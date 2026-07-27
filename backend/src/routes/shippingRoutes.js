const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { createShipment, trackShipment } = require("../controllers/shippingController");

router.post("/create", protect, authorize("admin"), createShipment);
router.get("/:trackingId", trackShipment); // public tracking, no auth needed

module.exports = router;
