const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { middlewares } = require('../shared-lib');
const { internalOnly } = middlewares.internalAuth;

// All internal routes require internal middleware
router.use(internalOnly);

// Validate token (called by User Service)
router.post('/validate-token', authController.validateToken);

module.exports = router;
