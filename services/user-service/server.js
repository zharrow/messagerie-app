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

const app = express();
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

// Initialize database and start server
initDatabase()
  .then(async () => {
    // Initialize profile columns if they don't exist
    await User.initializeProfileColumns();
    console.log('Profile columns initialized');

    // Initialize user_keys table for E2EE
    await UserKey.initializeTable();
    console.log('User keys table initialized');

    // Seed initial users
    await seedUsers();

    app.listen(PORT, () => {
      console.log(`User Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
