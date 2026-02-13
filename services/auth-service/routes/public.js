const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { middlewares } = require('../shared-lib');
const { healthCheck } = middlewares.health;

// Health check - no auth required
router.get('/health', healthCheck('auth-service'));

// Authentication routes - no auth required
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

module.exports = router;
