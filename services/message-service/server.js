const { utils } = require('./shared-lib');
const { createApp, startServer } = utils.serverFactory;
const { connectDB } = require('./config/database');
const publicRoutes = require('./routes/public');
const { initializeSocket } = require('./services/socketService');

const { app, server } = createApp();
const PORT = process.env.PORT || 3003;

// Routes
app.use('/messages', publicRoutes);

// Initialize and start
startServer({
  server,
  port: PORT,
  serviceName: 'Message Service',
  initFn: async () => {
    await connectDB();
    initializeSocket(server);
    console.log(`WebSocket available at ws://localhost:${PORT}/messages/socket.io`);
  }
});
