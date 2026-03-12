const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  caption: { type: String, default: "", maxlength: 2200 },
  image: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  // Buy/Sell feature
  isForSale: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  currency: { type: String, default: "usd" },
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isSold: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
