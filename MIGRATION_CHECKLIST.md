# ✅ Checklist de migration Docker → Vercel + Supabase

## 🎯 Vue d'ensemble

Cette checklist vous guide pas-à-pas pour migrer OvO de Docker local vers un déploiement cloud professionnel.

**Temps estimé : 2-3 heures**

---

## 📋 Phase 1 : Préparation (30 min)

### ✅ Créer les comptes

- [ ] Créer compte Vercel : https://vercel.com/signup
- [ ] Créer compte Supabase : https://supabase.com
- [ ] Créer compte GitHub (si pas déjà fait)
- [ ] Installer Vercel CLI : `npm i -g vercel`
- [ ] Installer Supabase CLI : `npm i -g supabase`

### ✅ Préparer le repository

- [ ] Créer un nouveau repo GitHub : `ovo-messaging`
- [ ] Ajouter `.gitignore` :
  ```
  node_modules/
  .env
  .env.local
  dist/
  .vercel
  .supabase
  *.log
  ```
- [ ] Push le code actuel sur GitHub

---

## 🗄️ Phase 2 : Configuration Supabase (45 min)

### ✅ Créer le projet

- [ ] Dashboard Supabase > New Project
- [ ] Nom : `ovo-messaging`
- [ ] Region : Europe West (Paris - cdg1)
- [ ] Password DB : Générer un mot de passe fort (noter dans un gestionnaire)
- [ ] Attendre 2-3 minutes la création

### ✅ Exécuter les migrations SQL

- [ ] Ouvrir SQL Editor dans Supabase
- [ ] Copier-coller `supabase-migration.sql`
- [ ] Exécuter (Run ▶️)
- [ ] Vérifier les tables dans Table Editor :
  - `users` ✓
  - `user_keys` ✓
  - `conversations` ✓
  - `conversation_participants` ✓
  - `messages` ✓
  - `message_attachments` ✓
  - `message_reactions` ✓
  - `message_read_receipts` ✓

### ✅ Configurer Realtime

- [ ] Database > Replication
- [ ] Activer pour :
  - [x] `messages`
  - [x] `message_reactions`
  - [x] `conversation_participants`

### ✅ Configurer Storage

- [ ] Storage > Create Bucket
- [ ] Nom : `message-attachments`
- [ ] Public : ✓
- [ ] Copier-coller les policies SQL pour storage (voir DEPLOYMENT_GUIDE.md)

### ✅ Noter les credentials

Aller dans Settings > API et noter :

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGci...
service_role key: eyJhbGci... (SECRET - ne jamais commit !)
```

---

## 💻 Phase 3 : Modifier le code (1h)

### ✅ Installer les dépendances

```bash
cd frontend
npm install @supabase/supabase-js
cd ../api
npm install @supabase/supabase-js @vercel/node bcryptjs jsonwebtoken
```

### ✅ Configuration Frontend

- [ ] Créer `frontend/src/lib/supabase.ts` (déjà créé ✓)
- [ ] Ajouter variables dans `frontend/.env.local` :
  ```env
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGci...
  VITE_API_URL=http://localhost:3000
  ```

### ✅ Remplacer Socket.io par Supabase Realtime

**Option rapide** : Garder Socket.io pour l'instant, migrer plus tard

**Option recommandée** : Remplacer par Supabase Realtime

- [ ] Modifier `frontend/src/services/socket.ts` pour utiliser :
  ```typescript
  import { subscribeToMessages } from '@/lib/supabase';
  ```
- [ ] Remplacer tous les `socket.on()` par `subscribeToMessages()`
- [ ] Tester localement

### ✅ Modifier l'authentification

- [ ] Optionnel : Utiliser Supabase Auth au lieu de JWT custom
- [ ] Ou garder JWT et utiliser API routes Vercel (`api/auth/login.ts`)

---

## 🚀 Phase 4 : Déploiement Vercel (30 min)

### ✅ Préparer le projet

- [ ] Créer `vercel.json` à la racine (déjà créé ✓)
- [ ] Vérifier que `frontend/package.json` contient :
  ```json
  {
    "scripts": {
      "build": "vite build",
      "preview": "vite preview"
    }
  }
  ```

### ✅ Connecter à Vercel

```bash
# Depuis la racine du projet
vercel

# Suivre les instructions :
# - Link to existing project? No
# - Project name? ovo-messaging
# - Directory? ./
# - Override settings? No
```

### ✅ Configurer les variables d'environnement

Dans Vercel Dashboard > Settings > Environment Variables :

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (secret !)

# API
VITE_API_URL=https://ovo-messaging.vercel.app

# JWT
JWT_SECRET=your-super-secret-key-32-chars-minimum

# Internal
INTERNAL_SECRET=another-secret-key
```

