const { nanoid } = require("nanoid");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { canTransition } = require("../utils/orderWorkflow");

// This mock gateway mirrors the Razorpay contract 1:1
// (order.create -> checkout -> payments.verify with signature),
// so swapping in the real SDK later only touches this file, not controllers/routes.

// POST /payments/create  { orderId }
const createPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.customer.toString() !== req.user._id.toString()) throw new ApiError(403, "Not your order");
  if (order.status !== "ORDER_PLACED") throw new ApiError(400, "Payment already initiated/completed for this order");

  const paymentId = `pay_mock_${nanoid(14)}`;

  const payment = await Payment.create({
    order: order._id,
    customer: req.user._id,
    paymentId,
    amount: order.totalAmount,
    currency: "INR",
    status: "PENDING",
    method: process.env.PAYMENT_MODE === "mock" ? "mock" : "razorpay",
  });

  order.payment = payment._id;
  await order.save();

  res.status(201).json(
    new ApiResponse(
      201,
      { paymentId: payment.paymentId, amount: payment.amount, currency: payment.currency, orderId: order._id },
      "Payment order created"
    )
  );
});

// POST /payments/verify  { paymentId, simulateResult: 'success' | 'failure' }
// A real integration verifies an HMAC signature here instead of trusting simulateResult.
const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, simulateResult = "success" } = req.body;

  const payment = await Payment.findOne({ paymentId });
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.customer.toString() !== req.user._id.toString()) throw new ApiError(403, "Not your payment");

  const order = await Order.findById(payment.order);
  if (!order) throw new ApiError(404, "Associated order not found");

  if (simulateResult === "success") {
    payment.status = "SUCCESSFUL";
    payment.transactionId = `txn_mock_${nanoid(14)}`;
    payment.paymentDate = new Date();
    await payment.save();

    const check = canTransition(order.status, "PAYMENT_VERIFIED");
    if (!check.ok) throw new ApiError(400, check.reason);

    order.status = "PAYMENT_VERIFIED";
    order.timeline.push({ status: "PAYMENT_VERIFIED", note: `Paid via ${payment.method}, txn ${payment.transactionId}` });
    await order.save();
  } else {
    payment.status = "FAILED";
    await payment.save();
  }

  res.status(200).json(new ApiResponse(200, { payment, order }, `Payment ${payment.status.toLowerCase()}`));
});

// Admin: GET /payments (view payment details, spec requirement)
const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find().populate("order", "orderNumber totalAmount").populate("customer", "name email").sort("-createdAt");
  res.status(200).json(new ApiResponse(200, payments));
});

module.exports = { createPayment, verifyPayment, getAllPayments };
