const Razorpay = require('razorpay');
const env = require('./env');
const logger = require('../utils/logger');

let razorpayInstance = null;

const isConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

if (isConfigured) {
  try {
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
    logger.info('Razorpay client initialized successfully.');
  } catch (error) {
    logger.error('Failed to initialize Razorpay client:', error.message);
  }
} else {
  logger.warn('Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not set in environment. Set test keys (rzp_test_...) in .env to enable online payments.');
}

module.exports = {
  razorpay: razorpayInstance,
  isRazorpayConfigured: isConfigured,
  keyId: env.RAZORPAY_KEY_ID,
  keySecret: env.RAZORPAY_KEY_SECRET,
  webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
};
