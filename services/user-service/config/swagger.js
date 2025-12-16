const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      version: '1.0.0',
      description: 'API de gestion des utilisateurs - Gère l\'enregistrement, les profils, les statuts et les clés de chiffrement E2EE',
      contact: {
        name: 'OvO Team',
      },
    },
    servers: [
      {
        url: 'http://localhost/users',
        description: 'Development server (via Traefik)',
      },
      {
        url: 'http://localhost:3001',
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
        InternalSecret: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Internal-Secret',
          description: 'Secret pour les appels service-to-service',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            profile_photo_url: { type: 'string', nullable: true, example: 'https://example.com/photo.jpg' },
            bio: { type: 'string', nullable: true, example: 'Développeur passionné' },
            status: { type: 'string', enum: ['online', 'offline', 'busy', 'away'], example: 'online' },
            status_message: { type: 'string', nullable: true, example: 'En réunion' },
            last_seen_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        UserKey: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            device_id: { type: 'string', example: 'device-12345' },
            public_key: { type: 'string', example: 'dGVzdF9wdWJsaWNfa2V5X2Jhc2U2NA==' },
            key_fingerprint: { type: 'string', example: 'a1b2c3d4e5f6...' },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
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
        name: 'Users',
        description: 'Gestion des utilisateurs',
      },
      {
        name: 'Profile',
        description: 'Gestion des profils utilisateurs',
      },
      {
        name: 'Status',
        description: 'Gestion des statuts utilisateurs',
      },
      {
        name: 'Keys',
        description: 'Gestion des clés de chiffrement E2EE',
      },
      {
        name: 'Internal',
        description: 'Endpoints internes (service-to-service)',
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
