/**
 * Centralized service URLs configuration
 * Shared across all microservices
 */

const SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || 'http://auth-service:3002',
  USER: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  MESSAGE: process.env.MESSAGE_SERVICE_URL || 'http://message-service:3003'
};

const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

module.exports = {
  SERVICES,
  INTERNAL_SECRET
};