const Redis = require('ioredis');

let redis;

const initRedis = async () => {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
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
  await redis.ping();
  console.log('Redis initialized successfully');
};

const getRedis = () => redis;

module.exports = { initRedis, getRedis };
