const Category = require("../models/Category");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const slugify = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort("name");
  res.status(200).json(new ApiResponse(200, categories));
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.create({ name, description, slug: slugify(name) });
  res.status(201).json(new ApiResponse(201, category, "Category created"));
});

const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;
  const update = { description, isActive };
  if (name) update.name = name, update.slug = slugify(name);

  const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!category) throw new ApiError(404, "Category not found");
  res.status(200).json(new ApiResponse(200, category, "Category updated"));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!category) throw new ApiError(404, "Category not found");
  res.status(200).json(new ApiResponse(200, null, "Category deactivated"));
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