### ✅ Déployer en production

```bash
vercel --prod
```

- [ ] Attendre le build (2-3 min)
- [ ] Noter l'URL de production : `https://ovo-messaging.vercel.app`

---

## 🧪 Phase 5 : Tests (20 min)

### ✅ Tests fonctionnels

Aller sur `https://ovo-messaging.vercel.app` :

- [ ] Page de login charge correctement
- [ ] Créer un compte (Register)
- [ ] Se connecter
- [ ] Envoyer un message
- [ ] Vérifier réception en temps réel (ouvrir 2 onglets)
- [ ] Uploader un fichier
- [ ] Tester les réactions
- [ ] Vérifier E2EE (console logs)
- [ ] Tester sur mobile

### ✅ Vérifier les logs

- [ ] Vercel > Deployment > Function Logs → Pas d'erreurs
- [ ] Supabase > Logs > API → Requêtes correctes
- [ ] Network tab (F12) → Pas d'erreurs CORS

---

## 📊 Phase 6 : Monitoring (15 min)

### ✅ Activer les analytics

- [ ] Vercel > Analytics → Enable
- [ ] Supabase > Reports → Voir les métriques
- [ ] (Optionnel) Configurer Sentry pour error tracking

### ✅ Configurer les alertes

- [ ] Supabase > Database > Backup enabled
- [ ] Vercel > Settings > Notifications > Email alerts
- [ ] (Optionnel) Slack/Discord webhooks

---

## 🎉 Phase 7 : Post-déploiement (optionnel)

### ✅ Domaine personnalisé

- [ ] Acheter un domaine (ex: ovo-chat.com sur Namecheap)
- [ ] Vercel > Settings > Domains → Add domain
- [ ] Configurer DNS (Vercel donne les instructions)
- [ ] Attendre propagation (15-30 min)

### ✅ Optimisations

- [ ] Activer compression Brotli (automatique Vercel)
- [ ] Configurer Image Optimization
- [ ] Ajouter PWA manifest pour mobile
- [ ] Configurer service worker pour offline

### ✅ SEO

- [ ] Ajouter `meta` tags dans `index.html`
- [ ] Créer `robots.txt`
- [ ] Créer `sitemap.xml`
- [ ] Vérifier Google Search Console

---

## 🛡️ Sécurité finale

### ✅ Audit de sécurité

- [ ] Vérifier que `SUPABASE_SERVICE_ROLE_KEY` n'est PAS dans le code
- [ ] Vérifier Row Level Security (RLS) activé sur toutes les tables
- [ ] Tester les permissions : User A ne peut pas lire messages de B
- [ ] Activer rate limiting (Supabase Dashboard)
- [ ] Configurer CORS correctement

### ✅ Backup

- [ ] Supabase > Database > Enable daily backups
- [ ] Exporter manuellement la structure SQL : `supabase db dump`
- [ ] Sauvegarder dans un repo privé

---

## 📈 Métriques de succès

À la fin, vous devriez avoir :

- ✅ Application accessible sur une URL publique
- ✅ Temps de chargement < 2 secondes
- ✅ Real-time fonctionnel (messages instantanés)
- ✅ E2EE activé et fonctionnel
- ✅ Aucune erreur dans les logs
- ✅ Score Lighthouse > 90/100
- ✅ 100% gratuit jusqu'à 1000+ utilisateurs
- ✅ CI/CD automatique (push = deploy)

---

## 🆘 En cas de problème

### Build échoue sur Vercel

1. Vérifier les logs de build
2. Tester localement : `npm run build`
3. Vérifier Node version (Vite require 20+)

### CORS errors

1. Supabase > Authentication > URL Configuration
2. Ajouter : `https://ovo-messaging.vercel.app`

### Real-time ne marche pas

1. Vérifier Database > Replication activée
2. Vérifier les policies RLS
3. Console logs : Voir erreurs WebSocket

### "Module not found"

1. Vérifier `package.json` : dépendances dans `dependencies` (pas `devDependencies`)
2. `npm install` et re-deploy

---

## 🎓 Ressources

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel + Supabase Integration Guide](https://vercel.com/integrations/supabase)
- [Discord OvO Support](https://discord.gg/ovo) (créer le vôtre !)

---

## ✅ Statut final

- [ ] Phase 1 : Préparation
- [ ] Phase 2 : Supabase configuré
- [ ] Phase 3 : Code migré
- [ ] Phase 4 : Déployé sur Vercel
- [ ] Phase 5 : Tests passés
- [ ] Phase 6 : Monitoring activé
- [ ] Phase 7 : Post-déploiement (optionnel)

**Félicitations ! 🎉 OvO est maintenant en production !**
