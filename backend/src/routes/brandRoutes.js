const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', brandController.getBrands);

// Admin-only brand management
router.post('/', authenticate, authorize('admin'), brandController.createBrand);
router.put('/:id', authenticate, authorize('admin'), brandController.updateBrand);
router.delete('/:id', authenticate, authorize('admin'), brandController.deleteBrand);

module.exports = router;
