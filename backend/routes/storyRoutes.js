const express = require("express");
const router = express.Router();
const { createStory, getFeedStories, viewStory, deleteStory } = require("../controllers/storyController");
const { isAuthenticated } = require("../middleware/auth");

router.post("/new", isAuthenticated, createStory);
router.get("/feed", isAuthenticated, getFeedStories);
router.put("/view/:id", isAuthenticated, viewStory);
router.delete("/:id", isAuthenticated, deleteStory);

module.exports = router;