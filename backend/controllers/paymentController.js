const Payment = require("../models/paymentModel");
const Post    = require("../models/postModel");
const stripe  = require("stripe")(process.env.STRIPE_SECRET_KEY);

/* ── POST /api/v1/payment/intent/:postId ── */
exports.createPaymentIntent = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate("user", "username");
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (!post.price) return res.status(400).json({ success: false, message: "Post is not for sale" });

    const intent = await stripe.paymentIntents.create({
      amount:   Math.round(post.price * 100),
      currency: "usd",
      metadata: { postId: post._id.toString(), buyerId: req.user._id.toString() },
    });

    // Save pending order
    const payment = await Payment.create({
      user:            req.user._id,
      post:            post._id,
      seller:          post.user._id,
      amount:          post.price,
      stripePaymentId: intent.id,
      status:          "pending",
      deliveryStatus:  "pending",
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.json({ success: true, clientSecret: intent.client_secret, orderId: payment._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/v1/payment/confirm ── */
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentId: paymentIntentId },
      { status: "paid", deliveryStatus: "confirmed", statusUpdatedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/v1/payment/order/:id ── */
exports.getOrder = async (req, res) => {
  try {
    const order = await Payment.findById(req.params.id)
      .populate("post", "caption image price")
      .populate("seller", "username avatar");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Only buyer or seller can view
    if (
      order.user.toString() !== req.user._id.toString() &&
      order.seller?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/v1/payment/my-orders ── */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Payment.find({ user: req.user._id, status: "paid" })
      .populate("post", "caption image price")
      .populate("seller", "username avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── PUT /api/v1/payment/order/:id/status  (seller only) ── */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { deliveryStatus, trackingNote } = req.body;
    const order = await Payment.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.seller?.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Only seller can update status" });

    order.deliveryStatus  = deliveryStatus;
    order.trackingNote    = trackingNote || order.trackingNote;
    order.statusUpdatedAt = new Date();
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
