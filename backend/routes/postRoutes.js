const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const {
  createPost,
  getFeedPosts,
  getUserPosts,
  likePost,
  commentPost,
  deletePost,
  savePost,
  getMarketplacePosts,
} = require("../controllers/postController");

router.post("/new", isAuthenticated, createPost);
router.get("/feed", isAuthenticated, getFeedPosts);
router.get("/marketplace", isAuthenticated, getMarketplacePosts);
router.get("/user/:id", isAuthenticated, getUserPosts);   // by user _id
router.put("/like/:id", isAuthenticated, likePost);
router.put("/comment/:id", isAuthenticated, commentPost);
router.put("/save/:id", isAuthenticated, savePost);
router.delete("/delete/:id", isAuthenticated, deletePost);

module.exports = router;