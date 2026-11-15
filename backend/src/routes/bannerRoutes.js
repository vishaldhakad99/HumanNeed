const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Public active banners
router.get('/active', bannerController.getActiveBanners);

// Admin-only banner management
router.get('/', authenticate, authorize('admin'), bannerController.getAllBanners);
router.post('/', authenticate, authorize('admin'), bannerController.createBanner);
router.put('/:id', authenticate, authorize('admin'), bannerController.updateBanner);
router.delete('/:id', authenticate, authorize('admin'), bannerController.deleteBanner);

module.exports = router;
