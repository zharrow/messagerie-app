const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middlewares/auth');

// Health check - no auth required
router.get('/health', messageController.health);

// All other routes require authentication
router.use(authMiddleware);

// Conversations
router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController.createConversation);
router.get('/conversations/:id', messageController.getConversation);

// Messages
router.post('/conversations/:id/messages', messageController.sendMessage);
router.put('/conversations/:id/read', messageController.markAsRead);

// Group management
router.post('/conversations/:id/participants', messageController.addParticipant);
router.delete('/conversations/:id/participants/:participantId', messageController.removeParticipant);

module.exports = router;
