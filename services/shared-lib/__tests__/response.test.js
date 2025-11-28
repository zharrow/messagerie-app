/**
 * Unit tests for response utils
 */

const { success, error, validationError, notFound, unauthorized } = require('../utils/response');

// Mock Express response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Response Utils', () => {
  describe('success', () => {
    test('should return success response with default values', () => {
      const res = mockResponse();
      const data = { id: 1, name: 'Test' };

      success(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Success',
          data,
          timestamp: expect.any(String)
        })
      );
    });

    test('should return success response with custom values', () => {
      const res = mockResponse();
      const data = { id: 1 };

      success(res, data, 'Created successfully', 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Created successfully',
          data
        })
      );
    });
  });

  describe('error', () => {
    test('should return error response with default values', () => {
      const res = mockResponse();

      error(res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal Server Error',
          timestamp: expect.any(String)
        })
      );
    });

    test('should return error response with custom values', () => {
      const res = mockResponse();

      error(res, 'Not found', 404);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Not found'
        })
      );
    });
  });

  describe('validationError', () => {
    test('should return validation error response', () => {
      const res = mockResponse();
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' }
      ];

      validationError(res, errors);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
          errors
        })
      );
    });
  });

  describe('notFound', () => {
    test('should return not found response with default resource', () => {
      const res = mockResponse();

      notFound(res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Resource not found'
        })
      );
    });

    test('should return not found response with custom resource', () => {
      const res = mockResponse();

      notFound(res, 'User');

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not found'
        })
      );
    });
  });

  describe('unauthorized', () => {
    test('should return unauthorized response with default message', () => {
      const res = mockResponse();

      unauthorized(res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Unauthorized'
        })
      );
    });

    test('should return unauthorized response with custom message', () => {
      const res = mockResponse();

      unauthorized(res, 'Invalid token');

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid token'
        })
      );
    });
  });
});
