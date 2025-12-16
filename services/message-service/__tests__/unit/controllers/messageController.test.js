const messageController = require('../../../controllers/messageController');
const Conversation = require('../../../models/Conversation');
const mongoose = require('mongoose');

describe('MessageController', () => {
  // Mock request and response objects
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: { id: 1 },
      params: {},
      body: {},
      query: {}
    };

    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('getConversations', () => {
    it('should return all conversations for the user', async () => {
      // Create test conversations
      await Conversation.create([
        {
          participants: [1, 2],
          isGroup: false,
          messages: [{ from: 1, content: 'Hello', createdAt: new Date() }]
        },
        {
          participants: [1, 3],
          isGroup: false,
          messages: [{ from: 1, content: 'Hi', createdAt: new Date() }]
        }
      ]);

      await messageController.getConversations(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const conversations = mockRes.json.mock.calls[0][0];
      expect(conversations).toHaveLength(2);
      expect(conversations[0]).not.toHaveProperty('messages'); // Should not include messages
    });

    it('should return empty array if user has no conversations', async () => {
      mockReq.user.id = 999;

      await messageController.getConversations(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });
  });

  describe('getConversation', () => {
    let conversationId;

    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { from: 1, content: 'Hello', createdAt: new Date() },
          { from: 2, content: 'Hi!', createdAt: new Date() }
        ]
      });
      conversationId = conv._id.toString();
    });

    it('should return conversation with messages', async () => {
      mockReq.params.id = conversationId;

      await messageController.getConversation(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const conversation = mockRes.json.mock.calls[0][0];
      expect(conversation.messages).toHaveLength(2);
      expect(conversation.participants).toContain(1);
    });

    it('should filter out deleted messages', async () => {
      const conv = await Conversation.findById(conversationId);
      conv.messages.push({
        from: 1,
        content: 'Deleted message',
        deletedAt: new Date(),
        createdAt: new Date()
      });
      await conv.save();

      mockReq.params.id = conversationId;

      await messageController.getConversation(mockReq, mockRes);

      const conversation = mockRes.json.mock.calls[0][0];
      expect(conversation.messages).toHaveLength(2); // Should not include deleted
    });

    it('should return 404 if conversation not found', async () => {
      mockReq.params.id = new mongoose.Types.ObjectId().toString();

      await messageController.getConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Conversation not found' });
    });

    it('should return 404 if user is not a participant', async () => {
      mockReq.user.id = 999;
      mockReq.params.id = conversationId;

      await messageController.getConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createConversation', () => {
    it('should create a private conversation', async () => {
      mockReq.body = {
        participants: [2],
        isGroup: false
      };

      await messageController.createConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      const conversation = mockRes.json.mock.calls[0][0];
      expect(conversation.participants).toHaveLength(2);
      expect(conversation.participants).toContain(1);
      expect(conversation.participants).toContain(2);
      expect(conversation.isGroup).toBe(false);
    });

    it('should create a group conversation', async () => {
      mockReq.body = {
        participants: [2, 3, 4],
        isGroup: true,
        groupName: 'Test Group'
      };

      await messageController.createConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      const conversation = mockRes.json.mock.calls[0][0];
      expect(conversation.isGroup).toBe(true);
      expect(conversation.groupName).toBe('Test Group');
      expect(conversation.groupAdmin).toBe(1);
      expect(conversation.participants).toHaveLength(4);
    });

    it('should return existing private conversation if it exists', async () => {
      // Create existing conversation
      const existing = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });

      mockReq.body = {
        participants: [2],
        isGroup: false
      };

      await messageController.createConversation(mockReq, mockRes);

      expect(mockRes.status).not.toHaveBeenCalledWith(201); // Should not create new
      const conversation = mockRes.json.mock.calls[0][0];
      expect(conversation._id.toString()).toBe(existing._id.toString());
    });

    it('should return 400 if participants are missing', async () => {
      mockReq.body = { isGroup: false };

      await messageController.createConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Participants are required' });
    });

    it('should return 400 if private conversation has wrong number of participants', async () => {
      mockReq.body = {
        participants: [2, 3], // 3 participants with current user
        isGroup: false
      };

      await messageController.createConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Private conversation requires exactly 2 participants'
      });
    });
  });

  describe('sendMessage', () => {
    let conversationId;

    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });
      conversationId = conv._id.toString();
    });

    it('should send a message to conversation', async () => {
      mockReq.params.id = conversationId;
      mockReq.body = {
        content: 'Test message'
      };

      await messageController.sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      const message = mockRes.json.mock.calls[0][0];
      expect(message.content).toBe('Test message');
      expect(message.from).toBe(1);
      expect(message._id).toBeDefined();
    });

    it('should include attachments in message', async () => {
      mockReq.params.id = conversationId;
      mockReq.body = {
        content: 'Check this file',
        attachments: [
          {
            filename: 'test.jpg',
            url: '/uploads/test.jpg',
            mimeType: 'image/jpeg'
          }
        ]
      };

      await messageController.sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      const message = mockRes.json.mock.calls[0][0];
      expect(message.attachments).toHaveLength(1);
      expect(message.attachments[0].filename).toBe('test.jpg');
    });

    it('should update lastMessage field', async () => {
      mockReq.params.id = conversationId;
      mockReq.body = { content: 'Latest message' };

      await messageController.sendMessage(mockReq, mockRes);

      const conv = await Conversation.findById(conversationId);
      expect(conv.lastMessage.content).toBe('Latest message');
      expect(conv.lastMessage.from).toBe(1);
    });

    it('should return 400 if content is missing', async () => {
      mockReq.params.id = conversationId;
      mockReq.body = {};

      await messageController.sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Message content is required' });
    });

    it('should return 404 if conversation not found', async () => {
      mockReq.params.id = new mongoose.Types.ObjectId().toString();
      mockReq.body = { content: 'Test' };

      await messageController.sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('markAsRead', () => {
    let conversationId;

    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { from: 2, content: 'Message 1', readBy: [2], createdAt: new Date() },
          { from: 2, content: 'Message 2', readBy: [2], createdAt: new Date() }
        ]
      });
      conversationId = conv._id.toString();
    });

    it('should mark all messages as read', async () => {
      mockReq.params.id = conversationId;

      await messageController.markAsRead(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Messages marked as read' });

      const conv = await Conversation.findById(conversationId);
      conv.messages.forEach(msg => {
        expect(msg.readBy).toContain(1);
      });
    });

    it('should not duplicate readBy entries', async () => {
      mockReq.params.id = conversationId;

      // Mark as read twice
      await messageController.markAsRead(mockReq, mockRes);
      await messageController.markAsRead(mockReq, mockRes);

      const conv = await Conversation.findById(conversationId);
      conv.messages.forEach(msg => {
        const user1Count = msg.readBy.filter(id => id === 1).length;
        expect(user1Count).toBe(1); // Should appear only once
      });
    });

    it('should return 404 if conversation not found', async () => {
      mockReq.params.id = new mongoose.Types.ObjectId().toString();

      await messageController.markAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('addParticipant', () => {
    let conversationId;

    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2, 3],
        isGroup: true,
        groupName: 'Test Group',
        groupAdmin: 1,
        messages: []
      });
      conversationId = conv._id.toString();
    });

    it('should add a single participant to group', async () => {
      mockReq.params.id = conversationId;
      mockReq.body = { participantId: 4 };

      await messageController.addParticipant(mockReq, mockRes);

      const conversation = mockRes.json.mock.calls[0][0];
      expect(conversation.participants).toContain(4);
      expect(conversation.participants).toHaveLength(4);
    });

    it('should add multiple participants to group', async () => {
      mockReq.params.id = conversationId;
      mockReq.body = { participantIds: [4, 5] };

      await messageController.addParticipant(mockReq, mockRes);

      const conversation = mockRes.json.mock.calls[0][0];
      expect(conversation.participants).toContain(4);
      expect(conversation.participants).toContain(5);
      expect(conversation.participants).toHaveLength(5);
    });

    it('should return 400 if user is already in conversation', async () => {
      mockReq.params.id = conversationId;
      mockReq.body = { participantId: 2 }; // Already in conversation

      await messageController.addParticipant(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'All users are already in the conversation'
      });
    });

    it('should return 404 if conversation is not a group', async () => {
      const privateConv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });

      mockReq.params.id = privateConv._id.toString();
      mockReq.body = { participantId: 3 };

      await messageController.addParticipant(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('removeParticipant', () => {
    let conversationId;

    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2, 3, 4],
        isGroup: true,
        groupName: 'Test Group',
        groupAdmin: 1,
        messages: []
      });
      conversationId = conv._id.toString();
    });

    it('should allow admin to remove participant', async () => {
      mockReq.params.id = conversationId;
      mockReq.params.participantId = '3';

      await messageController.removeParticipant(mockReq, mockRes);

      const conversation = mockRes.json.mock.calls[0][0];
      expect(conversation.participants).not.toContain(3);
      expect(conversation.participants).toHaveLength(3);
    });

    it('should allow user to remove themselves', async () => {
      mockReq.user.id = 2; // Non-admin user
      mockReq.params.id = conversationId;
      mockReq.params.participantId = '2';

      await messageController.removeParticipant(mockReq, mockRes);

      const conversation = mockRes.json.mock.calls[0][0];
      expect(conversation.participants).not.toContain(2);
    });

    it('should return 403 if non-admin tries to remove others', async () => {
      mockReq.user.id = 2; // Non-admin user
      mockReq.params.id = conversationId;
      mockReq.params.participantId = '3'; // Trying to remove someone else

      await messageController.removeParticipant(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not authorized' });
    });
  });

  describe('deleteConversation', () => {
    let conversationId;

    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [{ from: 1, content: 'Test', createdAt: new Date() }]
      });
      conversationId = conv._id.toString();
    });

    it('should delete conversation', async () => {
      mockReq.params.id = conversationId;

      await messageController.deleteConversation(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Conversation deleted successfully' });

      const deleted = await Conversation.findById(conversationId);
      expect(deleted).toBeNull();
    });

    it('should return 404 if conversation not found', async () => {
      mockReq.params.id = new mongoose.Types.ObjectId().toString();

      await messageController.deleteConversation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('searchMessages', () => {
    beforeEach(async () => {
      await Conversation.create([
        {
          participants: [1, 2],
          isGroup: false,
          messages: [
            { from: 1, content: 'Hello world', createdAt: new Date() },
            { from: 2, content: 'Hello there', createdAt: new Date() }
          ]
        },
        {
          participants: [1, 3],
          isGroup: true,
          groupName: 'Group Chat',
          messages: [
            { from: 3, content: 'World news', createdAt: new Date() }
          ]
        }
      ]);
    });

    it('should search messages by keyword', async () => {
      mockReq.query = { q: 'hello' };

      await messageController.searchMessages(mockReq, mockRes);

      const results = mockRes.json.mock.calls[0][0];
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.message.content.toLowerCase()).toContain('hello');
      });
    });

    it('should search in specific conversation', async () => {
      const conv = await Conversation.findOne({ participants: [1, 2] });
      mockReq.query = { q: 'hello', conversationId: conv._id.toString() };

      await messageController.searchMessages(mockReq, mockRes);

      const results = mockRes.json.mock.calls[0][0];
      results.forEach(result => {
        expect(result.conversationId.toString()).toBe(conv._id.toString());
      });
    });

    it('should return 400 if query is too short', async () => {
      mockReq.query = { q: 'a' }; // Only 1 character

      await messageController.searchMessages(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Search query must be at least 2 characters'
      });
    });

    it('should not return deleted messages', async () => {
      const conv = await Conversation.findOne({ participants: [1, 2] });
      conv.messages.push({
        from: 1,
        content: 'Hello deleted',
        deletedAt: new Date(),
        createdAt: new Date()
      });
      await conv.save();

      mockReq.query = { q: 'hello' };

      await messageController.searchMessages(mockReq, mockRes);

      const results = mockRes.json.mock.calls[0][0];
      results.forEach(result => {
        expect(result.message.content).not.toBe('Hello deleted');
      });
    });
  });

  describe('health', () => {
    it('should return healthy status', () => {
      messageController.health(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      expect(response.status).toBe('healthy');
      expect(response.service).toBe('message-service');
      expect(response.timestamp).toBeDefined();
    });
  });
});
