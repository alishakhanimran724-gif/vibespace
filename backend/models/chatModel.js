const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content:  { type: String, default: "" },
  chat:     { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  image:    { url: String, public_id: String },
  audio:    { url: String, public_id: String },
  gif:      { type: String },           // giphy URL
  readBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  read:     { type: Boolean, default: false },
  reactions: [{
    user:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    emoji: String,
  }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lastMessage:  { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  messages:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
  unreadCount:  { type: Number, default: 0 },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
const Chat    = mongoose.model("Chat", chatSchema);

module.exports = { Chat, Message };