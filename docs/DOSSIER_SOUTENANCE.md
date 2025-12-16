# Fire Finch - Messagerie Microservices E2EE

**Projet Final - Architecture Microservices**

---

<div style="text-align: center; margin-top: 100px;">

# FIRE FINCH
## Application de Messagerie Sécurisée
### Architecture Microservices avec End-to-End Encryption

---

**Projet Final - Module Microservices**

**Formation:** [Votre Formation]
**Année:** 2025-2026

**Étudiants:**
- [Votre Nom]
- [Nom du Binôme si applicable]

**Enseignant:** [Nom de l'enseignant]

**Date de rendu:** Jeudi 12 février 2026

</div>

---

<div style="page-break-after: always;"></div>

## Table des Matières

1. [Contexte et Fonctionnalité Principale](#1-contexte-et-fonctionnalité-principale)
   - 1.1 Présentation du Projet
   - 1.2 Problématique
   - 1.3 Feature Principale
   - 1.4 Valeur Ajoutée

2. [Architecture du Système](#2-architecture-du-système)
   - 2.1 Vue d'Ensemble
   - 2.2 Schéma d'Architecture
   - 2.3 Communication Inter-Services
   - 2.4 Répartition des Services

3. [Choix Technologiques](#3-choix-technologiques)
   - 3.1 Backend
   - 3.2 Frontend
   - 3.3 Bases de Données
   - 3.4 Infrastructure
   - 3.5 Justifications

4. [Organisation des Bases de Données](#4-organisation-des-bases-de-données)
   - 4.1 PostgreSQL (Users)
   - 4.2 Redis (Sessions)
   - 4.3 MongoDB (Messages)

5. [Documentation API](#5-documentation-api)
   - 5.1 Endpoints REST
   - 5.2 WebSocket Events
   - 5.3 Authentication
   - 5.4 Swagger Documentation

6. [Interface Utilisateur](#6-interface-utilisateur)
   - 6.1 Screenshots
   - 6.2 Design System
   - 6.3 Responsive Design

7. [End-to-End Encryption](#7-end-to-end-encryption)
   - 7.1 Implémentation
   - 7.2 Cryptographie
   - 7.3 Sécurité

8. [Mise en Production](#8-mise-en-production)
   - 8.1 Stratégie de Déploiement
   - 8.2 Infrastructure Cloud
   - 8.3 Monitoring et Logs
   - 8.4 Scaling

9. [Tests et Qualité](#9-tests-et-qualité)
   - 9.1 Tests Unitaires
   - 9.2 Tests d'Intégration
   - 9.3 Tests E2E

10. [Roadmap](#10-roadmap)
    - 10.1 Court Terme
    - 10.2 Moyen Terme
    - 10.3 Long Terme

11. [Conclusion](#11-conclusion)

12. [Annexes](#12-annexes)

---

<div style="page-break-after: always;"></div>

## 1. Contexte et Fonctionnalité Principale

### 1.1 Présentation du Projet

**Fire Finch** est une application de messagerie instantanée moderne construite sur une **architecture microservices** avec un focus particulier sur la **sécurité** et la **confidentialité** des communications.

Le projet implémente un système de messagerie complet avec:
- ✅ Messagerie temps réel (WebSocket)
- ✅ Conversations privées et groupes
- ✅ **End-to-End Encryption (E2EE)** par défaut
- ✅ Partage de fichiers et médias
- ✅ Réactions, édition et suppression de messages
- ✅ Interface moderne et intuitive

### 1.2 Problématique

**Problème identifié:**

Les applications de messagerie actuelles (WhatsApp, Messenger, Telegram) présentent plusieurs limitations:
- **Centralisation:** Dépendance à des serveurs propriétaires
- **Vie privée:** Métadonnées collectées et analysées
- **Contrôle:** Aucun contrôle sur l'infrastructure
- **Open-source:** Manque de transparence sur le code

**Notre solution:**

Fire Finch propose une **alternative open-source, self-hostable et privacy-first** qui permet:
- 🔐 **End-to-End Encryption** (TweetNaCl/Curve25519)
- 🏗️ **Architecture microservices** scalable
- 🐳 **Déploiement Docker** simplifié
- 📖 **Code open-source** auditable
- 🚀 **Self-hosting** complet

### 1.3 Feature Principale

**Messagerie Temps Réel avec End-to-End Encryption**

Notre feature principale combine:

1. **Messagerie Instantanée**
   - WebSocket (Socket.io) pour temps réel
   - Latence < 50ms
   - Support conversations privées et groupes
   - Indicateurs de lecture et de saisie

2. **End-to-End Encryption**
   - Chiffrement client-side (TweetNaCl)
   - Clés publiques/privées (Curve25519)
   - Le serveur ne peut pas lire les messages
   - Support multi-device

3. **Features Modernes**
   - Réactions emoji (6 types)
   - Édition de messages
   - Suppression (soft delete)
   - GIF search (Tenor API)
   - Upload fichiers (images, documents)
   - Réponses citées (reply-to)

### 1.4 Valeur Ajoutée

**Par rapport aux solutions existantes:**

| Feature | WhatsApp | Telegram | Fire Finch |
|---------|----------|----------|------------|
| E2EE par défaut | ✅ | ❌ | ✅ |
| Open-source | ❌ | Partiel | ✅ |
| Self-hostable | ❌ | ❌ | ✅ |
| Architecture microservices | ❌ | ❌ | ✅ |
| Multi-device | ✅ | ✅ | ✅ (en cours) |
| Réactions | ✅ | ❌ | ✅ |
| Édition messages | ✅ | ✅ | ✅ |

**Cas d'usage:**
- 🏢 **Entreprises:** Communication interne sécurisée sans dépendance cloud
- 🏥 **Santé:** Conformité HIPAA avec données sensibles
- 🎓 **Éducation:** Plateforme pédagogique contrôlée
- 👥 **Communautés:** Alternative privacy-first pour groupes
- 🛠️ **Développeurs:** Base pour projets custom (API complète)

---

<div style="page-break-after: always;"></div>

## 2. Architecture du Système

### 2.1 Vue d'Ensemble

Fire Finch utilise une **architecture microservices** avec:
- **3 services backend** (User, Auth, Message)
- **1 API Gateway** (Traefik)
- **3 bases de données** (PostgreSQL, Redis, MongoDB)
- **1 frontend** (React SPA)

**Principes architecturaux:**
- ✅ Séparation des préoccupations (SoC)
- ✅ Single Responsibility Principle
- ✅ Stateless services (scalabilité horizontale)
- ✅ Communication asynchrone (WebSocket)
- ✅ Database per service pattern
- ✅ API Gateway pattern
- ✅ Health checks sur tous services

### 2.2 Schéma d'Architecture

> **📷 TODO: Insérer schéma d'architecture visuel ici**
>
> Le schéma doit montrer:
> - Client (navigateur)
> - Traefik Gateway (port 80)
> - 3 microservices (user:3001, auth:3002, message:3003)
> - 3 bases de données (PostgreSQL, Redis, MongoDB)
> - Flèches de communication (HTTP REST + WebSocket)
> - Communication interne (X-Internal-Secret)
>
> **Outils suggérés:** draw.io, Excalidraw, Miro, Lucidchart

**Architecture textuelle:**

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                    React SPA + Socket.io Client                  │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP/WebSocket
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    TRAEFIK API GATEWAY :80                       │
│              Reverse Proxy + Load Balancer                       │
│                      Dashboard :8080                             │
└──────┬─────────────────┬─────────────────┬───────────────────────┘
       │                 │                 │
       │ /users/*        │ /auth/*         │ /messages/*
       ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐
│   USER      │   │   AUTH      │   │    MESSAGE          │
│  SERVICE    │   │  SERVICE    │   │    SERVICE          │
│  :3001      │   │  :3002      │   │    :3003            │
│             │   │             │   │                     │
│ • Register  │   │ • Login     │   │ • Conversations     │
│ • Profile   │   │ • Logout    │   │ • Messages          │
│ • Status    │   │ • Refresh   │   │ • WebSocket/Socket.io│
│ • E2EE Keys │   │ • Validate  │   │ • File Upload       │
│             │   │             │   │ • Reactions         │
└──────┬──────┘   └──────┬──────┘   └──────┬──────────────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ PostgreSQL  │   │   Redis     │   │  MongoDB    │
│  users_db   │   │  sessions   │   │ messages_db │
│             │   │             │   │             │
│ • users     │   │ • tokens    │   │ • conversations│
│ • user_keys │   │ • blacklist │   │ • messages  │
└─────────────┘   └─────────────┘   └─────────────┘

────────────────────────────────────────────────────────────
COMMUNICATION INTERNE (Service-to-Service)
────────────────────────────────────────────────────────────

Auth Service → User Service
   POST /internal/verify-credentials (during login)
   Header: X-Internal-Secret

User/Message Service → Auth Service
   POST /internal/validate-token (JWT validation)
   Header: X-Internal-Secret

Message Service → User Service
   GET /users/:userId/keys (fetch E2EE public keys)
   Header: Authorization: Bearer <token>
```

### 2.3 Communication Inter-Services

**1. Communication Publique (Client → Services)**

```
Client → Traefik → Service
```

- **Protocole:** HTTP REST + WebSocket
- **Authentification:** JWT Bearer Token
- **Routes:**
  - `/users/*` → User Service
  - `/auth/*` → Auth Service
  - `/messages/*` → Message Service
  - `/*` → Frontend (React SPA)

**2. Communication Interne (Service → Service)**

```
Service A → Service B (via Docker network)
```

- **Protocole:** HTTP REST
- **Authentification:** `X-Internal-Secret` header
- **Endpoints internes:**
  - `POST /internal/verify-credentials` (Auth → User)
  - `POST /internal/validate-token` (Services → Auth)

**Sécurité:**
- ✅ Réseau Docker interne (`internal_network`)
- ✅ Secret partagé (`INTERNAL_SECRET`)
- ✅ Endpoints internes non exposés via Traefik
- ✅ Validation stricte des headers

**3. Communication Temps Réel**

```
Client ↔ Message Service (WebSocket)
```

- **Protocole:** WebSocket (Socket.io)
- **Route:** `/messages/socket.io`
- **Authentification:** JWT dans handshake
- **Events:**
  - Client → Server: `send_message`, `add_reaction`, `typing_start`, etc.
  - Server → Client: `new_message`, `user_online`, `messages_read`, etc.

### 2.4 Répartition des Services

#### **User Service** (Node.js/Express + PostgreSQL)

**Responsabilités:**
- ✅ Gestion des utilisateurs (CRUD)
- ✅ Profils (avatar, bio, status)
- ✅ Gestion des clés E2EE (upload, fetch)
- ✅ Vérification des credentials (internal)
- ✅ Statuts en ligne (online/offline/busy/away)

**Technologies:**
- Express.js (API REST)
- PostgreSQL (relationnel pour users)
- Bcrypt (hashing passwords)
- pg (PostgreSQL client)

**Endpoints clés:**
- `POST /users/register` - Inscription
- `GET /users` - Liste utilisateurs
- `POST /users/keys` - Upload clé publique E2EE
- `GET /users/:userId/keys` - Récupérer clés publiques
- `POST /internal/verify-credentials` - Vérification login (interne)

**Base de données:**
- Table `users`: id, email, password_hash, first_name, last_name, profile_photo_url, bio, status, created_at
- Table `user_keys`: id, user_id, device_id, public_key, key_fingerprint, is_active

---

#### **Auth Service** (Node.js/Express + Redis)

**Responsabilités:**
- ✅ Authentification (login/logout)
- ✅ Génération JWT (access + refresh tokens)
- ✅ Validation de tokens
- ✅ Refresh de tokens
- ✅ Blacklist de tokens (logout)
- ✅ Gestion de sessions

**Technologies:**
- Express.js (API REST)
- Redis (cache pour sessions et blacklist)
- jsonwebtoken (JWT)
- redis client

**Endpoints clés:**
- `POST /auth/login` - Connexion (génère tokens)
- `POST /auth/logout` - Déconnexion (blacklist token)
- `POST /auth/refresh` - Renouvellement access token
- `POST /internal/validate-token` - Validation JWT (interne)

**Stratégie de tokens:**
- **Access Token:** 15 minutes (courte durée pour sécurité)
- **Refresh Token:** 30 jours avec `remember_me`, sinon 1 jour
- **Storage:**
  - Redis: `refresh_token:<jwt>` → user data (TTL)
  - Redis: `blacklist:<jwt>` → "1" (TTL = remaining expiration)

---

#### **Message Service** (Node.js/Express + MongoDB + Socket.io)

**Responsabilités:**
- ✅ Gestion des conversations (privées + groupes)
- ✅ Envoi/réception de messages (WebSocket)
- ✅ Upload de fichiers (images, documents)
- ✅ Réactions emoji
- ✅ Édition/suppression de messages
- ✅ Read receipts et indicateurs de saisie
- ✅ Encryption/decryption E2EE

**Technologies:**
- Express.js (API REST)
- Socket.io (WebSocket temps réel)
- MongoDB (document database pour messages)
- Multer (upload fichiers)
- Mongoose (ODM)

**Endpoints REST:**
- `GET /messages/conversations` - Liste conversations
- `POST /messages/conversations` - Créer conversation
- `GET /messages/conversations/:id/messages` - Récupérer messages
- `POST /messages/upload` - Upload fichiers

**WebSocket Events (Socket.io):**
- **Client → Server:**
  - `send_message` - Envoyer message
  - `add_reaction` - Ajouter réaction
  - `edit_message` - Éditer message
  - `delete_message` - Supprimer message
  - `typing_start/stop` - Indicateur de saisie
  - `mark_read` - Marquer comme lu
- **Server → Client:**
  - `new_message` - Nouveau message reçu
  - `reaction_added` - Réaction ajoutée
  - `message_edited` - Message édité
  - `user_online/offline` - Présence utilisateur

**Base de données (MongoDB):**
- Collection `conversations`:
  - participants: [userId]
  - isGroup: Boolean
  - groupName, groupAdmin
  - messages: [embedded messages]
  - lastMessage: {content, from, createdAt}

---

#### **API Gateway** (Traefik v3)

**Responsabilités:**
- ✅ Reverse proxy (routing des requêtes)
- ✅ Load balancing (si multi-instances)
- ✅ Health checks automatiques
- ✅ TLS/HTTPS termination
- ✅ Dashboard de monitoring
- ✅ Logs centralisés

**Pourquoi Traefik et pas http-proxy-middleware?**
Voir [docs/JUSTIFICATION_TRAEFIK.md](./JUSTIFICATION_TRAEFIK.md) pour justification complète.

**Résumé:**
- ✅ Production-ready (utilisé en entreprise)
- ✅ Support WebSocket natif (critique pour Socket.io)
- ✅ Auto-découverte de services (Docker labels)
- ✅ Dashboard monitoring (http://localhost:8080)
- ✅ Performance (2-3x plus rapide que Node.js proxy)

**Configuration:**
- `infrastructure/traefik/traefik.yml` - Configuration principale
- `infrastructure/traefik/dynamic.yml` - Routes dynamiques
- Docker labels dans `docker-compose.yml` pour routing

---

<div style="page-break-after: always;"></div>

## 3. Choix Technologiques

### 3.1 Backend

#### **Node.js + Express.js**

**Pourquoi Node.js?**
- ✅ **JavaScript full-stack** (même langage frontend/backend)
- ✅ **Async/Non-blocking I/O** (parfait pour temps réel)
- ✅ **Écosystème npm riche** (500k+ packages)
- ✅ **Performance** (V8 engine optimisé)
- ✅ **WebSocket natif** (Socket.io)
- ✅ **Microservices-friendly** (léger, rapide à démarrer)

**Alternatives considérées:**
- ❌ **Java/Spring Boot:** Trop verbeux, JVM overhead, startup lent
- ❌ **Python/Django:** GIL limitation, moins performant pour temps réel
- ❌ **Go:** Courbe d'apprentissage, pas de full-stack JS
- ❌ **PHP:** Moins adapté pour WebSocket et temps réel

**Pourquoi Express.js?**
- ✅ **Minimaliste** (KISS principle)
- ✅ **Flexible** (middleware system)
- ✅ **Mature** (13+ ans, production-proven)
- ✅ **Documentation** excellente
- ✅ **Communauté** massive

#### **Socket.io**

**Pourquoi Socket.io pour WebSocket?**
- ✅ **Fallback automatique** (WebSocket → polling si nécessaire)
- ✅ **Rooms** (groupes de connexions)
- ✅ **Broadcast** simplifié
- ✅ **Reconnexion automatique**
- ✅ **Binary support** (fichiers)
- ✅ **Namespace** (organisation)

**Alternatives:**
- ❌ **WebSocket natif:** Pas de fallback, reconnexion manuelle
- ❌ **ws library:** Trop bas niveau, pas de rooms

### 3.2 Frontend

#### **React 19 + TypeScript**

**Pourquoi React?**
- ✅ **Composants réutilisables** (DRY principle)
- ✅ **Virtual DOM** (performance)
- ✅ **Écosystème** (React Router, hooks, etc.)
- ✅ **Communauté** (3+ millions de devs)
- ✅ **Support entreprise** (Meta)
- ✅ **DevTools** excellents

**Pourquoi TypeScript?**
- ✅ **Type safety** (moins de bugs)
- ✅ **Autocomplete** (productivité)
- ✅ **Refactoring** sûr
- ✅ **Documentation** intégrée (types = docs)
- ✅ **Standard industrie**

**Alternatives:**
- ❌ **Vue.js:** Moins adopté en entreprise
- ❌ **Angular:** Trop verbeux, courbe d'apprentissage
- ❌ **Svelte:** Écosystème jeune, moins d'emplois

#### **Vite**

**Pourquoi Vite pour build?**
- ✅ **HMR ultra rapide** (<50ms)
- ✅ **Build optimisé** (Rollup)
- ✅ **TypeScript natif**
- ✅ **Modern** (ESM)

**Alternative:**
- ❌ **Create React App:** Déprécié, lent, abandonné

#### **Tailwind CSS**

**Pourquoi Tailwind?**
- ✅ **Utility-first** (rapidité)
- ✅ **Pas de CSS custom** (maintenabilité)
- ✅ **Responsive** simplifié
- ✅ **Purge automatique** (petite taille)
- ✅ **Design system** cohérent

**Alternative:**
- ❌ **CSS Modules:** Verbose, répétitif
- ❌ **Styled Components:** Runtime overhead

### 3.3 Bases de Données

**Stratégie: Database per Service Pattern**

Chaque service a sa propre base de données, adaptée à ses besoins.

#### **PostgreSQL (User Service)**

**Pourquoi PostgreSQL?**
- ✅ **Relationnel** (users ↔ keys)
- ✅ **ACID** (garanties transactionnelles)
- ✅ **Maturité** (30+ ans)
- ✅ **JSON support** (flexibilité)
- ✅ **Performance** excellente
- ✅ **Open-source**

**Cas d'usage:**
- Données structurées (users, keys)
- Relations (user has many keys)
- Intégrité référentielle

**Alternative:**
- ❌ **MySQL:** Moins de features (pas de JSONB performant)
- ❌ **MongoDB:** Pas optimal pour relations

#### **Redis (Auth Service)**

**Pourquoi Redis?**
- ✅ **In-memory** (ultra rapide: <1ms)
- ✅ **TTL natif** (expiration automatique)
- ✅ **Key-value** simple
- ✅ **Atomic operations**
- ✅ **Pub/Sub** (bonus pour futur)

**Cas d'usage:**
- Sessions éphémères (refresh tokens)
- Blacklist tokens (jusqu'à expiration)
- Cache (futur: user data, conversations)

**Alternative:**
- ❌ **Memcached:** Moins de features (pas de TTL par clé)
- ❌ **PostgreSQL:** Overkill, pas optimisé pour cache

#### **MongoDB (Message Service)**

**Pourquoi MongoDB?**
- ✅ **Document-oriented** (messages = documents)
- ✅ **Flexibilité** (schema-less)
- ✅ **Embedded documents** (messages dans conversations)
- ✅ **Scalabilité horizontale** (sharding)
- ✅ **JSON natif** (pas de mapping)
- ✅ **Agrégation** puissante

**Cas d'usage:**
- Messages (structure flexible: text, files, reactions, etc.)
- Conversations (nested messages)
- Pas de relations complexes

**Alternative:**
- ❌ **PostgreSQL:** JSON moins performant, pas de sharding natif
- ❌ **Cassandra:** Overkill, complexe pour notre échelle

### 3.4 Infrastructure

#### **Docker + Docker Compose**

**Pourquoi Docker?**
- ✅ **Isolation** (un service = un container)
- ✅ **Portabilité** (fonctionne partout)
- ✅ **Reproductibilité** (même env dev/prod)
- ✅ **Scaling** simplifié
- ✅ **Standard industrie**

**Pourquoi Docker Compose?**
- ✅ **Multi-container** (8 services)
- ✅ **Configuration déclarative** (YAML)
- ✅ **Networking** automatique
- ✅ **Health checks** intégrés
- ✅ **One command start** (`docker-compose up`)

#### **Traefik v3**

**Pourquoi Traefik?**
Voir [docs/JUSTIFICATION_TRAEFIK.md](./JUSTIFICATION_TRAEFIK.md)

**Résumé:**
- ✅ Production-ready API Gateway
- ✅ Auto-découverte services (Docker labels)
- ✅ Support WebSocket natif
- ✅ Dashboard monitoring
- ✅ Performance (Go, 2-3x plus rapide que Node.js)
- ✅ Standard industrie

### 3.5 Sécurité

#### **TweetNaCl (E2EE)**

**Pourquoi TweetNaCl?**
- ✅ **Curve25519** (elliptic curve moderne)
- ✅ **Audit** (Daniel J. Bernstein - expert crypto)
- ✅ **Simple API** (box/open)
- ✅ **Petit** (100KB)
- ✅ **Performance** (optimisé)
- ✅ **Proven** (utilisé par Signal, WhatsApp)

**Alternative:**
- ❌ **OpenPGP:** Complexe, legacy
- ❌ **RSA:** Plus lent, clés plus grandes
- ❌ **AES seul:** Pas de public-key crypto

#### **JWT (Authentication)**

**Pourquoi JWT?**
- ✅ **Stateless** (scalable)
- ✅ **Self-contained** (pas de DB lookup)
- ✅ **Standard** (RFC 7519)
- ✅ **Multi-service** (token partagé)

**Stratégie:**
- Access token: 15min (sécurité)
- Refresh token: 30 jours (UX)
- Blacklist dans Redis (logout)

---

<div style="page-break-after: always;"></div>

## 4. Organisation des Bases de Données

### 4.1 PostgreSQL (User Service)

**Version:** PostgreSQL 16

#### **Table: users**

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  profile_photo_url TEXT,
  bio TEXT,
  status VARCHAR(20) DEFAULT 'offline',
  status_message TEXT,
  last_seen_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

**Champs:**
- `id`: Identifiant unique (auto-increment)
- `email`: Email unique (login)
- `password_hash`: Bcrypt hash (12 rounds)
- `first_name`, `last_name`: Nom complet
- `profile_photo_url`: URL avatar (S3/CDN futur)
- `bio`: Biographie utilisateur
- `status`: online/offline/busy/away
- `status_message`: Message status personnalisé
- `last_seen_at`: Dernière activité

#### **Table: user_keys (E2EE)**

```sql
CREATE TABLE user_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  public_key VARCHAR(255) NOT NULL,
  key_fingerprint VARCHAR(64),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX idx_user_keys_user_id ON user_keys(user_id);
CREATE INDEX idx_user_keys_active ON user_keys(is_active);
```

**Champs:**
- `id`: Identifiant unique
- `user_id`: Référence vers users (foreign key)
- `device_id`: Identifiant device unique (UUID généré client)
- `public_key`: Clé publique Curve25519 (base64, 44 chars)
- `key_fingerprint`: Empreinte pour vérification (hex, 64 chars)
- `is_active`: Device actif (pour révocation)

**Relation:**
- Un user peut avoir **plusieurs clés** (multi-device)
- Cascade delete: si user supprimé → clés supprimées

> **📷 TODO: Insérer schéma relationnel ici (users ↔ user_keys)**

### 4.2 Redis (Auth Service)

**Version:** Redis 7

**Structure key-value:**

#### **Refresh Tokens**

```
Key:   refresh_token:<jwt_token>
Value: JSON { userId, email, rememberMe }
TTL:   30 days (remember_me) ou 1 day
```

**Exemple:**
```
redis> GET refresh_token:eyJhbGc...xyz123
{"userId": 42, "email": "user@example.com", "rememberMe": true}

redis> TTL refresh_token:eyJhbGc...xyz123
2592000  (30 days en secondes)
```

#### **Blacklist Tokens**

```
Key:   blacklist:<jwt_token>
Value: "1"
TTL:   remaining expiration time
```

**Exemple:**
```
redis> GET blacklist:eyJhbGc...abc456
"1"

redis> TTL blacklist:eyJhbGc...abc456
300  (5 minutes restantes)
```

**Logique:**
- Lors du logout: ajout token à blacklist avec TTL = temps restant avant expiration
- Lors de validation: vérification si token dans blacklist
- Après expiration naturelle: suppression automatique (TTL)

#### **Future: Cache**

```
Key:   user_cache:<userId>
Value: JSON { id, email, first_name, last_name, photo_url }
TTL:   5 minutes
```

> **📷 TODO: Insérer schéma Redis (structure des clés)**

### 4.3 MongoDB (Message Service)

**Version:** MongoDB 7

**Database:** `messages_db`

#### **Collection: conversations**

```javascript
{
  _id: ObjectId("..."),
  participants: [1, 2, 3],  // Array of user IDs
  isGroup: false,
  groupName: "Team Project",  // null si private
  groupAdmin: 1,              // null si private
  messages: [
    {
      _id: ObjectId("..."),
      from: 1,  // userId
      content: "Hello!",

      // E2EE fields
      encrypted: true,
      encryptedPayloads: {
        "2:device1": "base64EncryptedForUser2Device1",
        "3:device1": "base64EncryptedForUser3Device1"
      },
      nonce: "base64Nonce",
      senderDeviceId: "device1",

      // Attachments
      attachments: [
        {
          filename: "abc123.jpg",
          originalName: "photo.jpg",
          url: "/messages/uploads/abc123.jpg",
          mimeType: "image/jpeg",
          size: 245678,
          encrypted: false
        }
      ],

      // Read receipts
      readBy: [
        { userId: 2, readAt: ISODate("2025-01-15T10:30:00Z") }
      ],

      // Reactions
      reactions: [
        { emoji: "👍", userId: 2, createdAt: ISODate("...") },
        { emoji: "❤️", userId: 3, createdAt: ISODate("...") }
      ],

      // Reply
      replyTo: ObjectId("..."),  // ID message parent

      // Edit/Delete
      editedAt: ISODate("2025-01-15T10:35:00Z"),
      deletedAt: null,

      createdAt: ISODate("2025-01-15T10:25:00Z")
    }
  ],
  lastMessage: {
    content: "Hello!",
    from: 1,
    createdAt: ISODate("2025-01-15T10:25:00Z")
  },
  createdAt: ISODate("2025-01-10T08:00:00Z"),
  updatedAt: ISODate("2025-01-15T10:25:00Z")
}
```

**Index:**
```javascript
db.conversations.createIndex({ participants: 1 })
db.conversations.createIndex({ "lastMessage.createdAt": -1 })
db.conversations.createIndex({ "messages.from": 1 })
db.conversations.createIndex({ "messages.createdAt": -1 })
```

**Pourquoi embedded documents?**
- ✅ Messages toujours récupérés avec conversation (une seule query)
- ✅ Pas de JOIN nécessaire
- ✅ Atomic updates (message + lastMessage)
- ✅ Performance (locality of data)

**Limitations:**
- ⚠️ Document size max: 16MB (acceptable pour conversations)
- ⚠️ Si conversation > 10,000 messages: pagination nécessaire

**Solution future:**
- Archiver vieux messages dans collection séparée
- Garder seulement derniers N messages dans conversation

> **📷 TODO: Insérer schéma MongoDB (structure documents)**

---

<div style="page-break-after: always;"></div>

## 5. Documentation API

### 5.1 Endpoints REST

**Base URL:** `http://localhost` (Traefik gateway)

#### **User Service** (`/users/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/register` | ❌ | Inscription utilisateur |
| GET | `/users` | ✅ | Liste tous les utilisateurs |
| GET | `/users/:id` | ✅ | Récupérer utilisateur par ID |
| PUT | `/users/:id` | ✅ | Modifier nom utilisateur |
| GET | `/users/:id/profile` | ✅ | Récupérer profil (photo, bio, status) |
| PUT | `/users/:id/profile` | ✅ | Modifier profil |
| PUT | `/users/:id/status` | ✅ | Modifier status (online/busy/away) |
| POST | `/users/keys` | ✅ | Upload clé publique E2EE |
| GET | `/users/keys/me` | ✅ | Récupérer ses propres clés |
| GET | `/users/:userId/keys` | ✅ | Récupérer clés publiques d'un user |
| POST | `/users/keys/bulk` | ✅ | Récupérer clés de plusieurs users |
| DELETE | `/users/keys/:device_id` | ✅ | Désactiver une clé device |

**Exemple: Registration**

```bash
POST /users/register
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "SecurePass123",
  "first_name": "Alice",
  "last_name": "Smith"
}

# Response 201
{
  "success": true,
  "data": {
    "id": 1,
    "email": "alice@example.com",
    "first_name": "Alice",
    "last_name": "Alice Smith"
  }
}
```

---

#### **Auth Service** (`/auth/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | ❌ | Connexion (génère tokens) |
| POST | `/auth/logout` | ✅ | Déconnexion (blacklist token) |
| POST | `/auth/refresh` | ❌ | Renouveler access token |

**Exemple: Login**

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "SecurePass123",
  "remember_me": true
}

# Response 200
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "alice@example.com",
      "first_name": "Alice",
      "last_name": "Smith"
    }
  }
}
```

---

#### **Message Service** (`/messages/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/messages/conversations` | ✅ | Liste conversations de l'user |
| POST | `/messages/conversations` | ✅ | Créer conversation (privée/groupe) |
| GET | `/messages/conversations/:id` | ✅ | Récupérer conversation + messages |
| DELETE | `/messages/conversations/:id` | ✅ | Supprimer conversation (admin groupe) |
| GET | `/messages/conversations/:id/messages` | ✅ | Récupérer messages (pagination) |
| POST | `/messages/conversations/:id/messages` | ✅ | Envoyer message (REST fallback) |
| PUT | `/messages/conversations/:id/read` | ✅ | Marquer messages comme lus |
| POST | `/messages/conversations/:id/participants` | ✅ | Ajouter membre(s) au groupe |
| DELETE | `/messages/conversations/:id/participants/:userId` | ✅ | Retirer membre du groupe |
| POST | `/messages/upload` | ✅ | Upload fichiers (max 10MB, 5 files) |
| GET | `/messages/search?q=` | ✅ | Rechercher messages |
| GET | `/messages/uploads/:filename` | ❌ | Récupérer fichier uploadé |

**Exemple: Créer Conversation**

```bash
POST /messages/conversations
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "participants": [2, 3],
  "isGroup": true,
  "groupName": "Team Project"
}

# Response 201
{
  "success": true,
  "data": {
    "_id": "65a1234567890abcdef12345",
    "participants": [1, 2, 3],
    "isGroup": true,
    "groupName": "Team Project",
    "groupAdmin": 1,
    "messages": [],
    "lastMessage": null,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### 5.2 WebSocket Events (Socket.io)

**URL:** `ws://localhost/messages/socket.io`

**Authentication:** JWT dans handshake query
```javascript
const socket = io('http://localhost/messages', {
  path: '/socket.io',
  query: { token: access_token }
});
```

#### **Client → Server Events**

| Event | Payload | Description |
|-------|---------|-------------|
| `send_message` | `{ conversationId, content, attachments?, replyTo?, encrypted?, encryptedPayloads?, nonce? }` | Envoyer message |
| `add_reaction` | `{ conversationId, messageId, emoji }` | Ajouter réaction |
| `remove_reaction` | `{ conversationId, messageId, emoji }` | Retirer réaction |
| `edit_message` | `{ conversationId, messageId, newContent }` | Éditer message |
| `delete_message` | `{ conversationId, messageId }` | Supprimer message (soft) |
| `typing_start` | `{ conversationId }` | Commencer à taper |
| `typing_stop` | `{ conversationId }` | Arrêter de taper |
| `mark_read` | `{ conversationId, messageIds }` | Marquer comme lu |
| `join_conversation` | `{ conversationId }` | Rejoindre room Socket.io |
| `leave_conversation` | `{ conversationId }` | Quitter room |

#### **Server → Client Events**

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ conversationId, message }` | Nouveau message reçu |
| `reaction_added` | `{ conversationId, messageId, reaction }` | Réaction ajoutée |
| `reaction_removed` | `{ conversationId, messageId, emoji, userId }` | Réaction retirée |
| `message_edited` | `{ conversationId, messageId, newContent, editedAt }` | Message édité |
| `message_deleted` | `{ conversationId, messageId, deletedAt }` | Message supprimé |
| `user_typing` | `{ conversationId, userId, isTyping }` | User en train de taper |
| `messages_read` | `{ conversationId, userId, messageIds, readAt }` | Messages lus |
| `user_online` | `{ userId }` | User en ligne |
| `user_offline` | `{ userId }` | User hors ligne |
| `error` | `{ message }` | Erreur WebSocket |

**Exemple: Send Message**

```javascript
// Client
socket.emit('send_message', {
  conversationId: '65a1234567890abcdef12345',
  content: 'Hello team!',
  attachments: [],
  encrypted: false
});

// Server → All participants
socket.on('new_message', (data) => {
  console.log(data);
  // {
  //   conversationId: '65a1234567890abcdef12345',
  //   message: {
  //     _id: '65a9876543210fedcba09876',
  //     from: 1,
  //     content: 'Hello team!',
  //     createdAt: '2025-01-15T10:30:00.000Z'
  //   }
  // }
});
```

### 5.3 Authentication

**Format:** JWT Bearer Token

```bash
GET /messages/conversations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Payload:**
```json
{
  "userId": 1,
  "email": "alice@example.com",
  "iat": 1705315200,
  "exp": 1705316100
}
```

**Error Responses:**

```json
// 401 Unauthorized
{
  "success": false,
  "message": "No token provided"
}

// 401 Unauthorized
{
  "success": false,
  "message": "Invalid or expired token"
}

// 403 Forbidden
{
  "success": false,
  "message": "You don't have permission to access this resource"
}
```

### 5.4 Swagger Documentation

**Documentation complète:** [docs/swagger.yaml](../docs/swagger.yaml)

**Accès local:** `http://localhost/swagger` (à configurer)

**OpenAPI 3.0.3 Specification**

Le fichier Swagger contient:
- ✅ Tous les endpoints (User, Auth, Message)
- ✅ Schémas de données (User, Conversation, Message, etc.)
- ✅ Exemples de requêtes/réponses
- ✅ Codes d'erreur
- ✅ Authentication schemes
- ✅ WebSocket events documentation

**Exemple de schéma:**
```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          example: 1
        email:
          type: string
          format: email
          example: alice@example.com
        first_name:
          type: string
          example: Alice
        last_name:
          type: string
          example: Smith
```

> **📷 TODO: Insérer screenshot Swagger UI**

---

<div style="page-break-after: always;"></div>

## 6. Interface Utilisateur

### 6.1 Screenshots

> **📷 TODO: Insérer screenshots ici**
>
> Screenshots à prendre:
> 1. **Page de Login**
>    - Formulaire login avec email/password
>    - Bouton "Remember me"
>    - Lien vers inscription
>
> 2. **Page de Chat (Conversation Active)**
>    - Sidebar gauche avec liste conversations
>    - Chat central avec messages
>    - Sidebar droite profil (optionnelle)
>    - MessageInput en bas
>
> 3. **Liste des Conversations (Sidebar)**
>    - Search bar en haut
>    - Liste conversations avec:
>      - Avatar utilisateur/groupe
>      - Nom + dernier message
>      - Timestamp
>      - Badge unread count
>      - Online status indicator
>
> 4. **Profil Utilisateur (ProfileSidebar)**
>    - Onglets: Infos / Médias / Fichiers
>    - Avatar large + nom + status
>    - Statistiques conversation
>    - (Si groupe) Liste membres + boutons admin
>
> 5. **Création de Groupe (CreateGroupModal)**
>    - Search bar pour utilisateurs
>    - Liste users avec checkboxes
>    - Compteur sélectionnés
>    - Input nom du groupe (si 2+ membres)
>    - Bouton "Créer"
>
> 6. **Upload de Fichiers (Preview)**
>    - Liste fichiers sélectionnés
>    - Nom + taille + icône type
>    - Bouton remove par fichier
>    - Bouton send
>
> 7. **Réactions Emoji**
>    - Message avec réactions sous le texte
>    - Format: 👍 3  ❤️ 2
>    - Highlight si user a réagi
>
> 8. **Édition de Message**
>    - Message en mode édition (input inline)
>    - Boutons Save / Cancel
>
> 9. **GIF Picker**
>    - Modal avec search bar
>    - Grid de GIFs (Tenor)
>    - Trending par défaut
>
> 10. **Encryption Badge**
>     - Lock icon dans header
>     - Tooltip "Messages chiffrés de bout en bout"

**Note pour captures:**
- Utiliser Chrome DevTools (F12)
- Responsive: Desktop + Tablet + Mobile
- Thème: Light (par défaut)
- Données: Utiliser seeders pour contenu réaliste

### 6.2 Design System

#### **Palette de Couleurs**

**Couleur Primaire: Fire Finch Red**
```
#E4524D (primary-600)
```

**Couleurs Secondaires:**
```css
/* Grays */
--gray-50:  #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-600: #4B5563
--gray-900: #111827

/* Primary Shades */
--primary-50:  #FEF2F2
--primary-100: #FEE2E2
--primary-600: #E4524D  /* Main red */
--primary-700: #DC2626
```

#### **Typographie**

```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
             'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

/* Tailles */
--text-xs:   0.75rem  /* 12px */
--text-sm:   0.875rem /* 14px */
--text-base: 1rem     /* 16px */
--text-lg:   1.125rem /* 18px */
--text-xl:   1.25rem  /* 20px */
--text-2xl:  1.5rem   /* 24px */
```

#### **Composants**

**Message Bubbles:**
- **Sent (own messages):**
  - Background: `#E4524D` (primary-600)
  - Text: `white`
  - Border-radius: `rounded-2xl` (16px)
  - Corner: `rounded-br-sm` (2px bottom-right)
  - Max-width: `450px`
  - Alignment: `flex-end` (right)

- **Received:**
  - Background: `#E5E7EB` (gray-200)
  - Text: `#111827` (gray-900)
  - Border-radius: `rounded-2xl` (16px)
  - Corner: `rounded-bl-sm` (2px bottom-left)
  - Max-width: `450px`
  - Alignment: `flex-start` (left)

**Buttons:**
```css
/* Primary Button */
.btn-primary {
  background: #E4524D;
  color: white;
  border-radius: 9999px; /* rounded-full */
  padding: 0.5rem 1.5rem;
  font-weight: 600;
}
.btn-primary:hover {
  background: #DC2626;
}

/* Icon Button */
.btn-icon {
  color: #E4524D;
  border-radius: 9999px;
  padding: 0.5rem;
  transition: background 200ms;
}
.btn-icon:hover {
  background: #F3F4F6; /* gray-100 */
}
```

**Inputs:**
```css
.input {
  background: #F3F4F6; /* gray-100 */
  border-radius: 9999px; /* rounded-full */
  padding: 0.75rem 1rem;
  border: none;
  font-size: 0.875rem;
}
.input:focus {
  outline: 2px solid #E4524D;
  outline-offset: 2px;
}
```

#### **Spacing**

**Messages:**
- Entre messages du même sender: `1px` (gap-[1px])
- Entre groupes de messages: `16px` (gap-4)

**Layout:**
- Sidebar width: `360px` (ConversationSidebar)
- ProfileSidebar width: `320px`
- MessageInput height: `auto` (min-height: 48px)
- ChatHeader height: `64px`

### 6.3 Responsive Design

**Breakpoints Tailwind:**
```
sm:  640px   (tablet portrait)
md:  768px   (tablet landscape)
lg:  1024px  (desktop small)
xl:  1280px  (desktop large)
```

**Comportement:**

**Mobile (< 768px):**
- Sidebar left hidden (toggle button)
- Chat plein écran
- ProfileSidebar hidden (toggle button)
- Message bubbles max-width: 85vw

**Tablet (768px - 1024px):**
- Sidebar left visible
- Chat central
- ProfileSidebar hidden par défaut

**Desktop (> 1024px):**
- Sidebar left visible (360px)
- Chat central
- ProfileSidebar toggle (320px)

**Test responsive:**
```bash
# Chrome DevTools
- iPhone SE (375x667)
- iPad Air (820x1180)
- Desktop (1920x1080)
```

---

<div style="page-break-after: always;"></div>

## 7. End-to-End Encryption

### 7.1 Implémentation

Fire Finch implémente un **chiffrement de bout en bout (E2EE)** complet où:
- ✅ Messages chiffrés **client-side** (navigateur)
- ✅ Serveur **ne peut pas** déchiffrer les messages
- ✅ Seuls expéditeur et destinataire peuvent lire
- ✅ Clés privées **jamais envoyées** au serveur

**Documentation complète:** [docs/E2EE_IMPLEMENTATION_SUMMARY.md](../docs/E2EE_IMPLEMENTATION_SUMMARY.md)

### 7.2 Cryptographie

**Bibliothèque:** TweetNaCl (Networking and Cryptography library)

**Algorithmes:**
- **Curve25519:** Elliptic curve Diffie-Hellman (ECDH)
- **NaCl box:** Public-key authenticated encryption
- **XSalsa20:** Stream cipher (encryption)
- **Poly1305:** Message authentication code (MAC)

**Tailles de clés:**
- Public key: 32 bytes (base64: 44 chars)
- Private key: 32 bytes (jamais exportée)
- Nonce: 24 bytes (base64: 32 chars)

### 7.3 Flow E2EE

#### **1. Génération de Clés (Login)**

```javascript
// Frontend: services/encryption.ts
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';

// Génération paire de clés
const keyPair = nacl.box.keyPair();
const publicKey = encodeBase64(keyPair.publicKey);
const privateKey = encodeBase64(keyPair.secretKey);

// Stockage
localStorage.setItem('encryptionPrivateKey', privateKey);
localStorage.setItem('encryptionPublicKey', publicKey);

// Upload clé publique au serveur
await api.post('/users/keys', {
  device_id: generateDeviceId(),
  public_key: publicKey,
  key_fingerprint: generateFingerprint(publicKey)
});
```

**Résultat:**
- Clé privée: stockée **localement uniquement** (localStorage)
- Clé publique: uploadée au User Service (PostgreSQL)

#### **2. Envoi Message Chiffré**

```javascript
// Frontend
async function sendEncryptedMessage(content, recipientIds) {
  // 1. Récupérer clés publiques des destinataires
  const recipientKeys = await api.post('/users/keys/bulk', {
    user_ids: recipientIds
  });

  // 2. Générer nonce unique
  const nonce = nacl.randomBytes(24);
  const nonceBase64 = encodeBase64(nonce);

  // 3. Chiffrer pour chaque destinataire
  const encryptedPayloads = {};
  for (const recipient of recipientKeys) {
    const recipientPublicKey = decodeBase64(recipient.public_key);
    const myPrivateKey = decodeBase64(getMyPrivateKey());

    // Chiffrement NaCl box
    const encrypted = nacl.box(
      encodeUTF8(content),
      nonce,
      recipientPublicKey,
      myPrivateKey
    );

    encryptedPayloads[`${recipient.user_id}:${recipient.device_id}`] =
      encodeBase64(encrypted);
  }

  // 4. Envoyer via WebSocket
  socket.emit('send_message', {
    conversationId,
    content: '[Encrypted Message]',
    encrypted: true,
    encryptedPayloads,
    nonce: nonceBase64,
    senderDeviceId: getMyDeviceId()
  });
}
```

**Stockage serveur (MongoDB):**
```json
{
  "content": "[Encrypted Message]",
  "encrypted": true,
  "encryptedPayloads": {
    "2:device1": "xK7j+9Qp...",
    "3:device1": "aB5m+2Nq..."
  },
  "nonce": "Rt6h+8Lm...",
  "senderDeviceId": "device1"
}
```

#### **3. Réception Message Chiffré**

```javascript
// Frontend
socket.on('new_message', async (data) => {
  const message = data.message;

  if (message.encrypted) {
    // 1. Trouver payload pour notre device
    const myUserId = getCurrentUserId();
    const myDeviceId = getMyDeviceId();
    const key = `${myUserId}:${myDeviceId}`;

    const encryptedPayload = message.encryptedPayloads[key];
    if (!encryptedPayload) {
      console.error('No payload for our device');
      return;
    }

    // 2. Déchiffrer
    const nonce = decodeBase64(message.nonce);
    const encrypted = decodeBase64(encryptedPayload);
    const senderPublicKey = await getSenderPublicKey(message.from);
    const myPrivateKey = decodeBase64(getMyPrivateKey());

    const decrypted = nacl.box.open(
      encrypted,
      nonce,
      senderPublicKey,
      myPrivateKey
    );

    if (!decrypted) {
      console.error('Decryption failed');
      return;
    }

    // 3. Afficher message déchiffré
    const plaintext = decodeUTF8(decrypted);
    displayMessage({ ...message, content: plaintext });
  }
});
```

### 7.4 Sécurité

**Propriétés Cryptographiques:**

- ✅ **Confidentialité:** Seuls sender et recipients peuvent lire
- ✅ **Authentification:** Message signé cryptographiquement (Poly1305 MAC)
- ✅ **Intégrité:** Toute modification détectée automatiquement
- ✅ **Forward Secrecy:** (Futur) Rotation de clés de session

**Limitations Actuelles:**

- ⚠️ **Pas de forward secrecy:** Même clé pour tous les messages
  - **Solution future:** Signal Protocol (Double Ratchet)
- ⚠️ **Métadonnées non chiffrées:** Sender, timestamp, read receipts visibles
  - **Acceptable:** Standard industrie (même WhatsApp)
- ⚠️ **Search impossible côté serveur:** Messages chiffrés non indexables
  - **Solution:** Client-side search uniquement
- ⚠️ **Fichiers non chiffrés** (implémentation future)

**Safety Numbers (Futur):**
```
Alice: 12345 67890 ABCDE FGHIJ
Bob:   98765 43210 ZYXWV UTSRQ

→ QR code pour vérification en personne
```

**Diagram E2EE:**

> **📷 TODO: Insérer diagramme de flux E2EE**
>
> Montrer:
> 1. Alice génère clés → upload public key
> 2. Bob génère clés → upload public key
> 3. Alice envoie message → chiffré avec clé publique Bob
> 4. Serveur stocke message chiffré (ne peut pas lire)
> 5. Bob reçoit → déchiffre avec sa clé privée

---

<div style="page-break-after: always;"></div>

## 8. Mise en Production

### 8.1 Stratégie de Déploiement

**Environnements:**
- **Development:** Local (Docker Compose)
- **Staging:** Railway/Render (testing)
- **Production:** Railway/AWS/GCP (public)

**Infrastructure actuelle:** Railway (PaaS)

### 8.2 Infrastructure Cloud (Railway)

**Documentation:** [docs/RAILWAY_DEPLOYMENT.md](../docs/RAILWAY_DEPLOYMENT.md)

**Services déployés:**
- ✅ user-service
- ✅ auth-service
- ✅ message-service
- ✅ traefik (gateway)
- ✅ frontend (React)
- ✅ PostgreSQL (managed)
- ✅ Redis (managed)
- ✅ MongoDB (managed)

**Configuration:**

```yaml
# railway.json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  }
}
```

**Variables d'environnement:**
Voir [docs/RAILWAY_ENV_VARIABLES.md](../docs/RAILWAY_ENV_VARIABLES.md)

**Clés importantes:**
```bash
# JWT
JWT_SECRET=<random_256bit>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d

# Internal Auth
INTERNAL_SECRET=<random_256bit>

# Databases
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MONGO_URI=mongodb://...

# Services URLs
USER_SERVICE_URL=https://user-service.railway.app
AUTH_SERVICE_URL=https://auth-service.railway.app
MESSAGE_SERVICE_URL=https://message-service.railway.app
```

### 8.3 Monitoring et Logs

**Logs:**
- Railway Dashboard (logs agrégés)
- Morgan HTTP logs (tous services)
- Console.log structurés

**Future: Monitoring Avancé**

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  loki:
    image: grafana/loki
    ports:
      - "3100:3100"
```

**Métriques à monitorer:**
- Request rate (req/s)
- Error rate (%)
- Latency (p50, p95, p99)
- Database connections
- WebSocket connections
- Memory usage
- CPU usage

**Alertes (future):**
- Error rate > 1%
- Latency p95 > 500ms
- Service down (health check fail)
- Database connection pool full

### 8.4 Scaling

**Horizontal Scaling:**

```yaml
# docker-compose.yml
services:
  user-service:
    deploy:
      replicas: 3  # 3 instances
    environment:
      - NODE_ENV=production
```

**Traefik Load Balancing:**
```yaml
# traefik/dynamic.yml
http:
  services:
    user-service:
      loadBalancer:
        servers:
          - url: "http://user-service-1:3001"
          - url: "http://user-service-2:3001"
          - url: "http://user-service-3:3001"
        healthCheck:
          path: "/health"
          interval: "10s"
```

**Database Scaling:**
- **PostgreSQL:** Read replicas (pgBouncer)
- **Redis:** Cluster mode (3 master + 3 replica)
- **MongoDB:** Sharding (collection partitioning)

**CDN (Future):**
- Cloudflare pour frontend
- S3 + CloudFront pour fichiers uploadés

**Objectifs Performance:**
- Latency API: < 100ms (p95)
- WebSocket latency: < 50ms
- Uptime: 99.9% (8.76h downtime/an)
- Concurrent users: 100,000+

**Auto-scaling (Kubernetes future):**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

<div style="page-break-after: always;"></div>

## 9. Tests et Qualité

### 9.1 Tests Unitaires

**Framework:** Jest

**État actuel:**
- ✅ Tests pour `shared-lib/utils/response.js`
- ✅ Tests pour `shared-lib/validators/email.js`
- ⚠️ **Manquant:** Tests pour services (user, auth, message)

**À implémenter:**

#### **User Service Tests**

```javascript
// services/user-service/__tests__/userController.test.js
describe('UserController', () => {
  describe('register', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        first_name: 'Test',
        last_name: 'User'
      };
      const result = await userController.register(userData);
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(userData.email);
    });

    it('should reject invalid email', async () => {
      await expect(
        userController.register({ email: 'invalid' })
      ).rejects.toThrow('Invalid email');
    });
  });
});
```

#### **Auth Service Tests**

```javascript
// services/auth-service/__tests__/tokenService.test.js
describe('TokenService', () => {
  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const user = { id: 1, email: 'test@example.com' };
      const tokens = tokenService.generateTokens(user);

      expect(tokens).toHaveProperty('access_token');
      expect(tokens).toHaveProperty('refresh_token');
    });
  });

  describe('validateToken', () => {
    it('should validate valid token', () => {
      const token = tokenService.generateAccessToken({ id: 1 });
      const payload = tokenService.validateToken(token);

      expect(payload.userId).toBe(1);
    });

    it('should reject expired token', () => {
      // Mock expired token
      const expiredToken = 'eyJhbGc...';
      expect(() => tokenService.validateToken(expiredToken))
        .toThrow('Token expired');
    });
  });
});
```

#### **Message Service Tests**

```javascript
// services/message-service/__tests__/messageController.test.js
describe('MessageController', () => {
  describe('createConversation', () => {
    it('should create private conversation', async () => {
      const result = await messageController.createConversation({
        participants: [1, 2],
        isGroup: false
      });

      expect(result.participants).toEqual([1, 2]);
      expect(result.isGroup).toBe(false);
    });

    it('should create group conversation', async () => {
      const result = await messageController.createConversation({
        participants: [1, 2, 3],
        isGroup: true,
        groupName: 'Test Group'
      });

      expect(result.isGroup).toBe(true);
      expect(result.groupName).toBe('Test Group');
    });
  });
});
```

**Coverage Target:** 80%+

### 9.2 Tests d'Intégration

**Framework:** Supertest (API testing)

```javascript
// __tests__/integration/auth-flow.test.js
describe('Authentication Flow', () => {
  it('should complete full auth flow', async () => {
    // 1. Register
    const registerRes = await request(app)
      .post('/users/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123',
        first_name: 'Test',
        last_name: 'User'
      })
      .expect(201);

    // 2. Login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123'
      })
      .expect(200);

    const { access_token } = loginRes.body.data;

    // 3. Access protected resource
    await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    // 4. Logout
    await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    // 5. Verify token blacklisted
    await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(401);
  });
});
```

### 9.3 Tests E2E (End-to-End)

**Feature Principale: Messaging avec E2EE**

**Framework:** Playwright ou Puppeteer

```javascript
// __tests__/e2e/messaging-e2e.test.js
describe('Messaging E2E Flow', () => {
  let page1, page2;  // 2 browsers (Alice & Bob)

  beforeAll(async () => {
    page1 = await browser.newPage();  // Alice
    page2 = await browser.newPage();  // Bob
  });

  it('should complete full messaging flow with E2EE', async () => {
    // 1. Alice: Register + Login
    await page1.goto('http://localhost/login');
    await page1.fill('[name="email"]', 'alice@example.com');
    await page1.fill('[name="password"]', 'AlicePass123');
    await page1.click('button[type="submit"]');
    await page1.waitForSelector('.chat-page');

    // 2. Bob: Register + Login
    await page2.goto('http://localhost/login');
    await page2.fill('[name="email"]', 'bob@example.com');
    await page2.fill('[name="password"]', 'BobPass123');
    await page2.click('button[type="submit"]');
    await page2.waitForSelector('.chat-page');

    // 3. Alice: Create conversation with Bob
    await page1.click('[data-test="new-conversation"]');
    await page1.fill('[data-test="search-users"]', 'bob');
    await page1.click('[data-test="user-bob"]');
    await page1.click('[data-test="create-conversation"]');

    // 4. Alice: Send encrypted message
    await page1.fill('[data-test="message-input"]', 'Hello Bob! 🔒');
    await page1.click('[data-test="send-button"]');

    // 5. Bob: Receive and decrypt message
    await page2.waitForSelector('[data-test="new-message"]');
    const messageText = await page2.textContent('[data-test="message-content"]');
    expect(messageText).toBe('Hello Bob! 🔒');

    // 6. Bob: Reply with reaction
    await page2.hover('[data-test="message-0"]');
    await page2.click('[data-test="add-reaction"]');
    await page2.click('[data-test="emoji-thumbs-up"]');

    // 7. Alice: See reaction
    await page1.waitForSelector('[data-test="reaction-thumbs-up"]');
    const reactionCount = await page1.textContent('[data-test="reaction-count"]');
    expect(reactionCount).toBe('1');

    // 8. Bob: Send file
    await page2.setInputFiles('[data-test="file-input"]', 'test-image.jpg');
    await page2.click('[data-test="send-button"]');

    // 9. Alice: Receive file
    await page1.waitForSelector('[data-test="message-attachment"]');
    const attachmentSrc = await page1.getAttribute('[data-test="attachment-img"]', 'src');
    expect(attachmentSrc).toContain('/messages/uploads/');

    // 10. Alice: Edit message
    await page1.hover('[data-test="message-0"]');
    await page1.click('[data-test="edit-button"]');
    await page1.fill('[data-test="edit-input"]', 'Hello Bob! (edited) 🔒');
    await page1.keyboard.press('Enter');

    // 11. Bob: See edited message
    await page2.waitForSelector('[data-test="message-edited"]');
    const editedText = await page2.textContent('[data-test="message-content"]');
    expect(editedText).toBe('Hello Bob! (edited) 🔒');
  });
});
```

**Scénarios à tester:**
- ✅ Inscription + Login
- ✅ Création conversation
- ✅ Envoi message (E2EE)
- ✅ Réception message (decryption)
- ✅ Upload fichier
- ✅ Réaction emoji
- ✅ Édition message
- ✅ Suppression message
- ✅ Création groupe
- ✅ Ajout membre groupe
- ✅ Indicateur de saisie
- ✅ Read receipts
- ✅ Logout

**CI/CD Integration:**

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Start services
        run: docker-compose up -d

      - name: Wait for services
        run: sleep 30

      - name: Run unit tests
        run: npm test

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

<div style="page-break-after: always;"></div>

## 10. Roadmap

**Document complet:** [docs/ROADMAP.md](../docs/ROADMAP.md)

### 10.1 Court Terme (1-3 mois)

**Focus:** Robustesse et Qualité

1. **Tests Complets**
   - Tests unitaires (80%+ coverage)
   - Tests d'intégration
   - Tests E2E (Playwright)
   - CI/CD (GitHub Actions)

2. **Validation Backend**
   - Joi/Zod pour validation
   - Error handling centralisé
   - Custom error classes

3. **Sécurité**
   - Rate limiting (express-rate-limit)
   - Helmet.js (security headers)
   - Input sanitization
   - OWASP Top 10 compliance

4. **Monitoring**
   - Prometheus + Grafana
   - ELK Stack ou Loki (logs)
   - Sentry (error tracking)
   - APM (Datadog/New Relic)

5. **Performance**
   - Caching (Redis)
   - Database optimization
   - CDN pour frontend
   - Code splitting

### 10.2 Moyen Terme (3-6 mois)

**Focus:** Features Avancées

6. **Appels Audio/Vidéo** 🎥
   - WebRTC pour P2P
   - STUN/TURN servers
   - Appels 1-to-1
   - Appels de groupe (SFU)
   - Screen sharing

7. **Notifications Push** 🔔
   - Web Push API
   - Firebase Cloud Messaging
   - Email notifications (opt-in)
   - Notification settings

8. **Multi-Device Support** 📱
   - Session management
   - Key synchronization (Signal Protocol)
   - Message sync
   - Device revocation

9. **Recherche Full-Text** 🔍
   - Elasticsearch integration
   - Multi-langue search
   - Filters (date, sender, type)
   - Client-side search (E2EE messages)

10. **E2EE v2** 🔐
    - Signal Protocol (Double Ratchet)
    - Forward secrecy
    - Safety numbers (QR code)
    - Encrypted file attachments

### 10.3 Long Terme (6-12 mois)

**Focus:** Écosystème et Scale

11. **Application Mobile** 📱
    - React Native (iOS + Android)
    - Native push notifications
    - In-app camera
    - Biometric auth

12. **Stories Éphémères** 📸
    - Post photo/video/text (24h TTL)
    - View counter + viewer list
    - Reply to story (DM)
    - Privacy controls

13. **Bots et Automatisation** 🤖
    - Bot Platform (API + SDK)
    - Slash commands (/weather, /poll)
    - Inline queries
    - Example bots (weather, translate, poll)

14. **Channels et Broadcast** 📢
    - One-to-many messaging
    - Unlimited subscribers
    - Rich media posts
    - Analytics

15. **Modération IA** 🛡️
    - NSFW detection (images)
    - Toxicity detection (text)
    - Spam detection (ML)
    - Reporting system

16. **Monétisation** 💰
    - Premium tier ($4.99/mois)
    - Business tier ($9.99/user/mois)
    - Features premium (unlimited storage, custom stickers, etc.)

17. **Kubernetes Migration** ☸️
    - Migrate from Docker Compose
    - Helm charts
    - Auto-scaling (HPA)
    - Service mesh (Istio)

---

<div style="page-break-after: always;"></div>

## 11. Conclusion

### Résumé du Projet

Fire Finch démontre une **architecture microservices complète et fonctionnelle** avec:

**✅ Réalisations Techniques:**
- 3 microservices backend (User, Auth, Message)
- 3 bases de données (PostgreSQL, Redis, MongoDB)
- API Gateway moderne (Traefik)
- Frontend React moderne (TypeScript + Tailwind)
- End-to-End Encryption (TweetNaCl/Curve25519)
- WebSocket temps réel (Socket.io)
- Dockerisation complète (8 containers)
- Documentation exhaustive (Swagger, CLAUDE.md, README)

**✅ Features Fonctionnelles:**
- Messagerie instantanée (privée + groupes)
- Chiffrement de bout en bout
- Upload fichiers et images
- Réactions emoji
- Édition/suppression messages
- GIF search (Tenor API)
- Read receipts et indicateurs de saisie
- Profils utilisateurs avec statuts
- Design moderne Messenger-style

**✅ Qualités Démontrées:**
- Séparation des préoccupations (SoC)
- Code organisé (MVC)
- Composants réutilisables (DRY)
- Simplicité (KISS)
- Documentation complète
- Scalabilité (architecture stateless)

### Compétences Acquises

Ce projet a permis de développer des compétences en:

**Backend:**
- Architecture microservices
- API REST design
- WebSocket (temps réel)
- Authentification JWT
- Cryptographie (E2EE)
- Databases (SQL + NoSQL + Cache)
- Docker et containerisation

**Frontend:**
- React moderne (hooks, context)
- TypeScript (type safety)
- State management
- WebSocket client
- Design system (Tailwind)
- Responsive design

**DevOps:**
- Docker Compose
- API Gateway (Traefik)
- Cloud deployment (Railway)
- Logs et monitoring
- Health checks

**Soft Skills:**
- Lecture documentation technique
- Debugging complexe (multi-services)
- Architecture decision records
- Communication technique (CLAUDE.md)

### Perspectives d'Évolution

Fire Finch a un potentiel d'évolution important:

**Court terme:**
- Tests complets (80%+ coverage)
- Sécurité renforcée (rate limiting, validation)
- Monitoring production (Prometheus, Grafana)

**Moyen terme:**
- Appels audio/vidéo (WebRTC)
- Notifications push
- Application mobile (React Native)
- E2EE v2 (Signal Protocol)

**Long terme:**
- Stories éphémères
- Bots platform
- Channels/broadcast
- Open-source community

### Leçons Apprises

**Succès:**
- ✅ Architecture microservices bien définie
- ✅ E2EE implémenté avec succès
- ✅ Documentation technique excellente
- ✅ Code maintenable et lisible

**Défis Rencontrés:**
- ⚠️ WebSocket avec Gateway (résolu avec Traefik)
- ⚠️ E2EE multi-device (complexité)
- ⚠️ Gestion erreurs WebSocket
- ⚠️ Debugging multi-containers

**Améliorations Futures:**
- Tests plus complets dès le début
- Error handling centralisé dès le départ
- Monitoring en développement (pas seulement production)

### Remerciements

Merci à [Nom de l'enseignant] pour:
- Les cours sur les microservices
- Les TPs pratiques
- Les retours sur l'architecture
- L'autorisation d'utiliser Traefik

### Ressources

**Documentation Projet:**
- GitHub: [lien vers repo]
- Swagger: [docs/swagger.yaml](../docs/swagger.yaml)
- CLAUDE.md: [CLAUDE.md](../CLAUDE.md)
- README: [README.md](../README.md)

**Technologies:**
- Traefik: https://doc.traefik.io/
- Socket.io: https://socket.io/docs/
- TweetNaCl: https://tweetnacl.js.org/
- React: https://react.dev/
- PostgreSQL: https://www.postgresql.org/docs/
- MongoDB: https://www.mongodb.com/docs/
- Redis: https://redis.io/docs/

---

<div style="page-break-after: always;"></div>

## 12. Annexes

### Annexe A: Installation et Démarrage

**Prérequis:**
- Docker + Docker Compose
- Node.js 18+ (pour développement local)
- Git

**Commandes:**

```bash
# 1. Cloner le repo
git clone <repo_url>
cd messagerie-app

# 2. Copier .env
cp .env.example .env

# 3. Démarrer tous les services
docker-compose up -d --build

# 4. Vérifier les services
docker-compose ps

# 5. Seed database (optional)
docker-compose exec user-service node seeders/seedUsers.js

# 6. Accéder à l'app
# Frontend: http://localhost
# Traefik Dashboard: http://localhost:8080
```

**Arrêt:**
```bash
docker-compose down
```

**Logs:**
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f user-service
```

### Annexe B: Variables d'Environnement

Voir [docs/RAILWAY_ENV_VARIABLES.md](../docs/RAILWAY_ENV_VARIABLES.md) pour la liste complète.

**Essentielles:**
```bash
# JWT
JWT_SECRET=your_secret_here_256bit
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d

# Internal Auth
INTERNAL_SECRET=your_secret_here_256bit

# Databases
POSTGRES_USER=userservice
POSTGRES_PASSWORD=password
POSTGRES_DB=users_db

REDIS_PASSWORD=redispassword123

MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password
```

### Annexe C: Ports des Services

| Service | Port | URL Local |
|---------|------|-----------|
| Traefik Gateway | 80 | http://localhost |
| Traefik Dashboard | 8080 | http://localhost:8080 |
| User Service | 3001 | http://localhost:3001 (internal) |
| Auth Service | 3002 | http://localhost:3002 (internal) |
| Message Service | 3003 | http://localhost:3003 (internal) |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MongoDB | 27017 | localhost:27017 |
| Frontend | 5173 | http://localhost (via Traefik) |

### Annexe D: Commandes Utiles

**Health Checks:**
```bash
curl http://localhost/users/health
curl http://localhost/auth/health
curl http://localhost/messages/health
```

**Database Access:**
```bash
# PostgreSQL
docker-compose exec postgres psql -U userservice -d users_db
# \dt (list tables)
# SELECT * FROM users;

# Redis
docker-compose exec redis redis-cli -a redispassword123
# KEYS *
# GET refresh_token:...

# MongoDB
docker-compose exec mongodb mongosh
# use messages_db
# db.conversations.find()
```

**Rebuild Service:**
```bash
docker-compose up -d --build user-service
```

**Clean Restart:**
```bash
docker-compose down -v  # ⚠️ Supprime volumes (data loss)
docker-compose up -d --build
```

### Annexe E: Structure du Projet

```
messagerie-app/
├── docs/                          # Documentation
│   ├── swagger.yaml
│   ├── PROJET_FINAL_ANALYSE.md
│   ├── JUSTIFICATION_TRAEFIK.md
│   ├── ROADMAP.md
│   ├── DOSSIER_SOUTENANCE.md      # Ce fichier
│   └── E2EE_IMPLEMENTATION_SUMMARY.md
├── infrastructure/
│   ├── docker-compose.yml         # Orchestration
│   └── traefik/
│       ├── traefik.yml
│       └── dynamic.yml
├── services/
│   ├── user-service/              # Service User
│   ├── auth-service/              # Service Auth
│   ├── message-service/           # Service Message
│   └── shared-lib/                # Librairie partagée
├── frontend/                      # React App
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── contexts/
│   └── package.json
├── .env                           # Variables env
├── .gitignore
├── CLAUDE.md                      # Documentation technique
├── README.md                      # Quick start
└── README_DETAILS.md              # Documentation complète
```

### Annexe F: Glossaire

**API Gateway:** Point d'entrée unique pour toutes les requêtes client vers les microservices

**E2EE (End-to-End Encryption):** Chiffrement où seuls sender et recipient peuvent lire les messages

**JWT (JSON Web Token):** Standard pour tokens d'authentification stateless

**Microservices:** Architecture où l'application est divisée en services indépendants

**MongoDB:** Base de données NoSQL orientée documents

**PostgreSQL:** Base de données relationnelle SQL

**Redis:** Base de données in-memory key-value (cache)

**Socket.io:** Librairie WebSocket avec fallbacks

**Traefik:** API Gateway et reverse proxy moderne

**TweetNaCl:** Librairie cryptographique (Curve25519)

**WebSocket:** Protocole de communication bi-directionnelle temps réel

---

## Fin du Document

**Date:** 2025-12-16
**Version:** 1.0
**Auteurs:** [Vos Noms]
**Projet:** Fire Finch - Messagerie Microservices E2EE

---

**Pour convertir en PDF:**

```bash
# Option 1: Pandoc
pandoc DOSSIER_SOUTENANCE.md -o DOSSIER_SOUTENANCE.pdf \
  --pdf-engine=xelatex \
  --toc \
  --number-sections \
  -V geometry:margin=1in

# Option 2: Google Docs
# Importer le fichier .md dans Google Docs
# Fichier → Télécharger → PDF

# Option 3: Online converter
# https://www.markdowntopdf.com/
# https://md2pdf.netlify.app/
```

**Ajouts avant conversion:**
1. ✅ Insérer schéma d'architecture (section 2.2)
2. ✅ Insérer schémas BDD (sections 4.1, 4.2, 4.3)
3. ✅ Insérer screenshots (section 6.1)
4. ✅ Remplacer [Votre Nom] par vrais noms
5. ✅ Ajouter lien GitHub repo
6. ✅ Vérifier numéros de pages
7. ✅ Générer table des matières
8. ✅ Mise en page finale
