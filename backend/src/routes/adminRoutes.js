const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validation');
const { updateSellerStatusSchema } = require('../validators/sellerValidator');

// Enforce admin authorization on all routes
router.use(authenticate, authorize('admin'));

router.get('/metrics', adminController.getDashboardMetrics);
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/block', adminController.toggleBlockUser);

router.get('/sellers', adminController.getSellers);
router.put('/sellers/:id/status', validate(updateSellerStatusSchema), adminController.updateSellerStatus);

router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatusAdmin);
router.post('/orders/:id/return-process', adminController.processReturnRequest);

router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
