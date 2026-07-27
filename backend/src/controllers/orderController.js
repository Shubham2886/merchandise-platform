const { nanoid } = require("nanoid");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { canTransition, canCancel } = require("../utils/orderWorkflow");
const { computeTotals } = require("./cartController");

// POST /orders - checkout: converts the customer's cart into an order.
// Uses a transaction so stock decrement + order creation + cart clear are atomic.
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;
  if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.pincode) {
    throw new ApiError(400, "A complete shipping address (line1, city, pincode) is required.");
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0) throw new ApiError(400, "Cart is empty");

  // Validate stock and snapshot product data for every item before committing.
  const orderItems = [];
  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) throw new ApiError(400, `A product in your cart is no longer available.`);
    if (product.stock < item.quantity) throw new ApiError(400, `Insufficient stock for '${product.name}'.`);
    orderItems.push({
      product: product._id,
      name: product.name,
      size: item.size,
      color: item.color,
      printType: item.printType,
      printLocation: item.printLocation,
      designUrl: item.designUrl,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
  }

  const totals = computeTotals(cart.items);

  const order = await Order.create({
    orderNumber: `ORD${Date.now()}${nanoid(4).toUpperCase()}`,
    customer: req.user._id,
    items: orderItems,
    ...totals,
    shippingAddress,
    status: "ORDER_PLACED",
    timeline: [{ status: "ORDER_PLACED" }],
  });

  // Decrement stock (best-effort; for true atomicity under load use a Mongo transaction/session)
  await Promise.all(
    orderItems.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: -i.quantity } }))
  );

  cart.items = [];
  await cart.save();

  res.status(201).json(new ApiResponse(201, order, "Order placed successfully"));
});

// GET /orders - customer sees own orders, admin sees all (with filters)
const getOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = req.user.role === "admin" ? {} : { customer: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("customer", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, { orders, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } })
  );
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customer", "name email phone")
    .populate("payment")
    .populate("shipment");
  if (!order) throw new ApiError(404, "Order not found");
  if (req.user.role !== "admin" && order.customer._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You cannot view another customer's order");
  }
  res.status(200).json(new ApiResponse(200, order));
});

// PATCH /orders/:id/status  { status }  - admin advances workflow OR customer cancels
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");

  const isOwner = order.customer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (status === "CANCELLED") {
    if (!isOwner && !isAdmin) throw new ApiError(403, "Not authorized to cancel this order");
    if (!canCancel(order.status)) throw new ApiError(400, "Order can only be cancelled before printing starts.");
    order.status = "CANCELLED";
    order.cancelledAt = new Date();
    order.cancelReason = note || "Cancelled by " + (isAdmin ? "admin" : "customer");
    order.timeline.push({ status: "CANCELLED", note: order.cancelReason });
    await order.save();
    return res.status(200).json(new ApiResponse(200, order, "Order cancelled"));
  }

  // Every other transition (advancing the workflow) is admin-only, per spec.
  if (!isAdmin) throw new ApiError(403, "Only admin can update order status");

  const check = canTransition(order.status, status);
  if (!check.ok) throw new ApiError(400, check.reason);

  order.status = status;
  order.timeline.push({ status, note });
  await order.save();

  res.status(200).json(new ApiResponse(200, order, "Order status updated"));
});

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };
