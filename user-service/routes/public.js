const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

// Health check - no auth required
router.get('/health', userController.health);

// Registration - no auth required
router.post('/register', userController.register);

// Protected routes - auth required
router.get('/', authMiddleware, userController.listUsers);
router.get('/:id', authMiddleware, userController.getUser);
router.put('/:id', authMiddleware, userController.updateUser);

// Profile routes
router.get('/:id/profile', authMiddleware, userController.getProfile);
router.put('/:id/profile', authMiddleware, userController.updateProfile);
router.put('/:id/status', authMiddleware, userController.updateStatus);

module.exports = router;
