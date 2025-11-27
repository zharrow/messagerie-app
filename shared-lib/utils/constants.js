/**
 * Shared constants across all microservices
 */

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh'
};

const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BUSY: 'busy',
  AWAY: 'away'
};

const SERVICE_NAMES = {
  USER: 'user-service',
  AUTH: 'auth-service',
  MESSAGE: 'message-service'
};

module.exports = {
  HTTP_STATUS,
  TOKEN_TYPES,
  USER_STATUS,
  SERVICE_NAMES
};
