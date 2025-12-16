const mongoose = require('mongoose');
const Conversation = require('../../../models/Conversation');

describe('Conversation Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid private conversation', async () => {
      const conv = new Conversation({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });

      const saved = await conv.save();

      expect(saved._id).toBeDefined();
      expect(saved.participants).toEqual([1, 2]);
      expect(saved.isGroup).toBe(false);
      expect(saved.createdAt).toBeDefined();
    });

    it('should create a valid group conversation', async () => {
      const conv = new Conversation({
        participants: [1, 2, 3],
        isGroup: true,
        groupName: 'Test Group',
        groupAdmin: 1,
        messages: []
      });

      const saved = await conv.save();

      expect(saved.groupName).toBe('Test Group');
      expect(saved.groupAdmin).toBe(1);
      expect(saved.participants).toHaveLength(3);
    });

    it('should require participants array', async () => {
      const conv = new Conversation({
        isGroup: false,
        messages: []
      });

      await expect(conv.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        messages: []
      });

      expect(conv.isGroup).toBe(false);
      expect(conv.groupName).toBeNull();
      expect(conv.groupAdmin).toBeNull();
      expect(conv.lastMessage).toBeNull();
    });
  });

  describe('Messages', () => {
    it('should add message to conversation', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });

      conv.messages.push({
        from: 1,
        content: 'Hello',
        createdAt: new Date()
      });

      await conv.save();

      const updated = await Conversation.findById(conv._id);
      expect(updated.messages).toHaveLength(1);
      expect(updated.messages[0].content).toBe('Hello');
      expect(updated.messages[0].from).toBe(1);
      expect(updated.messages[0]._id).toBeDefined();
    });

    it('should add message with only attachments (no content)', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });

      conv.messages.push({
        from: 1,
        attachments: [{
          filename: 'test.jpg',
          originalName: 'photo.jpg',
          url: '/uploads/test.jpg',
          mimeType: 'image/jpeg',
          size: 12345
        }],
        createdAt: new Date()
      });

      await conv.save();

      const updated = await Conversation.findById(conv._id);
      expect(updated.messages[0].attachments).toHaveLength(1);
      expect(updated.messages[0].attachments[0].filename).toBe('test.jpg');
    });

    it('should store encrypted message fields', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });

      const encryptedPayloads = new Map();
      encryptedPayloads.set('2:device1', 'base64EncryptedData');

      conv.messages.push({
        from: 1,
        content: '[Encrypted Message]',
        encrypted: true,
        encryptedPayloads: encryptedPayloads,
        nonce: 'base64Nonce',
        senderDeviceId: 'device1',
        createdAt: new Date()
      });

      await conv.save();

      const saved = await Conversation.findById(conv._id);
      const msg = saved.messages[0];

      expect(msg.encrypted).toBe(true);
      expect(msg.encryptedPayloads).toBeInstanceOf(Map);
      expect(msg.encryptedPayloads.get('2:device1')).toBe('base64EncryptedData');
      expect(msg.nonce).toBe('base64Nonce');
      expect(msg.senderDeviceId).toBe('device1');
    });

    it('should allow multiple messages in conversation', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { from: 1, content: 'Message 1', createdAt: new Date() },
          { from: 2, content: 'Message 2', createdAt: new Date() },
          { from: 1, content: 'Message 3', createdAt: new Date() }
        ]
      });

      expect(conv.messages).toHaveLength(3);
      expect(conv.messages[0].from).toBe(1);
      expect(conv.messages[1].from).toBe(2);
      expect(conv.messages[2].from).toBe(1);
    });
  });

  describe('Reactions', () => {
    let conversation;

    beforeEach(async () => {
      conversation = await Conversation.create({
        participants: [1, 2, 3],
        isGroup: false,
        messages: [
          { from: 1, content: 'Hello', reactions: [], createdAt: new Date() }
        ]
      });
    });

    it('should add reaction to message', async () => {
      const message = conversation.messages[0];
      message.reactions.push({
        emoji: '👍',
        userId: 2,
        createdAt: new Date()
      });

      await conversation.save();

      const updated = await Conversation.findById(conversation._id);
      expect(updated.messages[0].reactions).toHaveLength(1);
      expect(updated.messages[0].reactions[0].emoji).toBe('👍');
      expect(updated.messages[0].reactions[0].userId).toBe(2);
    });

    it('should allow multiple reactions on same message', async () => {
      const message = conversation.messages[0];
      message.reactions.push(
        { emoji: '👍', userId: 2, createdAt: new Date() },
        { emoji: '❤️', userId: 3, createdAt: new Date() },
        { emoji: '😂', userId: 2, createdAt: new Date() }
      );

      await conversation.save();

      const updated = await Conversation.findById(conversation._id);
      expect(updated.messages[0].reactions).toHaveLength(3);
    });

    it('should store reaction with timestamp', async () => {
      const now = new Date();
      const message = conversation.messages[0];
      message.reactions.push({
        emoji: '❤️',
        userId: 3,
        createdAt: now
      });

      await conversation.save();

      const updated = await Conversation.findById(conversation._id);
      const reaction = updated.messages[0].reactions[0];
      expect(reaction.createdAt.getTime()).toBe(now.getTime());
    });
  });

  describe('Read Receipts', () => {
    let conversation;

    beforeEach(async () => {
      conversation = await Conversation.create({
        participants: [1, 2, 3],
        isGroup: true,
        groupName: 'Test Group',
        messages: [
          { from: 1, content: 'Hello group', readBy: [], createdAt: new Date() }
        ]
      });
    });

    it('should mark message as read by user', async () => {
      const message = conversation.messages[0];
      message.readBy.push({
        userId: 2,
        readAt: new Date()
      });

      await conversation.save();

      const updated = await Conversation.findById(conversation._id);
      expect(updated.messages[0].readBy).toHaveLength(1);
      expect(updated.messages[0].readBy[0].userId).toBe(2);
      expect(updated.messages[0].readBy[0].readAt).toBeDefined();
    });

    it('should track multiple users reading same message', async () => {
      const message = conversation.messages[0];
      const now = new Date();

      message.readBy.push(
        { userId: 2, readAt: now },
        { userId: 3, readAt: new Date(now.getTime() + 1000) }
      );

      await conversation.save();

      const updated = await Conversation.findById(conversation._id);
      expect(updated.messages[0].readBy).toHaveLength(2);
      expect(updated.messages[0].readBy[0].userId).toBe(2);
      expect(updated.messages[0].readBy[1].userId).toBe(3);
    });
  });

  describe('Message Editing and Deletion', () => {
    let conversation;

    beforeEach(async () => {
      conversation = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { from: 1, content: 'Original message', createdAt: new Date() }
        ]
      });
    });

    it('should track message edit with editedAt timestamp', async () => {
      const message = conversation.messages[0];
      message.content = 'Edited message';
      message.editedAt = new Date();

      await conversation.save();

      const updated = await Conversation.findById(conversation._id);
      expect(updated.messages[0].content).toBe('Edited message');
      expect(updated.messages[0].editedAt).toBeDefined();
    });

    it('should soft delete message with deletedAt timestamp', async () => {
      const message = conversation.messages[0];
      message.deletedAt = new Date();

      await conversation.save();

      const updated = await Conversation.findById(conversation._id);
      expect(updated.messages[0].deletedAt).toBeDefined();
      expect(updated.messages[0].content).toBe('Original message'); // Content still exists
    });

    it('should keep original createdAt when editing', async () => {
      const originalCreatedAt = conversation.messages[0].createdAt;

      const message = conversation.messages[0];
      message.content = 'Edited';
      message.editedAt = new Date();

      await conversation.save();

      const updated = await Conversation.findById(conversation._id);
      expect(updated.messages[0].createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe('Reply To (Thread)', () => {
    let conversation;

    beforeEach(async () => {
      conversation = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { from: 1, content: 'Original message', createdAt: new Date() }
        ]
      });
    });

    it('should link message as reply to another message', async () => {
      const originalMessageId = conversation.messages[0]._id;

      conversation.messages.push({
        from: 2,
        content: 'Reply message',
        replyTo: originalMessageId,
        createdAt: new Date()
      });

      await conversation.save();

      const updated = await Conversation.findById(conversation._id);
      expect(updated.messages[1].replyTo.toString()).toBe(originalMessageId.toString());
    });
  });

  describe('Attachments', () => {
    it('should store file attachment with all required fields', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          {
            from: 1,
            content: 'Check this file',
            attachments: [
              {
                filename: 'abc123.jpg',
                originalName: 'photo.jpg',
                url: '/messages/uploads/abc123.jpg',
                mimeType: 'image/jpeg',
                size: 245678
              }
            ],
            createdAt: new Date()
          }
        ]
      });

      const attachment = conv.messages[0].attachments[0];
      expect(attachment.filename).toBe('abc123.jpg');
      expect(attachment.originalName).toBe('photo.jpg');
      expect(attachment.url).toBe('/messages/uploads/abc123.jpg');
      expect(attachment.mimeType).toBe('image/jpeg');
      expect(attachment.size).toBe(245678);
    });

    it('should allow multiple attachments on one message', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          {
            from: 1,
            attachments: [
              {
                filename: 'file1.jpg',
                originalName: 'photo1.jpg',
                url: '/uploads/file1.jpg',
                mimeType: 'image/jpeg',
                size: 100000
              },
              {
                filename: 'file2.pdf',
                originalName: 'document.pdf',
                url: '/uploads/file2.pdf',
                mimeType: 'application/pdf',
                size: 200000
              }
            ],
            createdAt: new Date()
          }
        ]
      });

      expect(conv.messages[0].attachments).toHaveLength(2);
      expect(conv.messages[0].attachments[0].mimeType).toBe('image/jpeg');
      expect(conv.messages[0].attachments[1].mimeType).toBe('application/pdf');
    });
  });

  describe('Last Message Tracking', () => {
    it('should update lastMessage field', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { from: 1, content: 'First', createdAt: new Date() },
          { from: 2, content: 'Second', createdAt: new Date() }
        ]
      });

      conv.lastMessage = {
        content: 'Second',
        from: 2,
        createdAt: conv.messages[1].createdAt
      };

      await conv.save();

      const updated = await Conversation.findById(conv._id);
      expect(updated.lastMessage.content).toBe('Second');
      expect(updated.lastMessage.from).toBe(2);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });

      expect(conv.createdAt).toBeDefined();
      expect(conv.updatedAt).toBeDefined();
      expect(conv.createdAt.getTime()).toBeLessThanOrEqual(conv.updatedAt.getTime());
    });

    it('should update updatedAt on save', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });

      const originalUpdatedAt = conv.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      conv.messages.push({
        from: 1,
        content: 'New message',
        createdAt: new Date()
      });

      await conv.save();

      const updated = await Conversation.findById(conv._id);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Query Performance', () => {
    beforeEach(async () => {
      // Create multiple conversations for testing
      await Conversation.create([
        { participants: [1, 2], isGroup: false, messages: [] },
        { participants: [1, 3], isGroup: false, messages: [] },
        { participants: [1, 2, 3, 4], isGroup: true, groupName: 'Group 1', messages: [] }
      ]);
    });

    it('should find conversations by participant', async () => {
      const conversations = await Conversation.find({ participants: 1 });

      expect(conversations.length).toBeGreaterThanOrEqual(3);
      conversations.forEach(conv => {
        expect(conv.participants).toContain(1);
      });
    });

    it('should find only group conversations', async () => {
      const groups = await Conversation.find({ isGroup: true });

      groups.forEach(group => {
        expect(group.isGroup).toBe(true);
        expect(group.groupName).toBeDefined();
      });
    });

    it('should sort conversations by updatedAt', async () => {
      const conversations = await Conversation.find({ participants: 1 })
        .sort({ updatedAt: -1 });

      for (let i = 0; i < conversations.length - 1; i++) {
        expect(conversations[i].updatedAt.getTime()).toBeGreaterThanOrEqual(
          conversations[i + 1].updatedAt.getTime()
        );
      }
    });
  });
});
