const Conversation = require('../models/Conversation');

const messageController = {
  // GET /messages/conversations - Get all conversations for a user
  async getConversations(req, res) {
    try {
      const userId = req.user.id;

      const conversations = await Conversation.find({
        participants: userId
      })
        .select('-messages')
        .sort({ updatedAt: -1 });

      res.json(conversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /messages/conversations/:id - Get a specific conversation with messages
  async getConversation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findOne({
        _id: id,
        participants: userId
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /messages/conversations - Create a new conversation (private or group)
  async createConversation(req, res) {
    try {
      const userId = req.user.id;
      const { participants, isGroup, groupName } = req.body;

      if (!participants || !Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ error: 'Participants are required' });
      }

      // Add current user to participants if not included
      const allParticipants = [...new Set([userId, ...participants])];

      if (!isGroup && allParticipants.length !== 2) {
        return res.status(400).json({ error: 'Private conversation requires exactly 2 participants' });
      }

      if (isGroup && allParticipants.length < 2) {
        return res.status(400).json({ error: 'Group conversation requires at least 2 participants' });
      }

      // For private conversations, check if one already exists
      if (!isGroup) {
        const existingConversation = await Conversation.findOne({
          participants: { $all: allParticipants, $size: 2 },
          isGroup: false
        });

        if (existingConversation) {
          return res.json(existingConversation);
        }
      }

      const conversation = new Conversation({
        participants: allParticipants,
        isGroup: isGroup || false,
        groupName: isGroup ? groupName : null,
        groupAdmin: isGroup ? userId : null,
        messages: []
      });

      await conversation.save();

      res.status(201).json(conversation);
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /messages/conversations/:id/messages - Send a message (REST fallback)
  async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { content, attachments } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const conversation = await Conversation.findOne({
        _id: id,
        participants: userId
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const message = {
        from: userId,
        content,
        attachments: attachments || [],
        readBy: [userId],
        createdAt: new Date()
      };

      conversation.messages.push(message);
      conversation.lastMessage = {
        content,
        from: userId,
        createdAt: message.createdAt
      };

      await conversation.save();

      // Get the saved message with its _id
      const savedMessage = conversation.messages[conversation.messages.length - 1];

      res.status(201).json(savedMessage);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // PUT /messages/conversations/:id/read - Mark messages as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findOne({
        _id: id,
        participants: userId
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Mark all messages as read by this user
      conversation.messages.forEach(message => {
        if (!message.readBy.includes(userId)) {
          message.readBy.push(userId);
        }
      });

      await conversation.save();

      res.json({ message: 'Messages marked as read' });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /messages/conversations/:id/participants - Add participant to group
  async addParticipant(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { participantId } = req.body;

      const conversation = await Conversation.findOne({
        _id: id,
        participants: userId,
        isGroup: true
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Group conversation not found' });
      }

      if (conversation.groupAdmin !== userId) {
        return res.status(403).json({ error: 'Only admin can add participants' });
      }

      if (conversation.participants.includes(participantId)) {
        return res.status(400).json({ error: 'User already in conversation' });
      }

      conversation.participants.push(participantId);
      await conversation.save();

      res.json(conversation);
    } catch (error) {
      console.error('Add participant error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // DELETE /messages/conversations/:id/participants/:participantId - Remove participant
  async removeParticipant(req, res) {
    try {
      const { id, participantId } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findOne({
        _id: id,
        participants: userId,
        isGroup: true
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Group conversation not found' });
      }

      // Admin can remove anyone, users can only remove themselves
      if (conversation.groupAdmin !== userId && userId !== parseInt(participantId)) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      conversation.participants = conversation.participants.filter(
        p => p !== parseInt(participantId)
      );

      await conversation.save();

      res.json(conversation);
    } catch (error) {
      console.error('Remove participant error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /messages/health
  health(req, res) {
    res.json({
      status: 'healthy',
      service: 'message-service',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = messageController;
