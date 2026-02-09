/**
 * Middleware to protect internal-only routes
 * Shared across all microservices
 */

function internalOnly(req, res, next) {
  const internalSecret = req.headers['x-internal-secret'];
  const expectedSecret = process.env.INTERNAL_SECRET;

  if (!internalSecret || internalSecret !== expectedSecret) {
    // Also check if request comes from Docker internal network
    const ip = req.ip || req.connection?.remoteAddress;
    const isInternalNetwork = ip && (
      ip.includes('172.') ||
      ip.includes('10.') ||
      ip.includes('127.0.0.1')
    );

    if (!isInternalNetwork) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This endpoint is for internal service communication only'
      });
    }
  }

  next();
}

module.exports = { internalOnly };
