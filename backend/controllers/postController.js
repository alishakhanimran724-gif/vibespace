const Post = require("../models/postModel");
const User = require("../models/userModel");
const cloudinary = require("cloudinary").v2;

// POST /api/v1/post/new
exports.createPost = async (req, res) => {
  try {
    const { caption, isForSale, price } = req.body;

    if (!req.files || !req.files.image)
      return res.status(400).json({ success: false, message: "Please upload an image" });

    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
      folder: "vibespace/posts",
      width: 1080, crop: "limit",
    });

    const post = await Post.create({
      owner: req.user._id,
      image: { public_id: result.public_id, url: result.secure_url },
      caption,
      isForSale: isForSale === "true",
      price: isForSale === "true" ? Number(price) : 0,
    });

    await post.populate("owner", "username avatar");
    res.status(201).json({ success: true, post });
  } catch (err) {
    console.error("createPost:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/post/feed  — smart feed
exports.getFeedPosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const followingIds = currentUser.following || [];

    // Posts from following + own posts
    let posts = await Post.find({
      owner: { $in: [...followingIds, req.user._id] },
    })
      .populate("owner", "username avatar isOnline")
      .populate("comments.user", "username avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    // Score-based sort
    const now = Date.now();
    const scored = posts.map((p) => {
      const ageHours = (now - new Date(p.createdAt).getTime()) / 3600000;
      const recency = Math.max(0, 100 - ageHours * 2);
      const isFollowing = followingIds.some(
        (id) => id.toString() === p.owner._id.toString()
      );
      const score =
        (p.likes?.length || 0) * 3 +
        (p.comments?.length || 0) * 5 +
        recency +
        (isFollowing ? 30 : 0);
      return { post: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const sortedPosts = scored.map((s) => s.post);

    // Suggested posts from non-following
    let suggestedPosts = [];
    if (followingIds.length > 0) {
      suggestedPosts = await Post.find({
        owner: { $nin: [...followingIds, req.user._id] },
      })
        .populate("owner", "username avatar isOnline")
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.json({ success: true, posts: sortedPosts, suggestedPosts });
  } catch (err) {
    console.error("getFeedPosts:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/post/user/:id  — posts by user _id
exports.getUserPosts = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined")
      return res.status(400).json({ success: false, message: "User ID required" });

    const posts = await Post.find({ owner: id })
      .populate("owner", "username avatar")
      .populate("comments.user", "username avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (err) {
    console.error("getUserPosts:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/post/marketplace
exports.getMarketplacePosts = async (req, res) => {
  try {
    const posts = await Post.find({ isForSale: true })
      .populate("owner", "username avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/post/like/:id
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const idx = post.likes.indexOf(req.user._id);
    if (idx === -1) post.likes.push(req.user._id);
    else post.likes.splice(idx, 1);

    await post.save();
    res.json({ success: true, liked: idx === -1, likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/post/comment/:id
exports.commentPost = async (req, res) => {
  try {
    const { comment } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.comments.push({ user: req.user._id, comment });
    await post.save();
    await post.populate("comments.user", "username avatar");

    res.json({ success: true, comments: post.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/post/save/:id
exports.savePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.savedPosts.indexOf(req.params.id);
    if (idx === -1) user.savedPosts.push(req.params.id);
    else user.savedPosts.splice(idx, 1);

    await user.save();
    res.json({ success: true, saved: idx === -1 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/post/delete/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    if (post.image?.public_id) {
      await cloudinary.uploader.destroy(post.image.public_id);
    }
    await post.deleteOne();
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};