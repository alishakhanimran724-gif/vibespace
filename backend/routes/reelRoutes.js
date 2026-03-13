const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const {
  createReel,
  getAllReels,
  likeReel,
  commentReel,
  viewReel,
  deleteReel,
} = require("../controllers/reelController");

router.post("/new",          isAuthenticated, createReel);
router.get("/",              isAuthenticated, getAllReels);
router.put("/like/:id",      isAuthenticated, likeReel);
router.put("/comment/:id",   isAuthenticated, commentReel);
router.put("/view/:id",      isAuthenticated, viewReel);
router.delete("/delete/:id", isAuthenticated, deleteReel);

module.exports = router;