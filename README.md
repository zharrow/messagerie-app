# Messaging App

Application de messagerie temps réel avec chiffrement de bout en bout (E2EE).

## 🚀 Démarrage rapide

### Prérequis

- Docker Desktop installé et en cours d'exécution

### Installation

1. **Cloner le projet**
```bash
git clone https://github.com/zharrow/messagerie-app
cd FullStack
```

2. **Créer le fichier `.env`**

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d

# Internal Service Authentication
INTERNAL_SECRET=your-internal-service-secret-key-change-this

# PostgreSQL Configuration
POSTGRES_USER=userservice
POSTGRES_PASSWORD=userpassword123
POSTGRES_DB=users_db

# Redis Configuration
REDIS_PASSWORD=redispassword123

# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=mongopassword123
MONGO_INITDB_DATABASE=messages_db
```

3. **Lancer l'application**
```bash
docker-compose up -d --build
```

4. **Accéder à l'application**

Ouvrez votre navigateur à l'adresse : **http://localhost**

## 👤 Comptes de test

Trois utilisateurs sont créés automatiquement au démarrage :

| Email | Mot de passe | Nom |
|-------|--------------|-----|
| `anakin@skywalker.fr` | `Password123` | Anakin Skywalker |
| `dark@vador.fr` | `Password123` | Dark Vador |
| `luke@skywalker.fr` | `Password123` | Luke Skywalker |

💡 **Astuce** : Ouvrez deux navigateurs (ou une fenêtre privée) pour tester la messagerie temps réel entre deux utilisateurs !

## 📋 Commandes utiles

### Arrêter l'application
```bash
docker-compose down
```

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f user-service
docker-compose logs -f auth-service
docker-compose logs -f message-service
```

### Redémarrer un service
```bash
docker-compose restart user-service
```

### Reconstruire après modification du code
```bash
docker-compose up -d --build
```

## 🔧 Vérification

Pour vérifier que tout fonctionne :

```bash
# Vérifier les services
curl http://localhost/users/health
curl http://localhost/auth/health
curl http://localhost/messages/health
```

Tous doivent retourner `{"status":"ok"}`

## 📖 Documentation technique

Pour plus de détails sur l'architecture et les fonctionnalités, consultez [README_DETAILS.md](README_DETAILS.md)

## ⚠️ Remarques

- **Première utilisation** : Le premier build peut prendre quelques minutes
- **Ports utilisés** : 80 (HTTP), 8080 (Traefik Dashboard)
- **Données persistantes** : Les données sont stockées dans des volumes Docker et persistent entre les redémarrages
