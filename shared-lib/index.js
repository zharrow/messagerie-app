/**
 * Shared library for microservices
 *
 * This library provides common utilities, middlewares, and validators
 * that can be reused across all microservices to ensure consistency
 * and reduce code duplication.
 *
 * Usage:
 * const { middlewares, utils, validators } = require('@microservices/shared-lib');
 */

const middlewares = {
  internalAuth: require('./middlewares/internalAuth'),
  logger: require('./middlewares/logger')
};

const utils = {
  response: require('./utils/response'),
  constants: require('./utils/constants')
};

const validators = {
  email: require('./validators/email')
};

module.exports = {
  middlewares,
  utils,
  validators
};
