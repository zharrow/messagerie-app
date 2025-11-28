# 🚨 RAILWAY DEPLOYMENT - QUICK FIX

## The Problem

**Error:** `No start command was found`

**Root Cause:** Railway is looking at the repository root, but your services are in subdirectories (`user-service/`, `auth-service/`, `message-service/`).

---

## ✅ SOLUTION (1 minute)

### Step 1: Configure Root Directory in Railway Dashboard

**For each service you deploy:**

1. Open Railway Dashboard
2. Click on the service (e.g., `user-service`)
3. Go to **Settings** tab
4. Find **Root Directory** field
5. Enter the service folder name:
   - For user-service: `user-service`
   - For auth-service: `auth-service`
   - For message-service: `message-service`
6. Click **Save** or the field will auto-save
7. Click **Deploy** → **Redeploy**

**Screenshot of where to find Root Directory:**
```
Railway Dashboard
└── Your Service (click on service name)
    └── Settings (top tab)
        └── Service Settings
            └── Root Directory: [user-service] ← Enter here
```

---

## 📝 Complete Configuration Checklist

### For User Service:

**Railway Dashboard Settings:**
```
Service Name:     user-service
Root Directory:   user-service
Start Command:    npm start (or leave empty, it will auto-detect)
```

**Environment Variables:**
```env
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-super-secret-key-min-32-chars
INTERNAL_SECRET=another-secret-key
NODE_ENV=production
```

---

### For Auth Service:

**Railway Dashboard Settings:**
```
Service Name:     auth-service
Root Directory:   auth-service
Start Command:    npm start
```

**Environment Variables:**
```env
PORT=3002
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=your-super-secret-key-min-32-chars
INTERNAL_SECRET=another-secret-key
USER_SERVICE_URL=https://user-service-production-xxxx.railway.app
NODE_ENV=production
```

---

### For Message Service:

**Railway Dashboard Settings:**
```
Service Name:     message-service
Root Directory:   message-service
Start Command:    npm start
```

**Environment Variables:**
```env
PORT=3003
MONGODB_URL=${{MongoDB.MONGO_URL}}
JWT_SECRET=your-super-secret-key-min-32-chars
INTERNAL_SECRET=another-secret-key
AUTH_SERVICE_URL=https://auth-service-production-xxxx.railway.app
USER_SERVICE_URL=https://user-service-production-xxxx.railway.app
NODE_ENV=production
```

---

## 🎯 Deployment Order

Deploy in this order to avoid dependency issues:

1. **Databases first:**
   - Add PostgreSQL (for user-service)
   - Add Redis (for auth-service)
   - Add MongoDB (for message-service)

2. **Services:**
   - Deploy `user-service` first
   - Deploy `auth-service` second (needs USER_SERVICE_URL)
   - Deploy `message-service` last (needs both AUTH and USER URLs)

3. **Update environment variables:**
   - After each service deploys, Railway gives you a public URL
   - Copy that URL and paste it into the dependent services' environment variables
   - Example: After user-service deploys, copy its URL to `auth-service` → `USER_SERVICE_URL`

---

## 🔍 How to Verify It's Working

After configuring Root Directory and redeploying:

### Check Build Logs:
```
Railway Dashboard → Service → Deployments → Click latest deployment
```

**You should see:**
```
✓ Installing dependencies with 'npm ci'
✓ Running 'npm start'
✓ Server running on port 3001
```

**You should NOT see:**
```
✖ No start command was found
✖ package.json not found
```

### Test the Health Endpoint:
```bash
curl https://your-service-xxxx.railway.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "user-service",
  "timestamp": "2025-11-28T..."
}
```

---

## 🚨 Still Not Working?

### Double-check:

1. **Root Directory is spelled exactly right:**
   - ✅ `user-service`
   - ❌ `user-service/`
   - ❌ `/user-service`
   - ❌ `User-Service`

2. **Package.json exists in the service folder:**
   ```bash
   user-service/package.json  ✅
   user-service/server.js     ✅
   ```

3. **Start command in package.json:**
   ```json
   {
     "scripts": {
       "start": "node server.js"  ← Must exist
     }
   }
   ```

4. **Railway is pointing to the correct GitHub repo and branch:**
   - Settings → **Source** → Check repo name and branch

---

## 📚 Full Documentation

For complete deployment guide, see:
- [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) - Complete step-by-step guide
- [railway.json](railway.json) - Railway project config
- [user-service/railway.toml](user-service/railway.toml) - Service config
- [user-service/nixpacks.toml](user-service/nixpacks.toml) - Nixpacks config

---

## 💡 Why This Happens

Railway uses **Nixpacks** to auto-detect your app. When you have a monorepo with multiple services, Nixpacks looks at the root and doesn't find a `package.json`, so it fails.

**The Root Directory setting tells Railway:** "Look in this subdirectory instead of the root."

Once configured, Railway will:
1. Navigate to `user-service/` folder
2. Find `package.json`
3. Run `npm ci` to install dependencies
4. Run `npm start` to start the server
5. ✅ Success!

---

## 🎉 Expected Result

After configuring Root Directory correctly:

```
Building...
✓ Detected Node.js project
✓ Installing dependencies with npm ci
✓ Running start command: npm start
✓ Server listening on port 3001

Deployment successful! 🚀
```

**Your service will be live at:**
```
https://user-service-production-xxxx.railway.app
```

---

**Need help?** Check the full guide: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)
