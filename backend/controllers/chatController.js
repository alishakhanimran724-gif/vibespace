const { Chat, Message } = require("../models/chatModel");
const cloudinary = require("cloudinary").v2;

/* ── helper: upload buffer to cloudinary via base64 ── */
const uploadBuffer = (buffer, folder, resource_type = "auto") => {
  const b64 = buffer.toString("base64");
  const mimeType = resource_type === "video" ? "video/webm" : "image/jpeg";
  const dataUri = `data:${mimeType};base64,${b64}`;
  return cloudinary.uploader.upload(dataUri, { folder, resource_type });
};

/* ── GET /api/v1/chat  — all chats for current user ── */
exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "username avatar")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username avatar" },
      })
      .sort({ updatedAt: -1 });
    res.json({ success: true, chats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/v1/chat/get-or-create  — open / create 1-1 chat ── */
exports.getOrCreateChat = async (req, res) => {
  try {
    const { userId } = req.body;
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 },
    }).populate("participants", "username avatar");

    if (!chat) {
      chat = await Chat.create({ participants: [req.user._id, userId] });
      chat = await chat.populate("participants", "username avatar");
    }
    res.json({ success: true, chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/v1/chat/:chatId  — messages for a chat ── */
exports.getChatMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate({
        path: "messages",
        populate: [
          { path: "sender",  select: "username avatar" },
          { path: "replyTo", populate: { path: "sender", select: "username" } },
        ],
      });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    // mark messages as read
    await Message.updateMany(
      { chat: req.params.chatId, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );

    res.json({ success: true, messages: chat.messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/v1/chat/message  — send text / gif ── */
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content, gif, replyTo } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const msg = await Message.create({
      sender: req.user._id,
      chat: chatId,
      content: content || "",
      gif: gif || undefined,
      replyTo: replyTo || undefined,
    });

    chat.messages.push(msg._id);
    chat.lastMessage = msg._id;
    await chat.save();

    const populated = await msg.populate([
      { path: "sender",  select: "username avatar" },
      { path: "replyTo", populate: { path: "sender", select: "username" } },
    ]);

    res.json({ success: true, message: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/v1/chat/message/:chatId/image  — send image ── */
exports.sendImageMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, replyTo } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    let imageData = {};
    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, "vibespace/chat");
      imageData = { url: result.secure_url, public_id: result.public_id };
    }

    const msg = await Message.create({
      sender: req.user._id,
      chat: chatId,
      content: content || "📷 Photo",
      image: imageData.url ? imageData : undefined,
      replyTo: replyTo || undefined,
    });

    chat.messages.push(msg._id);
    chat.lastMessage = msg._id;
    await chat.save();

    const populated = await msg.populate("sender", "username avatar");
    res.json({ success: true, message: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/v1/chat/message/:chatId/audio  — send voice note ── */
exports.sendAudioMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    let audioData = {};
    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, "vibespace/voice", "video");
      audioData = { url: result.secure_url, public_id: result.public_id };
    }

    const msg = await Message.create({
      sender: req.user._id,
      chat: chatId,
      content: "🎤 Voice message",
      audio: audioData.url ? audioData : undefined,
    });

    chat.messages.push(msg._id);
    chat.lastMessage = msg._id;
    await chat.save();

    const populated = await msg.populate("sender", "username avatar");
    res.json({ success: true, message: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── PUT /api/v1/chat/message/:messageId/react  — react to message ── */
exports.reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    const existingIdx = msg.reactions.findIndex(
      r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingIdx > -1) {
      msg.reactions.splice(existingIdx, 1); // toggle off
    } else {
      // remove old reaction from same user first
      msg.reactions = msg.reactions.filter(r => r.user.toString() !== req.user._id.toString());
      msg.reactions.push({ user: req.user._id, emoji });
    }

    await msg.save();
    res.json({ success: true, reactions: msg.reactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── DELETE /api/v1/chat/message/:messageId  — delete message ── */
exports.deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ success: false, message: "Not found" });
    if (msg.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not your message" });
    msg.deleted = true;
    msg.content = "This message was deleted";
    await msg.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};