/**
 * Validation middleware using Joi
 * @param {Object} schema - Joi schema to validate against
 * @param {string} property - Property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown keys from the validated data
      convert: true // Convert types (string to number, etc.)
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

module.exports = validate;
