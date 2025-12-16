const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Message Service API',
      version: '1.0.0',
      description: 'API de messagerie - Gère les conversations, messages, fichiers et WebSocket en temps réel avec support E2EE',
      contact: {
        name: 'OvO Team',
      },
    },
    servers: [
      {
        url: 'http://localhost/messages',
        description: 'Development server (via Traefik)',
      },
      {
        url: 'http://localhost:3003',
        description: 'Direct service endpoint',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenu depuis /auth/login',
        },
      },
      schemas: {
        Conversation: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6581234567890abcdef12345' },
            participants: {
              type: 'array',
              items: { type: 'integer' },
              example: [1, 2],
            },
            isGroup: { type: 'boolean', example: false },
            groupName: { type: 'string', nullable: true, example: 'Groupe de travail' },
            groupAdmin: { type: 'integer', nullable: true, example: 1 },
            messages: {
              type: 'array',
              items: { $ref: '#/components/schemas/Message' },
            },
            lastMessage: { $ref: '#/components/schemas/LastMessage' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6581234567890abcdef12346' },
            from: { type: 'integer', example: 1 },
            content: { type: 'string', example: 'Hello world!' },
            encrypted: { type: 'boolean', example: false },
            encryptedPayloads: {
              type: 'object',
              additionalProperties: { type: 'string' },
              example: { 'userId:deviceId': 'base64_encrypted_data' },
            },
            nonce: { type: 'string', nullable: true, example: 'base64_nonce' },
            senderDeviceId: { type: 'string', nullable: true, example: 'device-123' },
            attachments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attachment' },
            },
            readBy: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'integer', example: 2 },
                  readAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            reactions: {
              type: 'array',
              items: { $ref: '#/components/schemas/Reaction' },
            },
            replyTo: { type: 'string', nullable: true, example: '6581234567890abcdef12345' },
            editedAt: { type: 'string', format: 'date-time', nullable: true },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Attachment: {
          type: 'object',
          properties: {
            filename: { type: 'string', example: 'upload-1234567890.jpg' },
            originalName: { type: 'string', example: 'photo.jpg' },
            url: { type: 'string', example: '/messages/uploads/upload-1234567890.jpg' },
            mimeType: { type: 'string', example: 'image/jpeg' },
            size: { type: 'integer', example: 102400 },
            encrypted: { type: 'boolean', example: false },
            encryptedData: { type: 'string', nullable: true },
          },
        },
        Reaction: {
          type: 'object',
          properties: {
            emoji: { type: 'string', example: '👍' },
            userId: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        LastMessage: {
          type: 'object',
          properties: {
            content: { type: 'string', example: 'Dernier message' },
            from: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateConversationRequest: {
          type: 'object',
          required: ['participants'],
          properties: {
            participants: {
              type: 'array',
              items: { type: 'integer' },
              example: [2, 3],
            },
            isGroup: { type: 'boolean', example: false },
            groupName: { type: 'string', example: 'Mon groupe' },
          },
        },
        SendMessageRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'Hello!' },
            encrypted: { type: 'boolean', example: false },
            encryptedPayloads: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
            nonce: { type: 'string' },
            senderDeviceId: { type: 'string' },
            attachments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attachment' },
            },
            replyTo: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Conversations',
        description: 'Gestion des conversations (privées et groupes)',
      },
      {
        name: 'Messages',
        description: 'Gestion des messages',
      },
      {
        name: 'Files',
        description: 'Upload et téléchargement de fichiers',
      },
      {
        name: 'WebSocket',
        description: 'Événements temps réel (Socket.io)',
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
