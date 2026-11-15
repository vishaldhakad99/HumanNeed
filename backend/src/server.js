const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');

const server = http.createServer(app);

// Socket.io for real-time platform updates
const io = new Server(server, {
  cors: {
    origin: [env.FRONTEND_URL, 'http://localhost:5173'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.debug(`Socket client connected: ${socket.id}`);

  // Join personal user room for order updates
  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  // Join seller room for live order notifications
  socket.on('join_seller_room', (sellerId) => {
    if (sellerId) {
      socket.join(`seller_${sellerId}`);
    }
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket client disconnected: ${socket.id}`);
  });
});

// Attach io to express app for controller access if needed
app.set('io', io);

// Start server
const startServer = async () => {
  await connectDB();

  server.listen(env.PORT, () => {
    logger.info(`=======================================================`);
    logger.info(`  HumanNeed API Server running in ${env.NODE_ENV} mode`);
    logger.info(`  Listening on: http://localhost:${env.PORT}`);
    logger.info(`  Health Check: http://localhost:${env.PORT}/api/health`);
    logger.info(`=======================================================`);
  });
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server };
