const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0',
      description: 'API d\'authentification - Gère les tokens JWT, login, refresh et validation',
      contact: {
        name: 'OvO Team',
      },
    },
    servers: [
      {
        url: 'http://localhost/auth',
        description: 'Development server (via Traefik)',
      },
      {
        url: 'http://localhost:3002',
        description: 'Direct service endpoint',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token',
        },
        InternalSecret: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Internal-Secret',
          description: 'Secret pour les appels service-to-service',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@ovo.com' },
            password: { type: 'string', format: 'password', example: 'Admin123!' },
            remember_me: { type: 'boolean', example: true, default: false },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                email: { type: 'string', example: 'admin@ovo.com' },
                first_name: { type: 'string', example: 'Admin' },
                last_name: { type: 'string', example: 'User' },
              },
            },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refresh_token'],
          properties: {
            refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
        ValidateRequest: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
        ValidateResponse: {
          type: 'object',
          properties: {
            valid: { type: 'boolean', example: true },
            decoded: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                email: { type: 'string', example: 'admin@ovo.com' },
              },
            },
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
        name: 'Authentication',
        description: 'Endpoints d\'authentification publics',
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
