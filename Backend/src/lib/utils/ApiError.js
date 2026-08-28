class ApiError extends Error {
  constructor(message = "Internal Server error", statusCode = 500, err = []) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.err = err;
    // Do NOT console.error here — error.middleware.js already logs via Winston
  }

  static notFoundError(message = "Resource not found") {
    return new ApiError(message, 404);
  }

  static badRequestError(message = "Bad request") {
    return new ApiError(message, 400);
  }

  static unauthorizedError(message = "Unauthorized") {
    return new ApiError(message, 401);
  }

  static forbiddenError(message = "Forbidden") {
    return new ApiError(message, 403);
  }

  static internalServerError(message = "Internal server error") {
    return new ApiError(message, 500);
  }
}

export default ApiError;