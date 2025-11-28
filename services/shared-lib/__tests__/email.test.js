/**
 * Unit tests for email validator
 */

const { isValidEmail, normalizeEmail, validateAndNormalize } = require('../validators/email');

describe('Email Validator', () => {
  describe('isValidEmail', () => {
    test('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('valid_email@domain.com')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('test@domain')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('   ')).toBe(false);
      expect(isValidEmail(123)).toBe(false);
    });
  });

  describe('normalizeEmail', () => {
    test('should convert to lowercase and trim', () => {
      expect(normalizeEmail('Test@Example.COM')).toBe('test@example.com');
      expect(normalizeEmail('  user@domain.com  ')).toBe('user@domain.com');
      expect(normalizeEmail('  USER@DOMAIN.COM  ')).toBe('user@domain.com');
    });

    test('should handle edge cases', () => {
      expect(normalizeEmail(null)).toBe('');
      expect(normalizeEmail(undefined)).toBe('');
      expect(normalizeEmail('')).toBe('');
      expect(normalizeEmail('   ')).toBe('');
    });
  });

  describe('validateAndNormalize', () => {
    test('should return valid result for correct emails', () => {
      const result = validateAndNormalize('Test@Example.com');
      expect(result.valid).toBe(true);
      expect(result.email).toBe('test@example.com');
      expect(result.error).toBeNull();
    });

    test('should return error for invalid emails', () => {
      const result = validateAndNormalize('invalid-email');
      expect(result.valid).toBe(false);
      expect(result.email).toBe('invalid-email');
      expect(result.error).toBe('Invalid email format');
    });

    test('should return error for empty emails', () => {
      const result = validateAndNormalize('');
      expect(result.valid).toBe(false);
      expect(result.email).toBe('');
      expect(result.error).toBe('Email is required');
    });

    test('should handle whitespace', () => {
      const result = validateAndNormalize('  Valid@Email.com  ');
      expect(result.valid).toBe(true);
      expect(result.email).toBe('valid@email.com');
      expect(result.error).toBeNull();
    });
  });
});
