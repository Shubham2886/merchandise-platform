const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/:id", getProductById);

const productValidators = [
  body("name").trim().notEmpty(),
  body("description").trim().notEmpty(),
  body("category").isMongoId(),
  body("price").isFloat({ min: 0 }),
  body("sku").trim().notEmpty(),
];

router.post("/", protect, authorize("admin"), productValidators, validate, createProduct);
router.put("/:id", protect, authorize("admin"), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;
