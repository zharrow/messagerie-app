const { utils } = require('./shared-lib');
const { createApp, startServer } = utils.serverFactory;
const { initRedis } = require('./config/redis');
const publicRoutes = require('./routes/public');
const internalRoutes = require('./routes/internal');

const { app, server } = createApp();
const PORT = process.env.PORT || 3002;

// Routes
app.use('/auth', publicRoutes);
app.use('/internal', internalRoutes);

// Initialize and start
startServer({
  server,
  port: PORT,
  serviceName: 'Auth Service',
  initFn: initRedis
});
