# 🔧 Services Backend

Ce dossier contient tous les microservices de l'application.

## 📁 Structure

```
services/
├── user-service/       # Gestion des utilisateurs
├── auth-service/       # Authentification JWT
├── message-service/    # Messagerie temps réel
└── shared-lib/         # Bibliothèque partagée
```

## 🔹 User Service (Port 3001)

**Responsabilités** :
- Inscription et gestion des utilisateurs
- Profils utilisateurs (photo, bio, statut)
- Gestion des clés publiques E2EE
- Validation des credentials (interne)

**Base de données** : PostgreSQL

**Endpoints principaux** :
- `POST /users/register` - Inscription
- `GET /users/:id` - Récupérer un utilisateur
- `PUT /users/:id/profile` - Modifier le profil
- `POST /users/keys` - Upload clé publique E2EE
- `GET /users/:userId/keys` - Récupérer clés publiques

**Technologies** :
- Express.js
- PostgreSQL (pg)
- bcrypt (hashing passwords)

---

## 🔹 Auth Service (Port 3002)

**Responsabilités** :
- Génération de tokens JWT (Access + Refresh)
- Validation des tokens
- Logout et blacklist
- Remember Me (refresh tokens 30 jours)

**Base de données** : Redis (cache)

**Endpoints principaux** :
- `POST /auth/login` - Connexion
- `POST /auth/logout` - Déconnexion
- `POST /auth/refresh` - Renouveler le token
- `POST /internal/validate-token` - Validation (interne)

**Technologies** :
- Express.js
- Redis (ioredis)
- jsonwebtoken (JWT)

---

## 🔹 Message Service (Port 3003)

**Responsabilités** :
- Conversations privées et groupes
- Messages en temps réel (WebSocket)
- Upload et partage de fichiers
- Réactions emoji
- Chiffrement E2EE des messages
- Édition et suppression de messages

**Base de données** : MongoDB (NoSQL)

**Endpoints principaux** :
- `GET /messages/conversations` - Liste des conversations
- `POST /messages/conversations` - Créer une conversation
- `GET /messages/conversations/:id` - Récupérer messages
- `POST /messages/upload` - Upload de fichiers
- `GET /messages/search` - Rechercher dans les messages

**WebSocket events** :
- `send_message` - Envoyer un message
- `add_reaction` - Ajouter une réaction
- `edit_message` - Éditer un message
- `typing_start/stop` - Indicateurs de frappe

**Technologies** :
- Express.js
- MongoDB (mongoose)
- Socket.io (WebSocket)
- Multer (upload fichiers)

---

## 🔹 Shared Library

**Responsabilités** :
- Code mutualisé entre tous les services
- Middlewares réutilisables
- Utilitaires partagés
- Validateurs

**Contenu** :
- `middlewares/` - Auth, logging, internal security
- `utils/` - Helpers API, constantes
- `validators/` - Validation email, etc.
- `__tests__/` - Tests unitaires Jest

**Technologies** :
- Jest (tests unitaires)
- Morgan (logging)

---

## 🔄 Communication inter-services

### Pattern d'authentification

Tous les services utilisent le même pattern pour valider les requêtes :

```javascript
// 1. Middleware auth dans chaque service
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  // 2. Appel à Auth Service pour valider
  const response = await axios.post('http://auth-service:3002/internal/validate-token', {
    token
  }, {
    headers: { 'X-Internal-Secret': process.env.INTERNAL_SECRET }
  });

  req.userId = response.data.user_id;
  next();
};
```

### Sécurité interne

Les endpoints internes (ex: `/internal/*`) sont protégés par :
- Header `X-Internal-Secret` obligatoire
- Réseau Docker isolé
- Non exposés publiquement via Traefik

---

## 🛠️ Développement

### Installer les dépendances (tous les services)

```bash
cd user-service && npm install
cd ../auth-service && npm install
cd ../message-service && npm install
cd ../shared-lib && npm install
```

### Lancer un service en mode dev (avec Nodemon)

```bash
cd user-service
npm run dev
```

### Tests

```bash
cd shared-lib
npm test
```

---

## 📚 Documentation détaillée

- **[User Service](user-service/README.md)** (à créer)
- **[Auth Service](auth-service/README.md)** (à créer)
- **[Message Service](message-service/README.md)** (à créer)
- **[Shared Library](shared-lib/README.md)** ✅

---

## 🏗️ Architecture technique

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ User Service │      │ Auth Service │      │Message Service│
│  (Express)   │◄────►│  (Express)   │◄────►│  (Express +  │
│              │      │              │      │  Socket.io)  │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       ↓                     ↓                     ↓
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │      │   MongoDB    │
│  (users_db)  │      │  (sessions)  │      │(messages_db) │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

**Pour plus d'informations, consultez [CLAUDE.md](../CLAUDE.md)**
