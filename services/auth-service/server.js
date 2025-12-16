const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { initRedis } = require('./config/redis');
const publicRoutes = require('./routes/public');
const internalRoutes = require('./routes/internal');
const swaggerSpec = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(morgan('combined')); // HTTP request logger
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Auth Service API Documentation',
}));

// Routes
app.use('/auth', publicRoutes);
app.use('/internal', internalRoutes);

// Initialize Redis and start server
initRedis()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Auth Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize Redis:', err);
    process.exit(1);
  });
