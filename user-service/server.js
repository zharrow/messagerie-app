const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');
const publicRoutes = require('./routes/public');
const internalRoutes = require('./routes/internal');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/users', publicRoutes);
app.use('/internal', internalRoutes);

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`User Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
