const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { applyCouponSchema } = require('../validators/couponValidator');

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/item/:itemId', cartController.updateCartQuantity);
router.delete('/item/:itemId', cartController.removeFromCart);
router.put('/item/:itemId/save-for-later', cartController.toggleSaveForLater);
router.post('/apply-coupon', validate(applyCouponSchema), cartController.applyCoupon);
router.delete('/remove-coupon', cartController.removeCoupon);

module.exports = router;
