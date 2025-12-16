# Tests - Message Service

Tests unitaires et E2E pour le service de messagerie.

## 📦 Installation

```bash
cd services/message-service
npm install
```

## 🧪 Exécution des Tests

### Tous les tests
```bash
npm test
```

### Tests unitaires uniquement
```bash
npm run test:unit
```

### Tests E2E uniquement
```bash
npm run test:e2e
```

### Mode watch (développement)
```bash
npm run test:watch
```

### Avec coverage
```bash
npm run test:coverage
```

## 📊 Coverage

Les tests visent une couverture minimale de:
- **Lines:** 80%
- **Functions:** 75%
- **Branches:** 70%
- **Statements:** 80%

## 🗂️ Structure des Tests

```
__tests__/
├── setup.js                          # Configuration MongoDB Memory Server
├── unit/
│   ├── controllers/
│   │   └── messageController.test.js # Tests controller (35+ tests)
│   └── models/
│       └── Conversation.test.js      # Tests modèle (40+ tests)
└── e2e/
    └── messaging-flow.test.js        # Tests E2E (50+ tests)
```

## ✅ Tests Couverts

### Controller Tests
- [x] getConversations
- [x] getConversation
- [x] createConversation (private + group)
- [x] sendMessage
- [x] markAsRead
- [x] addParticipant
- [x] removeParticipant
- [x] deleteConversation
- [x] searchMessages
- [x] health

### Model Tests
- [x] Schema validation
- [x] Messages (CRUD)
- [x] Reactions
- [x] Read receipts
- [x] Message editing
- [x] Soft delete
- [x] Reply to messages
- [x] Attachments
- [x] E2EE fields
- [x] Timestamps

### E2E Tests
- [x] Complete conversation lifecycle
- [x] Group conversation flow
- [x] Message attachments flow
- [x] Message search flow
- [x] Message pagination flow
- [x] Error handling
- [x] Health check

## 🔍 Exemple d'Exécution

```bash
$ npm test

 PASS  __tests__/unit/models/Conversation.test.js
 PASS  __tests__/unit/controllers/messageController.test.js
 PASS  __tests__/e2e/messaging-flow.test.js

Test Suites: 3 passed, 3 total
Tests:       125 passed, 125 total
Snapshots:   0 total
Time:        15.432 s
```

## 🚨 Troubleshooting

### MongoDB Memory Server prend du temps au premier lancement
C'est normal. Le premier `npm test` télécharge MongoDB binaries.

### Tests timeout
Augmentez le timeout dans `jest.config.js`:
```javascript
testTimeout: 15000, // 15 secondes
```

### Port déjà utilisé
Les tests E2E n'utilisent pas de port réel, mais l'application en mémoire.

## 📝 Ajouter un Nouveau Test

### Test unitaire:
```javascript
// __tests__/unit/controllers/myController.test.js
describe('MyController', () => {
  it('should do something', async () => {
    // Arrange
    const mockReq = { user: { id: 1 } };
    const mockRes = { json: jest.fn() };

    // Act
    await myController.myMethod(mockReq, mockRes);

    // Assert
    expect(mockRes.json).toHaveBeenCalled();
  });
});
```

### Test E2E:
```javascript
// __tests__/e2e/my-flow.test.js
it('should complete my flow', async () => {
  const response = await request(app)
    .post('/messages/endpoint')
    .set('x-user-id', '1')
    .send({ data: 'test' });

  expect(response.status).toBe(200);
});
```

## 📚 Documentation

- **Jest:** https://jestjs.io/docs/getting-started
- **Supertest:** https://github.com/ladjs/supertest
- **MongoDB Memory Server:** https://github.com/nodkz/mongodb-memory-server

---

**Tests créés le:** 2025-12-16
**Coverage cible:** 80%+
