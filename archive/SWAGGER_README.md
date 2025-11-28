# 📖 Documentation API OvO - Swagger/OpenAPI

## 🎯 Accéder à la documentation

### Développement local (Docker)

```
http://localhost/api-docs.html
```

### Production (Vercel)

```
https://ovo-messaging.vercel.app/api-docs.html
```

---

## 📋 Fichiers Swagger

### 1. **[swagger.yaml](swagger.yaml)** - Spécification OpenAPI 3.0.3
   - Définition complète de l'API
   - 35+ endpoints documentés
   - Schémas de données (models)
   - Exemples de requêtes/réponses
   - Documentation WebSocket

### 2. **[frontend/public/api-docs.html](frontend/public/api-docs.html)** - Interface Swagger UI
   - Interface interactive
   - Test des endpoints directement depuis le navigateur
   - Auto-injection du JWT token
   - Thème personnalisé OvO

---

## 🚀 Comment utiliser Swagger UI

### 1. Ouvrir l'interface

Aller sur `http://localhost/api-docs.html` (ou l'URL de production)

### 2. S'authentifier

1. **Option A : Via Swagger UI**
   - Cliquer sur "Authorize" (🔒) en haut à droite
   - Entrer votre JWT token (obtenu via `/auth/login`)
   - Format : `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

2. **Option B : Automatique** (si déjà connecté)
   - Si vous êtes connecté sur OvO, le token est auto-injecté depuis localStorage

### 3. Tester un endpoint

1. Choisir une catégorie (Authentication, Users, Messages, etc.)
2. Cliquer sur un endpoint (ex: `GET /users`)
3. Cliquer sur "Try it out"
4. Remplir les paramètres (si nécessaire)
5. Cliquer sur "Execute"
6. Voir la réponse en bas

---

## 📚 Structure de l'API

### 🔐 Authentication (3 endpoints)
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Rafraîchir token
- `POST /auth/logout` - Déconnexion

### 👤 Users (7 endpoints)
- `POST /users/register` - Inscription
- `GET /users` - Liste utilisateurs
- `GET /users/{id}` - Obtenir utilisateur
- `PUT /users/{id}` - Modifier profil
- `GET /users/{id}/profile` - Profil complet
- `PUT /users/{id}/profile` - Modifier profil (photo, bio)
- `PUT /users/{id}/status` - Modifier statut (online, busy, etc.)

### 🔑 Encryption Keys (5 endpoints)
- `POST /users/keys` - Upload clé publique
- `GET /users/keys/me` - Mes clés
- `GET /users/{userId}/keys` - Clés d'un utilisateur
- `POST /users/keys/bulk` - Clés de plusieurs utilisateurs
- `DELETE /users/keys/{device_id}` - Désactiver clé

### 💬 Conversations (7 endpoints)
- `GET /messages/conversations` - Liste conversations
- `POST /messages/conversations` - Créer conversation
- `GET /messages/conversations/{id}` - Obtenir conversation
- `DELETE /messages/conversations/{id}` - Supprimer conversation
- `POST /messages/conversations/{id}/participants` - Ajouter membres
- `DELETE /messages/conversations/{id}/participants/{id}` - Retirer membre

### 📨 Messages (3 endpoints REST)
- `GET /messages/conversations/{id}/messages` - Obtenir messages
- `POST /messages/conversations/{id}/messages` - Envoyer message (fallback)
- `PUT /messages/conversations/{id}/read` - Marquer comme lu

### 📎 Files (2 endpoints)
- `POST /messages/upload` - Upload fichiers (max 5, 10MB)
- `GET /messages/uploads/{filename}` - Récupérer fichier

### 🔍 Search (1 endpoint)
- `GET /messages/search?q=` - Rechercher messages

### 🔌 WebSocket (documentation)
- `/socket.io` - Événements temps réel documentés

**Total : 35+ endpoints documentés**

---

## 🎨 Schémas de données

Le Swagger inclut tous les modèles de données :

### Core Models
- `User` - Utilisateur avec profil complet
- `UserKey` - Clé E2EE (public key + fingerprint)
- `Conversation` - Conversation privée ou groupe
- `Message` - Message avec support E2EE
- `Attachment` - Fichier attaché (image, document)
- `Reaction` - Réaction emoji sur message

### Auth Models
- `AuthResponse` - Réponse login (tokens + user)
- `Error` - Format d'erreur standardisé

---

## 🔐 Authentification JWT

### Flow complet :

1. **Login** : `POST /auth/login`
   ```json
   {
     "email": "alice@example.com",
     "password": "Alice123",
     "rememberMe": true
   }
   ```

   Réponse :
   ```json
   {
     "access_token": "eyJhbGci...",
     "refresh_token": "eyJhbGci...",
     "user": { ... }
   }
   ```

2. **Utiliser le token** :
   - Header : `Authorization: Bearer eyJhbGci...`
   - Expiration : 15 minutes (access token)

3. **Rafraîchir** : `POST /auth/refresh`
   ```json
   {
     "refresh_token": "eyJhbGci..."
   }
   ```

4. **Logout** : `POST /auth/logout`
   - Blacklist les tokens
   - Nettoyage localStorage côté client

---

## 🧪 Tests avec Swagger UI

### Scénario 1 : Inscription + Login

```bash
1. POST /users/register
   {
     "email": "test@example.com",
     "password": "Test123",
     "first_name": "Test",
     "last_name": "User"
   }

2. POST /auth/login
   {
     "email": "test@example.com",
     "password": "Test123",
     "rememberMe": true
   }

3. Copier le access_token
4. Cliquer sur "Authorize" et coller le token
5. Tester GET /users/me
```

### Scénario 2 : Créer conversation + Envoyer message

```bash
1. POST /messages/conversations
   {
     "participants": [2],
     "isGroup": false
   }

2. Copier le conversationId
3. POST /messages/conversations/{id}/messages
   {
     "content": "Hello from Swagger!"
   }

4. GET /messages/conversations/{id}/messages
   → Voir le message
```

### Scénario 3 : Upload fichier

```bash
1. POST /messages/upload
   - Sélectionner 1-5 fichiers (max 10MB chacun)
   - Execute

2. Copier les URLs des fichiers
3. Utiliser dans un message :
   POST /messages/conversations/{id}/messages
   {
     "content": "Voici des fichiers",
     "attachments": [ ... ]
   }
```

---

## 🔌 WebSocket Events (Real-time)

Le Swagger documente aussi les événements WebSocket :

### Client → Serveur

| Event | Description | Payload |
|-------|-------------|---------|
| `send_message` | Envoyer message | `{ conversationId, content, encrypted, ... }` |
| `add_reaction` | Ajouter réaction | `{ conversationId, messageId, emoji }` |
| `remove_reaction` | Retirer réaction | `{ conversationId, messageId, emoji }` |
| `edit_message` | Éditer message | `{ conversationId, messageId, newContent }` |
| `delete_message` | Supprimer message | `{ conversationId, messageId }` |
| `typing_start` | Commence à écrire | `{ conversationId }` |
| `typing_stop` | Arrête d'écrire | `{ conversationId }` |
| `mark_read` | Marquer comme lu | `{ conversationId, lastMessageId }` |
| `join_conversation` | Rejoindre room | `{ conversationId }` |
| `leave_conversation` | Quitter room | `{ conversationId }` |

### Serveur → Client

| Event | Description |
|-------|-------------|
| `new_message` | Nouveau message |
| `reaction_added` | Réaction ajoutée |
| `reaction_removed` | Réaction retirée |
| `message_edited` | Message édité |
| `message_deleted` | Message supprimé |
| `user_typing` | Utilisateur écrit |
| `messages_read` | Messages lus |
| `user_online` | Utilisateur connecté |
| `user_offline` | Utilisateur déconnecté |

**Note** : Les WebSocket ne sont pas testables directement via Swagger UI. Utiliser Socket.io client ou l'app OvO.

---

## 📊 Codes de statut HTTP

| Code | Description | Exemple |
|------|-------------|---------|
| `200` | OK | Requête réussie |
| `201` | Created | Ressource créée |
| `400` | Bad Request | Paramètres invalides |
| `401` | Unauthorized | Token manquant/invalide |
| `403` | Forbidden | Pas les permissions |
| `404` | Not Found | Ressource introuvable |
| `500` | Internal Server Error | Erreur serveur |

---

## 🛠️ Intégration avec Postman

### Import du Swagger dans Postman :

1. Ouvrir Postman
2. File > Import
3. Sélectionner `swagger.yaml`
4. ✅ Collection "OvO API" créée avec tous les endpoints !

### Avantages :
- Tous les endpoints pré-configurés
- Exemples de requêtes
- Tests automatisés possibles
- Partage avec l'équipe

---

## 📝 Mise à jour du Swagger

### Lors de l'ajout d'un endpoint :

1. Modifier `swagger.yaml`
2. Ajouter le path sous `/paths`
3. Définir les schémas sous `/components/schemas`
4. Tester sur `http://localhost/api-docs.html`
5. Commit : `git add swagger.yaml && git commit -m "docs: add new endpoint"`

### Valider le Swagger :

```bash
# Installer validator
npm install -g @apidevtools/swagger-cli

# Valider
swagger-cli validate swagger.yaml

# Si OK :
✅ swagger.yaml is valid
```

---

## 🎓 Ressources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Swagger Editor](https://editor.swagger.io/) - Éditeur en ligne
- [Postman](https://www.postman.com/) - Client API

---

## 🚀 Déploiement

### Développement local

Swagger est automatiquement disponible sur `http://localhost/api-docs.html` via Docker.

### Production Vercel

Le fichier `frontend/public/api-docs.html` est déployé automatiquement.

Accessible sur : `https://ovo-messaging.vercel.app/api-docs.html`

### Hébergement alternatif

Si vous voulez héberger le Swagger séparément :

```bash
# Via npx
npx @stoplight/prism-cli mock swagger.yaml

# Via Docker
docker run --rm -p 4010:4010 stoplight/prism:4 mock -h 0.0.0.0 swagger.yaml
```

---

## ✅ Checklist d'utilisation

- [ ] Ouvrir `http://localhost/api-docs.html`
- [ ] Lire la description de l'API
- [ ] S'authentifier via `/auth/login`
- [ ] Copier le token JWT
- [ ] Cliquer sur "Authorize" et coller le token
- [ ] Tester quelques endpoints (GET /users, POST /messages/conversations)
- [ ] Vérifier les schémas de données
- [ ] Lire la doc WebSocket
- [ ] (Optionnel) Importer dans Postman

---

## 🎉 Félicitations !

Vous avez maintenant une **documentation API complète et interactive** pour OvO !

**Avantages** :
✅ Documentation toujours à jour (maintenue avec le code)
✅ Tests interactifs directement dans le navigateur
✅ Import facile dans Postman/Insomnia
✅ Standard OpenAPI 3.0 (compatible avec tous les outils)
✅ Facilite l'onboarding des nouveaux développeurs
✅ Professionnalisme pour présentation projet

**URL finale** : `https://ovo-messaging.vercel.app/api-docs.html` 🚀
