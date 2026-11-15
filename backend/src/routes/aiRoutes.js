const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { searchLimiter } = require('../middleware/rateLimiter');

// Public AI Shopping Assistant chat with rate limiting
router.post('/chat', searchLimiter, aiController.chatWithAssistant);

module.exports = router;
