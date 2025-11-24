const express = require('express');
const cors = require('cors');
const { initRedis } = require('./config/redis');
const publicRoutes = require('./routes/public');
const internalRoutes = require('./routes/internal');

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

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
