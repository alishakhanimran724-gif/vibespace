const express = require("express");
const router  = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const { generateCaption, describeImage } = require("../controllers/aiController");

router.post("/caption",        isAuthenticated, generateCaption);
router.post("/describe-image", isAuthenticated, describeImage);

module.exports = router;
