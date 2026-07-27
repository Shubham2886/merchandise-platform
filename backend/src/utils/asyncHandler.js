// Wraps async route/controller functions so any rejected promise (thrown error)
// is forwarded to Express's error-handling middleware via next(err),
// instead of crashing the process or requiring try/catch in every controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
