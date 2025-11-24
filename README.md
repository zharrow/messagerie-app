# Système de Gestion d'Utilisateurs avec Architecture Microservices

## 📋 Description du Projet

Système de gestion d'utilisateurs basé sur une architecture microservices avec API Gateway. Le projet implémente l'authentification JWT, la gestion de sessions et un système de "Remember Me" pour une expérience utilisateur fluide.

### Objectif
Créer une architecture distribuée scalable et sécurisée permettant la gestion complète du cycle de vie des utilisateurs (inscription, connexion, déconnexion, modification de profil).

---

## 🏗️ Architecture

### Vue d'ensemble

```
                                Internet
                                   |
                            [Traefik Gateway]
                              Port 80/443
                                   |
                    +-------------+-------------+
                    |                           |
              [User Service]              [Auth Service]
                Port 3001                   Port 3002
                    |                           |
              [PostgreSQL]                   [Redis]
                Port 5432                   Port 6379
```

### Schéma détaillé

```
┌─────────────────────────────────────────────────────────────────┐
│                            CLIENT                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       TRAEFIK (Gateway)                         │
│  - Reverse Proxy                                                │
│  - Load Balancing                                               │
│  - Routing automatique                                          │
│  - Dashboard monitoring                                         │
└───────────┬─────────────────────────────┬───────────────────────┘
            │                             │
            │ /users/*                    │ /auth/*
            ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────────────┐
│    USER SERVICE         │   │      AUTH SERVICE               │
│  (Express.js/Node.js)   │◄──┤   (Express.js/Node.js)          │
│                         │   │                                 │
│  Endpoints Publics:     │   │   Endpoints Publics:            │
│  - POST /users/register │   │   - POST /auth/login            │
│  - GET /users/:id       │   │   - POST /auth/logout           │
│  - PUT /users/:id       │   │   - POST /auth/refresh          │
│  - GET /health          │   │   - GET /health                 │
│                         │   │                                 │
│  Endpoints Internes:    │   │   Endpoints Internes:           │
│  - POST /internal/      │   │   - POST /internal/             │
│    verify-credentials   │   │     validate-token              │
└──────────┬──────────────┘   └──────────┬──────────────────────┘
           │                             │
           │ Réseau Docker               │ Réseau Docker
           │ (internal)                  │ (internal)
           ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────────────┐
│     POSTGRESQL          │   │         REDIS                   │
│                         │   │                                 │
│  - users table          │   │  - JWT tokens                   │
│  - credentials          │   │  - Refresh tokens               │
│  - user profiles        │   │  - Sessions (TTL)               │
└─────────────────────────┘   └─────────────────────────────────┘
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
│  [Traefik] ◄──► [User Service] ◄──► [Auth Service]               │
│                       ▼                      ▼                   │
│                 [PostgreSQL]             [Redis]                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Choix Techniques

### 1. API Gateway : Traefik

**Pourquoi Traefik ?**
- **Auto-discovery** : Détecte automatiquement les services Docker via labels
- **Configuration déclarative** : Configuration via docker-compose.yml, pas de fichiers complexes
- **Dashboard intégré** : Interface web de monitoring en temps réel
- **Production-ready** : Support natif HTTPS, Let's Encrypt, health checks
- **Performance** : Léger et rapide, écrit en Go
- **Hot reload** : Mise à jour de la configuration sans redémarrage

**Alternatives considérées :**
- ❌ **Nginx** : Configuration plus complexe, pas d'auto-discovery
- ❌ **Kong** : Trop lourd pour ce projet, orienté entreprise
- ❌ **API Gateway custom** : Réinventer la roue, maintenance supplémentaire

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
microservices-user-management/
├── docker-compose.yml          # Orchestration des services
├── .env                        # Variables d'environnement
├── .env.example               # Template des variables
├── README.md                  # Cette documentation
│
├── traefik/
│   └── traefik.yml           # Configuration Traefik
│
├── user-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js             # Point d'entrée
│   ├── config/
│   │   └── database.js       # Configuration PostgreSQL
│   ├── routes/
│   │   ├── public.js         # Routes publiques
│   │   └── internal.js       # Routes internes
│   ├── controllers/
│   │   └── userController.js
│   ├── models/
│   │   └── User.js
│   ├── middlewares/
│   │   ├── auth.js           # Middleware d'authentification
│   │   └── internal.js       # Protection routes internes
│   └── utils/
│       └── validation.js     # Validation des inputs
│
└── auth-service/
    ├── Dockerfile
    ├── package.json
    ├── server.js             # Point d'entrée
    ├── config/
    │   └── redis.js          # Configuration Redis
    ├── routes/
    │   ├── public.js         # Routes publiques
    │   └── internal.js       # Routes internes
    ├── controllers/
    │   └── authController.js
    ├── services/
    │   ├── tokenService.js   # Gestion JWT
    │   └── sessionService.js # Gestion sessions Redis
    ├── middlewares/
    │   ├── auth.js
    │   └── internal.js
    └── utils/
        └── jwt.js            # Helpers JWT
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

## 👥 Auteur

**Florent** - Projet réalisé dans le cadre d'un TP d'architecture microservices

---

## 📝 Licence

Ce projet est à usage éducatif uniquement.
