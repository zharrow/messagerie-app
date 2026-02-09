/**
 * Health check middleware
 * Shared across all microservices
 */

/**
 * Create a health check handler for a service
 * @param {string} serviceName - Name of the service
 * @returns {Function} Express route handler
 */
function healthCheck(serviceName) {
  return (req, res) => {
    res.json({
      status: 'healthy',
      service: serviceName,
      timestamp: new Date().toISOString()
    });
  };
}

module.exports = { healthCheck };