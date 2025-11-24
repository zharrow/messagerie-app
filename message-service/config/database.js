const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/messages_db';

    await mongoose.connect(uri);

    console.log('Connected to MongoDB');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

module.exports = { connectDB };
