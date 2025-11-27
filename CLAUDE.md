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
- **Purpose:** User registration, profile management, credential verification, status management, E2EE key management
- **Key files:**
  - `user-service/controllers/userController.js` - Business logic
  - `user-service/controllers/keyController.js` - E2EE key management
  - `user-service/models/User.js` - Database model with bcrypt hashing and profile fields
  - `user-service/models/UserKey.js` - E2EE public key storage
  - `user-service/middlewares/auth.js` - JWT validation via Auth Service
- **Endpoints:**
  - `POST /users/register` - User registration
  - `GET /users` - List all users
  - `GET /users/:id` - Get user by ID
  - `PUT /users/:id` - Update user name
  - `GET /users/:id/profile` - Get user profile (photo, bio, status)
  - `PUT /users/:id/profile` - Update profile (photo_url, bio)
  - `PUT /users/:id/status` - Update status (online/offline/busy/away + message)
  - `POST /users/keys` - Upload public encryption key
  - `GET /users/keys/me` - Get own encryption keys
  - `GET /users/:userId/keys` - Get user's public keys
  - `POST /users/keys/bulk` - Get public keys for multiple users
  - `DELETE /users/keys/:device_id` - Deactivate device key
- **Internal endpoint:** `POST /internal/verify-credentials` - Called by Auth Service during login

### Auth Service (Express.js + Redis)
- **Purpose:** JWT token generation, validation, refresh, and blacklisting
- **Key files:**
  - `auth-service/services/tokenService.js` - Token creation/validation/refresh
  - `auth-service/utils/jwt.js` - JWT helpers with duration parsing
- **Token strategy:** Access (15min) + Refresh (30 days with remember_me)
- **Internal endpoint:** `POST /internal/validate-token` - Called by other services

### Message Service (Express.js + MongoDB + Socket.io)
- **Purpose:** Conversations, messages, real-time chat, file uploads, E2EE message routing
- **Key files:**
  - `message-service/models/Conversation.js` - MongoDB schema with messages, reactions, attachments, encryption fields
  - `message-service/services/socketService.js` - WebSocket event handlers
  - `message-service/services/uploadService.js` - File upload handling (multer)
  - `message-service/services/encryptionService.js` - E2EE validation and key fetching
  - `message-service/controllers/messageController.js` - REST API handlers
- **REST Endpoints:**
  - `GET /messages/conversations` - List user's conversations
  - `POST /messages/conversations` - Create conversation (private or group)
  - `GET /messages/conversations/:id` - Get conversation with messages
  - `DELETE /messages/conversations/:id` - Delete conversation (admin only for groups)
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
- **Architecture:**
  - **Refactored from monolithic Chat.tsx (939 lines) to modular structure**
  - Custom hooks for business logic separation
  - Reusable UI components
  - Type-safe with TypeScript interfaces
- **Key files:**
  - `frontend/src/contexts/AuthContext.tsx` - Global auth state with E2EE initialization
  - `frontend/src/services/api.ts` - Axios with auto token refresh
  - `frontend/src/services/socket.ts` - Socket.io client with all event helpers
  - `frontend/src/services/encryption.ts` - E2EE client-side encryption/decryption (TweetNaCl)
  - `frontend/src/pages/Chat.tsx` - Main chat orchestrator (220 lines)
  - **Hooks:** `useUserCache`, `useConversations`, `useSocketEvents`, `useMessages`, `useTypingIndicator`, `useGifSearch`, `useEncryption`, `useMessageDecryption`
  - **Components:** `Message`, `MessageList`, `MessageInput`, `ChatHeader`, `ConversationSidebar`, `ProfileSidebar`, `GifPicker`, `CreateGroupModal`, `GroupSettingsModal`, `DeleteMessageModal`, `FireButton`, `Fire3DShaders`, `EncryptionBadge`
  - **Utils:** `chatHelpers.ts` - Utility functions (isGifUrl, formatMessageTime, groupReactionsByEmoji, etc.)
  - **Types:** `frontend/src/types/chat.ts` - Shared TypeScript interfaces (User, Message, Conversation, Attachment, Reaction)
