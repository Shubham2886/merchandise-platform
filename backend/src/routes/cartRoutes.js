const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { getCart, addToCart, updateCartItem, removeCartItem } = require("../controllers/cartController");

router.use(protect); // every cart route requires a logged-in customer

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:itemId", updateCartItem);
router.delete("/:itemId", removeCartItem);

module.exports = router;
