const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');
const {
  createOrderSchema,
  cancelOrderSchema,
  returnOrderSchema,
} = require('../validators/orderValidator');

router.use(authenticate);

router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:id/cancel', validate(cancelOrderSchema), orderController.cancelOrder);
router.post('/:id/return', validate(returnOrderSchema), orderController.requestReturn);
router.get('/:id/invoice', orderController.getOrderInvoice);

module.exports = router;
