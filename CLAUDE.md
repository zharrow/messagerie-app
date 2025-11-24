# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Microservices-based messaging application with JWT authentication, real-time WebSocket chat, and API Gateway routing.

## Architecture

```
[Traefik Gateway :80]
       │
       ├── /users/*    → [User Service :3001]    → [PostgreSQL]
       ├── /auth/*     → [Auth Service :3002]    → [Redis]
       ├── /messages/* → [Message Service :3003] → [MongoDB]
       └── /*          → [Frontend React]
```

**Service Communication Pattern:**
- Public requests: Client → Traefik → Service
- Internal requests: Service → Service (via Docker network with `X-Internal-Secret` header)
- Real-time: Client → WebSocket `/messages/socket.io` → Message Service

## Common Commands

```bash
# Start all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build user-service

# View logs
docker-compose logs -f user-service
docker-compose logs -f auth-service
docker-compose logs -f message-service

# Access databases
docker-compose exec postgres psql -U userservice -d users_db
docker-compose exec redis redis-cli -a redispassword123
docker-compose exec mongodb mongosh

# Health checks
curl http://localhost/users/health
curl http://localhost/auth/health
curl http://localhost/messages/health

# Traefik dashboard
http://localhost:8080
```

## Service Details

### User Service (Express.js + PostgreSQL)
- **Purpose:** User registration, profile management, credential verification
- **Key files:**
  - `user-service/controllers/userController.js` - Business logic
  - `user-service/models/User.js` - Database model with bcrypt hashing
  - `user-service/middlewares/auth.js` - JWT validation via Auth Service
- **Internal endpoint:** `POST /internal/verify-credentials` - Called by Auth Service during login

### Auth Service (Express.js + Redis)
- **Purpose:** JWT token generation, validation, refresh, and blacklisting
- **Key files:**
  - `auth-service/services/tokenService.js` - Token creation/validation/refresh
  - `auth-service/utils/jwt.js` - JWT helpers with duration parsing
- **Token strategy:** Access (15min) + Refresh (30 days with remember_me)
- **Internal endpoint:** `POST /internal/validate-token` - Called by other services

### Message Service (Express.js + MongoDB + Socket.io)
- **Purpose:** Conversations, messages, real-time chat
- **Key files:**
  - `message-service/models/Conversation.js` - MongoDB schema (conversations with nested messages)
  - `message-service/services/socketService.js` - WebSocket event handlers
- **WebSocket events:** `send_message`, `typing_start/stop`, `mark_read`, `new_message`

### Frontend (React + TypeScript + Vite)
- **Key files:**
  - `frontend/src/contexts/AuthContext.tsx` - Global auth state
  - `frontend/src/services/api.ts` - Axios with auto token refresh
  - `frontend/src/services/socket.ts` - Socket.io client
  - `frontend/src/pages/Chat.tsx` - Main chat interface

## Authentication Flow

1. Login: `POST /auth/login` → Auth Service calls User Service `/internal/verify-credentials`
2. Token validation: Services call Auth Service `/internal/validate-token`
3. Refresh: `POST /auth/refresh` with refresh_token
4. Logout: Access token blacklisted in Redis, refresh token deleted

## Database Schemas

**PostgreSQL (users):**
```sql
users (id, email, password_hash, first_name, last_name, created_at, updated_at)
```

**MongoDB (conversations):**
```javascript
{ participants: [userId], isGroup, groupName, groupAdmin,
  messages: [{ from, content, readBy: [], createdAt }], lastMessage }
```

**Redis:**
- `refresh_token:<jwt>` → user data (TTL: 30d or 1d)
- `blacklist:<jwt>` → "1" (TTL: remaining expiration)

## Environment Variables

Key variables in `.env`:
- `JWT_SECRET` - Shared between all services for token signing
- `INTERNAL_SECRET` - Shared secret for service-to-service auth
- `POSTGRES_*` - PostgreSQL credentials
- `REDIS_PASSWORD` - Redis authentication

## Traefik Routing

Routes defined via Docker labels in `docker-compose.yml`:
```yaml
labels:
  - "traefik.http.routers.{service}.rule=PathPrefix(`/{path}`)"
  - "traefik.http.services.{service}.loadbalancer.server.port={port}"
```

## Password Validation

Registration requires: 8+ characters, uppercase, lowercase, and number.
Regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`
