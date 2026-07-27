const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { register, login, refresh, logout, getMe } = require("../controllers/authController");

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  validate,
  login
);

router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

module.exports = router;
