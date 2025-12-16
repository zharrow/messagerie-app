# Validation avec Joi

Ce dossier contient tous les schémas de validation Joi pour le Message Service.

## 📦 Installation

```bash
npm install joi
```

## 🎯 Schémas Disponibles

### Conversation Schemas

**Fichier:** `conversation.js`

#### 1. `createConversationSchema`
Valide la création d'une conversation (privée ou groupe).

**Champs:**
- `participants` (array, required): Liste des IDs utilisateurs
- `isGroup` (boolean, default: false): Type de conversation
- `groupName` (string, conditional): Requis si isGroup=true

**Exemple:**
```javascript
{
  "participants": [2, 3],
  "isGroup": true,
  "groupName": "Team Project"
}
```

#### 2. `sendMessageSchema`
Valide l'envoi d'un message.

**Champs:**
- `content` (string, max 5000): Contenu du message
- `attachments` (array, max 5): Fichiers joints
- `replyTo` (string, optional): ID du message parent
- `encrypted` (boolean, optional): Flag E2EE
- `encryptedPayloads` (object, optional): Payloads chiffrés
- `nonce` (string, optional): Nonce pour E2EE
- `senderDeviceId` (string, optional): ID device expéditeur

**Note:** Soit `content` soit `attachments` doit être fourni.

**Exemple:**
```javascript
{
  "content": "Hello!",
  "attachments": [
    {
      "filename": "abc123.jpg",
      "originalName": "photo.jpg",
      "url": "/messages/uploads/abc123.jpg",
      "mimeType": "image/jpeg",
      "size": 245678
    }
  ]
}
```

#### 3. `addParticipantsSchema`
Valide l'ajout de participants à un groupe.

**Champs:**
- `participantId` (number, optional): Un seul participant
- `participantIds` (array, optional): Plusieurs participants

**Note:** Un et un seul de ces champs doit être fourni.

**Exemple:**
```javascript
// Un participant
{ "participantId": 4 }

// Plusieurs participants
{ "participantIds": [4, 5, 6] }
```

#### 4. `searchMessagesSchema`
Valide la recherche de messages.

**Champs:**
- `q` (string, required, min 2, max 100): Query de recherche
- `conversationId` (string, optional): ID conversation spécifique

**Exemple:**
```javascript
{
  "q": "hello world",
  "conversationId": "65a1234567890abcdef12345"
}
```

#### 5. `getMessagesSchema`
Valide la pagination de messages.

**Champs:**
- `before` (date ISO, optional): Date avant laquelle chercher
- `limit` (number, default 50, max 100): Nombre de messages

**Exemple:**
```javascript
{
  "before": "2025-01-15T10:30:00.000Z",
  "limit": 20
}
```

## 🔧 Utilisation

### Dans les Routes

```javascript
const validate = require('../middlewares/validate');
const { createConversationSchema } = require('../validators/conversation');

router.post('/conversations',
  validate(createConversationSchema),
  messageController.createConversation
);
```

### Valider Query Params

```javascript
router.get('/search',
  validate(searchMessagesSchema, 'query'),
  messageController.searchMessages
);
```

### Valider Params

```javascript
router.get('/users/:id',
  validate(userIdSchema, 'params'),
  userController.getUser
);
```

## ⚠️ Messages d'Erreur

En cas d'erreur de validation, l'API retourne:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "participants",
      "message": "At least one participant is required",
      "type": "array.min"
    }
  ]
}
```

**Status Code:** 400 Bad Request

## ✅ Avantages

1. **Type Safety:** Conversion automatique des types
2. **Strip Unknown:** Suppression des champs non définis
3. **Messages Custom:** Messages d'erreur descriptifs
4. **Validation Conditionnelle:** `when()` pour règles complexes
5. **DRY:** Schémas réutilisables

## 📝 Ajouter un Nouveau Schéma

```javascript
// validators/mySchema.js
const Joi = require('joi');

const mySchema = Joi.object({
  field1: Joi.string().required(),
  field2: Joi.number().min(0).max(100).optional()
});

module.exports = { mySchema };
```

```javascript
// routes/myRoutes.js
const { mySchema } = require('../validators/mySchema');

router.post('/endpoint',
  validate(mySchema),
  controller.method
);
```

## 🧪 Tester la Validation

```javascript
// Exemple avec Jest
const { createConversationSchema } = require('../validators/conversation');

describe('Validation', () => {
  it('should validate correct data', () => {
    const data = {
      participants: [2, 3],
      isGroup: true,
      groupName: 'Test'
    };

    const { error, value } = createConversationSchema.validate(data);
    expect(error).toBeUndefined();
    expect(value.participants).toEqual([2, 3]);
  });

  it('should reject invalid data', () => {
    const data = {
      isGroup: true
      // Missing participants
    };

    const { error } = createConversationSchema.validate(data);
    expect(error).toBeDefined();
  });
});
```

## 📚 Documentation Joi

- **Guide:** https://joi.dev/api/
- **Playground:** https://joi.dev/tester/
- **GitHub:** https://github.com/hapijs/joi

---

**Créé le:** 2025-12-16
**Version Joi:** 17.11.0
