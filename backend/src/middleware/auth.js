const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

// Verifies the JWT access token sent in the Authorization: Bearer <token> header,
// loads the user, and attaches it to req.user for downstream handlers.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authenticated. No token provided.");
  }
  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token.");
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, "User belonging to this token no longer exists.");

  req.user = user;
  next();
});

// Role-based access control. Usage: authorize("admin") or authorize("admin","customer")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, `Role '${req.user?.role}' is not permitted to perform this action.`);
  }
  next();
};

module.exports = { protect, authorize };
