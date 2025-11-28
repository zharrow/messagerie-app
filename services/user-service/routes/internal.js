const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const internalMiddleware = require('../middlewares/internal');

// All internal routes require internal middleware
router.use(internalMiddleware);

// Verify user credentials (called by Auth Service)
router.post('/verify-credentials', userController.verifyCredentials);

module.exports = router;
