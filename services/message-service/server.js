const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const swaggerUi = require('swagger-ui-express');
const { connectDB } = require('./config/database');
const publicRoutes = require('./routes/public');
const { initializeSocket } = require('./services/socketService');
const swaggerSpec = require('./config/swagger');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(morgan('combined')); // HTTP request logger
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Message Service API Documentation',
}));

// Routes
app.use('/messages', publicRoutes);

// Initialize database and WebSocket, then start server
connectDB()
  .then(() => {
    // Initialize Socket.io
    initializeSocket(server);

    server.listen(PORT, () => {
      console.log(`Message Service running on port ${PORT}`);
      console.log(`WebSocket available at ws://localhost:${PORT}/messages/socket.io`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize:', err);
    process.exit(1);
  });
