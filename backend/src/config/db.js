const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('MongoDB is already connected.');
    return;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 4000,
    });

    isConnected = true;
    logger.info(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    logger.warn(`Could not connect to configured MongoDB URI (${env.MONGODB_URI}): ${error.message}`);
    if (env.NODE_ENV === 'production') {
      logger.error('Fatal: Cannot run in production without a valid MongoDB connection.');
      process.exit(1);
    } else {
      logger.info('Starting local in-memory MongoDB server for development fallback...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        await mongoose.connect(memUri);
        isConnected = true;
        logger.info(`In-memory development MongoDB connected successfully at: ${memUri}`);
      } catch (memErr) {
        logger.error(`In-memory MongoDB startup failed: ${memErr.message}`);
      }
    }
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB connection lost. Reconnecting...');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB runtime error: ${err.message}`);
});

module.exports = { connectDB, getIsConnected: () => isConnected };
