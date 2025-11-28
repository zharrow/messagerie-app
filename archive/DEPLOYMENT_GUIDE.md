# 🚀 Guide de déploiement OvO - Vercel + Supabase

## 📋 Prérequis

- Compte GitHub (pour connexion Vercel)
- Compte Vercel (gratuit)
- Compte Supabase (gratuit)
- Node.js 18+ installé localement

---

## 🎯 Architecture de déploiement

```
Frontend (Vercel)
    ↓
API Routes (Vercel Serverless)
    ↓
Supabase (PostgreSQL + Realtime + Storage + Auth)
```

---

## 📦 Étape 1 : Préparer Supabase

### 1.1 Créer le projet Supabase

1. Aller sur https://supabase.com
2. Cliquer sur "New Project"
3. Choisir un nom : `ovo-messaging`
4. Choisir un mot de passe database (le noter !)
5. Choisir une région proche (ex: Europe West)
6. Attendre 2-3 minutes la création

### 1.2 Configurer la base de données

1. Dans Supabase Dashboard, aller dans **SQL Editor**
2. Créer un nouveau query
3. Copier-coller le contenu de `supabase-migration.sql`
4. Cliquer sur "Run" (▶️)
5. Vérifier que toutes les tables sont créées dans **Table Editor**

### 1.3 Récupérer les credentials

Aller dans **Settings > API** et noter :

- `Project URL` : https://xxxxxx.supabase.co
- `anon public` key : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- `service_role` key (secret) : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### 1.4 Activer Realtime

1. Aller dans **Database > Replication**
2. Activer la réplication pour les tables :
   - `public.messages`
   - `public.message_reactions`
   - `public.conversation_participants`

### 1.5 Configurer le Storage (pour fichiers)

1. Aller dans **Storage**
2. Créer un bucket `message-attachments`
3. Configurer les policies :

```sql
-- Permettre upload aux utilisateurs authentifiés
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

-- Permettre lecture à tous (messages publics dans conversations)
CREATE POLICY "Anyone can read attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments');
```

---

## 📂 Étape 2 : Préparer le projet pour Vercel

### 2.1 Restructurer le projet

Le frontend Vite doit être à la racine pour Vercel :

```bash
# Dans le dossier FullStack
cd frontend
```

### 2.2 Créer `vercel.json`

Créer un fichier `vercel.json` à la **racine du projet FullStack** :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "VITE_API_URL": "@vite_api_url",
    "VITE_SUPABASE_URL": "@vite_supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@vite_supabase_anon_key"
  }
}
```

### 2.3 Créer les API Routes Vercel

Créer un dossier `api/` à la racine :

```bash
mkdir api
```

Créer `api/auth/login.ts` :

```typescript
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  // Vérifier credentials via Supabase Auth
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  return res.status(200).json({
    user: data.user,
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token
  })
}
```

### 2.4 Modifier le frontend pour utiliser Supabase

Installer Supabase client :

```bash
cd frontend
npm install @supabase/supabase-js
```

Créer `frontend/src/lib/supabase.ts` :

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

---

## 🚀 Étape 3 : Déployer sur Vercel

### 3.1 Push sur GitHub

```bash
# Initialiser git si pas déjà fait
git init
git add .
git commit -m "feat: prepare for Vercel deployment"

# Créer un repo sur GitHub et push
git remote add origin https://github.com/votre-username/ovo-messaging.git
git branch -M main
git push -u origin main
```

### 3.2 Connecter à Vercel

1. Aller sur https://vercel.com
2. Cliquer sur "New Project"
3. Importer depuis GitHub : `ovo-messaging`
4. **Configuration Framework** :
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3.3 Configurer les variables d'environnement

Dans Vercel Dashboard > Settings > Environment Variables, ajouter :

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (secret)

# API
VITE_API_URL=https://votre-projet.vercel.app

# JWT (générer un secret fort)
JWT_SECRET=your-super-secret-key-min-32-chars

# Internal secret
INTERNAL_SECRET=another-secret-key
```

### 3.4 Déployer

```bash
# Déployer via CLI (optionnel)
vercel --prod

# Ou simplement push sur main, Vercel déploie automatiquement
git push origin main
```

---

## 🔄 Étape 4 : Migrer la logique Real-time

### Option A : Utiliser Supabase Realtime (Recommandé)

Remplacer Socket.io par Supabase Realtime dans `frontend/src/services/socket.ts` :

```typescript
import { supabase } from '@/lib/supabase'

export const subscribeToConversation = (conversationId: string, callback: Function) => {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()
}

export const sendMessage = async (conversationId: string, content: string) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content,
      from_user_id: supabase.auth.getUser().id
    })
    .select()

  return { data, error }
}
```

### Option B : Garder Socket.io via Vercel Serverless

Créer `api/socket.ts` :

```typescript
import { Server } from 'socket.io'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!(res.socket as any).server.io) {
    const io = new Server((res.socket as any).server)

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id)

      socket.on('send_message', async (data) => {
        // Sauvegarder en Supabase
        // Broadcast aux autres
      })
    })

    (res.socket as any).server.io = io
  }
  res.end()
}
```

---

## ✅ Étape 5 : Tests post-déploiement

### 5.1 Vérifier l'URL de production

```bash
# Votre app sera disponible sur :
https://ovo-messaging.vercel.app
```

### 5.2 Tests critiques

- [ ] Inscription d'un nouvel utilisateur
- [ ] Connexion
- [ ] Envoi d'un message
- [ ] Réception en temps réel
- [ ] Upload de fichier
- [ ] Chiffrement E2EE
- [ ] Réactions aux messages

### 5.3 Monitoring

- **Vercel Analytics** : Automatique (aller dans l'onglet Analytics)
- **Supabase Logs** : Dashboard > Logs
- **Errors** : Vercel > Deployment > Function Logs

---

## 💰 Coûts estimés

### Gratuit (jusqu'à certaines limites) :

**Vercel Free Tier :**
- 100 GB bandwidth/mois
- Déploiements illimités
- Serverless Functions : 100 GB-hours

**Supabase Free Tier :**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- 500K Edge Function requests
- 2M Realtime messages

### Si dépassement (environ 10-50 utilisateurs actifs) :

- **Vercel Pro** : $20/mois → Bandwidth illimité
- **Supabase Pro** : $25/mois → 8 GB database, 100 GB storage

**Total estimé : $0-45/mois** selon l'usage

---

## 🔧 Optimisations recommandées

### 1. CDN pour les fichiers statiques

Configurer Vercel Edge Network (automatique).

### 2. Compression des images

Utiliser Vercel Image Optimization :

```typescript
<img src={`/_vercel/image?url=${imageUrl}&w=800&q=75`} />
```

### 3. Caching intelligent

Configurer les headers dans `vercel.json` :

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 4. Monitoring des erreurs

Intégrer Sentry :

```bash
npm install @sentry/react @sentry/vercel
```

---

## 🐛 Troubleshooting

### Problème : "Module not found" en production

**Solution** : Vérifier que toutes les dépendances sont dans `dependencies` (pas `devDependencies`) :

```bash
npm install --save @supabase/supabase-js axios
```

### Problème : CORS errors

**Solution** : Configurer dans Supabase Dashboard > Authentication > URL Configuration :

- Site URL: `https://ovo-messaging.vercel.app`
- Redirect URLs: `https://ovo-messaging.vercel.app/**`

### Problème : Real-time ne fonctionne pas

**Solution** : Vérifier que les tables sont dans la réplication (Database > Replication).

---

## 📚 Ressources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel + Supabase Integration](https://vercel.com/integrations/supabase)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

## 🎉 Félicitations !

Votre app OvO est maintenant déployée en production avec :

✅ Frontend ultra-rapide (Vercel Edge Network)
✅ Backend scalable (Supabase)
✅ Real-time performant
✅ Gratuit jusqu'à des milliers d'utilisateurs
✅ SSL/HTTPS automatique
✅ CI/CD automatique (push = deploy)

**Prochaines étapes** :
- Configurer un domaine custom (ex: ovo-chat.com)
- Activer Vercel Analytics
- Implémenter Sentry pour monitoring des erreurs
- Configurer des alertes Slack/Discord
