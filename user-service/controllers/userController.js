const User = require('../models/User');
const { validateEmail, validatePassword } = require('../utils/validation');

const userController = {
  // POST /users/register
  async register(req, res) {
    try {
      const { email, password, first_name, last_name } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters with uppercase, lowercase, and number'
        });
      }

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Create user
      const user = await User.create({ email, password, first_name, last_name });

      res.status(201).json(user);
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /users/:id
  async getUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // PUT /users/:id
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { first_name, last_name } = req.body;

      // Verify user is updating their own profile
      if (req.user && req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Not authorized to update this profile' });
      }

      const user = await User.update(id, { first_name, last_name });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /users/health
  health(req, res) {
    res.json({
      status: 'healthy',
      service: 'user-service',
      timestamp: new Date().toISOString()
    });
  },

  // POST /internal/verify-credentials
  async verifyCredentials(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await User.verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Return user without password_hash
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Verify credentials error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = userController;
