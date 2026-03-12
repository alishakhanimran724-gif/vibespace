const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post:             { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    seller:           { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount:           { type: Number, required: true },
    currency:         { type: String, default: "usd" },
    stripePaymentId:  { type: String },
    status:           { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    // ── Delivery tracking ──
    deliveryStatus: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered"],
      default: "pending",
    },
    trackingNote:       { type: String },
    estimatedDelivery:  { type: Date },
    statusUpdatedAt:    { type: Date },
    // ── Buyer info ──
    buyerName:    { type: String },
    buyerAddress: { type: String },
    buyerPhone:   { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
