const User = require('../models/User');
const { utils, validators } = require('../shared-lib');
const { error: errorResponse, notFound, unauthorized } = utils.response;
const { isValidEmail, isValidPassword } = validators.email;

const userController = {
  // POST /users/register
  async register(req, res) {
    try {
      const { email, password, first_name, last_name } = req.body;

      // Validation
      if (!email || !password) {
        return errorResponse(res, 'Email and password are required', 400);
      }

      if (!isValidEmail(email)) {
        return errorResponse(res, 'Invalid email format', 400);
      }

      if (!isValidPassword(password)) {
        return errorResponse(res, 'Password must be at least 8 characters with uppercase, lowercase, and number', 400);
      }

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return errorResponse(res, 'Email already registered', 409);
      }

      // Create user
      const user = await User.create({ email, password, first_name, last_name });

      res.status(201).json(user);
    } catch (error) {
      console.error('Register error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // GET /users/:id
  async getUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return notFound(res, 'User');
      }

      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // PUT /users/:id
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { first_name, last_name } = req.body;

      // Verify user is updating their own profile
      if (req.user && req.user.id !== parseInt(id)) {
        return errorResponse(res, 'Not authorized to update this profile', 403);
      }

      const user = await User.update(id, { first_name, last_name });
      if (!user) {
        return notFound(res, 'User');
      }

      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // GET /users/:id/profile - Get user profile
  async getProfile(req, res) {
    try {
      const { id } = req.params;

      const user = await User.getProfile(id);
      if (!user) {
        return notFound(res, 'User');
      }

      res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // PUT /users/:id/profile - Update user profile (photo, bio)
  async updateProfile(req, res) {
    try {
      const { id } = req.params;
      const { profile_photo_url, bio } = req.body;

      // Verify user is updating their own profile
      if (req.user && req.user.id !== parseInt(id)) {
        return errorResponse(res, 'Not authorized to update this profile', 403);
      }

      const user = await User.updateProfile(id, { profile_photo_url, bio });
      if (!user) {
        return notFound(res, 'User');
      }

      res.json(user);
    } catch (error) {
      console.error('Update profile error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // PUT /users/:id/status - Update user status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, status_message } = req.body;

      // Verify user is updating their own status
      if (req.user && req.user.id !== parseInt(id)) {
        return errorResponse(res, 'Not authorized to update this status', 403);
      }

      const user = await User.updateStatus(id, { status, status_message });
      if (!user) {
        return notFound(res, 'User');
      }

      res.json(user);
    } catch (error) {
      console.error('Update status error:', error);
      if (error.message.includes('Invalid status')) {
        return errorResponse(res, error.message, 400);
      }
      errorResponse(res, 'Internal server error');
    }
  },

  // GET /users - List all users
  async listUsers(req, res) {
    try {
      const currentUserId = req.user?.id;
      const users = await User.findAll(currentUserId);
      res.json(users);
    } catch (error) {
      console.error('List users error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // POST /internal/verify-credentials
  async verifyCredentials(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return errorResponse(res, 'Email and password are required', 400);
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return unauthorized(res, 'Invalid credentials');
      }

      const isValid = await User.verifyPassword(password, user.password_hash);
      if (!isValid) {
        return unauthorized(res, 'Invalid credentials');
      }

      // Return user without password_hash
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Verify credentials error:', error);
      errorResponse(res, 'Internal server error');
    }
  }
};

module.exports = userController;
