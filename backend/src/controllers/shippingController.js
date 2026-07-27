const { nanoid } = require("nanoid");
const Shipment = require("../models/Shipment");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { canTransition } = require("../utils/orderWorkflow");

const MOCK_COURIERS = ["Delhivery", "Bluedart", "Ekart", "DTDC"];

// POST /shipping/create  { orderId }  (admin) - moves order to SHIPMENT_CREATED
const createShipment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "PACKED") throw new ApiError(400, "Order must be PACKED before a shipment can be created.");

  const shipment = await Shipment.create({
    order: order._id,
    courierName: MOCK_COURIERS[Math.floor(Math.random() * MOCK_COURIERS.length)],
    trackingNumber: `TRK${nanoid(10).toUpperCase()}`,
    shipmentId: `SHP${nanoid(10).toUpperCase()}`,
    estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: "CREATED",
    trackingHistory: [{ status: "CREATED", location: "Origin hub" }],
  });

  const check = canTransition(order.status, "SHIPMENT_CREATED");
  if (!check.ok) throw new ApiError(400, check.reason);

  order.status = "SHIPMENT_CREATED";
  order.shipment = shipment._id;
  order.timeline.push({ status: "SHIPMENT_CREATED", note: `Courier: ${shipment.courierName}, AWB: ${shipment.trackingNumber}` });
  await order.save();

  res.status(201).json(new ApiResponse(201, shipment, "Shipment created"));
});

// GET /shipping/:trackingId - public tracking lookup
const trackShipment = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingId }).populate("order", "orderNumber status");
  if (!shipment) throw new ApiError(404, "Shipment not found for this tracking number");
  res.status(200).json(new ApiResponse(200, shipment));
});

module.exports = { createShipment, trackShipment };
