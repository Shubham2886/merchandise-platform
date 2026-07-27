const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    courierName: { type: String, required: true },
    trackingNumber: { type: String, required: true, unique: true },
    shipmentId: { type: String, required: true, unique: true },
    estimatedDeliveryDate: { type: Date },
    status: {
      type: String,
      enum: ["CREATED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED"],
      default: "CREATED",
    },
    trackingHistory: [
      { status: String, location: String, at: { type: Date, default: Date.now } },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
