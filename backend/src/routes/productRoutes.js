const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { searchLimiter } = require('../middleware/rateLimiter');

router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/best-sellers', productController.getBestSellers);
router.get('/recommended', productController.getRecommendedProducts);
router.get('/search/suggestions', searchLimiter, productController.getLiveSearchSuggestions);
router.post('/compare', productController.compareProducts);
router.get('/:identifier', productController.getProductBySlugOrId);

module.exports = router;
