const ApiError = require("../utils/ApiError");

// Centralized error handler - converts known error types (Mongoose validation,
// duplicate key, cast errors, JWT errors, ApiError) into a consistent JSON shape.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || "Internal Server Error";

    if (error.name === "ValidationError") {
      statusCode = 400;
      message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
    } else if (error.code === 11000) {
      statusCode = 409;
      const field = Object.keys(error.keyValue || {})[0];
      message = `Duplicate value for field '${field}': '${error.keyValue?.[field]}' already exists.`;
    } else if (error.name === "CastError") {
      statusCode = 400;
      message = `Invalid value for '${error.path}': ${error.value}`;
    } else if (error.name === "JsonWebTokenError") {
      statusCode = 401;
      message = "Invalid token.";
    } else if (error.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Token expired.";
    }

    error = new ApiError(statusCode, message);
  }

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
  });
}

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { errorHandler, notFound };
