const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const TAX_RATE = 0.18; // 18% GST, mirrors real Indian e-commerce tax handling
const FLAT_SHIPPING = 60;
const FREE_SHIPPING_THRESHOLD = 999;

function computeTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const shippingCharge = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING;
  const totalAmount = Math.round((subtotal + tax + shippingCharge) * 100) / 100;
  return { subtotal, tax, shippingCharge, totalAmount };
}

const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate("items.product", "name images price stock isActive");
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  res.status(200).json(new ApiResponse(200, { cart, totals: computeTotals(cart.items) }));
});

// POST /cart - add an item with full customization
const addToCart = asyncHandler(async (req, res) => {
  const { productId, size, color, printType, printLocation, designUrl, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");
  if (size && product.sizes.length && !product.sizes.includes(size)) {
    throw new ApiError(400, `Size '${size}' is not available for this product.`);
  }
  if (color && product.colors.length && !product.colors.includes(color)) {
    throw new ApiError(400, `Color '${color}' is not available for this product.`);
  }
  if (product.stock < quantity) throw new ApiError(400, `Only ${product.stock} unit(s) in stock.`);

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  cart.items.push({
    product: product._id,
    size,
    color,
    printType,
    printLocation,
    designUrl,
    quantity,
    unitPrice: product.price,
  });
  await cart.save();
  await cart.populate("items.product", "name images price stock isActive");

  res.status(201).json(new ApiResponse(201, { cart, totals: computeTotals(cart.items) }, "Item added to cart"));
});

// PUT /cart/:itemId - update quantity of a specific cart line item
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) throw new ApiError(400, "Quantity must be at least 1.");

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, "Cart item not found");

  const product = await Product.findById(item.product);
  if (product && product.stock < quantity) throw new ApiError(400, `Only ${product.stock} unit(s) in stock.`);

  item.quantity = quantity;
  await cart.save();
  await cart.populate("items.product", "name images price stock isActive");

  res.status(200).json(new ApiResponse(200, { cart, totals: computeTotals(cart.items) }, "Cart item updated"));
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
  await cart.save();
  await cart.populate("items.product", "name images price stock isActive");

  res.status(200).json(new ApiResponse(200, { cart, totals: computeTotals(cart.items) }, "Item removed"));
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, computeTotals, TAX_RATE, FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD };
