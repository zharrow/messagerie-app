# Plan de Tests - Message Service (Feature Principale)

**Date:** 2025-12-16
**Contexte:** Projet Final - Tests unitaires et E2E pour feature principale (messaging)

---

## 🎯 Objectif

Implémenter **tests unitaires** et **tests E2E** pour le **Message Service**, la feature principale de l'application.

**Contrainte projet:** "Votre feature principale doit être testée (test unitaires et E2E)"

**Scope:** Message Service uniquement (pas User Service ni Auth Service)

**Estimation:** 10-14 heures

---

## 📦 Configuration Initiale

### 1. Installation des Dépendances

```bash
cd services/message-service

# Installer Jest + utilitaires
npm install --save-dev jest supertest @shelf/jest-mongodb socket.io-client

# Si TypeScript
npm install --save-dev @types/jest @types/supertest
```

### 2. Configuration Jest

**Créer:** `services/message-service/jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
    'middlewares/**/*.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
};
```

### 3. Setup File

**Créer:** `services/message-service/__tests__/setup.js`

```javascript
// Setup MongoDB Memory Server pour tests
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Avant tous les tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// Après chaque test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Après tous les tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});
```

### 4. Scripts NPM

**Ajouter dans** `services/message-service/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__/unit",
    "test:e2e": "jest --testPathPattern=__tests__/e2e --runInBand"
  }
}
```

---

## 🧪 Tests Unitaires

### Structure des Dossiers

```
services/message-service/
├── __tests__/
│   ├── setup.js
│   ├── unit/
│   │   ├── controllers/
│   │   │   └── messageController.test.js
│   │   ├── services/
│   │   │   ├── socketService.test.js
│   │   │   ├── encryptionService.test.js
│   │   │   └── uploadService.test.js
│   │   ├── models/
│   │   │   └── Conversation.test.js
│   │   └── middlewares/
│   │       └── auth.test.js
│   └── e2e/
│       └── messaging-flow.test.js
```

---

### 1. Tests Controller (messageController.test.js)

**Fichier:** `services/message-service/__tests__/unit/controllers/messageController.test.js`

```javascript
const request = require('supertest');
const app = require('../../../server');  // Exporter app depuis server.js
const Conversation = require('../../../models/Conversation');
const mongoose = require('mongoose');

describe('MessageController', () => {
  let authToken;
  let userId = 1;
  let conversationId;

  beforeEach(() => {
    // Mock JWT auth middleware (simplification pour tests)
    authToken = 'mock_jwt_token';
  });

  describe('POST /messages/conversations', () => {
    it('should create a private conversation', async () => {
      const response = await request(app)
        .post('/messages/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          participants: [1, 2],
          isGroup: false
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.participants).toEqual([1, 2]);
      expect(response.body.data.isGroup).toBe(false);
    });

    it('should create a group conversation with name', async () => {
      const response = await request(app)
        .post('/messages/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          participants: [1, 2, 3],
          isGroup: true,
          groupName: 'Test Group'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.isGroup).toBe(true);
      expect(response.body.data.groupName).toBe('Test Group');
      expect(response.body.data.groupAdmin).toBe(userId);
    });

    it('should reject group without name', async () => {
      const response = await request(app)
        .post('/messages/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          participants: [1, 2, 3],
          isGroup: true
          // groupName manquant
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /messages/conversations', () => {
    beforeEach(async () => {
      // Créer des conversations de test
      await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });
      await Conversation.create({
        participants: [1, 3],
        isGroup: false,
        messages: []
      });
    });

    it('should list user conversations', async () => {
      const response = await request(app)
        .get('/messages/conversations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /messages/conversations/:id', () => {
    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          {
            from: 1,
            content: 'Hello',
            createdAt: new Date()
          },
          {
            from: 2,
            content: 'Hi!',
            createdAt: new Date()
          }
        ]
      });
      conversationId = conv._id;
    });

    it('should get conversation with messages', async () => {
      const response = await request(app)
        .get(`/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.messages).toHaveLength(2);
    });

    it('should return 404 for non-existent conversation', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/messages/conversations/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /messages/conversations/:id/messages', () => {
    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });
      conversationId = conv._id;
    });

    it('should send a message to conversation', async () => {
      const response = await request(app)
        .post(`/messages/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test message'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.message.content).toBe('Test message');
      expect(response.body.data.message.from).toBe(userId);
    });

    it('should reject empty message', async () => {
      const response = await request(app)
        .post(`/messages/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: ''
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /messages/conversations/:id/read', () => {
    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { _id: new mongoose.Types.ObjectId(), from: 2, content: 'Hello', readBy: [] },
          { _id: new mongoose.Types.ObjectId(), from: 2, content: 'World', readBy: [] }
        ]
      });
      conversationId = conv._id;
    });

    it('should mark messages as read', async () => {
      const conversation = await Conversation.findById(conversationId);
      const messageIds = conversation.messages.map(m => m._id);

      const response = await request(app)
        .put(`/messages/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ messageIds });

      expect(response.status).toBe(200);

      // Vérifier que messages sont marqués lus
      const updated = await Conversation.findById(conversationId);
      updated.messages.forEach(msg => {
        expect(msg.readBy).toContainEqual(expect.objectContaining({ userId }));
      });
    });
  });

  describe('DELETE /messages/conversations/:id', () => {
    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2, 3],
        isGroup: true,
        groupName: 'Test Group',
        groupAdmin: userId,
        messages: []
      });
      conversationId = conv._id;
    });

    it('should delete group conversation (admin only)', async () => {
      const response = await request(app)
        .delete(`/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Vérifier suppression
      const deleted = await Conversation.findById(conversationId);
      expect(deleted).toBeNull();
    });

    it('should reject non-admin deletion', async () => {
      // Mock user ID = 2 (non-admin)
      const nonAdminToken = 'mock_token_user_2';

      const response = await request(app)
        .delete(`/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${nonAdminToken}`);

      expect(response.status).toBe(403);
    });
  });
});
```

---

### 2. Tests Service (socketService.test.js)

**Fichier:** `services/message-service/__tests__/unit/services/socketService.test.js`

```javascript
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const socketService = require('../../../services/socketService');
const Conversation = require('../../../models/Conversation');

