# Guide de Déploiement Railway - Messagerie App

## 📋 Vue d'ensemble

Votre application nécessite **7 services Railway** :

1. **PostgreSQL** (base de données pour User Service)
2. **Redis** (base de données pour Auth Service)
3. **MongoDB** (base de données pour Message Service)
4. **User Service** (API utilisateurs)
5. **Auth Service** (API authentification)
6. **Message Service** (API messages + WebSocket)
7. **Frontend** (React App)

---

## 🚀 Étapes de Déploiement

### 1️⃣ Créer un Nouveau Projet Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur **"New Project"**
3. Nommez votre projet : `messagerie-app`

---

### 2️⃣ Ajouter les Bases de Données

#### A. PostgreSQL

1. Cliquez sur **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway génère automatiquement les variables :
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`
   - `DATABASE_URL`

**💡 Astuce :** Railway fournit automatiquement une base PostgreSQL avec toutes les variables configurées.

#### B. Redis

1. Cliquez sur **"+ New"** → **"Database"** → **"Redis"**
2. Railway génère automatiquement :
   - `REDIS_URL`
   - `REDIS_PRIVATE_URL`

#### C. MongoDB

1. Cliquez sur **"+ New"** → **"Database"** → **"MongoDB"**
2. Railway génère automatiquement :
   - `MONGO_URL`

---

### 3️⃣ Déployer les Services Backend

Pour chaque service, vous allez connecter votre **repository GitHub** et configurer les variables d'environnement.

#### A. Déployer User Service

1. Cliquez sur **"+ New"** → **"GitHub Repo"**
2. Sélectionnez votre repository
3. Railway détecte automatiquement le service
4. **Configuration :**
   - **Root Directory :** `services/user-service`
   - **Build Command :** `npm install`
   - **Start Command :** `npm start`

5. **Variables d'environnement à ajouter :**

```bash
# Port (Railway génère automatiquement PORT)
PORT=${{PORT}}

# PostgreSQL (référencer le service PostgreSQL)
POSTGRES_USER=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
POSTGRES_DB=${{Postgres.PGDATABASE}}
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_PORT=${{Postgres.PGPORT}}

# OU utiliser directement DATABASE_URL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secret (créer une variable partagée)
JWT_SECRET=votre-super-secret-jwt-key-production-changez-moi

# Internal Secret (communication entre services)
INTERNAL_SECRET=internal-service-secret-production-changez-moi

# URLs des autres services (à remplir après leur déploiement)
AUTH_SERVICE_URL=${{Auth-Service.RAILWAY_PUBLIC_DOMAIN}}
```

6. Cliquez sur **"Deploy"**

---

#### B. Déployer Auth Service

1. Cliquez sur **"+ New"** → **"GitHub Repo"**
2. **Configuration :**
   - **Root Directory :** `services/auth-service`
   - **Build Command :** `npm install`
   - **Start Command :** `npm start`

3. **Variables d'environnement à ajouter :**

```bash
# Port
PORT=${{PORT}}

# Redis (référencer le service Redis)
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# OU utiliser directement REDIS_URL
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secret (MÊME valeur que User Service)
JWT_SECRET=votre-super-secret-jwt-key-production-changez-moi
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d

# Internal Secret
INTERNAL_SECRET=internal-service-secret-production-changez-moi

# URL User Service
USER_SERVICE_URL=${{User-Service.RAILWAY_PUBLIC_DOMAIN}}
```

4. Cliquez sur **"Deploy"**

---

#### C. Déployer Message Service

1. Cliquez sur **"+ New"** → **"GitHub Repo"**
2. **Configuration :**
   - **Root Directory :** `services/message-service`
   - **Build Command :** `npm install`
   - **Start Command :** `npm start`

3. **Variables d'environnement à ajouter :**

```bash
# Port
PORT=${{PORT}}

# MongoDB (référencer le service MongoDB)
MONGODB_URI=${{MongoDB.MONGO_URL}}

# JWT Secret
JWT_SECRET=votre-super-secret-jwt-key-production-changez-moi

# Internal Secret
INTERNAL_SECRET=internal-service-secret-production-changez-moi

# URLs des autres services
AUTH_SERVICE_URL=${{Auth-Service.RAILWAY_PUBLIC_DOMAIN}}
USER_SERVICE_URL=${{User-Service.RAILWAY_PUBLIC_DOMAIN}}

# CORS (mettre l'URL du frontend après déploiement)
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

4. Cliquez sur **"Deploy"**

---

### 4️⃣ Déployer le Frontend

1. Cliquez sur **"+ New"** → **"GitHub Repo"**
2. **Configuration :**
   - **Root Directory :** `frontend`
   - **Build Command :** `npm install && npm run build`
   - **Start Command :** `npm run preview`

3. **Variables d'environnement à ajouter :**

```bash
# Port
PORT=${{PORT}}

# API URLs des services
VITE_API_URL=https://${{User-Service.RAILWAY_PUBLIC_DOMAIN}}
VITE_AUTH_URL=https://${{Auth-Service.RAILWAY_PUBLIC_DOMAIN}}
VITE_MESSAGE_URL=https://${{Message-Service.RAILWAY_PUBLIC_DOMAIN}}

# WebSocket URL (Message Service)
VITE_SOCKET_URL=https://${{Message-Service.RAILWAY_PUBLIC_DOMAIN}}
```

4. Cliquez sur **"Deploy"**

---

## 🔧 Configuration Importante

### A. Générer des Secrets Sécurisés

**IMPORTANT :** Changez les secrets par défaut !

