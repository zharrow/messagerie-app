/**
 * Authentication middleware
 * Shared across all microservices that need JWT validation
 */

const { SERVICES, INTERNAL_SECRET } = require('../config/services');
const httpClient = require('../utils/httpClient');

/**
 * Express middleware to validate JWT tokens via Auth Service
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const data = await httpClient.post(
      `${SERVICES.AUTH}/internal/validate-token`,
      { token }
    );

    req.user = data.user;
    next();
  } catch (error) {
    if (error.status === 401) {
      return res.status(401).json({ error: error.message || 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication service unavailable' });
  }
};

/**
 * Validate token for WebSocket connections
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} User object or null if invalid
 */
const validateSocketToken = async (token) => {
  try {
    const data = await httpClient.post(
      `${SERVICES.AUTH}/internal/validate-token`,
      { token }
    );
    return data.user;
  } catch (error) {
    console.error('Socket auth error:', error);
    return null;
  }
};

module.exports = {
  authMiddleware,
  validateSocketToken
};