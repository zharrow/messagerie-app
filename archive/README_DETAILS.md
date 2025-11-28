# Application de Messagerie en Temps Réel avec Architecture Microservices

> **TP Microservices - M1 Ynov Fullstack 2025/2026**
> Application de chat en temps réel avec chiffrement end-to-end (E2EE), architecture microservices complète et API Gateway Traefik.

## 📋 Description du Projet

**OvO Messenger** est une application de messagerie instantanée moderne basée sur une architecture microservices complète. Le projet implémente un système de chat en temps réel avec chiffrement end-to-end, authentification JWT, gestion de groupes, partage de fichiers et réactions emoji.

### 🎯 Fonctionnalité Principale

**Messagerie sécurisée en temps réel** avec les fonctionnalités suivantes :
- 💬 **Chat temps réel** via WebSocket (Socket.io)
- 🔐 **Chiffrement end-to-end (E2EE)** avec TweetNaCl (Curve25519)
- 👥 **Conversations privées et groupes** avec gestion d'admin
- 📎 **Partage de fichiers** (images, documents, max 10MB)
- 😊 **Réactions emoji** sur les messages (6 réactions disponibles)
- ✏️ **Édition et suppression** de messages en temps réel
- 📱 **Interface Messenger-like** responsive et moderne
- 🔔 **Indicateurs de frappe** (typing indicators)
- ✓✓ **Accusés de lecture** avec timestamps
- 🎨 **GIF Tenor** intégré dans le chat

### 🏆 Points Forts du Projet

| Critère TP | Requis | Implémenté | Bonus |
|-----------|--------|------------|-------|
| **Services** | 2+ services | **3 services** (User, Auth, Message) | ✅ +1 service |
| **Bases de données** | 2+ BDD | **3 BDD** (PostgreSQL, Redis, MongoDB) | ✅ +1 BDD |
| **Gateway** | 1 gateway | Traefik avec auto-discovery + dashboard | ✅ Pro-grade |
| **Frontend** | 1 front | React + TypeScript + Vite | ✅ TypeScript |
| **Dockerisation** | Tous services | 7 containers orchestrés | ✅ |
| **Logs** | Morgan | Morgan sur tous les services | ✅ |
| **Bonus** | Optionnel | **Tous bonus + E2EE + WebSocket** | ✅✅✅ |

### 🚀 Technologies Utilisées

**Backend :**
- Node.js 18 + Express.js (3 microservices)
- PostgreSQL (utilisateurs)
- Redis (sessions JWT)
- MongoDB (conversations)
- Socket.io (WebSocket temps réel)
- Traefik v3 (API Gateway)

**Frontend :**
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Socket.io Client
- TweetNaCl (E2EE cryptographie)
- Axios (HTTP client)

**DevOps :**
- Docker + Docker Compose
- Morgan (logging HTTP)
- Nodemon (hot-reload dev)
- ESLint + Husky (qualité code)
- Jest (tests unitaires)

---

## 🏗️ Architecture

### Vue d'ensemble

```
                                   Internet
                                      |
                               [Traefik Gateway]
                                 Port 80/443
                                 Dashboard :8080
                                      |
        +-------------+---------------+----------------+---------------+
        |             |               |                |               |
        |             |               |                |               |
    [Frontend]  [User Service]  [Auth Service]  [Message Service]     |
     React/TS     Port 3001       Port 3002         Port 3003          |
     + Nginx          |               |                |               |
                      |               |                |               |
                [PostgreSQL]       [Redis]         [MongoDB]           |
                 Port 5432       Port 6379        Port 27017           |

    Légende:
    ──────►  Requêtes HTTP/HTTPS
    ◄─────►  Communication inter-services (réseau Docker interne)
    ⚡       WebSocket (temps réel)
```

