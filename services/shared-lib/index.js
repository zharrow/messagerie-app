/**
 * Shared library for microservices
 *
 * This library provides common utilities, middlewares, and validators
 * that can be reused across all microservices to ensure consistency
 * and reduce code duplication.
 *
 * Usage:
 * const { middlewares, utils, validators, config } = require('@microservices/shared-lib');
 */

const middlewares = {
  internalAuth: require('./middlewares/internalAuth'),
  auth: require('./middlewares/auth'),
  health: require('./middlewares/health'),
  logger: require('./middlewares/logger')
};

const utils = {
  response: require('./utils/response'),
  constants: require('./utils/constants'),
  httpClient: require('./utils/httpClient'),
  serverFactory: require('./utils/serverFactory')
};

const validators = {
  email: require('./validators/email')
};

const config = {
  services: require('./config/services')
};

module.exports = {
  middlewares,
  utils,
  validators,
  config
};
