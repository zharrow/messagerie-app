const tokenService = require('../services/tokenService');
const { utils, config } = require('../shared-lib');
const { error: errorResponse, unauthorized } = utils.response;
const httpClient = utils.httpClient;
const { SERVICES } = config.services;

const authController = {
  // POST /auth/login
  async login(req, res) {
    try {
      const { email, password, remember_me = false } = req.body;

      if (!email || !password) {
        return errorResponse(res, 'Email and password are required', 400);
      }

      // Call User Service to verify credentials
      let user;
      try {
        user = await httpClient.post(`${SERVICES.USER}/internal/verify-credentials`, { email, password });
      } catch (err) {
        return unauthorized(res, err.message || 'Invalid credentials');
      }

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
      errorResponse(res, 'Internal server error');
    }
  },

  // POST /auth/logout
  async logout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const { refresh_token } = req.body;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return unauthorized(res, 'No token provided');
      }

      const accessToken = authHeader.split(' ')[1];

      // Invalidate tokens
      await tokenService.invalidateTokens(accessToken, refresh_token);

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // POST /auth/refresh
  async refresh(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return errorResponse(res, 'Refresh token is required', 400);
      }

      const tokens = await tokenService.refreshAccessToken(refresh_token);

      if (!tokens) {
        return unauthorized(res, 'Invalid or expired refresh token');
      }

      res.json(tokens);
    } catch (error) {
      console.error('Refresh error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // POST /internal/validate-token
  async validateToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return errorResponse(res, 'Token is required', 400);
      }

      const user = await tokenService.validateAccessToken(token);

      if (!user) {
        return unauthorized(res, 'Invalid or expired token');
      }

      res.json({ valid: true, user });
    } catch (error) {
      console.error('Validate token error:', error);
      errorResponse(res, 'Internal server error');
    }
  }
};

module.exports = authController;
