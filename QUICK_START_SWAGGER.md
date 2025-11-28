# 🚀 Quick Start - Documentation API Swagger

## ⚡ Accès rapide

### Développement local
```
http://localhost/api-docs.html
```

### Production (après déploiement)
```
https://ovo-messaging.vercel.app/api-docs.html
```

---

## 📖 En 3 étapes

### 1️⃣ Ouvrir Swagger UI
```bash
# Dans votre navigateur
http://localhost/api-docs.html
```

### 2️⃣ S'authentifier
```bash
# 1. Tester POST /auth/login avec :
{
  "email": "votre@email.com",
  "password": "VotreMotDePasse123",
  "rememberMe": true
}

# 2. Copier le "access_token" de la réponse

# 3. Cliquer sur "Authorize" 🔒 en haut à droite

# 4. Coller : Bearer eyJhbGci...

# 5. Cliquer "Authorize"
```

### 3️⃣ Tester l'API
```bash
# Maintenant tous les endpoints sont accessibles !

# Exemples :
- GET /users → Liste utilisateurs
- GET /messages/conversations → Vos conversations
- POST /messages/conversations → Créer conversation
- POST /messages/upload → Upload fichier
```

---

## 📚 Documentation complète

Voir **[SWAGGER_README.md](SWAGGER_README.md)** pour :
- Guide détaillé d'utilisation
- Tous les endpoints (35+)
- Schémas de données
- Événements WebSocket
- Tests et exemples
- Intégration Postman

---

## 🎯 Endpoints clés

### Authentication
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Rafraîchir token
- `POST /auth/logout` - Déconnexion

### Users
- `GET /users` - Liste utilisateurs
- `POST /users/register` - Inscription
- `GET /users/{id}/profile` - Profil complet

### Messages
- `GET /messages/conversations` - Vos conversations
- `POST /messages/conversations` - Créer conversation
- `POST /messages/conversations/{id}/messages` - Envoyer message

### Files
- `POST /messages/upload` - Upload fichiers (max 5, 10MB)

### Encryption (E2EE)
- `POST /users/keys` - Upload clé publique
- `GET /users/{userId}/keys` - Clés d'un utilisateur

---

## 🔌 WebSocket (Real-time)

Les événements WebSocket sont documentés dans Swagger UI.

**Note** : WebSocket ne peut pas être testé directement via Swagger.
Utilisez l'application OvO ou un client Socket.io.

---

## ✅ Checklist rapide

- [ ] Ouvrir `http://localhost/api-docs.html`
- [ ] Login via `POST /auth/login`
- [ ] Copier le token JWT
- [ ] Authorize avec le token
- [ ] Tester `GET /users`
- [ ] Tester `GET /messages/conversations`
- [ ] Explorer les autres endpoints

---

## 🎉 C'est tout !

Votre API est maintenant **entièrement documentée et testable** !

📖 Guide complet : [SWAGGER_README.md](SWAGGER_README.md)
🔧 Spécification OpenAPI : [swagger.yaml](swagger.yaml)
