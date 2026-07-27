const mongoose = require("mongoose");

// A cart item captures the full customization chosen by the customer,
// mirroring the assignment's "Product Customization" module.
const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    printType: { type: String, required: true },
    printLocation: { type: String, required: true },
    designUrl: { type: String }, // uploaded artwork
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true }, // price snapshot at add-time
  },
  { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.virtual("subtotal").get(function subtotal() {
  return this.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
});
cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Cart", cartSchema);
