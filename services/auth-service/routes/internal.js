const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const internalMiddleware = require('../middlewares/internal');

// All internal routes require internal middleware
router.use(internalMiddleware);

// Validate token (called by User Service)
router.post('/validate-token', authController.validateToken);

module.exports = router;