describe('SocketService', () => {
  let io, serverSocket, clientSocket, httpServer;

  beforeAll((done) => {
    // Setup Socket.io server
    httpServer = http.createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      socketService.initialize(io);

      // Connect client
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  describe('send_message event', () => {
    let conversationId;

    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: []
      });
      conversationId = conv._id.toString();
    });

    it('should broadcast new message to conversation room', (done) => {
      // Listen for new_message event
      clientSocket.on('new_message', (data) => {
        expect(data).toHaveProperty('conversationId');
        expect(data.message.content).toBe('Test message');
        done();
      });

      // Emit send_message
      clientSocket.emit('send_message', {
        conversationId,
        content: 'Test message'
      });
    });

    it('should save message to database', (done) => {
      clientSocket.emit('send_message', {
        conversationId,
        content: 'Persistent message'
      });

      // Wait and check database
      setTimeout(async () => {
        const conv = await Conversation.findById(conversationId);
        const lastMsg = conv.messages[conv.messages.length - 1];
        expect(lastMsg.content).toBe('Persistent message');
        done();
      }, 100);
    });
  });

  describe('add_reaction event', () => {
    let conversationId, messageId;

    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { from: 1, content: 'Hello', reactions: [] }
        ]
      });
      conversationId = conv._id.toString();
      messageId = conv.messages[0]._id.toString();
    });

    it('should add reaction to message', (done) => {
      clientSocket.on('reaction_added', (data) => {
        expect(data.reaction.emoji).toBe('👍');
        done();
      });

      clientSocket.emit('add_reaction', {
        conversationId,
        messageId,
        emoji: '👍'
      });
    });
  });

  describe('typing indicators', () => {
    it('should broadcast typing_start', (done) => {
      const conversationId = 'conv123';

      clientSocket.on('user_typing', (data) => {
        expect(data.conversationId).toBe(conversationId);
        expect(data.isTyping).toBe(true);
        done();
      });

      clientSocket.emit('typing_start', { conversationId });
    });

    it('should broadcast typing_stop', (done) => {
      const conversationId = 'conv123';

      clientSocket.on('user_typing', (data) => {
        expect(data.isTyping).toBe(false);
        done();
      });

      clientSocket.emit('typing_stop', { conversationId });
    });
  });

  describe('edit_message event', () => {
    let conversationId, messageId;

    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { from: 1, content: 'Original', editedAt: null }
        ]
      });
      conversationId = conv._id.toString();
      messageId = conv.messages[0]._id.toString();
    });

    it('should edit message and broadcast', (done) => {
      clientSocket.on('message_edited', (data) => {
        expect(data.newContent).toBe('Edited');
        expect(data.editedAt).toBeDefined();
        done();
      });

      clientSocket.emit('edit_message', {
        conversationId,
        messageId,
        newContent: 'Edited'
      });
    });
  });

  describe('delete_message event', () => {
    let conversationId, messageId;

    beforeEach(async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { from: 1, content: 'To delete', deletedAt: null }
        ]
      });
      conversationId = conv._id.toString();
      messageId = conv.messages[0]._id.toString();
    });

    it('should soft delete message', (done) => {
      clientSocket.on('message_deleted', async (data) => {
        expect(data.deletedAt).toBeDefined();

        // Verify soft delete in DB
        const conv = await Conversation.findById(conversationId);
        const msg = conv.messages.id(messageId);
        expect(msg.deletedAt).toBeDefined();
        done();
      });

      clientSocket.emit('delete_message', {
        conversationId,
        messageId
      });
    });
  });
});
```

---

### 3. Tests Model (Conversation.test.js)

**Fichier:** `services/message-service/__tests__/unit/models/Conversation.test.js`

```javascript
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
    });

    it('should require participants array', async () => {
      const conv = new Conversation({
        isGroup: false,
        messages: []
      });

      await expect(conv.save()).rejects.toThrow();
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
    });

    it('should store encrypted message fields', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          {
            from: 1,
            content: '[Encrypted Message]',
            encrypted: true,
            encryptedPayloads: {
              '2:device1': 'base64EncryptedData'
            },
            nonce: 'base64Nonce',
            senderDeviceId: 'device1'
          }
        ]
      });

      const saved = await Conversation.findById(conv._id);
      const msg = saved.messages[0];
      expect(msg.encrypted).toBe(true);
      expect(msg.encryptedPayloads.get('2:device1')).toBe('base64EncryptedData');
      expect(msg.nonce).toBe('base64Nonce');
    });
  });

  describe('Reactions', () => {
    it('should add reaction to message', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { from: 1, content: 'Hello', reactions: [] }
        ]
      });

      const message = conv.messages[0];
      message.reactions.push({
        emoji: '👍',
        userId: 2,
        createdAt: new Date()
      });

      await conv.save();

      const updated = await Conversation.findById(conv._id);
      expect(updated.messages[0].reactions).toHaveLength(1);
      expect(updated.messages[0].reactions[0].emoji).toBe('👍');
    });
  });

  describe('Read Receipts', () => {
    it('should mark message as read', async () => {
      const conv = await Conversation.create({
        participants: [1, 2],
        isGroup: false,
        messages: [
          { from: 1, content: 'Hello', readBy: [] }
        ]
      });

      const message = conv.messages[0];
      message.readBy.push({
        userId: 2,
        readAt: new Date()
      });

      await conv.save();

      const updated = await Conversation.findById(conv._id);
      expect(updated.messages[0].readBy).toHaveLength(1);
      expect(updated.messages[0].readBy[0].userId).toBe(2);
    });
  });
});
```

---

## 🚀 Tests E2E (End-to-End)

### Configuration Playwright

```bash
cd services/message-service
npm install --save-dev @playwright/test
npx playwright install
```

**Créer:** `services/message-service/playwright.config.js`

```javascript
module.exports = {
  testDir: './__tests__/e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
};
```

---

### Test E2E Complet

**Fichier:** `services/message-service/__tests__/e2e/messaging-flow.test.js`

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Messaging E2E Flow', () => {
  let page1, page2;  // Alice & Bob

  test.beforeAll(async ({ browser }) => {
    // Créer 2 contexts (2 users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    page1 = await context1.newPage();  // Alice
    page2 = await context2.newPage();  // Bob
  });

  test('Complete messaging workflow with E2EE', async () => {
    // 1. Alice: Login
    await page1.goto('/login');
    await page1.fill('[data-test="email"]', 'alice@example.com');
    await page1.fill('[data-test="password"]', 'AlicePass123');
    await page1.click('[data-test="login-button"]');
    await page1.waitForSelector('[data-test="chat-page"]');

    // 2. Bob: Login
    await page2.goto('/login');
    await page2.fill('[data-test="email"]', 'bob@example.com');
    await page2.fill('[data-test="password"]', 'BobPass123');
    await page2.click('[data-test="login-button"]');
    await page2.waitForSelector('[data-test="chat-page"]');

    // 3. Alice: Create conversation with Bob
    await page1.click('[data-test="new-conversation"]');
    await page1.fill('[data-test="search-users"]', 'bob');
    await page1.click('[data-test="user-bob"]');
    await page1.click('[data-test="create-button"]');

    // 4. Alice: Send message
    await page1.fill('[data-test="message-input"]', 'Hello Bob! 🔒');
    await page1.click('[data-test="send-button"]');

    // 5. Bob: Receive message
    await page2.waitForSelector('[data-test="new-message"]', { timeout: 5000 });
    const messageText = await page2.textContent('[data-test="message-content"]');
    expect(messageText).toBe('Hello Bob! 🔒');

    // 6. Bob: Reply
    await page2.fill('[data-test="message-input"]', 'Hi Alice!');
    await page2.click('[data-test="send-button"]');

    // 7. Alice: Receive reply
    await page1.waitForSelector('[data-test="message-1"]');
    const replyText = await page1.textContent('[data-test="message-1"] [data-test="message-content"]');
    expect(replyText).toBe('Hi Alice!');

    // 8. Alice: Add reaction
    await page1.hover('[data-test="message-1"]');
    await page1.click('[data-test="add-reaction-button"]');
    await page1.click('[data-test="emoji-heart"]');

    // 9. Bob: See reaction
    await page2.waitForSelector('[data-test="reaction-heart"]');
    const reactionCount = await page2.textContent('[data-test="reaction-count"]');
    expect(reactionCount).toBe('1');

    // 10. Alice: Edit message
    await page1.hover('[data-test="message-0"]');
    await page1.click('[data-test="edit-button"]');
    await page1.fill('[data-test="edit-input"]', 'Hello Bob (edited)! 🔒');
    await page1.keyboard.press('Enter');

    // 11. Bob: See edited message
    await page2.waitForSelector('[data-test="message-edited-badge"]');
    const editedText = await page2.textContent('[data-test="message-0"] [data-test="message-content"]');
    expect(editedText).toContain('(edited)');

    // 12. Alice: Upload file
    await page1.setInputFiles('[data-test="file-input"]', './test-files/image.jpg');
    await page1.click('[data-test="send-button"]');

    // 13. Bob: Receive file
    await page2.waitForSelector('[data-test="message-attachment"]');
    const attachmentSrc = await page2.getAttribute('[data-test="attachment-image"]', 'src');
    expect(attachmentSrc).toContain('/messages/uploads/');

    // 14. Bob: Delete message
    await page2.hover('[data-test="message-1"]');
    await page2.click('[data-test="delete-button"]');
    await page2.click('[data-test="confirm-delete"]');

    // 15. Alice: See deleted message
    await page1.waitForSelector('[data-test="message-1"][data-deleted="true"]');
    const deletedText = await page1.textContent('[data-test="message-1"] [data-test="message-content"]');
    expect(deletedText).toBe('[Message supprimé]');
  });

  test('Group conversation flow', async () => {
    // 1. Alice: Create group
    await page1.click('[data-test="new-conversation"]');
    await page1.fill('[data-test="search-users"]', 'bob');
    await page1.click('[data-test="user-bob"]');
    await page1.fill('[data-test="search-users"]', 'charlie');
    await page1.click('[data-test="user-charlie"]');
    await page1.fill('[data-test="group-name-input"]', 'Team Project');
    await page1.click('[data-test="create-button"]');

    // 2. Alice: Send message in group
    await page1.fill('[data-test="message-input"]', 'Hello team!');
    await page1.click('[data-test="send-button"]');

    // 3. Bob: Receive group message
    await page2.waitForSelector('[data-test="conversation-team-project"]');
    await page2.click('[data-test="conversation-team-project"]');
    const groupMsg = await page2.textContent('[data-test="message-0"]');
    expect(groupMsg).toContain('Hello team!');

    // 4. Alice: Open group settings (admin only)
    await page1.click('[data-test="conversation-info-button"]');
    await page1.click('[data-test="group-settings-button"]');

    // 5. Alice: Add member
    await page1.fill('[data-test="search-users"]', 'dave');
    await page1.click('[data-test="user-dave"]');
    await page1.click('[data-test="add-members-button"]');

    // 6. Verify member added
    await page1.waitForSelector('[data-test="member-dave"]');
    const memberCount = await page1.locator('[data-test^="member-"]').count();
    expect(memberCount).toBe(4);  // Alice, Bob, Charlie, Dave
  });

  test('Typing indicators', async () => {
    // 1. Bob starts typing
    await page2.focus('[data-test="message-input"]');
    await page2.type('[data-test="message-input"]', 'T');  // Just one char

    // 2. Alice sees typing indicator
    await page1.waitForSelector('[data-test="typing-indicator"]', { timeout: 2000 });
    const typingText = await page1.textContent('[data-test="typing-indicator"]');
    expect(typingText).toContain('Bob');

    // 3. Bob stops typing (clears input)
    await page2.fill('[data-test="message-input"]', '');

    // 4. Alice: typing indicator disappears
    await page1.waitForSelector('[data-test="typing-indicator"]', { state: 'hidden', timeout: 5000 });
  });

  test('Read receipts', async () => {
    // 1. Alice: Send message
    await page1.fill('[data-test="message-input"]', 'Are you there?');
    await page1.click('[data-test="send-button"]');

    // 2. Initially: single checkmark (sent)
    await page1.waitForSelector('[data-test="message-status-sent"]');

    // 3. Bob: Open conversation (auto-marks as read)
    await page2.click('[data-test="conversation-alice"]');

    // 4. Alice: See double checkmark (read)
    await page1.waitForSelector('[data-test="message-status-read"]', { timeout: 5000 });
  });
});
```

