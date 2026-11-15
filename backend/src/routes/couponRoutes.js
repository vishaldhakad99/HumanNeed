const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validation');
const { createCouponSchema } = require('../validators/couponValidator');

// Public validation
router.post('/validate', couponController.validateCoupon);

// Admin-only management
router.get('/', authenticate, authorize('admin'), couponController.getAllCoupons);
router.post('/', authenticate, authorize('admin'), validate(createCouponSchema), couponController.createCoupon);
router.put('/:id', authenticate, authorize('admin'), couponController.updateCoupon);
router.delete('/:id', authenticate, authorize('admin'), couponController.deleteCoupon);

module.exports = router;
