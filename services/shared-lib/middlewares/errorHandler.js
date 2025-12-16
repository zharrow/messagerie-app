const { AppError } = require('../utils/errors');

/**
 * Global error handling middleware
 * Should be placed LAST in the middleware chain
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Log error details
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    message: err.message,
    stack: err.stack,
    ...(req.user && { userId: req.user.id })
  };

  // Log to console (in production, use proper logging service)
  if (statusCode >= 500) {
    console.error('[ERROR]', errorLog);
  } else {
    console.warn('[WARN]', errorLog);
  }

  // Don't leak error details in production for non-operational errors
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    message = 'Internal server error';
  }

  // Send error response
  const response = {
    success: false,
    message,
    ...(err.errors && { errors: err.errors }), // Validation errors
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  };

  res.status(statusCode).json(response);
};

/**
 * Catch 404 and forward to error handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.method} ${req.path} not found`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
