const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const { getMyAnalytics } = require("../controllers/analyticsController");

router.get("/me", isAuthenticated, getMyAnalytics);

module.exports = router;