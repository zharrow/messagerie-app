# 🏗️ Infrastructure Configuration

Ce dossier contient toute la configuration de l'infrastructure Docker et des outils de déploiement.

## 📋 Contenu

### Docker Compose
- **[docker-compose.yml](docker-compose.yml)** - Configuration complète de l'orchestration
  - 3 microservices (User, Auth, Message)
  - 3 bases de données (PostgreSQL, Redis, MongoDB)
  - Gateway Traefik
  - Frontend React

### Traefik
- **[traefik/](traefik/)** - Configuration du reverse proxy et API gateway
  - Auto-discovery Docker
  - Dashboard sur port 8080
  - Routage HTTP

### Déploiement
- **[railway.json](railway.json)** - Configuration pour Railway deployment

## 🚀 Utilisation

### Démarrer tous les services
```bash
docker-compose up -d --build
```

### Arrêter tous les services
```bash
docker-compose down
```

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f user-service
```

### Reconstruire un service spécifique
```bash
docker-compose up -d --build user-service
```

## 🔧 Services configurés

| Service | Port | Description |
|---------|------|-------------|
| **traefik** | 80, 8080 | API Gateway + Dashboard |
| **user-service** | 3001 | Gestion utilisateurs |
| **auth-service** | 3002 | Authentification JWT |
| **message-service** | 3003 | Messagerie temps réel |
| **frontend** | 80 | Application React (via Traefik) |
| **postgres** | 5432 | Base de données utilisateurs |
| **redis** | 6379 | Cache sessions |
| **mongodb** | 27017 | Base de données messages |

## 📡 Accès

- **Application** : http://localhost
- **Traefik Dashboard** : http://localhost:8080
- **Health Checks** :
  - http://localhost/users/health
  - http://localhost/auth/health
  - http://localhost/messages/health

## 🔍 Architecture

```
[Internet :80]
      ↓
[Traefik Gateway]
      ↓
  ┌───┴───┬────────┬─────────┐
  ↓       ↓        ↓         ↓
[User] [Auth] [Message] [Frontend]
  ↓       ↓        ↓
[PG]   [Redis] [MongoDB]
```

## ⚙️ Variables d'environnement

Les variables sont définies dans le fichier `.env` à la racine du projet.

Variables requises :
- `JWT_SECRET` - Secret pour les tokens JWT
- `INTERNAL_SECRET` - Secret pour la communication inter-services
- `POSTGRES_*` - Credentials PostgreSQL
- `REDIS_PASSWORD` - Mot de passe Redis

Voir [../.env.example](../.env.example) pour le template complet.

## 🐳 Volumes Docker

Les données persistent dans des volumes Docker :
- `postgres_data` - Données PostgreSQL
- `redis_data` - Données Redis
- `mongodb_data` - Données MongoDB

## 🌐 Réseaux

Deux réseaux sont configurés :
- **public** - Accès externe (Traefik)
- **internal** - Communication inter-services

## 📚 Documentation

Pour plus d'informations :
- [Guide de démarrage](../README.md)
- [Documentation technique](../CLAUDE.md)
- [Déploiement Railway](../docs/RAILWAY_DEPLOYMENT.md)
