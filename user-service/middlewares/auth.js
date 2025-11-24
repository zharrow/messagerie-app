const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3002';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Call Auth Service to validate token
    const response = await fetch(`${AUTH_SERVICE_URL}/internal/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': INTERNAL_SECRET
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(401).json({ error: error.error || 'Invalid token' });
    }

    const data = await response.json();
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication service unavailable' });
  }
};

module.exports = authMiddleware;
