const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { middlewares } = require('../shared-lib');
const { internalOnly } = middlewares.internalAuth;

// All internal routes require internal middleware
router.use(internalOnly);

// Verify user credentials (called by Auth Service)
router.post('/verify-credentials', userController.verifyCredentials);

module.exports = router;
