const mongoose = require("mongoose");
const { ORDER_STAGES } = require("../utils/orderWorkflow");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String, // snapshot so historical orders survive product edits/deletion
    size: String,
    color: String,
    printType: String,
    printLocation: String,
    designUrl: String,
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
  },
  { _id: false }
);

// Timeline entries give the customer the "Order Tracking" view from the spec.
const timelineEntrySchema = new mongoose.Schema(
  { status: { type: String, required: true }, at: { type: Date, default: Date.now }, note: String },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],

    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shippingCharge: { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      phone: String,
    },

    status: { type: String, enum: [...ORDER_STAGES, "CANCELLED"], default: "ORDER_PLACED" },
    timeline: [timelineEntrySchema],

    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment" },

    cancelledAt: Date,
    cancelReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
