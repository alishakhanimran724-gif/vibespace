const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  image: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  caption: { type: String, default: "" },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    index: { expires: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model("Story", storySchema);
