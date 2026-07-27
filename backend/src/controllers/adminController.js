const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

// GET /admin/dashboard - aggregated metrics for the spec's "Sales Dashboard"
const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalProducts,
    totalOrders,
    revenueAgg,
    pendingOrders,
    printingOrders,
    deliveredOrders,
    lowStockProducts,
    totalCustomers,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: "CANCELLED" } } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments({ status: { $in: ["ORDER_PLACED", "PAYMENT_VERIFIED", "DESIGN_APPROVED"] } }),
    Order.countDocuments({ status: "PRINTING_IN_PROGRESS" }),
    Order.countDocuments({ status: "DELIVERED" }),
    Product.find({ isActive: true, stock: { $lte: 5 } }).select("name stock sku").limit(20),
    User.countDocuments({ role: "customer" }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      totalProducts,
      totalOrders,
      totalRevenue: revenueAgg[0]?.revenue || 0,
      pendingOrders,
      printingOrders,
      deliveredOrders,
      lowStockProducts,
      totalCustomers,
    })
  );
});

// GET /admin/customers
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: "customer" }).sort("-createdAt");
  res.status(200).json(new ApiResponse(200, customers));
});

module.exports = { getDashboard, getCustomers };
