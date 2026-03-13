const Reel = require("../models/reelModel");
const cloudinary = require("cloudinary").v2;

// POST /api/v1/reel/new
exports.createReel = async (req, res) => {
  try {
    const { caption, audio } = req.body;

    if (!req.files || !req.files.video) {
      return res.status(400).json({ success: false, message: "Please upload a video" });
    }

    const videoFile = req.files.video;

    // Upload to cloudinary as video resource
    const result = await cloudinary.uploader.upload(videoFile.tempFilePath, {
      resource_type: "video",
      folder: "vibespace/reels",
      chunk_size: 6000000, // 6MB chunks for large videos
      eager: [{ format: "mp4", quality: "auto" }],
      eager_async: true,
    });
    
    // Use secure_url from result
    const videoUrl = result.secure_url || result.url;
    if (!videoUrl) throw new Error("Cloudinary upload failed — no URL returned");

    const reel = await Reel.create({
      owner: req.user._id,
      video: { public_id: result.public_id, url: videoUrl },
      caption,
      audio,
    });

    await reel.populate("owner", "username avatar");

    res.status(201).json({ success: true, reel });
  } catch (err) {
    console.error("createReel error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/reel
exports.getAllReels = async (req, res) => {
  try {
    const reels = await Reel.find()
      .populate("owner", "username avatar")
      .populate("comments.user", "username avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, reels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/reel/like/:id
exports.likeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });

    const idx = reel.likes.indexOf(req.user._id);
    if (idx === -1) reel.likes.push(req.user._id);
    else reel.likes.splice(idx, 1);

    await reel.save();
    res.json({ success: true, liked: idx === -1, likesCount: reel.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/reel/comment/:id
exports.commentReel = async (req, res) => {
  try {
    const { comment } = req.body;
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });

    reel.comments.push({ user: req.user._id, comment });
    await reel.save();
    await reel.populate("comments.user", "username avatar");

    res.json({ success: true, comments: reel.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/reel/view/:id
exports.viewReel = async (req, res) => {
  try {
    await Reel.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/reel/delete/:id
exports.deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });
    if (reel.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    if (reel.video?.public_id) {
      await cloudinary.uploader.destroy(reel.video.public_id, { resource_type: "video" });
    }
    await reel.deleteOne();
    res.json({ success: true, message: "Reel deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};