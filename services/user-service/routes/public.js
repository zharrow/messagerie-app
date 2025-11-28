const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const keyController = require('../controllers/keyController');
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

// E2EE Key management routes
router.post('/keys', authMiddleware, keyController.uploadPublicKey);
router.get('/keys/me', authMiddleware, keyController.getMyKeys);
router.get('/:userId/keys', authMiddleware, keyController.getUserPublicKeys);
router.post('/keys/bulk', authMiddleware, keyController.getBulkPublicKeys);
router.delete('/keys/:device_id', authMiddleware, keyController.deactivateKey);

module.exports = router;
