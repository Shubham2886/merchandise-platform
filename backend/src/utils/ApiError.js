// Custom error class so errorHandler middleware can send consistent
// { success:false, message, errors } responses with correct status codes.
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
  }
}

module.exports = ApiError;
