# 🔐 Railway Environment Variables - Configuration Exacte

## ⚠️ Problème Résolu

**Erreur précédente :** `Redis error: Error: connect ECONNREFUSED ::1:6379`

**Cause :** Les services utilisaient des variables séparées (`REDIS_HOST`, `POSTGRES_HOST`, etc.) mais Railway fournit des URLs complètes.

**Solution :** Code mis à jour pour accepter les URLs Railway + configuration des bonnes variables ci-dessous.

---

## 📋 Variables d'environnement par service

### 1️⃣ User Service

**Variables Railway à configurer :**

```env
# Port (Railway l'injecte automatiquement)
PORT=3001

# Base de données PostgreSQL - Railway fournit cette variable automatiquement
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Secrets partagés (à définir manuellement - IMPORTANT: utiliser les mêmes valeurs pour tous les services)
JWT_SECRET=votre-secret-jwt-minimum-32-caracteres-ici
INTERNAL_SECRET=votre-secret-interne-minimum-32-caracteres-ici

# Environnement
NODE_ENV=production
```

**Comment obtenir `${{Postgres.DATABASE_URL}}` :**
1. Ajouter une base de données PostgreSQL dans Railway
2. Railway crée automatiquement la variable `${{Postgres.DATABASE_URL}}`
3. Utiliser cette syntaxe exacte dans le champ de variable d'environnement

---

### 2️⃣ Auth Service

**Variables Railway à configurer :**

```env
# Port
PORT=3002

# Base de données Redis - Railway fournit cette variable automatiquement
REDIS_URL=${{Redis.REDIS_URL}}

# Secrets partagés (DOIVENT être identiques à user-service)
JWT_SECRET=votre-secret-jwt-minimum-32-caracteres-ici
INTERNAL_SECRET=votre-secret-interne-minimum-32-caracteres-ici

# URL du User Service (copier depuis Railway après déploiement)
USER_SERVICE_URL=https://user-service-production-xxxx.railway.app

# Environnement
NODE_ENV=production
```

**Comment obtenir `${{Redis.REDIS_URL}}` :**
1. Ajouter une base de données Redis dans Railway
2. Railway crée automatiquement la variable `${{Redis.REDIS_URL}}`
3. Utiliser cette syntaxe exacte

**Comment obtenir `USER_SERVICE_URL` :**
1. Déployer user-service d'abord
2. Aller dans user-service → Settings → Domains
3. Copier l'URL publique (format: `https://user-service-production-xxxx.railway.app`)
4. Coller dans auth-service → Variables → USER_SERVICE_URL

---

### 3️⃣ Message Service

**Variables Railway à configurer :**

```env
# Port
PORT=3003

# Base de données MongoDB - Railway fournit cette variable automatiquement
MONGODB_URL=${{MongoDB.MONGO_URL}}

# Secrets partagés (DOIVENT être identiques aux autres services)
JWT_SECRET=votre-secret-jwt-minimum-32-caracteres-ici
INTERNAL_SECRET=votre-secret-interne-minimum-32-caracteres-ici

# URLs des autres services (copier depuis Railway)
AUTH_SERVICE_URL=https://auth-service-production-xxxx.railway.app
USER_SERVICE_URL=https://user-service-production-xxxx.railway.app

# Environnement
NODE_ENV=production
```

**Comment obtenir `${{MongoDB.MONGO_URL}}` :**
1. Ajouter une base de données MongoDB dans Railway
2. Railway crée automatiquement la variable `${{MongoDB.MONGO_URL}}`
3. Utiliser cette syntaxe exacte

---

## 🔑 Génération des Secrets

**Pour `JWT_SECRET` et `INTERNAL_SECRET`, utiliser une de ces méthodes :**

### Méthode 1 : Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Méthode 2 : OpenSSL
```bash
openssl rand -hex 32
```

### Méthode 3 : Online (moins sécurisé)
- https://randomkeygen.com/ (section "CodeIgniter Encryption Keys")

**Important :** Les 3 services DOIVENT utiliser le **même `JWT_SECRET`** et le **même `INTERNAL_SECRET`**.

---

## 📝 Ordre de Configuration

### Étape 1 : Ajouter les bases de données
1. Aller dans Railway Dashboard
2. Cliquer **+ New** → **Database** → **Add PostgreSQL**
3. Répéter pour Redis et MongoDB
4. Railway génère automatiquement les variables `${{...}}`

### Étape 2 : Générer les secrets
```bash
# Générer JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copier le résultat

# Générer INTERNAL_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copier le résultat
```

### Étape 3 : Configurer user-service
1. Aller dans user-service → Variables
2. Ajouter les variables une par une :
   - `PORT` = `3001`
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (syntaxe exacte)
   - `JWT_SECRET` = (coller le secret généré)
   - `INTERNAL_SECRET` = (coller le secret généré)
   - `NODE_ENV` = `production`
3. Sauvegarder et déployer
4. Copier l'URL publique du service déployé

