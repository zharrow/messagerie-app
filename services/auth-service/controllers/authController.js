const tokenService = require('../services/tokenService');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

const authController = {
  // POST /auth/login
  async login(req, res) {
    try {
      const { email, password, remember_me = false } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Call User Service to verify credentials
      const response = await fetch(`${USER_SERVICE_URL}/internal/verify-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': INTERNAL_SECRET
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(401).json({ error: error.error || 'Invalid credentials' });
      }

      const user = await response.json();

      // Generate tokens
      const tokens = await tokenService.createTokens(user, remember_me);

      res.json({
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /auth/logout
  async logout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const { refresh_token } = req.body;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const accessToken = authHeader.split(' ')[1];

      // Invalidate tokens
      await tokenService.invalidateTokens(accessToken, refresh_token);

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /auth/refresh
  async refresh(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const tokens = await tokenService.refreshAccessToken(refresh_token);

      if (!tokens) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      res.json(tokens);
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /auth/health
  health(req, res) {
    res.json({
      status: 'healthy',
      service: 'auth-service',
      timestamp: new Date().toISOString()
    });
  },

  // POST /internal/validate-token
  async validateToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const user = await tokenService.validateAccessToken(token);

      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      res.json({ valid: true, user });
    } catch (error) {
      console.error('Validate token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = authController;
