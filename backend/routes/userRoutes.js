const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const {
  register,
  login,
  logout,
  getMyProfile,
  getUserProfile,
  followUser,
  updateProfile,
  changePassword,
  searchUsers,
} = require("../controllers/userController");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

// Protected routes
router.get("/me", isAuthenticated, getMyProfile);
router.get("/search", isAuthenticated, searchUsers);
router.put("/follow/:id", isAuthenticated, followUser);
router.put("/update", isAuthenticated, updateProfile);
router.put("/password", isAuthenticated, changePassword);

// Must be LAST — catches /:username
router.get("/:username", isAuthenticated, getUserProfile);

module.exports = router;