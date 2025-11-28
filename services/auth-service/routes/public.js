const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Health check - no auth required
router.get('/health', authController.health);

// Authentication routes - no auth required
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

module.exports = router;
