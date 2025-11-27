/**
 * Middleware to protect internal-only routes
 * Shared across all microservices
 */

function internalOnly(req, res, next) {
  const internalSecret = req.headers['x-internal-secret'];
  const expectedSecret = process.env.INTERNAL_SECRET;

  if (!internalSecret || internalSecret !== expectedSecret) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This endpoint is for internal service communication only'
    });
  }

  next();
}

module.exports = { internalOnly };