---

## 📊 Coverage et Qualité

### 1. Générer Coverage Report

```bash
cd services/message-service
npm run test:coverage
```

**Output:**
```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   82.15 |    75.33 |   80.50 |   82.15 |
 controllers              |   85.20 |    78.50 |   82.00 |   85.20 |
  messageController.js    |   85.20 |    78.50 |   82.00 |   85.20 |
 services                 |   80.10 |    72.80 |   78.90 |   80.10 |
  socketService.js        |   82.50 |    75.20 |   80.30 |   82.50 |
  encryptionService.js    |   78.40 |    70.10 |   77.50 |   78.40 |
  uploadService.js        |   79.30 |    72.90 |   78.90 |   79.30 |
 models                   |   88.60 |    82.10 |   85.70 |   88.60 |
  Conversation.js         |   88.60 |    82.10 |   85.70 |   88.60 |
--------------------------|---------|----------|---------|---------|
```

### 2. CI/CD Integration

**Créer:** `.github/workflows/message-service-tests.yml`

```yaml
name: Message Service Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/message-service/**'
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./services/message-service
        run: npm ci

      - name: Run unit tests
        working-directory: ./services/message-service
        run: npm run test:unit

      - name: Run E2E tests
        working-directory: ./services/message-service
        run: npm run test:e2e

      - name: Generate coverage
        working-directory: ./services/message-service
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./services/message-service/coverage/lcov.info
          flags: message-service

      - name: Check coverage threshold
        working-directory: ./services/message-service
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
```

