const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// GET /products?search=&category=&minPrice=&maxPrice=&size=&color=&printType=&sort=&page=&limit=
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, size, color, printType, sort, page = 1, limit = 12 } = req.query;

  const filter = { isActive: true };
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (size) filter.sizes = size;
  if (color) filter.colors = color;
  if (printType) filter.printTypes = printType;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    price_asc: "price",
    price_desc: "-price",
    newest: "-createdAt",
    rating: "-ratingsAverage",
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sortMap[sort] || "-createdAt")
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    })
  );
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name slug");
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");
  res.status(200).json(new ApiResponse(200, product));
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(new ApiResponse(201, product, "Product created"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, "Product not found");
  res.status(200).json(new ApiResponse(200, product, "Product updated"));
});

// Soft delete keeps historical order snapshots intact and avoids breaking
// existing order references (Orders store a snapshot, not a live join).
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) throw new ApiError(404, "Product not found");
  res.status(200).json(new ApiResponse(200, null, "Product deleted"));
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
