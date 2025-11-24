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
- **Purpose:** User registration, profile management, credential verification, status management
- **Key files:**
  - `user-service/controllers/userController.js` - Business logic
  - `user-service/models/User.js` - Database model with bcrypt hashing and profile fields
  - `user-service/middlewares/auth.js` - JWT validation via Auth Service
- **Endpoints:**
  - `POST /users/register` - User registration
  - `GET /users` - List all users
  - `GET /users/:id` - Get user by ID
  - `PUT /users/:id` - Update user name
  - `GET /users/:id/profile` - Get user profile (photo, bio, status)
  - `PUT /users/:id/profile` - Update profile (photo_url, bio)
  - `PUT /users/:id/status` - Update status (online/offline/busy/away + message)
- **Internal endpoint:** `POST /internal/verify-credentials` - Called by Auth Service during login

### Auth Service (Express.js + Redis)
- **Purpose:** JWT token generation, validation, refresh, and blacklisting
- **Key files:**
  - `auth-service/services/tokenService.js` - Token creation/validation/refresh
  - `auth-service/utils/jwt.js` - JWT helpers with duration parsing
- **Token strategy:** Access (15min) + Refresh (30 days with remember_me)
- **Internal endpoint:** `POST /internal/validate-token` - Called by other services

### Message Service (Express.js + MongoDB + Socket.io)
- **Purpose:** Conversations, messages, real-time chat, file uploads
- **Key files:**
  - `message-service/models/Conversation.js` - MongoDB schema with messages, reactions, attachments
  - `message-service/services/socketService.js` - WebSocket event handlers
  - `message-service/services/uploadService.js` - File upload handling (multer)
  - `message-service/controllers/messageController.js` - REST API handlers
- **REST Endpoints:**
  - `GET /messages/conversations` - List user's conversations
  - `POST /messages/conversations` - Create conversation (private or group)
  - `GET /messages/conversations/:id` - Get conversation with messages
  - `GET /messages/conversations/:id/messages` - Get messages with pagination
  - `POST /messages/conversations/:id/messages` - Send message (REST fallback)
  - `PUT /messages/conversations/:id/read` - Mark messages as read
  - `POST /messages/conversations/:id/participants` - Add member(s) to group
  - `DELETE /messages/conversations/:id/participants/:participantId` - Remove member from group
  - `POST /messages/upload` - Upload files (max 10MB, 5 files)
  - `GET /messages/search?q=` - Search messages
  - `GET /messages/uploads/:filename` - Serve uploaded files
- **WebSocket events (client → server):**
  - `send_message` - Send message with optional attachments and replyTo
  - `add_reaction` - Add emoji reaction to message
  - `remove_reaction` - Remove emoji reaction
  - `edit_message` - Edit own message
  - `delete_message` - Soft delete own message
  - `typing_start/stop` - Typing indicators
  - `mark_read` - Mark messages as read
  - `join_conversation` - Join socket room
  - `leave_conversation` - Leave socket room
- **WebSocket events (server → client):**
  - `new_message` - New message received
  - `reaction_added` - Reaction added to message
  - `reaction_removed` - Reaction removed
  - `message_edited` - Message was edited
  - `message_deleted` - Message was deleted
  - `user_typing` - User typing status
  - `messages_read` - Messages marked as read
  - `user_online/offline` - User presence

### Frontend (React + TypeScript + Vite)
- **Key files:**
  - `frontend/src/contexts/AuthContext.tsx` - Global auth state
  - `frontend/src/services/api.ts` - Axios with auto token refresh
  - `frontend/src/services/socket.ts` - Socket.io client with all event helpers
  - `frontend/src/pages/Chat.tsx` - Main chat interface with all features
  - `frontend/src/components/ui/AvatarStatus.tsx` - Avatar with online indicator
- **Features:**
  - Real-time messaging with WebSocket
  - Emoji reactions (👍 ❤️ 😂 😮 😢 🙏)
  - Message editing and deletion
  - Reply to messages (quote)
  - File/image upload and preview
  - Search messages
  - Read receipts with timestamps (✓ sent, ✓✓ delivered, ✓✓ read)
  - Unread message badges
  - Typing indicators
  - Notification sounds (toggleable)
  - User online status
  - Smooth animations
  - **Group conversations:**
    - Create groups with 1+ members
    - Dynamic member management (add/remove)
    - Group settings modal with member list
    - New members get full message history
  - **Message display (Messenger-style):**
    - Avatar and username above received messages
    - Color-coded messages:
      - Sender: Primary theme color
      - Receiver (private): Slate gray
      - Group: Unique color per user (10 color palette)
    - Larger, more readable message bubbles

## Authentication Flow

1. Login: `POST /auth/login` → Auth Service calls User Service `/internal/verify-credentials`
2. Token validation: Services call Auth Service `/internal/validate-token`
3. Refresh: `POST /auth/refresh` with refresh_token
4. Logout: Access token blacklisted in Redis, refresh token deleted

## Database Schemas

**PostgreSQL (users):**
```sql
users (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  profile_photo_url,  -- User avatar URL
  bio,                -- User biography
  status,             -- online/offline/busy/away
  status_message,     -- Custom status message
  last_seen_at,       -- Last activity timestamp
  created_at,
  updated_at
)
```

**MongoDB (conversations):**
```javascript
{
  participants: [userId],
  isGroup: Boolean,
  groupName: String,
  groupAdmin: Number,
  messages: [{
    from: Number,
    content: String,
    attachments: [{
      filename: String,
      originalName: String,
      url: String,
      mimeType: String,
      size: Number
    }],
    readBy: [{
      userId: Number,
      readAt: Date
    }],
    reactions: [{
      emoji: String,
      userId: Number,
      createdAt: Date
    }],
    replyTo: ObjectId,    // Reference to parent message
    editedAt: Date,       // Edit timestamp
    deletedAt: Date,      // Soft delete timestamp
    createdAt: Date
  }],
  lastMessage: { content, from, createdAt },
  createdAt: Date,
  updatedAt: Date
}
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

## File Upload

- **Max file size:** 10MB
- **Max files per upload:** 5
- **Allowed types:** Images (jpeg, png, gif, webp, svg), Documents (pdf, doc, docx, xls, xlsx, txt), Archives (zip, rar)
- **Storage:** `message-service/uploads/` directory
- **URL pattern:** `/messages/uploads/{filename}`
