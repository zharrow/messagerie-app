/**
 * Standardized API response helpers
 * Ensures consistent response format across all services
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function success(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} details - Optional error details
 */
function error(res, message = 'Internal Server Error', statusCode = 500, details = null) {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  return res.status(statusCode).json(response);
}

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
function validationError(res, errors) {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    errors,
    timestamp: new Date().toISOString()
  });
}

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 */
function notFound(res, resource = 'Resource') {
  return res.status(404).json({
    success: false,
    error: `${resource} not found`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Optional message
 */
function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  success,
  error,
  validationError,
  notFound,
  unauthorized
};
