const { getRedis } = require('../config/redis');

const SESSION_PREFIX = 'session:';

const sessionService = {
  async createSession(userId, sessionData) {
    const redis = getRedis();
    const sessionId = `${SESSION_PREFIX}${userId}:${Date.now()}`;

    await redis.setex(
      sessionId,
      60 * 60 * 24, // 24 hours
      JSON.stringify({
        userId,
        ...sessionData,
        createdAt: new Date().toISOString()
      })
    );

    return sessionId;
  },

  async getSession(sessionId) {
    const redis = getRedis();
    const data = await redis.get(sessionId);
    return data ? JSON.parse(data) : null;
  },

  async deleteSession(sessionId) {
    const redis = getRedis();
    await redis.del(sessionId);
    return true;
  },

  async deleteAllUserSessions(userId) {
    const redis = getRedis();
    const keys = await redis.keys(`${SESSION_PREFIX}${userId}:*`);

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return keys.length;
  }
};

module.exports = sessionService;
