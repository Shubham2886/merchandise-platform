const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { getDashboard, getCustomers } = require("../controllers/adminController");

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/customers", getCustomers);

module.exports = router;
