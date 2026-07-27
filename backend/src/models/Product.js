const mongoose = require("mongoose");

const PRINT_TYPES = ["Screen Printing", "DTF Printing", "Sublimation", "Embroidery", "UV Printing"];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    images: [{ type: String }], // stored URLs / paths
    price: { type: Number, required: true, min: 0 },
    sizes: [{ type: String }], // e.g. ["S","M","L","XL"]
    colors: [{ type: String }], // e.g. ["Black","White","Red"]
    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    printTypes: [{ type: String, enum: PRINT_TYPES }],
    printLocations: [{ type: String }], // e.g. ["Front","Back","Sleeve"]
    isActive: { type: Boolean, default: true },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
module.exports.PRINT_TYPES = PRINT_TYPES;
