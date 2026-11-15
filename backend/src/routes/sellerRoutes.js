const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireApprovedSeller } = require('../middleware/role');
const validate = require('../middleware/validation');
const { registerSellerSchema } = require('../validators/sellerValidator');
const { createProductSchema, updateProductSchema } = require('../validators/productValidator');
const { updateOrderStatusSchema } = require('../validators/orderValidator');

router.use(authenticate);

// Seller application & profile
router.post('/apply', validate(registerSellerSchema), sellerController.applySeller);
router.get('/profile', sellerController.getSellerProfile);
router.put('/profile', sellerController.updateSellerProfile);

// Seller products management (Protected by requireApprovedSeller)
router.get('/products', requireApprovedSeller, sellerController.getSellerProducts);
router.post('/products', requireApprovedSeller, validate(createProductSchema), sellerController.createProduct);
router.put('/products/:id', requireApprovedSeller, validate(updateProductSchema), sellerController.updateProduct);
router.delete('/products/:id', requireApprovedSeller, sellerController.deleteProduct);

// Seller orders & fulfillment (Isolated to seller's items)
router.get('/orders', requireApprovedSeller, sellerController.getSellerOrders);
router.put(
  '/orders/:orderId/status',
  requireApprovedSeller,
  validate(updateOrderStatusSchema),
  sellerController.updateSellerOrderStatus
);

// Seller analytics
router.get('/analytics', requireApprovedSeller, sellerController.getSellerAnalytics);

module.exports = router;
