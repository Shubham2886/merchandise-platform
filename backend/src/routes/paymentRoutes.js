const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { createPayment, verifyPayment, getAllPayments } = require("../controllers/paymentController");

router.post("/create", protect, createPayment);
router.post("/verify", protect, verifyPayment);
router.get("/", protect, authorize("admin"), getAllPayments);

module.exports = router;
