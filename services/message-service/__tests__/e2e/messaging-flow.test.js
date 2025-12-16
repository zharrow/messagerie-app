const request = require('supertest');
const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');

// Mock auth middleware for testing
jest.mock('../../middlewares/auth', () => ({
  __esModule: true,
  default: (req, res, next) => {
    // Mock authenticated user
    req.user = { id: parseInt(req.headers['x-user-id']) || 1 };
    next();
  }
}));

// Create Express app for testing
const express = require('express');
const app = express();
app.use(express.json());
app.use('/messages', require('../../routes/public'));

describe('E2E: Complete Messaging Flow', () => {
  const user1Id = 1;
  const user2Id = 2;
  const user3Id = 3;

  describe('Full Conversation Lifecycle', () => {
    let conversationId;
    let messageId;

    it('should create a private conversation between two users', async () => {
      const response = await request(app)
        .post('/messages/conversations')
        .set('x-user-id', user1Id.toString())
        .send({
          participants: [user2Id],
          isGroup: false
        });

      expect(response.status).toBe(201);
      expect(response.body.participants).toContain(user1Id);
      expect(response.body.participants).toContain(user2Id);
      expect(response.body.isGroup).toBe(false);

      conversationId = response.body._id;
    });

    it('should send first message in conversation', async () => {
      const response = await request(app)
        .post(`/messages/conversations/${conversationId}/messages`)
        .set('x-user-id', user1Id.toString())
        .send({
          content: 'Hello! This is the first message'
        });

      expect(response.status).toBe(201);
      expect(response.body.from).toBe(user1Id);
      expect(response.body.content).toBe('Hello! This is the first message');
      expect(response.body._id).toBeDefined();

      messageId = response.body._id;
    });

    it('should retrieve conversation with messages', async () => {
      const response = await request(app)
        .get(`/messages/conversations/${conversationId}`)
        .set('x-user-id', user1Id.toString());

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0].content).toBe('Hello! This is the first message');
    });

    it('should send reply message', async () => {
      const response = await request(app)
        .post(`/messages/conversations/${conversationId}/messages`)
        .set('x-user-id', user2Id.toString())
        .send({
          content: 'Hi! Nice to hear from you'
        });

      expect(response.status).toBe(201);
      expect(response.body.from).toBe(user2Id);
    });

    it('should mark messages as read', async () => {
      const response = await request(app)
        .put(`/messages/conversations/${conversationId}/read`)
        .set('x-user-id', user2Id.toString());

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Messages marked as read');

      // Verify messages are marked as read
      const conv = await Conversation.findById(conversationId);
      conv.messages.forEach(msg => {
        expect(msg.readBy.map(r => r.userId)).toContain(user2Id);
      });
    });

    it('should list all conversations for user', async () => {
      const response = await request(app)
        .get('/messages/conversations')
        .set('x-user-id', user1Id.toString());

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const ourConv = response.body.find(c => c._id === conversationId);
      expect(ourConv).toBeDefined();
      expect(ourConv.lastMessage).toBeDefined();
    });
  });

  describe('Group Conversation Flow', () => {
    let groupId;

    it('should create a group conversation', async () => {
      const response = await request(app)
        .post('/messages/conversations')
        .set('x-user-id', user1Id.toString())
        .send({
          participants: [user2Id, user3Id],
          isGroup: true,
          groupName: 'Team Project'
        });

      expect(response.status).toBe(201);
      expect(response.body.isGroup).toBe(true);
      expect(response.body.groupName).toBe('Team Project');
      expect(response.body.groupAdmin).toBe(user1Id);
      expect(response.body.participants).toHaveLength(3);

      groupId = response.body._id;
    });

    it('should send message in group', async () => {
      const response = await request(app)
        .post(`/messages/conversations/${groupId}/messages`)
        .set('x-user-id', user1Id.toString())
        .send({
          content: 'Hello team!'
        });

      expect(response.status).toBe(201);
      expect(response.body.content).toBe('Hello team!');
    });

    it('should add new member to group', async () => {
      const newMemberId = 4;

      const response = await request(app)
        .post(`/messages/conversations/${groupId}/participants`)
        .set('x-user-id', user1Id.toString())
        .send({
          participantId: newMemberId
        });

      expect(response.status).toBe(200);
      expect(response.body.participants).toContain(newMemberId);
      expect(response.body.participants).toHaveLength(4);
    });

    it('should allow member to leave group', async () => {
      const response = await request(app)
        .delete(`/messages/conversations/${groupId}/participants/${user2Id}`)
        .set('x-user-id', user2Id.toString());

      expect(response.status).toBe(200);
      expect(response.body.participants).not.toContain(user2Id);
    });

    it('should allow admin to remove member', async () => {
      const response = await request(app)
        .delete(`/messages/conversations/${groupId}/participants/${user3Id}`)
        .set('x-user-id', user1Id.toString()); // Admin

      expect(response.status).toBe(200);
      expect(response.body.participants).not.toContain(user3Id);
    });

    it('should delete group conversation', async () => {
      const response = await request(app)
        .delete(`/messages/conversations/${groupId}`)
        .set('x-user-id', user1Id.toString());

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Conversation deleted successfully');

      // Verify deletion
      const deleted = await Conversation.findById(groupId);
      expect(deleted).toBeNull();
    });
  });

  describe('Message Attachments Flow', () => {
    let conversationId;

    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [user1Id, user2Id],
        isGroup: false,
        messages: []
      });
      conversationId = conv._id.toString();
    });

    it('should send message with attachments', async () => {
      const response = await request(app)
        .post(`/messages/conversations/${conversationId}/messages`)
        .set('x-user-id', user1Id.toString())
        .send({
          content: 'Check these files',
          attachments: [
            {
              filename: 'abc123.jpg',
              originalName: 'photo.jpg',
              url: '/messages/uploads/abc123.jpg',
              mimeType: 'image/jpeg',
              size: 245678
            },
            {
              filename: 'def456.pdf',
              originalName: 'document.pdf',
              url: '/messages/uploads/def456.pdf',
              mimeType: 'application/pdf',
              size: 987654
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.attachments).toHaveLength(2);
      expect(response.body.attachments[0].filename).toBe('abc123.jpg');
      expect(response.body.attachments[1].mimeType).toBe('application/pdf');
    });

    it('should send message with only attachments (no text)', async () => {
      const response = await request(app)
        .post(`/messages/conversations/${conversationId}/messages`)
        .set('x-user-id', user1Id.toString())
        .send({
          attachments: [
            {
              filename: 'image.png',
              originalName: 'screenshot.png',
              url: '/messages/uploads/image.png',
              mimeType: 'image/png',
              size: 123456
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.attachments).toHaveLength(1);
    });
  });

  describe('Message Search Flow', () => {
    beforeEach(async () => {
      // Create conversations with searchable messages
      await Conversation.create([
        {
          participants: [user1Id, user2Id],
          isGroup: false,
          messages: [
            { from: user1Id, content: 'Hello world', createdAt: new Date() },
            { from: user2Id, content: 'Hi there', createdAt: new Date() }
          ]
        },
        {
          participants: [user1Id, user3Id],
          isGroup: false,
          messages: [
            { from: user3Id, content: 'World news today', createdAt: new Date() }
          ]
        }
      ]);
    });

    it('should search messages by keyword', async () => {
      const response = await request(app)
        .get('/messages/search')
        .query({ q: 'world' })
        .set('x-user-id', user1Id.toString());

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      response.body.forEach(result => {
        expect(result.message.content.toLowerCase()).toContain('world');
      });
    });

    it('should return 400 for too short query', async () => {
      const response = await request(app)
        .get('/messages/search')
        .query({ q: 'a' })
        .set('x-user-id', user1Id.toString());

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Search query must be at least 2 characters');
    });

    it('should search only in specific conversation', async () => {
      const conv = await Conversation.findOne({ participants: [user1Id, user2Id] });

      const response = await request(app)
        .get('/messages/search')
        .query({
          q: 'hello',
          conversationId: conv._id.toString()
        })
        .set('x-user-id', user1Id.toString());

      expect(response.status).toBe(200);
      response.body.forEach(result => {
        expect(result.conversationId).toBe(conv._id.toString());
      });
    });
  });

  describe('Message Pagination Flow', () => {
    let conversationId;

    beforeEach(async () => {
      // Create conversation with many messages
      const messages = [];
      for (let i = 1; i <= 100; i++) {
        messages.push({
          from: i % 2 === 0 ? user1Id : user2Id,
          content: `Message ${i}`,
          createdAt: new Date(Date.now() + i * 1000) // Incremental timestamps
        });
      }

      const conv = await Conversation.create({
        participants: [user1Id, user2Id],
        isGroup: false,
        messages
      });
      conversationId = conv._id.toString();
    });

    it('should get messages with default limit', async () => {
      const response = await request(app)
        .get(`/messages/conversations/${conversationId}/messages`)
        .set('x-user-id', user1Id.toString());

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(50); // Default limit
      expect(response.body.hasMore).toBe(true);
    });

    it('should get messages with custom limit', async () => {
      const response = await request(app)
        .get(`/messages/conversations/${conversationId}/messages`)
        .query({ limit: 20 })
        .set('x-user-id', user1Id.toString());

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(20);
    });

    it('should get messages before a specific date', async () => {
      const conv = await Conversation.findById(conversationId);
      const middleMessage = conv.messages[50];
      const beforeDate = middleMessage.createdAt.toISOString();

      const response = await request(app)
        .get(`/messages/conversations/${conversationId}/messages`)
        .query({ before: beforeDate, limit: 10 })
        .set('x-user-id', user1Id.toString());

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(10);

      // Verify all messages are before the specified date
      response.body.messages.forEach(msg => {
        expect(new Date(msg.createdAt).getTime()).toBeLessThan(new Date(beforeDate).getTime());
      });
    });
  });

  describe('Error Handling Flow', () => {
    it('should return 404 for non-existent conversation', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/messages/conversations/${fakeId}`)
        .set('x-user-id', user1Id.toString());

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Conversation not found');
    });

    it('should return 404 when user is not participant', async () => {
      const conv = await Conversation.create({
        participants: [user2Id, user3Id],
        isGroup: false,
        messages: []
      });

      const response = await request(app)
        .get(`/messages/conversations/${conv._id}`)
        .set('x-user-id', user1Id.toString()); // Not a participant

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid create conversation request', async () => {
      const response = await request(app)
        .post('/messages/conversations')
        .set('x-user-id', user1Id.toString())
        .send({
          isGroup: false
          // Missing participants
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Participants are required');
    });

    it('should return 400 for sending empty message', async () => {
      const conv = await Conversation.create({
        participants: [user1Id, user2Id],
        isGroup: false,
        messages: []
      });

      const response = await request(app)
        .post(`/messages/conversations/${conv._id}/messages`)
        .set('x-user-id', user1Id.toString())
        .send({
          content: '' // Empty content
        });

      expect(response.status).toBe(400);
    });

    it('should return 403 when non-admin tries to remove others', async () => {
      const group = await Conversation.create({
        participants: [user1Id, user2Id, user3Id],
        isGroup: true,
        groupName: 'Test Group',
        groupAdmin: user1Id,
        messages: []
      });

      const response = await request(app)
        .delete(`/messages/conversations/${group._id}/participants/${user3Id}`)
        .set('x-user-id', user2Id.toString()); // Non-admin trying to remove user3

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/messages/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('message-service');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
