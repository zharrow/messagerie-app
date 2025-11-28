# 🚂 Guide de déploiement Railway pour OvO

## ⚡ Quick Fix - Erreur "No start command"

Railway ne sait pas quel dossier déployer. Voici comment configurer :

---

## 🎯 Configuration par service

### 1️⃣ User Service

**Dans Railway Dashboard :**

1. Cliquer sur le service `user-service`
2. Settings > **Root Directory** → `user-service`
3. Settings > **Start Command** → `npm start`
4. Variables > Add Variable :
   ```env
   PORT=3001
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-super-secret-key-min-32-chars
   INTERNAL_SECRET=another-secret-key
   ```
5. Deploy > Redeploy

---

### 2️⃣ Auth Service

1. + New > GitHub Repo > **Same repo** (OvO)
2. Settings > **Root Directory** → `auth-service`
3. Settings > **Start Command** → `npm start`
4. Variables > Add Variable :
   ```env
   PORT=3002
   REDIS_URL=${{Redis.REDIS_URL}}
   JWT_SECRET=your-super-secret-key-min-32-chars
   INTERNAL_SECRET=another-secret-key
   USER_SERVICE_URL=${{user-service.RAILWAY_PUBLIC_DOMAIN}}
   ```
5. Deploy

---

### 3️⃣ Message Service

1. + New > GitHub Repo > **Same repo**
2. Settings > **Root Directory** → `message-service`
3. Settings > **Start Command** → `npm start`
4. Variables > Add Variable :
   ```env
   PORT=3003
   MONGODB_URL=${{MongoDB.MONGO_URL}}
   JWT_SECRET=your-super-secret-key-min-32-chars
   INTERNAL_SECRET=another-secret-key
   AUTH_SERVICE_URL=${{auth-service.RAILWAY_PUBLIC_DOMAIN}}
   USER_SERVICE_URL=${{user-service.RAILWAY_PUBLIC_DOMAIN}}
   ```
5. Deploy

---

### 4️⃣ Frontend