- **Features:**
  - Real-time messaging with WebSocket
  - **GIF support:**
    - GIF search via Tenor API (Google)
    - Modal picker with search bar
    - Trending GIFs by default
    - Automatic GIF detection and display in messages
    - Debounced search (500ms)
  - **Message editing and deletion:**
    - Edit/delete buttons visible on hover for own messages
    - Inline editing with improved UI (300-500px width)
    - Save with Enter, Cancel with Escape
    - Custom delete confirmation modal (replaces native alert)
    - Real-time updates via WebSocket (message_edited, message_deleted events)
    - Soft delete in backend (deletedAt flag), filtered on load
  - **Emoji reactions:**
    - 6 emoji reactions available: 👍 ❤️ 😂 😮 😢 🙏
    - Reaction button on hover: center bottom for own messages, right side for received messages
    - Emoji picker popup with all available reactions
    - Reactions grouped by emoji with count display
    - Highlighted style when user has reacted
    - Click to toggle reaction (add/remove)
    - Real-time updates via WebSocket (reaction_added, reaction_removed events)
  - Reply to messages (quote)
  - **File/image upload and preview:**
    - **Paperclip button** (📎) in MessageInput to attach files
    - **Multi-file selection:** Up to 5 files at once
    - **File validation:** Max 10MB per file, automatic size checking
    - **Preview interface:** Shows selected files before sending with name, size, and remove option
    - **Supported types:**
      - Images: jpg, png, gif, webp, svg (displayed inline in chat)
      - Documents: pdf, doc, docx, xls, xlsx, txt (shown as downloadable links)
      - Archives: zip, rar
    - **Smart display:**
      - Images: Rendered as clickable thumbnails (max-h-60) in messages
      - Documents: Shown as clickable links with FileText icon, name, size, and Download icon
    - **Upload flow:** Files uploaded to `/messages/upload`, then attachment objects sent via WebSocket
    - **Storage:** Files stored in `message-service/uploads/` directory
    - **URL resolution:** Frontend prefixes relative URLs with API_URL for correct file access
    - **Fixed bug:** Attachments now display correctly with full URLs in messages and ProfileSidebar
  - Search messages
  - Read receipts with timestamps (✓ sent, ✓✓ delivered, ✓✓ read)
  - Unread message badges
  - Typing indicators
  - Notification sounds (toggleable)
  - User online status
  - Smooth animations with opacity transitions
  - **UI Design (Messenger-style):**
    - **Color palette:** Red primary Fire Finch (#E4524D / primary-600), white backgrounds, gray accents
    - **Message bubbles:**
      - Rounded corners (rounded-2xl) with asymmetric corners
      - Sent messages: Red background Fire Finch (#E4524D) with white text
      - Received messages: Light gray background (#E5E7EB) with dark text
      - Max width 450px with proper word wrapping
    - **Buttons and inputs:**
      - Rounded full buttons (rounded-full) with red accents
      - Hover states with gray backgrounds (hover:bg-gray-100)
      - Input fields with rounded-full style and gray backgrounds
      - Red action buttons (bg-primary-600)
    - **Spacing and layout:**
      - 1px between same-sender messages, 16px between groups
      - Time displayed only on last message of each group
      - Fixed horizontal scrollbar issue (overflow-x-hidden)
      - Hover effects with group class for better UX
    - **ConversationSidebar:**
      - Width: 360px with search bar at top
      - Rounded search input with magnifying glass icon
      - Red selection highlight (bg-primary-50)
      - Large avatars (h-14 w-14)
    - **ChatHeader:**
      - Phone, Video, Info icons in red
      - All buttons rounded with hover effects
    - **MessageInput:**
      - Placeholder "Aa" like Messenger
      - Red send button (rounded-full)
      - All action icons in red
  - **Fun features:**
    - Fire button with 3D volumetric shaders (react-shaders) - GPU-accelerated flame effect
    - Flame icon for celebrations
    - 3-second full-screen fire animation with raymarching and turbulence
  - **Group conversations:**
    - **Create groups with 1+ members** via `CreateGroupModal` component
    - **Multi-select interface:** Users can select multiple participants with checkboxes
    - **Smart conversation creation:**
      - 1 member selected → Creates private conversation (no group name required)
      - 2+ members selected → Creates group (group name required)
    - **Group name input:** Only appears when 2+ members are selected
    - **Search functionality:** Filter users by name or email
    - **Selected members counter:** Shows how many members are selected
    - **Visual feedback:** Selected users highlighted with checkmark badge
    - **Dynamic member management:** Add/remove members after group creation
    - **Full message history:** New members get access to all previous messages
    - **Group indicators:** Groups display with Users icon in conversation list
    - **Group Settings Modal** (`GroupSettingsModal` component):
      - **Access:** Admin-only via "Paramètres du groupe" button in ProfileSidebar
      - **Sections:**
        - Group name display
        - Members list with online status and admin badges
        - Add members interface with search and multi-select
        - Remove member buttons (admin only, cannot remove self)
        - Conversation statistics
      - **Add members flow:**
        - Search bar to filter available users
        - Checkbox selection (shows only non-members)
        - Selected users counter and confirmation button
        - Real-time update after adding
      - **Danger zone (admin only):**
        - Delete group button with two-step confirmation
        - Warning message about irreversibility
        - Deletes all messages and files permanently
      - **Styling:** Red buttons for actions, darker red for dangerous operations
  - **Profile Sidebar** (`ProfileSidebar` component):
    - **Toggle button:** User icon button in ChatHeader to open/close profile sidebar
    - **Responsive panel:** 320px right sidebar that slides in/out
    - **3 tabs:**
      1. **Infos Tab:**
         - Large avatar (24x24) with online status indicator
         - User/group name and status (online/offline)
         - **Group members list** (if group):
           - Shows all participants with avatars
           - Displays admin badge
           - "Add member" button (visible to admin)
           - "Remove member" button per user (admin only)
         - **Conversation statistics:**
           - Total messages count
           - Photos shared count
           - Files shared count
         - **Group settings button** (admin only)
      2. **Médias Tab:**
         - **Grid display** (3 columns) of all shared images
         - Clickable thumbnails (opens in new tab)
         - Empty state with Image icon
         - **Filters images** from message attachments
      3. **Fichiers Tab:**
         - **List display** of all non-image files
         - Shows file icon, name, extension, and size (MB)
         - Clickable to download/open
         - Empty state with FileText icon
         - **Filters documents/archives** from message attachments
    - **Data extraction:**
      - Scans all conversation messages
      - Extracts attachments by mimeType
      - Images: `mimeType.startsWith('image/')`
      - Files: `!mimeType.startsWith('image/')`
  - **End-to-End Encryption (E2EE):**
    - Client-side encryption using TweetNaCl (Curve25519)
    - Automatic key generation on login
    - Private keys stored locally (never sent to server)
    - Public keys distributed via User Service
    - Encryption badge indicator in chat header
    - Per-device encryption support
    - Safety numbers for key verification (planned)
    - Encrypted file attachments (planned)

## Authentication Flow

1. Login: `POST /auth/login` → Auth Service calls User Service `/internal/verify-credentials`
2. Token validation: Services call Auth Service `/internal/validate-token`
3. Refresh: `POST /auth/refresh` with refresh_token
4. Logout: Access token blacklisted in Redis, refresh token deleted

## End-to-End Encryption (E2EE)

**Cryptographic Implementation:**
- **Library:** TweetNaCl (NaCl - Networking and Cryptography library)
- **Algorithm:** Curve25519 elliptic curve cryptography
- **Encryption:** NaCl box (public-key authenticated encryption)
- **Key Size:** 256-bit (32 bytes)

**E2EE Flow:**
```
1. Key Generation (Client-Side):
   - User logs in → Frontend generates key pair (public + private)
   - Private key: Stored in localStorage (NEVER sent to server)
   - Public key: Uploaded to User Service for other users to fetch

2. Sending Encrypted Message:
   - Sender fetches recipient's public key(s) from User Service
   - Sender encrypts message with recipient's public key + own private key
   - Encrypted payload sent to Message Service
   - Server stores encrypted data (cannot decrypt)

3. Receiving Encrypted Message:
   - Recipient receives encrypted payload from server
   - Recipient decrypts with own private key + sender's public key
   - Only the recipient can read the message
```

**Key Features:**
- Per-device encryption keys (multi-device support)
- Public keys stored in PostgreSQL (`user_keys` table)
- Private keys never leave the client device
- Encryption badge shown in chat header (lock icon)
- Auto-initialization on login
- Key fingerprints for verification (safety numbers)
- Support for encrypted file attachments

**Security Properties:**
- **Confidentiality:** Only sender and recipient can read messages
- **Authenticity:** Messages are cryptographically signed
- **Integrity:** Tampering is detected automatically
- **Forward Secrecy:** Planned (session keys rotation)

**Limitations (Current Implementation):**
- Search only works on unencrypted messages (server cannot index encrypted content)
- Reactions and message metadata (timestamps, read receipts) are NOT encrypted
- Group messages use individual encryption per recipient (no shared secret yet)

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

user_keys (
  id,
  user_id,            -- Foreign key to users.id
  device_id,          -- Unique device identifier
  public_key,         -- Base64 encoded Curve25519 public key (44 chars)
  key_fingerprint,    -- Hex fingerprint for verification (64 chars)
  is_active,          -- Key activation status
  created_at,
  updated_at,
  UNIQUE(user_id, device_id)
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
    content: String,                    // Plaintext or "[Encrypted Message]"
    encrypted: Boolean,                 // E2EE flag
    encryptedPayloads: Map<String>,     // { "userId:deviceId": "base64EncryptedData" }
    nonce: String,                      // Base64 nonce for decryption
    senderDeviceId: String,             // Device that sent the message
    attachments: [{
      filename: String,
      originalName: String,
      url: String,
      mimeType: String,
      size: Number,
      encrypted: Boolean,               // E2EE for attachments
      encryptedData: String             // Encrypted file data
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
    replyTo: ObjectId,                  // Reference to parent message
    editedAt: Date,                     // Edit timestamp
    deletedAt: Date,                    // Soft delete timestamp
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

## Frontend Dependencies

**Key packages:**
- `react` + `react-dom` - UI framework
- `typescript` - Type safety
- `vite` - Build tool and dev server
- `socket.io-client` - WebSocket client
- `axios` - HTTP client with interceptors
- `react-router-dom` - Routing
- `lucide-react` - Icon library
- `react-shaders` - GPU-accelerated WebGL shader effects for 3D fire animation
- `tweetnacl` + `tweetnacl-util` - E2EE cryptography library
- `tailwindcss` - Utility-first CSS
- `shadcn/ui` - UI component library

**Development:**
- `@vitejs/plugin-react` - React support for Vite
- `tailwindcss-animate` - Animation utilities
- `eslint` + `typescript-eslint` - Linting
