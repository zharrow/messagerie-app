const { getRedis } = require('../config/redis');
const { generateAccessToken, generateRefreshToken, verifyToken, parseDuration } = require('../utils/jwt');

const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const BLACKLIST_PREFIX = 'blacklist:';

const tokenService = {
  async createTokens(user, rememberMe = false) {
    const redis = getRedis();

    // Generate tokens
    const accessTokenData = generateAccessToken(user);
    const refreshTokenData = generateRefreshToken(user);

    // Store refresh token in Redis
    const refreshExpiration = rememberMe
      ? parseDuration(process.env.JWT_REFRESH_EXPIRATION || '30d')
      : parseDuration('1d'); // 1 day if not remember me

    await redis.setex(
      `${REFRESH_TOKEN_PREFIX}${refreshTokenData.token}`,
      refreshExpiration,
      JSON.stringify({ userId: user.id, email: user.email })
    );

    return {
      access_token: accessTokenData.token,
      refresh_token: refreshTokenData.token,
      token_type: 'Bearer',
      expires_in: accessTokenData.expiresIn
    };
  },

  async refreshAccessToken(refreshToken) {
    const redis = getRedis();

    // Check if refresh token exists in Redis
    const storedData = await redis.get(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
    if (!storedData) {
      return null;
    }

    // Verify JWT signature
    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return null;
    }

    // Generate new access token
    const user = JSON.parse(storedData);
    const accessTokenData = generateAccessToken({ id: user.userId, email: user.email });

    return {
      access_token: accessTokenData.token,
      token_type: 'Bearer',
      expires_in: accessTokenData.expiresIn
    };
  },

  async validateAccessToken(token) {
    const redis = getRedis();

    // Check if token is blacklisted
    const isBlacklisted = await redis.exists(`${BLACKLIST_PREFIX}${token}`);
    if (isBlacklisted) {
      return null;
    }

    // Verify JWT
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'access') {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email
    };
  },

  async invalidateTokens(accessToken, refreshToken) {
    const redis = getRedis();

    // Get access token expiration to set blacklist TTL
    const decoded = verifyToken(accessToken);
    if (decoded) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redis.setex(`${BLACKLIST_PREFIX}${accessToken}`, ttl, '1');
      }
    }

    // Remove refresh token from Redis
    if (refreshToken) {
      await redis.del(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
    }

    return true;
  }
};

module.exports = tokenService;
