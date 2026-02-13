const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { initDatabase } = require('./config/database');
const publicRoutes = require('./routes/public');
const internalRoutes = require('./routes/internal');
const User = require('./models/User');
const UserKey = require('./models/UserKey');
const { seedUsers } = require('./seeders/seedUsers');
const swaggerSpec = require('./config/swagger');

const { app, server } = createApp();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(morgan('combined')); // HTTP request logger
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'User Service API Documentation',
}));

// Routes
app.use('/users', publicRoutes);
app.use('/internal', internalRoutes);

// Initialize and start
startServer({
  server,
  port: PORT,
  serviceName: 'User Service',
  initFn: async () => {
    await initDatabase();
    await User.initializeProfileColumns();
    console.log('Profile columns initialized');
    await UserKey.initializeTable();
    console.log('User keys table initialized');
    await seedUsers();
  }
});
