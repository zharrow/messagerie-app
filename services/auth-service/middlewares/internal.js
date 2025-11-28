const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

const internalMiddleware = (req, res, next) => {
  // Check for internal secret header
  const providedSecret = req.headers['x-internal-secret'];

  if (!providedSecret || providedSecret !== INTERNAL_SECRET) {
    // Also check if request comes from Docker internal network
    const ip = req.ip || req.connection.remoteAddress;
    const isInternalNetwork = ip.includes('172.') || ip.includes('10.') || ip.includes('127.0.0.1');

    if (!isInternalNetwork) {
      return res.status(403).json({ error: 'Access denied - internal endpoint' });
    }
  }

  next();
};

module.exports = internalMiddleware;
