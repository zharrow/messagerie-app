const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup avant tous les tests
beforeAll(async () => {
  try {
    // Créer instance MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connecter Mongoose
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB Memory Server connected');
  } catch (error) {
    console.error('❌ MongoDB Memory Server connection failed:', error);
    throw error;
  }
});

// Cleanup après chaque test
afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  }
});

// Cleanup après tous les tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('✅ MongoDB Memory Server stopped');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
});

// Timeout global
jest.setTimeout(10000);
