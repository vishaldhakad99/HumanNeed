const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/product/:productId', authenticate, reviewController.createReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

module.exports = router;
