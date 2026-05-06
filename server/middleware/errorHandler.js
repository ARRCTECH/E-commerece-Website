/**
 * Error Handler Middleware
 * Centralizes error handling across the application
 */

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Indicates if this is an operational error
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default to 500 if statusCode not set
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  
  console.error(`❌ [${statusCode}] ${errorCode}: ${err.message}`);
  
  // Log stack trace in development or for non-operational errors
  if (process.env.NODE_ENV === 'development' || !err.isOperational) {
    console.error(err.stack);
  }
  
  // Create response object
  const errorResponse = {
    success: false,
    message: err.message || 'Something went wrong',
    code: errorCode,
  };
  
  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }
  
  res.status(statusCode).json(errorResponse);
};

// Async handler to eliminate try/catch repetition
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Catch 404 errors
const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'RESOURCE_NOT_FOUND');
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFound
};
