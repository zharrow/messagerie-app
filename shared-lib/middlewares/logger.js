/**
 * Standardized logging middleware for all services
 * Uses morgan with consistent format
 */

const morgan = require('morgan');

// Custom token for service name
morgan.token('service', (req) => {
  return process.env.SERVICE_NAME || 'unknown-service';
});

// Custom format with service name
const logFormat = ':service :method :url :status :res[content-length] - :response-time ms';

/**
 * Get configured logger middleware
 * @param {string} format - 'dev', 'combined', 'common', 'short', 'tiny'
 * @returns {Function} Express middleware
 */
function getLogger(format = 'combined') {
  if (process.env.NODE_ENV === 'development') {
    return morgan('dev'); // Colorful, concise output for development
  }

  if (format === 'custom') {
    return morgan(logFormat);
  }

  return morgan(format); // 'combined' for production (Apache style)
}

module.exports = { getLogger };
