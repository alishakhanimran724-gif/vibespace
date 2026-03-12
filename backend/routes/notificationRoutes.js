const express = require("express");
const router = express.Router();
const { getNotifications, markAllRead, markRead, getUnreadCount } = require("../controllers/notificationController");
const { isAuthenticated } = require("../middleware/auth");

router.get("/", isAuthenticated, getNotifications);
router.get("/unread", isAuthenticated, getUnreadCount);
router.put("/read-all", isAuthenticated, markAllRead);
router.put("/read/:id", isAuthenticated, markRead);

module.exports = router;