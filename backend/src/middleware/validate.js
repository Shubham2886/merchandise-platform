const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

// Runs after an array of express-validator check(...) rules on a route.
// Collects all failures into a single 400 ApiError with field-level detail.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    throw new ApiError(400, "Validation failed", formatted);
  }
  next();
};

module.exports = validate;
