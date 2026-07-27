const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    paymentId: { type: String, required: true, unique: true }, // gateway order/payment id
    transactionId: { type: String }, // set on successful verification
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["PENDING", "SUCCESSFUL", "FAILED", "REFUNDED"], default: "PENDING" },
    paymentDate: { type: Date },
    method: { type: String, default: "mock" }, // razorpay | stripe | mock
    rawResponse: { type: mongoose.Schema.Types.Mixed }, // full gateway payload for audit/debug
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