### Schéma détaillé

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│                    - React Frontend (TypeScript + Vite)                      │
│                    - Socket.io Client (WebSocket)                            │
└────────────────────────────────┬─────────────────────────────────────────────┘
                                 │ HTTP/HTTPS + WebSocket
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           TRAEFIK (API Gateway)                              │
│  - Reverse Proxy                    - Load Balancing                         │
│  - Routing automatique              - Dashboard monitoring (Port 8080)       │
│  - Health Checks                    - Auto-discovery des services            │
└──────┬──────────────┬───────────────┬──────────────────────┬─────────────────┘
       │              │               │                      │
       │ /*           │ /users/*      │ /auth/*              │ /messages/*
       │ (Priority 1) │               │                      │ + WebSocket
       ▼              ▼               ▼                      ▼
┌────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────────┐
│  FRONTEND  │  │USER SERVICE  │  │AUTH SERVICE │  │   MESSAGE SERVICE        │
│  (Nginx)   │  │(Express.js)  │◄─┤(Express.js) │  │   (Express.js)           │
│            │  │              │  │             │  │   + Socket.io Server     │
│  Serve:    │  │Endpoints:    │  │Endpoints:   │  │                          │
│  - HTML    │  │PUBLIC:       │  │PUBLIC:      │  │   PUBLIC ENDPOINTS:      │
│  - CSS     │  │ POST /regis  │  │ POST /login │  │   GET  /conversations    │
│  - JS      │  │ GET  /:id    │  │ POST /logout│  │   POST /conversations    │
│  - Assets  │  │ PUT  /:id    │  │ POST /refresh│ │   GET  /conversations/:id│
│            │  │ GET  /       │  │ GET  /health│  │   POST /conversations/   │
│            │  │ PUT  /:id/   │  │             │  │        :id/messages      │
│            │  │   profile    │  │INTERNAL:    │  │   POST /upload           │
│            │  │ PUT  /:id/   │  │ POST /int/  │  │   GET  /search           │
│            │  │   status     │  │   validate  │  │   GET  /health           │
│            │  │ POST /keys   │  │             │  │                          │
│            │  │ GET  /keys/me│  │             │  │   WEBSOCKET EVENTS:      │
│            │  │ GET  /health │  │             │  │   ⚡ send_message        │
│            │  │              │  │             │  │   ⚡ add_reaction         │
│            │  │INTERNAL:     │  │             │  │   ⚡ edit_message         │
│            │  │ POST /int/   │  │             │  │   ⚡ delete_message       │
│            │  │   verify-    │  │             │  │   ⚡ typing_start/stop    │
│            │  │   credentials│  │             │  │   ⚡ mark_read            │
└────────────┘  └──────┬───────┘  └──────┬──────┘  └──────────┬───────────────┘
                       │                 │                    │
                       │                 │                    │
                       ▼                 ▼                    ▼
              ┌─────────────────┐ ┌──────────────┐  ┌─────────────────┐
              │   POSTGRESQL    │ │    REDIS     │  │    MONGODB      │
              │                 │ │              │  │                 │
              │  Tables:        │ │  Stockage:   │  │  Collections:   │
              │  - users        │ │  - JWT       │  │  - conversations│
              │  - user_keys    │ │    tokens    │  │    * messages   │
              │    (E2EE)       │ │  - Refresh   │  │    * reactions  │
              │                 │ │    tokens    │  │    * attachments│
              │  Port: 5432     │ │  - Sessions  │  │    * participants│
              └─────────────────┘ │  - Blacklist │  │                 │
                                  │              │  │  Port: 27017    │
                                  │  Port: 6379  │  └─────────────────┘
                                  └──────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    COMMUNICATION INTER-SERVICES                              │
│                                                                              │
│  User Service ──(verify credentials)──► Auth Service                        │
│  User Service ◄──(validate token)────── Auth Service                        │
│  Message Service ──(validate token)──► Auth Service                         │
│  Message Service ──(fetch user keys)─► User Service (E2EE)                  │
│                                                                              │
│  🔒 Sécurisé par: Header X-Internal-Secret                                  │
│  🌐 Réseau: Docker internal network                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Réseaux Docker

```
┌─────────────────────────────────────────────────────────────────┐
│                        RÉSEAU PUBLIC                            │
│                                                                 │
│  [Internet] ◄──► [Traefik]                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                      RÉSEAU INTERNAL                             │
│                                                                  │
│  [Traefik] ◄──► [Frontend] [User] [Auth] [Message]              │
│                               ▼       ▼       ▼                  │
│                          [PostgreSQL] [Redis] [MongoDB]          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔀 Répartition des Services

Cette section détaille le **rôle de chaque composant** et **qui fait quoi** dans l'architecture.

### 1️⃣ Traefik (API Gateway)

**Rôle :** Point d'entrée unique pour toutes les requêtes HTTP/HTTPS

**Responsabilités :**
- ✅ Routage des requêtes vers les services appropriés
- ✅ Load balancing automatique entre instances
- ✅ Auto-discovery des services Docker (via labels)
- ✅ Monitoring temps réel (Dashboard sur :8080)
- ✅ Health checks des services backend
- ✅ Support HTTPS/SSL (Let's Encrypt en production)

**Pourquoi Traefik ?**
- Configuration déclarative (Docker labels)
- Pas de code à maintenir (vs http-proxy-middleware)
- Production-ready avec dashboard intégré

**Routage :**
```yaml
/* (priority 1)        → Frontend (Nginx)
/users/*               → User Service (Port 3001)
/auth/*                → Auth Service (Port 3002)
/messages/*            → Message Service (Port 3003)
/messages/socket.io    → WebSocket Message Service
```

---

### 2️⃣ User Service (Port 3001)

**Rôle :** Gestion complète du cycle de vie des utilisateurs

**Responsabilités :**
- ✅ **Inscription** : Création de comptes avec validation email/password
- ✅ **CRUD utilisateurs** : Récupération, mise à jour, suppression
- ✅ **Profils** : Gestion photo, bio, statut (online/offline/busy/away)
- ✅ **Clés E2EE** : Stockage des clés publiques de chiffrement
- ✅ **Vérification credentials** : Endpoint interne pour Auth Service

**Base de données :** PostgreSQL
- Tables : `users`, `user_keys`
- Bcrypt pour le hashing de mots de passe

**Endpoints publics :**
- `POST /users/register` - Créer un compte
- `GET /users/:id` - Récupérer un utilisateur
- `PUT /users/:id` - Modifier nom/prénom
- `PUT /users/:id/profile` - Modifier photo/bio
- `PUT /users/:id/status` - Changer le statut
- `POST /users/keys` - Upload clé publique E2EE
- `GET /users/keys/:userId` - Récupérer clés publiques

**Endpoints internes (non exposés) :**
- `POST /internal/verify-credentials` - Valider email/password (appelé par Auth Service)

**Communication avec d'autres services :**
- ⬅️ **Reçoit** : Appels d'Auth Service pour vérifier les credentials
- ➡️ **Envoie** : Appels à Auth Service pour valider les tokens JWT

---

### 3️⃣ Auth Service (Port 3002)

**Rôle :** Authentification centralisée et gestion des sessions JWT

**Responsabilités :**
- ✅ **Login** : Génération de JWT (Access + Refresh tokens)
- ✅ **Logout** : Blacklist des tokens dans Redis
- ✅ **Refresh token** : Renouvellement d'Access Token expiré
- ✅ **Validation token** : Endpoint interne pour les autres services
- ✅ **Remember Me** : Refresh tokens longue durée (30 jours)

**Base de données :** Redis (in-memory)
- Refresh tokens avec TTL
- Blacklist des tokens révoqués
- Sessions utilisateurs

**Endpoints publics :**
- `POST /auth/login` - Connexion (retourne Access + Refresh tokens)
- `POST /auth/logout` - Déconnexion (blacklist tokens)
- `POST /auth/refresh` - Renouveler Access Token

**Endpoints internes (non exposés) :**
- `POST /internal/validate-token` - Valider un JWT (appelé par User/Message Services)

**Communication avec d'autres services :**
- ➡️ **Envoie** : Appels à User Service pour vérifier email/password lors du login
- ⬅️ **Reçoit** : Appels de User/Message Services pour valider les tokens

**Flow d'authentification :**
```
1. Login → Auth appelle User Service pour vérifier credentials
2. User Service retourne les infos si valide
3. Auth génère Access Token (15min) + Refresh Token (30d)
4. Tokens stockés dans Redis avec TTL
5. Client reçoit les tokens
```

---

### 4️⃣ Message Service (Port 3003)

**Rôle :** Messagerie temps réel avec chiffrement end-to-end

**Responsabilités :**
- ✅ **Conversations** : CRUD conversations privées et groupes
- ✅ **Messages** : Envoi, édition, suppression de messages
- ✅ **WebSocket** : Communication temps réel via Socket.io
- ✅ **Réactions** : Ajout/suppression d'emoji sur messages
- ✅ **Upload fichiers** : Images, documents (max 10MB, 5 fichiers)
- ✅ **Chiffrement E2EE** : Validation et routage de messages chiffrés
- ✅ **Indicateurs de frappe** : Typing indicators temps réel
- ✅ **Accusés de lecture** : Read receipts avec timestamps

**Base de données :** MongoDB (NoSQL)
- Collection : `conversations`
- Sous-documents : `messages`, `reactions`, `attachments`, `readBy`

**Endpoints REST publics :**
- `GET /messages/conversations` - Liste des conversations
- `POST /messages/conversations` - Créer conversation/groupe
- `GET /messages/conversations/:id` - Récupérer conversation + messages
- `POST /messages/upload` - Upload de fichiers
- `GET /messages/search?q=keyword` - Rechercher dans messages

**WebSocket Events (temps réel) :**
- `send_message` - Envoyer message
- `add_reaction` - Ajouter réaction emoji
- `edit_message` - Modifier message
- `delete_message` - Supprimer message
- `typing_start/stop` - Indicateurs de frappe
- `mark_read` - Marquer messages comme lus

**Communication avec d'autres services :**
- ➡️ **Envoie** : Appels à Auth Service pour valider tokens
- ➡️ **Envoie** : Appels à User Service pour récupérer clés publiques E2EE

**Sécurité WebSocket :**
- Middleware d'authentification JWT avant connexion
- Isolation par conversation (Socket.io rooms)
- Validation des permissions (admin pour groupes)

---

### 5️⃣ Frontend (React + TypeScript)

**Rôle :** Interface utilisateur web responsive et moderne

**Responsabilités :**
- ✅ **Authentification UI** : Login, Register, Logout
- ✅ **Chat interface** : Liste conversations, messages, input
- ✅ **Temps réel** : WebSocket pour messages instantanés
- ✅ **E2EE client-side** : Chiffrement/déchiffrement avec TweetNaCl
- ✅ **Gestion groupes** : Création, ajout/retrait membres, paramètres
- ✅ **Upload fichiers** : Interface de sélection et preview
- ✅ **Réactions emoji** : Picker et affichage des réactions
- ✅ **GIF Tenor** : Recherche et insertion de GIFs
- ✅ **Profils utilisateurs** : Sidebar avec infos, médias, fichiers

**Technologies :**
- React 19 + TypeScript
- Vite (build tool rapide)
- Tailwind CSS + shadcn/ui (design system)
- Socket.io Client (WebSocket)
- TweetNaCl (cryptographie E2EE)
- Axios (HTTP client avec auto-refresh token)

**Architecture frontend :**
- **Hooks personnalisés** : `useConversations`, `useMessages`, `useSocketEvents`, `useEncryption`
- **Context API** : `AuthContext` pour état global d'authentification
- **Services** : `api.ts` (REST), `socket.ts` (WebSocket), `encryption.ts` (E2EE)
- **Composants modulaires** : Séparation chat/UI pour maintenabilité

**Déploiement :**
- Build Vite en mode production
- Serveur Nginx pour servir les assets statiques
- Routing côté client avec React Router

---

### 📊 Tableau Récapitulatif

| Service | Port | Technologie | Base de données | Rôle Principal |
|---------|------|-------------|-----------------|----------------|
| **Traefik** | 80, 443, 8080 | Go | - | API Gateway + Reverse Proxy |
| **User Service** | 3001 | Node.js + Express | PostgreSQL | Gestion utilisateurs + E2EE keys |
| **Auth Service** | 3002 | Node.js + Express | Redis | Authentification JWT + Sessions |
| **Message Service** | 3003 | Node.js + Express + Socket.io | MongoDB | Chat temps réel + E2EE |
| **Frontend** | 80 (via Traefik) | React + TypeScript + Nginx | - | Interface utilisateur web |

---

## 🔧 Choix Techniques

### 1. API Gateway : Traefik

> **📌 Note sur les contraintes du TP**
>
> Le sujet du TP suggère l'utilisation de `http-proxy-middleware` pour la gateway. Après validation avec le professeur, **Traefik a été autorisé** comme alternative pour ce projet.

**Pourquoi Traefik plutôt que http-proxy-middleware ?**

| Critère | http-proxy-middleware | Traefik | Choix |
|---------|----------------------|---------|-------|
| **Configuration** | Code Express manuel | Labels Docker déclaratifs | ✅ Traefik |
| **Auto-discovery** | Non, routes à coder | Oui, détection automatique | ✅ Traefik |
| **Dashboard** | Non | Oui, interface web intégrée | ✅ Traefik |
| **HTTPS/SSL** | Configuration manuelle | Let's Encrypt natif | ✅ Traefik |
| **Load Balancing** | À implémenter | Natif | ✅ Traefik |
| **Production-ready** | Nécessite sécurisation | Prêt pour production | ✅ Traefik |
| **Maintenance** | Code à maintenir | Configuration déclarative | ✅ Traefik |

**Avantages de Traefik pour ce projet :**
- **Auto-discovery** : Détecte automatiquement les services Docker via labels
- **Configuration déclarative** : Configuration via docker-compose.yml, pas de code à maintenir
- **Dashboard intégré** : Interface web de monitoring en temps réel sur http://localhost:8080
- **Production-ready** : Support natif HTTPS, Let's Encrypt, health checks
- **Performance** : Léger et rapide, écrit en Go
- **Hot reload** : Mise à jour de la configuration sans redémarrage
- **Évolutivité** : Préparation pour Kubernetes (Ingress Controller)

**Exemple de configuration (http-proxy-middleware vs Traefik) :**

<details>
<summary>Avec http-proxy-middleware (code à maintenir)</summary>

```javascript
// gateway/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Routes à configurer manuellement pour chaque service
app.use('/users', createProxyMiddleware({
  target: 'http://user-service:3001',
  changeOrigin: true
}));

app.use('/auth', createProxyMiddleware({
  target: 'http://auth-service:3002',
  changeOrigin: true
}));

app.use('/messages', createProxyMiddleware({
  target: 'http://message-service:3003',
  changeOrigin: true
}));

app.listen(80);
```
**Problèmes :**
- Chaque nouveau service nécessite modification du code
- Pas de dashboard pour monitoring
- Pas de support HTTPS natif
- Redémarrage requis à chaque changement
</details>

<details>
<summary>Avec Traefik (configuration déclarative)</summary>

```yaml
# docker-compose.yml
services:
  user-service:
    labels:
      - "traefik.http.routers.user-service.rule=PathPrefix(`/users`)"
      - "traefik.http.services.user-service.loadbalancer.server.port=3001"
```
**Avantages :**
- Configuration via labels Docker (déclaratif)
- Auto-discovery des services
- Dashboard sur :8080
- HTTPS automatique (Let's Encrypt)
- Hot reload automatique
</details>

**Alternatives rejetées :**
- ❌ **http-proxy-middleware** : Code à maintenir, pas d'auto-discovery, fonctionnalités limitées
- ❌ **Nginx** : Configuration complexe, pas d'auto-discovery Docker
- ❌ **Kong** : Trop lourd pour ce projet, orienté entreprise avec plugins payants

### 2. Services : Express.js + Node.js

**Pourquoi Express.js ?**
- **Simplicité** : Framework minimaliste et flexible
- **Écosystème riche** : Nombreux middlewares disponibles (JWT, validation, CORS)
- **Performance** : Léger et rapide pour des APIs REST
- **Apprentissage** : Documentation excellente, large communauté
- **JavaScript full-stack** : Cohérence avec l'écosystème frontend si nécessaire

**Middlewares utilisés :**
- `express.json()` : Parsing du body JSON
- `cors()` : Gestion des requêtes cross-origin
- `jsonwebtoken` : Génération et validation des JWT
- `bcrypt` : Hashing sécurisé des mots de passe
- Custom middlewares pour l'authentification et les routes internes

### 3. Base de données : PostgreSQL

**Pourquoi PostgreSQL ?**
- **Relationnel** : Adapté pour les données structurées (utilisateurs, profils)
- **ACID** : Garanties transactionnelles pour l'intégrité des données
- **Robustesse** : Production-ready, utilisé par des millions d'applications
- **JSON support** : Flexibilité pour stocker des données semi-structurées si besoin
- **Open-source** : Gratuit et bien maintenu

**Schéma de base :**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Cache/Sessions : Redis

**Pourquoi Redis ?**
- **In-memory** : Ultra rapide pour les validations de tokens
- **TTL natif** : Expiration automatique des sessions/tokens
- **Data structures** : Support des sets, hashes pour gérer les sessions
- **Pub/Sub** : Possible évolution vers un système de notifications temps réel
- **Simplicité** : Facile à intégrer avec Node.js (`ioredis` ou `redis`)

**Usage :**
- Access tokens (JWT) : TTL de 15 minutes
- Refresh tokens : TTL de 30 jours (remember me)
- Blacklist de tokens lors du logout

### 4.5. Base de données NoSQL : MongoDB

**Pourquoi MongoDB pour le Message Service ?**

| Critère | PostgreSQL (relationnel) | MongoDB (NoSQL) | Choix |
|---------|-------------------------|-----------------|-------|
| **Schéma flexible** | Rigide, ALTER TABLE requis | Documents JSON flexibles | ✅ MongoDB |
| **Messages imbriqués** | Jointures complexes | Sous-documents natifs | ✅ MongoDB |
| **Performance lecture** | Index sur tables jointes | Lecture d'un seul document | ✅ MongoDB |
| **Évolutivité** | Vertical scaling | Horizontal sharding natif | ✅ MongoDB |
| **Réactions/attachments** | Tables séparées + joins | Arrays dans le document | ✅ MongoDB |

**Avantages pour le chat :**
- **Document model** : Une conversation = un document avec tous ses messages
- **Arrays** : Réactions, participants, attachments stockés directement
- **Performance** : Récupération d'une conversation en 1 requête (pas de joins)
- **Flexibilité** : Facile d'ajouter de nouveaux champs (replies, mentions, etc.)
- **Scaling** : Sharding automatique pour des millions de messages

**Schéma MongoDB :**
```javascript
// Collection: conversations
{
  _id: ObjectId("..."),
  participants: [1, 2, 3],  // User IDs
  isGroup: false,
  groupName: null,
  groupAdmin: null,
  messages: [
    {
      _id: ObjectId("..."),
      from: 1,
      content: "Hello!",
      encrypted: true,
      encryptedPayloads: {
        "1:device-1": "base64...",
        "2:device-1": "base64..."
      },
      attachments: [
        {
          filename: "image.png",
          url: "/uploads/...",
          mimeType: "image/png",
          size: 12345
        }
      ],
      reactions: [
        { emoji: "👍", userId: 2, createdAt: Date }
      ],
      readBy: [
        { userId: 2, readAt: Date }
      ],
      replyTo: ObjectId("..."),
      createdAt: Date,
      editedAt: Date,
      deletedAt: null
    }
  ],
  lastMessage: { ... },
  createdAt: Date,
  updatedAt: Date
}
```

**Alternatives rejetées :**
- ❌ **PostgreSQL avec JSONB** : Performant mais moins flexible que MongoDB
- ❌ **Cassandra** : Trop complexe pour ce use case, orienté time-series
- ❌ **DynamoDB** : Vendor lock-in AWS, coûteux

### 5. Authentification : JWT (JSON Web Tokens)

**Pourquoi JWT ?**
- **Stateless** : Pas besoin de stocker la session côté serveur (sauf refresh token)
- **Décentralisé** : Chaque service peut valider indépendamment
- **Claims personnalisables** : Payload flexible (user_id, roles, etc.)
- **Standard** : RFC 7519, bibliothèques disponibles partout

**Architecture des tokens :**
- **Access Token** : Courte durée (15 min), utilisé pour les requêtes API
- **Refresh Token** : Longue durée (30 jours), stocké dans Redis, permet de renouveler l'access token

**Flow :**
```
1. Login → Génère Access Token + Refresh Token
2. Requête API → Envoie Access Token dans header Authorization
3. Access Token expire → Utilise Refresh Token pour en obtenir un nouveau
4. Logout → Ajoute tokens à la blacklist dans Redis
```

### 6. Temps réel : Socket.io + WebSocket

**Pourquoi Socket.io pour le Message Service ?**

| Critère | HTTP Polling | Server-Sent Events | WebSocket | Socket.io | Choix |
|---------|-------------|-------------------|-----------|-----------|-------|
| **Bidirectionnel** | Non | Non | Oui | Oui | ✅ Socket.io |
| **Fallback auto** | - | - | Non | Oui (polling) | ✅ Socket.io |
| **Events nommés** | Non | Oui | Non natif | Oui | ✅ Socket.io |
| **Reconnexion auto** | - | Oui | Non natif | Oui | ✅ Socket.io |
| **Rooms/Namespaces** | Non | Non | Non natif | Oui | ✅ Socket.io |
| **Latence** | Élevée | Moyenne | Faible | Faible | ✅ Socket.io |

**Avantages de Socket.io :**
- **Abstraction WebSocket** : API simple et intuitive
- **Fallback automatique** : Long-polling si WebSocket indisponible
- **Rooms** : Isolation des conversations (join/leave)
- **Events** : Typage fort des événements (send_message, typing, reactions)
- **Reconnexion** : Automatique avec backoff exponentiel
- **Middlewares** : Authentification JWT avant connexion WebSocket

**Événements WebSocket implémentés :**

**Client → Server :**
```javascript
socket.emit('send_message', { conversationId, content, attachments });
socket.emit('add_reaction', { messageId, emoji });
socket.emit('typing_start', { conversationId });
socket.emit('edit_message', { messageId, newContent });
socket.emit('delete_message', { messageId });
```

**Server → Client :**
```javascript
socket.to(conversationId).emit('new_message', message);
socket.to(conversationId).emit('reaction_added', { messageId, reaction });
socket.to(conversationId).emit('user_typing', { userId, conversationId });
socket.to(conversationId).emit('message_edited', { messageId, newContent });
```

**Sécurité WebSocket :**
```javascript
// Middleware d'authentification Socket.io
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const isValid = await authService.validateToken(token);
  if (isValid) {
    socket.userId = isValid.user_id;
    next();
  } else {
    next(new Error('Authentication error'));
  }
});
```

**Alternatives rejetées :**
- ❌ **HTTP Polling** : Latence élevée, surcharge serveur
- ❌ **Server-Sent Events (SSE)** : Unidirectionnel (server → client uniquement)
- ❌ **WebSocket natif** : Pas de fallback, pas de rooms, API bas niveau

### 6. Communication Inter-Services : Réseau Docker Interne

**Choix : Communication directe via réseau Docker**

**Avantages :**
- ✅ **Performance** : Pas de hop supplémentaire via Traefik
- ✅ **Résilience** : Services communiquent même si Traefik tombe
- ✅ **Sécurité** : Endpoints internes non exposés publiquement
- ✅ **Isolation** : Séparation claire entre routes publiques et internes

**Sécurisation :**
```javascript
// Middleware pour protéger les routes internes
function internalOnly(req, res, next) {
  const ip = req.ip;
  // Vérifie que la requête vient du réseau Docker
  if (!ip.includes('172.') && !ip.includes('10.')) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

app.use('/internal', internalOnly);
```

**Alternative rejetée :**
- ❌ Communication via Traefik : Latence supplémentaire, point de défaillance unique

### 7. Orchestration : Docker Compose

**Pourquoi Docker Compose ?**
- **Simplicité** : Un seul fichier `docker-compose.yml` pour tout l'environnement
- **Reproductibilité** : Même environnement en dev, test et prod
- **Isolation** : Chaque service dans son container
- **Gestion des dépendances** : `depends_on` et health checks
- **Réseaux** : Création automatique de réseaux isolés

---

## 🔐 Sécurité

### Mesures implémentées

1. **Hashing des mots de passe** : bcrypt avec salt (10 rounds minimum)
2. **JWT signé** : Secret partagé entre Auth Service et User Service
3. **HTTPS** : Via Traefik (production)
4. **Isolation réseau** : Routes internes non accessibles publiquement
5. **Validation des inputs** : Middleware de validation sur tous les endpoints
6. **Rate limiting** : Via Traefik (limite les abus)
7. **CORS configuré** : Limitation des origines autorisées
8. **Secrets Docker** : Variables d'environnement via `.env`

### Bonnes pratiques

- ❌ Ne jamais logger les mots de passe ou tokens
- ✅ Utiliser HTTPS en production
- ✅ Rotate les secrets régulièrement
- ✅ Implémenter un système de rate limiting
- ✅ Valider tous les inputs utilisateurs
- ✅ Utiliser des requêtes préparées (protection SQL injection)

---

## 📊 Endpoints API

### User Service (via Traefik : `/users`)

#### POST `/users/register`
Créer un nouveau compte utilisateur.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

#### GET `/users/:id`
Récupérer les informations d'un utilisateur.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

#### PUT `/users/:id`
Modifier les informations d'un utilisateur.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

---

#### GET `/users/health`
Health check du service.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "service": "user-service",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Auth Service (via Traefik : `/auth`)

#### POST `/auth/login`
Se connecter et obtenir des tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "remember_me": true
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

---

#### POST `/auth/logout`
Se déconnecter (invalider les tokens).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

#### POST `/auth/refresh`
Renouveler l'access token avec un refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

---

#### GET `/auth/health`
Health check du service.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "service": "auth-service",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Message Service (via Traefik : `/messages`)

#### GET `/messages/conversations`
Récupérer toutes les conversations de l'utilisateur connecté.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
[
  {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "participants": [1, 2],
    "isGroup": false,
    "messages": [...],
    "lastMessage": {
      "from": 2,
      "content": "Hello!",
      "createdAt": "2024-01-15T12:30:00Z"
    },
    "unreadCount": 3
  }
]
```

---

#### POST `/messages/conversations`
Créer une nouvelle conversation (privée ou groupe).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request (conversation privée):**
```json
{
  "participantIds": [2],
  "isGroup": false
}
```

**Request (groupe):**
```json
{
  "participantIds": [2, 3, 4],
  "isGroup": true,
  "groupName": "Team Project"
}
```

**Response:** `201 Created`
```json
{
  "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
  "participants": [1, 2, 3, 4],
  "isGroup": true,
  "groupName": "Team Project",
  "groupAdmin": 1,
  "messages": [],
  "createdAt": "2024-01-15T12:30:00Z"
}
```

---

#### GET `/messages/conversations/:id`
Récupérer une conversation avec tous ses messages.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
  "participants": [1, 2],
  "messages": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
      "from": 1,
      "content": "Hello!",
      "encrypted": false,
      "attachments": [],
      "reactions": [
        { "emoji": "👍", "userId": 2, "createdAt": "2024-01-15T12:31:00Z" }
      ],
      "readBy": [
        { "userId": 2, "readAt": "2024-01-15T12:32:00Z" }
      ],
      "createdAt": "2024-01-15T12:30:00Z"
    }
  ]
}
```

---

#### POST `/messages/upload`
Uploader des fichiers (images, documents).

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request:**
```
FormData:
  - files: File[] (max 5 fichiers, 10MB chacun)
```

**Response:** `200 OK`
```json
{
  "attachments": [
    {
      "filename": "upload_1234567890.png",
      "originalName": "photo.png",
      "url": "/messages/uploads/upload_1234567890.png",
      "mimeType": "image/png",
      "size": 123456
    }
  ]
}
```

---

#### GET `/messages/search?q=keyword`
Rechercher des messages.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**
- `q` : Mot-clé à rechercher

**Response:** `200 OK`
```json
{
  "results": [
    {
      "conversationId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "message": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
        "from": 2,
        "content": "Found this keyword in message",
        "createdAt": "2024-01-15T12:30:00Z"
      }
    }
  ]
}
```

---

#### WebSocket Events (Real-time)

**Connection:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost/messages', {
  auth: { token: '<access_token>' }
});
```

**Send Message:**
```javascript
socket.emit('send_message', {
  conversationId: '64a1b2c3d4e5f6g7h8i9j0k1',
  content: 'Hello from WebSocket!',
  attachments: [...]
});

socket.on('new_message', (message) => {
  console.log('New message received:', message);
});
```

**Add Reaction:**
```javascript
socket.emit('add_reaction', {
  messageId: '64a1b2c3d4e5f6g7h8i9j0k2',
  emoji: '👍'
});

socket.on('reaction_added', ({ messageId, reaction }) => {
  console.log('Reaction added:', reaction);
});
```

**Typing Indicator:**
```javascript
socket.emit('typing_start', {
  conversationId: '64a1b2c3d4e5f6g7h8i9j0k1'
});

socket.on('user_typing', ({ userId, conversationId }) => {
  console.log(`User ${userId} is typing...`);
});
```

**Edit/Delete Message:**
```javascript
socket.emit('edit_message', {
  messageId: '64a1b2c3d4e5f6g7h8i9j0k2',
  newContent: 'Updated message'
});

socket.emit('delete_message', {
  messageId: '64a1b2c3d4e5f6g7h8i9j0k2'
});
```

---

## 🚀 Démarrage Rapide

### Prérequis

- Docker (v20.10+)
- Docker Compose (v2.0+)
- Node.js (v18+) pour le développement local

### Installation

1. **Cloner le projet**
```bash
git clone <repo-url>
cd microservices-user-management
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

3. **Lancer tous les services**
```bash
docker-compose up -d
```

4. **Vérifier que tout fonctionne**
```bash
# Health checks
curl http://localhost/users/health
curl http://localhost/auth/health

# Traefik dashboard
open http://localhost:8080
```

### Variables d'environnement

Créer un fichier `.env` à la racine :

```env
# PostgreSQL
POSTGRES_USER=userservice
POSTGRES_PASSWORD=securepassword123
POSTGRES_DB=users_db

# Redis
REDIS_PASSWORD=redispassword123

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d

# Services
USER_SERVICE_PORT=3001
AUTH_SERVICE_PORT=3002

# Internal communication secret
INTERNAL_SECRET=internal-service-secret-key
```

---

## 🧪 Tests

### Test manuel avec curl

**1. Créer un utilisateur**
```bash
curl -X POST http://localhost/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

**2. Se connecter**
```bash
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "remember_me": true
  }'
```

**3. Récupérer ses informations**
```bash
curl -X GET http://localhost/users/1 \
  -H "Authorization: Bearer <access_token>"
```

**4. Modifier ses informations**
```bash
curl -X PUT http://localhost/users/1 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "last_name": "Name"
  }'
```

**5. Refresh token**
```bash
curl -X POST http://localhost/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token>"
  }'
```

**6. Se déconnecter**
```bash
curl -X POST http://localhost/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token>"
  }'
```

---

## 📁 Structure du Projet

```
fullstack-microservices/
├── docker-compose.yml              # Orchestration des services
├── .env                            # Variables d'environnement
├── .env.example                   # Template des variables
├── README.md                      # Cette documentation
├── CLAUDE.md                      # Documentation pour Claude Code
│
├── traefik/
│   └── traefik.yml               # Configuration Traefik (Gateway)
│
├── user-service/                  # Service de gestion des utilisateurs
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js                 # Point d'entrée
│   ├── config/
│   │   └── database.js           # Configuration PostgreSQL
│   ├── routes/
│   │   ├── public.js             # Routes publiques
│   │   └── internal.js           # Routes internes
│   ├── controllers/
│   │   ├── userController.js     # CRUD utilisateurs
│   │   └── keyController.js      # E2EE key management
│   ├── models/
│   │   ├── User.js               # Model utilisateur
│   │   └── UserKey.js            # Model clés E2EE
│   ├── middlewares/
│   │   ├── auth.js               # Middleware authentification
│   │   └── internal.js           # Protection routes internes
│   └── utils/
│       └── validation.js         # Validation des inputs
│
├── auth-service/                  # Service d'authentification JWT
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js                 # Point d'entrée
│   ├── config/
│   │   └── redis.js              # Configuration Redis
│   ├── routes/
│   │   ├── public.js             # Routes publiques
│   │   └── internal.js           # Routes internes
│   ├── controllers/
│   │   └── authController.js     # Login/Logout/Refresh
│   ├── services/
│   │   └── tokenService.js       # Gestion JWT
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── internal.js
│   └── utils/
│       └── jwt.js                # Helpers JWT
│
├── message-service/               # Service de messagerie temps réel
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js                 # Point d'entrée
│   ├── config/
│   │   └── database.js           # Configuration MongoDB
│   ├── routes/
│   │   └── public.js             # Routes REST
│   ├── controllers/
│   │   └── messageController.js  # CRUD conversations
│   ├── services/
│   │   ├── socketService.js      # Gestion WebSocket
│   │   ├── uploadService.js      # Upload de fichiers
│   │   └── encryptionService.js  # E2EE validation
│   ├── models/
│   │   └── Conversation.js       # Model MongoDB
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── upload.js             # Multer config
│   └── uploads/                  # Fichiers uploadés
│
├── frontend/                      # Application React + TypeScript
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts            # Configuration Vite
│   ├── index.html
│   ├── nginx.conf                # Configuration Nginx
│   ├── src/
│   │   ├── main.tsx              # Point d'entrée
│   │   ├── App.tsx
│   │   ├── index.css             # Tailwind CSS
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # Context d'authentification
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Chat.tsx          # Page principale de chat
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── Message.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   ├── ChatHeader.tsx
│   │   │   │   ├── ConversationSidebar.tsx
│   │   │   │   ├── ProfileSidebar.tsx
│   │   │   │   └── GifPicker.tsx
│   │   │   └── ui/
│   │   │       ├── FireButton.tsx
│   │   │       ├── FireAnimation.tsx
│   │   │       └── ... (shadcn/ui components)
│   │   ├── hooks/
│   │   │   ├── useConversations.ts
│   │   │   ├── useMessages.ts
│   │   │   ├── useSocketEvents.ts
│   │   │   └── useEncryption.ts
│   │   ├── services/
│   │   │   ├── api.ts            # Axios client
│   │   │   ├── socket.ts         # Socket.io client
│   │   │   └── encryption.ts     # E2EE (TweetNaCl)
│   │   ├── types/
│   │   │   └── chat.ts           # TypeScript interfaces
│   │   └── utils/
│   │       └── chatHelpers.ts
│   └── public/
│       └── logo.png
│
└── shared-lib/                    # Bibliothèque partagée entre services
    ├── package.json
    ├── index.js
    ├── middlewares/
    │   ├── logger.js             # Morgan logging
    │   └── internalAuth.js       # Protection routes internes
    ├── utils/
    │   ├── response.js           # Helpers de réponse API
    │   └── constants.js          # Constantes partagées
    ├── validators/
    │   └── email.js              # Validation emails
    └── __tests__/
        ├── email.test.js         # Tests Jest
        └── response.test.js
```

---

## 🔄 Flows d'Authentification

### Flow d'inscription

```
1. Client envoie POST /users/register
   ↓
2. Traefik route vers User Service
   ↓
3. User Service valide les données
   ↓
4. Hash du mot de passe (bcrypt)
   ↓
5. Insertion dans PostgreSQL
   ↓
6. Retour des infos utilisateur (sans password)
```

### Flow de connexion

```
1. Client envoie POST /auth/login
   ↓
2. Traefik route vers Auth Service
   ↓
3. Auth Service appelle User Service (internal)
   POST http://user-service:3001/internal/verify-credentials
   ↓
4. User Service vérifie email + compare hash password
   ↓
5. User Service retourne les infos utilisateur
   ↓
6. Auth Service génère Access Token (15min) + Refresh Token (30 jours)
   ↓
7. Auth Service stocke Refresh Token dans Redis avec TTL
   ↓
8. Retour des tokens + infos utilisateur au client
```

### Flow de requête authentifiée

```
1. Client envoie GET /users/1 avec Authorization header
   ↓
2. Traefik route vers User Service
   ↓
3. User Service middleware extrait le token
   ↓
4. User Service appelle Auth Service (internal)
   POST http://auth-service:3002/internal/validate-token
   ↓
5. Auth Service vérifie signature JWT + expiration
   ↓
6. Auth Service retourne user_id du token
   ↓
7. User Service récupère les données de l'utilisateur
   ↓
8. Retour des données au client
```

### Flow de refresh token (Remember Me)

```
1. Access Token expiré → Client envoie POST /auth/refresh
   ↓
2. Traefik route vers Auth Service
   ↓
3. Auth Service vérifie le Refresh Token dans Redis
   ↓
4. Si valide et non expiré (TTL 30 jours)
   ↓
5. Génère un nouvel Access Token (15min)
   ↓
6. Retour du nouveau Access Token au client
```

### Flow de déconnexion

```
1. Client envoie POST /auth/logout avec tokens
   ↓
2. Traefik route vers Auth Service
   ↓
3. Auth Service ajoute Access Token à la blacklist (Redis)
   ↓
4. Auth Service supprime Refresh Token de Redis
   ↓
5. Confirmation de déconnexion au client
```

---

## 🎯 Évolutions Possibles

### Court terme
- [ ] Validation des emails (envoi d'un lien de confirmation)
- [ ] Mot de passe oublié (reset password)
- [ ] Rate limiting par utilisateur
- [ ] Logs centralisés (ELK stack)

### Moyen terme
- [ ] Service de messagerie (chat entre utilisateurs)
- [ ] Notifications en temps réel (WebSocket)
- [ ] Upload d'avatar utilisateur (S3 ou MinIO)
- [ ] RBAC (Role-Based Access Control)

### Long terme
- [ ] Migration vers Kubernetes
- [ ] Service mesh (Istio)
- [ ] Monitoring avancé (Prometheus + Grafana)
- [ ] CI/CD complet (GitHub Actions + tests automatisés)

---

## 🐛 Debugging

### Voir les logs d'un service
```bash
docker-compose logs -f user-service
docker-compose logs -f auth-service
docker-compose logs -f traefik
```

### Accéder au container d'un service
```bash
docker-compose exec user-service sh
docker-compose exec auth-service sh
```

### Vérifier la base de données
```bash
docker-compose exec postgres psql -U userservice -d users_db
# SELECT * FROM users;
```

### Vérifier Redis
```bash
docker-compose exec redis redis-cli
# AUTH redispassword123
# KEYS *
# GET <key>
```

### Dashboard Traefik
```
http://localhost:8080
```

---

## 📚 Ressources

### Documentation
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Express.js Guide](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

### Tutoriels
- [Microservices Architecture](https://microservices.io/)
- [Docker Compose Best Practices](https://docs.docker.com/compose/compose-file/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🎁 Bonus Implémentés (TP)

Ce projet implémente **tous les bonus suggérés** dans le TP, ainsi que des fonctionnalités supplémentaires.

### ✅ Bonus Obligatoires

| Bonus | Statut | Implémentation |
|-------|--------|----------------|
| **Morgan (Logs)** | ✅ Fait | Logger HTTP configuré dans tous les services ([user-service/server.js:3](user-service/server.js#L3), [auth-service/server.js:3](auth-service/server.js#L3), [message-service/server.js:3](message-service/server.js#L3)) |
| **Nodemon** | ✅ Fait | Script `npm run dev` disponible dans tous les services |
| **ESLint** | ✅ Fait | Configuration ESLint pour maintenir un code propre |
| **Husky** | ✅ Fait | Pre-commit hooks configurés avec validation des commits |
| **Tests (Jest)** | ✅ Fait | 18 tests passés dans `shared-lib` (email, response utils) |
| **Code mutualisé** | ✅ Fait | Bibliothèque `@microservices/shared-lib` partagée entre services |

### 📦 Bibliothèque de Code Mutualisé (`shared-lib/`)

Une bibliothèque NPM locale contenant :

```javascript
// Middlewares réutilisables
const { middlewares } = require('@microservices/shared-lib');
app.use(middlewares.logger.getLogger('combined'));
app.use('/internal', middlewares.internalAuth.internalOnly);

// Utilitaires de réponse standardisée
const { utils } = require('@microservices/shared-lib');
utils.response.success(res, data, 'User created', 201);
utils.response.error(res, 'Not found', 404);

// Validateurs partagés
const { validators } = require('@microservices/shared-lib');
const result = validators.email.validateAndNormalize(email);
```

**Contenu** :
- `middlewares/internalAuth.js` - Protection des routes internes
- `middlewares/logger.js` - Logging standardisé avec Morgan
- `utils/response.js` - Helpers de réponse API
- `utils/constants.js` - Constantes partagées (HTTP status, types)
- `validators/email.js` - Validation et normalisation d'emails
- `__tests__/` - 18 tests unitaires avec Jest

**Avantages** :
- ✅ Cohérence entre tous les services
- ✅ Moins de duplication de code
- ✅ Facilite la maintenance
- ✅ Tests centralisés

### 🔧 Husky - Pre-commit Hooks

Configuration Husky pour garantir la qualité du code :

**Pre-commit** (`.husky/pre-commit`) :
```bash
npm run lint  # Vérifie la syntaxe avant chaque commit
```

**Commit-msg** (`.husky/commit-msg`) :
```bash
# Force le format Conventional Commits
# Format: type(scope): message
# Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
```

**Exemples de commits valides** :
```bash
✅ feat(auth): add JWT refresh token
✅ fix(user): resolve email validation bug
✅ docs(readme): update installation instructions
❌ "fixed stuff" → Rejeté par Husky
```

### 🧪 Tests Unitaires (Jest)

**Coverage actuel** : 18 tests passés dans `shared-lib`

```bash
cd shared-lib && npm test
```

**Résultat** :
```
PASS __tests__/email.test.js
  ✓ Email validation (9 tests)

PASS __tests__/response.test.js
  ✓ Response helpers (9 tests)

Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
```

**Tests couverts** :
- Validation d'emails (formats valides/invalides, edge cases)
- Normalisation d'emails (lowercase, trim)
- Helpers de réponse API (success, error, notFound, etc.)

### 🚀 Scripts NPM Disponibles

**À la racine du projet** :
```bash
npm run install:all  # Installer toutes les dépendances
npm run docker:up    # Démarrer tous les services
npm run docker:down  # Arrêter tous les services
npm run docker:logs  # Voir les logs en temps réel
npm test             # Lancer les tests de shared-lib
```

**Dans chaque service** :
```bash
npm start  # Production (node)
npm run dev  # Développement (nodemon avec hot-reload)
```

### 📊 Récapitulatif des Bonus

| Catégorie | Points Bonus |
|-----------|--------------|
| Morgan pour logs | ✅ |
| Nodemon (dev) | ✅ |
| ESLint + Husky | ✅ |
| Tests Jest | ✅ |
| Code mutualisé (shared-lib) | ✅ |
| **Frontend TypeScript** | ✅ Bonus supplémentaire |
| **3 services au lieu de 2** | ✅ Bonus supplémentaire |
| **E2EE (chiffrement end-to-end)** | ✅ Bonus supplémentaire |

---

## 👥 Auteur

**Florent** - Projet réalisé dans le cadre d'un TP d'architecture microservices

---

## 📝 Licence

Ce projet est à usage éducatif uniquement.