```bash
# Sur votre terminal local, générez des secrets aléatoires :
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Utilisez la même valeur pour `JWT_SECRET` et `INTERNAL_SECRET` **dans tous les services**.

---

### B. Configurer les Variables Partagées (Shared Variables)

Railway permet de créer des variables partagées entre services :

1. Allez dans **Project Settings** → **Shared Variables**
2. Ajoutez :
   - `JWT_SECRET` : [votre secret JWT]
   - `INTERNAL_SECRET` : [votre secret interne]

3. Référencez-les dans chaque service : `${{shared.JWT_SECRET}}`

---

### C. Activer les Domaines Publics

Pour chaque service (User, Auth, Message, Frontend) :

1. Allez dans les **Settings** du service
2. Section **Networking** → **Public Networking**
3. Cliquez sur **"Generate Domain"**
4. Railway génère une URL type : `service-name-production.railway.app`

---

### D. Configurer CORS

Dans chaque backend service, assurez-vous d'autoriser l'origine du frontend Railway.

**Exemple dans `server.js` :**

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://votre-frontend.railway.app',
  credentials: true
}));
```

---

## 🔍 Vérification du Déploiement

### 1. Tester les Services

```bash
# User Service
curl https://votre-user-service.railway.app/health

# Auth Service
curl https://votre-auth-service.railway.app/health

# Message Service
curl https://votre-message-service.railway.app/health

# Frontend
curl https://votre-frontend.railway.app
```

### 2. Logs

Pour voir les logs de chaque service :
1. Cliquez sur le service
2. Onglet **"Deployments"**
3. Cliquez sur le dernier déploiement
4. **"View Logs"**

---

## 📊 Variables d'Environnement - Récapitulatif

### User Service
```
PORT=${{PORT}}
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=${{shared.JWT_SECRET}}
INTERNAL_SECRET=${{shared.INTERNAL_SECRET}}
AUTH_SERVICE_URL=https://${{Auth-Service.RAILWAY_PUBLIC_DOMAIN}}
```

### Auth Service
```
PORT=${{PORT}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=${{shared.JWT_SECRET}}
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d
INTERNAL_SECRET=${{shared.INTERNAL_SECRET}}
USER_SERVICE_URL=https://${{User-Service.RAILWAY_PUBLIC_DOMAIN}}
```

### Message Service
```
PORT=${{PORT}}
MONGODB_URI=${{MongoDB.MONGO_URL}}
JWT_SECRET=${{shared.JWT_SECRET}}
INTERNAL_SECRET=${{shared.INTERNAL_SECRET}}
AUTH_SERVICE_URL=https://${{Auth-Service.RAILWAY_PUBLIC_DOMAIN}}
USER_SERVICE_URL=https://${{User-Service.RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

### Frontend
```
PORT=${{PORT}}
VITE_API_URL=https://${{User-Service.RAILWAY_PUBLIC_DOMAIN}}
VITE_AUTH_URL=https://${{Auth-Service.RAILWAY_PUBLIC_DOMAIN}}
VITE_MESSAGE_URL=https://${{Message-Service.RAILWAY_PUBLIC_DOMAIN}}
VITE_SOCKET_URL=https://${{Message-Service.RAILWAY_PUBLIC_DOMAIN}}
```

---

## 💡 Astuces Railway

### 1. Auto-Redéploiement
Railway redéploie automatiquement quand vous push sur GitHub.

### 2. Preview Deployments
Activez les **Preview Deployments** pour tester les Pull Requests :
- **Settings** → **Environment** → **Deploy Previews** → Activez

### 3. Surveillance
- Railway affiche les métriques CPU, RAM, Network
- Configurez des alertes dans **Settings** → **Alerts**

### 4. Volumes (Uploads)
Pour le Message Service qui stocke les fichiers :
1. **Settings** → **Volumes**
2. Créez un volume monté sur `/app/uploads`
3. Cela persiste les fichiers entre redéploiements

---

## 🐛 Dépannage

### Erreur : "Service cannot connect to database"
- Vérifiez que les variables `DATABASE_URL`, `REDIS_URL`, `MONGODB_URI` sont correctement référencées
- Assurez-vous que les services de base de données sont démarrés

### Erreur : "CORS policy blocked"
- Ajoutez l'URL du frontend dans `FRONTEND_URL`
- Vérifiez la configuration CORS dans les services backend

### Erreur : "Internal service communication failed"
- Vérifiez que `INTERNAL_SECRET` est identique dans tous les services
- Vérifiez que les URLs des services sont correctes

### WebSocket ne fonctionne pas
- Assurez-vous que `VITE_SOCKET_URL` pointe vers le Message Service
- Railway supporte automatiquement les WebSockets (pas de config spéciale)

---

## 📝 Ordre de Déploiement Recommandé

1. **PostgreSQL** → Déployer la base
2. **Redis** → Déployer la base
3. **MongoDB** → Déployer la base
4. **User Service** → Déployer (dépend de PostgreSQL)
5. **Auth Service** → Déployer (dépend de Redis + User Service)
6. **Message Service** → Déployer (dépend de MongoDB + Auth + User)
7. **Frontend** → Déployer (dépend de tous les services backend)

**Temps estimé :** 20-30 minutes

---

## 🎉 C'est Terminé !

Votre application est maintenant déployée sur Railway avec :
- ✅ 3 bases de données managées
- ✅ 3 services backend
- ✅ 1 frontend React
- ✅ URLs publiques HTTPS
- ✅ Auto-redéploiement sur Git push
- ✅ WebSockets fonctionnels
- ✅ End-to-End Encryption

**URL de votre app :** `https://votre-frontend.railway.app`

---

## 📚 Ressources

- [Documentation Railway](https://docs.railway.app)
- [Railway Templates](https://railway.app/templates)
- [Railway Discord](https://discord.gg/railway)
