const express = require("express");
const router  = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const {
  createPaymentIntent,
  confirmPayment,
  getOrder,
  getMyOrders,
  updateOrderStatus,
} = require("../controllers/paymentController");

router.post("/intent/:postId",      isAuthenticated, createPaymentIntent);
router.post("/confirm",             isAuthenticated, confirmPayment);
router.get("/my-orders",            isAuthenticated, getMyOrders);
router.get("/order/:id",            isAuthenticated, getOrder);
router.put("/order/:id/status",     isAuthenticated, updateOrderStatus);

module.exports = router;
