/**
 * Email validation utilities
 * Shared across all services that handle user emails
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize email (lowercase, trim)
 * @param {string} email - Email to normalize
 * @returns {string} Normalized email
 */
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email.trim().toLowerCase();
}

/**
 * Validate and normalize email
 * @param {string} email - Email to process
 * @returns {{valid: boolean, email: string, error: string|null}}
 */
function validateAndNormalize(email) {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return {
      valid: false,
      email: '',
      error: 'Email is required'
    };
  }

  if (!isValidEmail(normalized)) {
    return {
      valid: false,
      email: normalized,
      error: 'Invalid email format'
    };
  }

  return {
    valid: true,
    email: normalized,
    error: null
  };
}

module.exports = {
  isValidEmail,
  normalizeEmail,
  validateAndNormalize
};
