const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

// ── Token helper ──────────────────────────────────────────────
const sendToken = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );

  const cookieExpireDays = parseInt(process.env.COOKIE_EXPIRE) || 7;

  const isProduction = process.env.NODE_ENV === "production";
  res
    .status(statusCode)
    .cookie("token", token, {
      expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    })
    .json({
      success: true,
      token,
      user: {
        _id:        user._id,
        name:       user.name,
        username:   user.username,
        email:      user.email,
        avatar:     user.avatar,
        bio:        user.bio,
        website:    user.website,
        followers:  user.followers,
        following:  user.following,
        savedPosts: user.savedPosts,
        isOnline:   user.isOnline,
      },
    });
};

// POST /api/v1/user/register
exports.register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password)
      return res.status(400).json({ success: false, message: "All fields are required" });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const exists = await User.findOne({ $or: [{ email }, { username: username.toLowerCase() }] });
    if (exists)
      return res.status(400).json({ success: false, message: "Email or username already taken" });

    // Hash password ONCE here
    const hashedPassword = await bcrypt.hash(password, 10);

    let avatar = { public_id: "", url: "" };
    if (req.files && req.files.avatar) {
      const result = await cloudinary.uploader.upload(req.files.avatar.tempFilePath, {
        folder: "vibespace/avatars",
        width: 300,
        crop: "scale",
      });
      avatar = { public_id: result.public_id, url: result.secure_url };
    }

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar,
    });

    console.log(`✅ New user registered: ${user.username}`);
    sendToken(user, 201, res);
  } catch (err) {
    console.error("❌ register error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/user/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    // Must select password because it's select:false in schema
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      console.log(`❌ Login failed — no user with email: ${email}`);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Debug log (remove in production)
    console.log(`🔐 Login attempt: ${email} | passwordExists: ${!!user.password}`);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`❌ Login failed — wrong password for: ${email}`);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    user.isOnline = true;
    await User.findByIdAndUpdate(user._id, { isOnline: true });

    console.log(`✅ Login success: ${user.username}`);
    sendToken(user, 200, res);
  } catch (err) {
    console.error("❌ login error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/user/logout
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { isOnline: false });
    }
    res
      .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
      .json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/user/me
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("followers", "username avatar isOnline")
      .populate("following", "username avatar isOnline");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/user/:username
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || username === "undefined" || username === "null")
      return res.status(400).json({ success: false, message: "Username is required" });

    const user = await User.findOne({ username: username.toLowerCase() })
      .populate("followers", "username avatar isOnline")
      .populate("following", "username avatar isOnline");

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/user/follow/:id
exports.followUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ success: false, message: "You cannot follow yourself" });

    const [targetUser, currentUser] = await Promise.all([
      User.findById(req.params.id),
      User.findById(req.user._id),
    ]);

    if (!targetUser)
      return res.status(404).json({ success: false, message: "User not found" });

    const alreadyFollowing = currentUser.following
      .map((id) => id.toString())
      .includes(req.params.id);

    if (alreadyFollowing) {
      currentUser.following.pull(req.params.id);
      targetUser.followers.pull(req.user._id);
    } else {
      currentUser.following.push(req.params.id);
      targetUser.followers.push(req.user._id);
      try {
        const Notification = require("../models/notificationModel");
        await Notification.create({
          recipient: req.params.id,
          sender: req.user._id,
          type: "follow",
        });
      } catch {}
    }

    await Promise.all([
      User.findByIdAndUpdate(currentUser._id, { following: currentUser.following }),
      User.findByIdAndUpdate(targetUser._id,  { followers: targetUser.followers  }),
    ]);

    res.json({
      success: true,
      followed: !alreadyFollowing,
      followersCount: targetUser.followers.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/user/update
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, website } = req.body;
    const updates = {};
    if (name)    updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (website !== undefined) updates.website = website;

    if (req.files && req.files.avatar) {
      const existingUser = await User.findById(req.user._id);
      if (existingUser.avatar?.public_id) {
        await cloudinary.uploader.destroy(existingUser.avatar.public_id).catch(() => {});
      }
      const result = await cloudinary.uploader.upload(req.files.avatar.tempFilePath, {
        folder: "vibespace/avatars",
        width: 300,
        crop: "scale",
      });
      updates.avatar = { public_id: result.public_id, url: result.secure_url };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/user/password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Both passwords required" });

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Current password is incorrect" });

    const newHashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, { password: newHashed });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/user/search?query=
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $or: [
        { username: { $regex: query || "", $options: "i" } },
        { name:     { $regex: query || "", $options: "i" } },
      ],
      _id: { $ne: req.user._id },
    })
      .select("username name avatar isOnline followers")
      .limit(20);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};