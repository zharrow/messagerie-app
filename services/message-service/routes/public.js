const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middlewares/auth');
const { upload, getFileUrl, uploadsDir } = require('../services/uploadService');
const validate = require('../middlewares/validate');
const {
  createConversationSchema,
  sendMessageSchema,
  addParticipantsSchema,
  searchMessagesSchema,
  getMessagesSchema
} = require('../validators/conversation');

// Health check - no auth required
router.get('/health', messageController.health);

// Serve uploaded files - no auth required (files have unique random names)
router.use('/uploads', express.static(uploadsDir));

// All other routes require authentication
router.use(authMiddleware);

// File upload endpoint
router.post('/upload', upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const attachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: getFileUrl(file.filename),
      mimeType: file.mimetype,
      size: file.size
    }));

    res.json({ attachments });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Conversations
router.get('/conversations', messageController.getConversations);
router.post('/conversations', validate(createConversationSchema), messageController.createConversation);
router.get('/conversations/:id', messageController.getConversation);
router.delete('/conversations/:id', messageController.deleteConversation);

// Search in conversations
router.get('/search', validate(searchMessagesSchema, 'query'), messageController.searchMessages);

// Messages
router.post('/conversations/:id/messages', validate(sendMessageSchema), messageController.sendMessage);
router.put('/conversations/:id/read', messageController.markAsRead);

// Pagination - get older messages
router.get('/conversations/:id/messages', validate(getMessagesSchema, 'query'), messageController.getMessages);

// Group management
router.post('/conversations/:id/participants', validate(addParticipantsSchema), messageController.addParticipant);
router.delete('/conversations/:id/participants/:participantId', messageController.removeParticipant);

module.exports = router;