**Option A : Via Vercel (Recommandé)**
- Plus simple pour frontend statique
- CDN gratuit
- Voir [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Option B : Via Railway**
1. + New > GitHub Repo > **Same repo**
2. Settings > **Root Directory** → `frontend`
3. Settings > **Build Command** → `npm run build`
4. Settings > **Start Command** → `npx serve -s dist -l $PORT`
5. Variables :
   ```env
   VITE_API_URL=${{message-service.RAILWAY_PUBLIC_DOMAIN}}
   ```
6. Deploy

---

## 🗄️ Ajouter les bases de données

### PostgreSQL (User Service)

1. + New > Database > **Add PostgreSQL**
2. Railway génère automatiquement `${{Postgres.DATABASE_URL}}`
3. Importer le schéma :

```bash
# Depuis votre machine locale
railway link  # Sélectionner votre projet
railway run psql $DATABASE_URL < user-service/init.sql
```

**Ou via Railway Dashboard :**
1. PostgreSQL service > Data > Query
2. Copier-coller le contenu de `user-service/init.sql`

---

### Redis (Auth Service)

1. + New > Database > **Add Redis**
2. Railway génère automatiquement `${{Redis.REDIS_URL}}`
3. ✅ Pas de configuration supplémentaire nécessaire

---

### MongoDB (Message Service)

1. + New > Database > **Add MongoDB**
2. Railway génère automatiquement `${{MongoDB.MONGO_URL}}`
3. ✅ Pas de configuration supplémentaire nécessaire

---

## 🔧 Troubleshooting

### ❌ "No start command was found"

**Solution 1 : Vérifier Root Directory**
```
Settings > Root Directory = user-service (ou auth-service, message-service)
```

**Solution 2 : Ajouter Start Command**
```
Settings > Start Command = npm start
```

**Solution 3 : Vérifier package.json**
```json
{
  "scripts": {
    "start": "node server.js"  ← Doit exister
  }
}
```

---

### ❌ "Cannot connect to database"

**Vérifier les variables d'environnement :**
```bash
# PostgreSQL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis
REDIS_URL=${{Redis.REDIS_URL}}

# MongoDB
MONGODB_URL=${{MongoDB.MONGO_URL}}
```

**Note** : Railway remplace automatiquement `${{...}}` par la vraie valeur

---

### ❌ "Port already in use"

**Solution** : Railway attribue automatiquement le port via `$PORT`

Dans chaque `server.js`, vérifier :
```javascript
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Important** : Utiliser `0.0.0.0` au lieu de `localhost` !

---

### ❌ "Build failed"

**Vérifier Node version :**
```bash
# Railway supporte Node 18+
# Ajouter dans package.json :
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 🌐 URLs publiques

Railway génère automatiquement des URLs :

```
User Service:     https://user-service-production-xxxx.railway.app
Auth Service:     https://auth-service-production-xxxx.railway.app
Message Service:  https://message-service-production-xxxx.railway.app
Frontend:         https://frontend-production-xxxx.railway.app
```

---

## 🔗 Configuration CORS

Mettre à jour CORS dans chaque service pour accepter Railway URLs :

**user-service/server.js** :
```javascript
const allowedOrigins = [
  'http://localhost',
  'https://frontend-production-xxxx.railway.app', // Remplacer par votre URL
  'https://ovo-messaging.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

**Répéter pour auth-service et message-service**

---

## 📊 Monitoring

### Logs en temps réel :
```bash
# Via Railway CLI
railway logs --service user-service
railway logs --service auth-service
railway logs --service message-service
```

### Via Dashboard :
```
Chaque service > Logs (onglet en haut)
```

---

## 💰 Coûts Railway

**Free Tier : $5/mois**

Estimation pour OvO (MVP) :
- 3 services backend : ~$2/mois
- PostgreSQL : ~$0.50/mois
- Redis : ~$0.30/mois
- MongoDB : ~$0.50/mois
- **Total : ~$3.50/mois** ✅ Reste dans le free tier !

---

## ✅ Checklist de déploiement

### Databases :
- [ ] PostgreSQL ajouté
- [ ] Redis ajouté
- [ ] MongoDB ajouté
- [ ] Schéma PostgreSQL importé

### Services :
- [ ] user-service déployé (Root directory configuré)
- [ ] auth-service déployé
- [ ] message-service déployé
- [ ] Frontend déployé (ou sur Vercel)

### Configuration :
- [ ] Variables d'environnement configurées
- [ ] CORS mis à jour avec URLs Railway
- [ ] JWT_SECRET et INTERNAL_SECRET définis
- [ ] Port binding configuré (`0.0.0.0`)

### Tests :
- [ ] User Service health check OK
- [ ] Auth Service health check OK
- [ ] Message Service health check OK
- [ ] Frontend charge correctement
- [ ] Login fonctionne
- [ ] Envoi de message fonctionne

---

## 🎯 Commandes utiles Railway CLI

```bash
# Installation
npm install -g @railway/cli

# Login
railway login

# Lier projet
railway link

# Variables d'environnement
railway variables
railway variables set KEY=value

# Logs
railway logs
railway logs --service user-service

# Shell dans le service
railway shell

# Base de données
railway connect postgres
railway connect redis
railway connect mongodb

# Deploy manuel
railway up
```

---

## 🚀 Prochaines étapes

1. **Configurer les services un par un** (suivre les étapes ci-dessus)
2. **Tester les health checks** :
   ```bash
   curl https://user-service-production-xxxx.railway.app/health
   curl https://auth-service-production-xxxx.railway.app/health
   curl https://message-service-production-xxxx.railway.app/health
   ```
3. **Mettre à jour le frontend** avec les nouvelles URLs
4. **Tester l'application** de bout en bout
5. **Configurer un domaine custom** (optionnel)

---

## 📚 Ressources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Templates](https://railway.app/templates)
- [Railway Discord](https://discord.gg/railway) - Support communautaire

---

## 🎉 Félicitations !

Une fois configuré, OvO sera déployé sur Railway avec :

✅ Backend scalable (auto-scale)
✅ Bases de données managées
✅ SSL/HTTPS automatique
✅ CI/CD depuis GitHub
✅ Logs centralisés
✅ $3.50/mois (dans le free tier !)

**Plus simple que Docker, plus flexible que Vercel serverless ! 🚂**
