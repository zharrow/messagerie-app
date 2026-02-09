const { utils } = require('./shared-lib');
const { createApp, startServer } = utils.serverFactory;
const { initDatabase } = require('./config/database');
const publicRoutes = require('./routes/public');
const internalRoutes = require('./routes/internal');
const User = require('./models/User');
const UserKey = require('./models/UserKey');
const { seedUsers } = require('./seeders/seedUsers');

const { app, server } = createApp();
const PORT = process.env.PORT || 3001;

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
