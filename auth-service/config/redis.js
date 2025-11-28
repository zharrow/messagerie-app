const Redis = require('ioredis');

let redis;

const initRedis = async () => {
  // Support both REDIS_URL (Railway/production) and individual config (Docker/local)
  const redisConfig = process.env.REDIS_URL
    ? process.env.REDIS_URL  // Railway provides full URL
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
      };

  redis = new Redis(redisConfig, {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  });

  redis.on('connect', () => {
    console.log('Connected to Redis');
  });

  redis.on('error', (err) => {
    console.error('Redis error:', err);
  });

  // Test connection
  try {
    await redis.ping();
    console.log('Redis initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    throw error;
  }
};

const getRedis = () => redis;

module.exports = { initRedis, getRedis };