### Étape 4 : Configurer auth-service
1. Aller dans auth-service → Variables
2. Ajouter :
   - `PORT` = `3002`
   - `REDIS_URL` = `${{Redis.REDIS_URL}}`
   - `JWT_SECRET` = (le MÊME secret que user-service)
   - `INTERNAL_SECRET` = (le MÊME secret que user-service)
   - `USER_SERVICE_URL` = (URL de user-service copiée)
   - `NODE_ENV` = `production`
3. Sauvegarder et déployer
4. Copier l'URL publique

### Étape 5 : Configurer message-service
1. Aller dans message-service → Variables
2. Ajouter :
   - `PORT` = `3003`
   - `MONGODB_URL` = `${{MongoDB.MONGO_URL}}`
   - `JWT_SECRET` = (le MÊME secret que les autres)
   - `INTERNAL_SECRET` = (le MÊME secret que les autres)
   - `AUTH_SERVICE_URL` = (URL de auth-service copiée)
   - `USER_SERVICE_URL` = (URL de user-service copiée)
   - `NODE_ENV` = `production`
3. Sauvegarder et déployer

---

## ✅ Vérification

### Vérifier que les variables sont bien injectées :

**Dans Railway Logs :**
```
Connected to PostgreSQL  ✅
Connected to Redis       ✅
Connected to MongoDB     ✅
Server running on port 3001  ✅
```

**Tester les endpoints :**
```bash
# User Service
curl https://user-service-production-xxxx.railway.app/health

# Auth Service
curl https://auth-service-production-xxxx.railway.app/health

# Message Service
curl https://message-service-production-xxxx.railway.app/health
```

**Réponse attendue :**
```json
{
  "status": "ok",
  "service": "user-service",
  "timestamp": "2025-11-28T..."
}
```

---

## 🚨 Erreurs Courantes

### ❌ `ECONNREFUSED ::1:6379`
**Problème :** Variable `REDIS_URL` non configurée ou mal configurée

**Solution :**
1. Vérifier que Redis est bien ajouté dans Railway
2. Utiliser exactement `${{Redis.REDIS_URL}}` (pas de guillemets, pas d'espaces)
3. Vérifier que le code utilise `REDIS_URL` (corrigé dans ce commit)

---

### ❌ `database "defaultdb" does not exist`
**Problème :** PostgreSQL ne trouve pas la base

**Solution :**
1. Utiliser `${{Postgres.DATABASE_URL}}` qui contient déjà le nom de la base
2. Ne pas définir manuellement `POSTGRES_DB`

---

### ❌ `Invalid JWT token`
**Problème :** Les services utilisent des `JWT_SECRET` différents

**Solution :**
1. Générer UN SEUL secret
2. Copier-coller le MÊME secret dans les 3 services
3. Ne pas régénérer pour chaque service

---

### ❌ `Cannot connect to USER_SERVICE_URL`
**Problème :** URL incorrecte ou service non déployé

**Solution :**
1. Vérifier que user-service est bien déployé et accessible
2. Copier l'URL depuis Railway → user-service → Settings → Domains
3. Format attendu : `https://user-service-production-xxxx.railway.app` (avec HTTPS)

---

## 📚 Ressources

- [Railway Environment Variables](https://docs.railway.app/guides/variables)
- [Railway Database URLs](https://docs.railway.app/databases/postgresql)
- Guide complet : [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)

---

## 🎯 Checklist Finale

Configuration complète des variables :

- [ ] PostgreSQL ajouté dans Railway
- [ ] Redis ajouté dans Railway
- [ ] MongoDB ajouté dans Railway
- [ ] `JWT_SECRET` généré (32+ caractères)
- [ ] `INTERNAL_SECRET` généré (32+ caractères)
- [ ] **user-service** :
  - [ ] `PORT=3001`
  - [ ] `DATABASE_URL=${{Postgres.DATABASE_URL}}`
  - [ ] `JWT_SECRET=...`
  - [ ] `INTERNAL_SECRET=...`
  - [ ] `NODE_ENV=production`
- [ ] **auth-service** :
  - [ ] `PORT=3002`
  - [ ] `REDIS_URL=${{Redis.REDIS_URL}}`
  - [ ] `JWT_SECRET=...` (le même)
  - [ ] `INTERNAL_SECRET=...` (le même)
  - [ ] `USER_SERVICE_URL=https://...`
  - [ ] `NODE_ENV=production`
- [ ] **message-service** :
  - [ ] `PORT=3003`
  - [ ] `MONGODB_URL=${{MongoDB.MONGO_URL}}`
  - [ ] `JWT_SECRET=...` (le même)
  - [ ] `INTERNAL_SECRET=...` (le même)
  - [ ] `AUTH_SERVICE_URL=https://...`
  - [ ] `USER_SERVICE_URL=https://...`
  - [ ] `NODE_ENV=production`

---

**Une fois configuré, redéployez chaque service pour appliquer les changements !**
