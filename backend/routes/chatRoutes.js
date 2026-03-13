const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const { isAuthenticated } = require("../middleware/auth");

/* disable express-fileupload for chat routes — multer handles uploads here */
const disableFileUpload = (req, res, next) => {
  req.files = undefined;
  next();
};
const {
  getMyChats,
  getOrCreateChat,
  getChatMessages,
  sendMessage,
  sendImageMessage,
  sendAudioMessage,
  reactToMessage,
  deleteMessage,
} = require("../controllers/chatController");

const storage = multer.memoryStorage();
const upload  = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20 MB

router.get   ("/",                        isAuthenticated, getMyChats);
router.post  ("/get-or-create",           isAuthenticated, getOrCreateChat);
router.get   ("/:chatId",                 isAuthenticated, getChatMessages);
router.post  ("/message/:chatId",         isAuthenticated, sendMessage);
router.post  ("/message/:chatId/image",   disableFileUpload, isAuthenticated, upload.single("image"), sendImageMessage);
router.post  ("/message/:chatId/audio",   disableFileUpload, isAuthenticated, upload.single("audio"), sendAudioMessage);
router.put   ("/message/:messageId/react",isAuthenticated, reactToMessage);
router.delete("/message/:messageId",      isAuthenticated, deleteMessage);

module.exports = router;