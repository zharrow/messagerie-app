const Conversation = require('../models/Conversation');
const { utils } = require('../shared-lib');
const { error: errorResponse, notFound } = utils.response;

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
      errorResponse(res, 'Internal server error');
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
      }).lean();

      if (!conversation) {
        return notFound(res, 'Conversation');
      }

      // Filter out deleted messages and convert Map fields to plain objects
      if (conversation.messages) {
        conversation.messages = conversation.messages
          .filter(msg => !msg.deletedAt)
          .map(msg => {
            // Convert encryptedPayloads Map to plain object if it exists
            if (msg.encryptedPayloads instanceof Map) {
              msg.encryptedPayloads = Object.fromEntries(msg.encryptedPayloads);
            } else if (msg.encryptedPayloads && typeof msg.encryptedPayloads === 'object' && msg.encryptedPayloads.$type === 'Map') {
              // Handle MongoDB Map serialization
              const entries = Object.entries(msg.encryptedPayloads).filter(([key]) => key !== '$type');
              msg.encryptedPayloads = Object.fromEntries(entries);
            }
            return msg;
          });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Get conversation error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // POST /messages/conversations - Create a new conversation (private or group)
  async createConversation(req, res) {
    try {
      const userId = req.user.id;
      const { participants, isGroup, groupName } = req.body;

      if (!participants || !Array.isArray(participants) || participants.length === 0) {
        return errorResponse(res, 'Participants are required', 400);
      }

      // Add current user to participants if not included
      const allParticipants = [...new Set([userId, ...participants])];

      if (!isGroup && allParticipants.length !== 2) {
        return errorResponse(res, 'Private conversation requires exactly 2 participants', 400);
      }

      if (isGroup && allParticipants.length < 2) {
        // Allow groups with just the creator + 1 other person minimum
        // allParticipants includes current user, so minimum is 2 (creator + 1 member)
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
      errorResponse(res, 'Internal server error');
    }
  },

  // POST /messages/conversations/:id/messages - Send a message (REST fallback)
  async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { content, attachments } = req.body;

      if (!content) {
        return errorResponse(res, 'Message content is required', 400);
      }

      const conversation = await Conversation.findOne({
        _id: id,
        participants: userId
      });

      if (!conversation) {
        return notFound(res, 'Conversation');
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
      errorResponse(res, 'Internal server error');
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
        return notFound(res, 'Conversation');
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
      errorResponse(res, 'Internal server error');
    }
  },

  // POST /messages/conversations/:id/participants - Add participant(s) to group
  async addParticipant(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { participantId, participantIds } = req.body;

      const conversation = await Conversation.findOne({
        _id: id,
        participants: userId,
        isGroup: true
      });

      if (!conversation) {
        return notFound(res, 'Group conversation');
      }

      // Any member can add participants (not just admin)
      // Get list of participants to add (support both single and multiple)
      const toAdd = participantIds || (participantId ? [participantId] : []);

      if (toAdd.length === 0) {
        return errorResponse(res, 'No participants to add', 400);
      }

      // Filter out users already in conversation
      const newParticipants = toAdd.filter(
        pid => !conversation.participants.includes(pid)
      );

      if (newParticipants.length === 0) {
        return errorResponse(res, 'All users are already in the conversation', 400);
      }

      conversation.participants.push(...newParticipants);
      await conversation.save();

      res.json(conversation);
    } catch (error) {
      console.error('Add participant error:', error);
      errorResponse(res, 'Internal server error');
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
        return notFound(res, 'Group conversation');
      }

      // Admin can remove anyone, users can only remove themselves
      if (conversation.groupAdmin !== userId && userId !== parseInt(participantId)) {
        return errorResponse(res, 'Not authorized', 403);
      }

      conversation.participants = conversation.participants.filter(
        p => p !== parseInt(participantId)
      );

      await conversation.save();

      res.json(conversation);
    } catch (error) {
      console.error('Remove participant error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // DELETE /messages/conversations/:id - Delete conversation
  async deleteConversation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findOne({
        _id: id,
        participants: userId
      });

      if (!conversation) {
        return notFound(res, 'Conversation');
      }

      // Allow any participant to delete (especially for /fire command)
      // No admin check - any member can "fire" the conversation
      await Conversation.deleteOne({ _id: id });

      res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
      console.error('Delete conversation error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // GET /messages/health
  health(req, res) {
    res.json({
      status: 'healthy',
      service: 'message-service',
      timestamp: new Date().toISOString()
    });
  },

  // GET /messages/search - Search in messages
  async searchMessages(req, res) {
    try {
      const userId = req.user.id;
      const { q, conversationId } = req.query;

      if (!q || q.length < 2) {
        return errorResponse(res, 'Search query must be at least 2 characters', 400);
      }

      // Build query
      const query = {
        participants: userId,
        'messages.content': { $regex: q, $options: 'i' }
      };

      if (conversationId) {
        query._id = conversationId;
      }

      const conversations = await Conversation.find(query)
        .select('_id participants isGroup groupName messages')
        .lean();

      // Extract matching messages
      const results = [];
      conversations.forEach(conv => {
        const matchingMessages = conv.messages.filter(msg =>
          msg.content &&
          !msg.deletedAt &&
          msg.content.toLowerCase().includes(q.toLowerCase())
        );

        matchingMessages.forEach(msg => {
          results.push({
            conversationId: conv._id,
            conversationName: conv.isGroup ? conv.groupName : null,
            participants: conv.participants,
            message: msg
          });
        });
      });

      // Sort by date descending
      results.sort((a, b) => new Date(b.message.createdAt) - new Date(a.message.createdAt));

      res.json(results.slice(0, 50)); // Limit to 50 results
    } catch (error) {
      console.error('Search messages error:', error);
      errorResponse(res, 'Internal server error');
    }
  },

  // GET /messages/conversations/:id/messages - Get messages with pagination
  async getMessages(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { before, limit = 50 } = req.query;

      const conversation = await Conversation.findOne({
        _id: id,
        participants: userId
      });

      if (!conversation) {
        return notFound(res, 'Conversation');
      }

      let messages = [...conversation.messages];

      // Filter messages before a certain date (for pagination)
      if (before) {
        const beforeDate = new Date(before);
        messages = messages.filter(msg => new Date(msg.createdAt) < beforeDate);
      }

      // Sort by date descending and limit
      messages = messages
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, parseInt(limit));

      // Reverse to get chronological order
      messages.reverse();

      res.json({
        messages,
        hasMore: messages.length === parseInt(limit)
      });
    } catch (error) {
      console.error('Get messages error:', error);
      errorResponse(res, 'Internal server error');
    }
  }
};

module.exports = messageController;
