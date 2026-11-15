const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const env = require('../config/env');
const ApiResponse = require('../utils/apiResponse');

router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  return ApiResponse.success(res, {
    status: 'healthy',
    platform: 'HumanNeed E-commerce Marketplace API',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
