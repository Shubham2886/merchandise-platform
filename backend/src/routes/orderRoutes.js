const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require("../controllers/orderController");

router.use(protect);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus); // role check happens inside controller (owner-cancel vs admin-advance)

module.exports = router;
