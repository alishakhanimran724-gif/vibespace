const Story = require("../models/storyModel");
const User = require("../models/userModel");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create story
exports.createStory = async (req, res) => {
  try {
    if (!req.files || !req.files.image) return res.status(400).json({ success: false, message: "Image is required" });
    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, { folder: "vibespace/stories" });
    const story = await Story.create({
      owner: req.user._id,
      image: { public_id: result.public_id, url: result.secure_url },
      caption: req.body.caption || "",
    });
    await story.populate("owner", "name username avatar");
    res.status(201).json({ success: true, story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get feed stories (following + own)
exports.getFeedStories = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const ids = [...user.following, req.user._id];
    const stories = await Story.find({ owner: { $in: ids } })
      .populate("owner", "name username avatar")
      .sort({ createdAt: -1 });

    // Group by user
    const grouped = {};
    stories.forEach((s) => {
      const uid = s.owner._id.toString();
      if (!grouped[uid]) grouped[uid] = { user: s.owner, stories: [] };
      grouped[uid].stories.push(s);
    });

    res.status(200).json({ success: true, stories: Object.values(grouped) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// View story
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });
    if (!story.viewers.includes(req.user._id)) {
      story.viewers.push(req.user._id);
      await story.save();
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete story
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });
    if (story.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    await cloudinary.uploader.destroy(story.image.public_id);
    await story.deleteOne();
    res.status(200).json({ success: true, message: "Story deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