---

## ✅ Checklist de Complétion

### Tests Unitaires
- [ ] Tests pour `messageController.js` (8+ tests)
- [ ] Tests pour `socketService.js` (6+ tests)
- [ ] Tests pour `encryptionService.js` (4+ tests)
- [ ] Tests pour `uploadService.js` (4+ tests)
- [ ] Tests pour `Conversation.js` model (5+ tests)
- [ ] Tests pour middleware `auth.js` (3+ tests)
- [ ] Coverage total > 80%

### Tests E2E
- [ ] Test complet messaging flow (15 étapes)
- [ ] Test groupe conversation (6 étapes)
- [ ] Test typing indicators
- [ ] Test read receipts
- [ ] Test upload fichiers
- [ ] Test réactions
- [ ] Test édition messages
- [ ] Test suppression messages

### Configuration
- [ ] `jest.config.js` créé
- [ ] `__tests__/setup.js` créé
- [ ] MongoDB Memory Server configuré
- [ ] Scripts npm ajoutés
- [ ] CI/CD workflow créé

### Documentation
- [ ] README tests ajouté
- [ ] Instructions d'exécution
- [ ] Exemples de tests
- [ ] Coverage badge dans README

---

## 🚀 Exécution

```bash
# Tous les tests
npm test

# Uniquement unitaires
npm run test:unit

# Uniquement E2E
npm run test:e2e

# Avec coverage
npm run test:coverage

# Watch mode (dev)
npm run test:watch
```

---

## 📈 Résultats Attendus

**Métriques cibles:**
- ✅ Coverage global: **> 80%**
- ✅ Tests unitaires: **30+ tests**
- ✅ Tests E2E: **4 scénarios complets**
- ✅ Temps d'exécution: **< 30 secondes** (unit) + **< 2 minutes** (E2E)
- ✅ CI/CD: **tous les tests passent** en automatique

**Validation projet:**
- ✅ "Feature principale testée (unitaires + E2E)" ✓
- ✅ Tests exécutables avec `npm test`
- ✅ Coverage visible et mesurable
- ✅ Intégration CI/CD fonctionnelle

---

**Document créé le:** 2025-12-16
**Estimation:** 10-14 heures de travail
**Priorité:** 🔴 Critique pour validation projet
