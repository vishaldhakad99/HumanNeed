const paymentService = require('../services/paymentService');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { keyId, isRazorpayConfigured } = require('../config/razorpay');
const { recordAudit } = require('../middleware/audit');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

const getPaymentConfig = (req, res) => {
  return ApiResponse.success(res, {
    isConfigured: isRazorpayConfigured,
    keyId: isRazorpayConfigured ? keyId : null,
    supportedMethods: ['razorpay', 'cod'],
    currency: 'INR',
  });
};

const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw ApiError.badRequest(
        'Missing payment verification parameters: orderId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.'
      );
    }

    const order = await paymentService.confirmPayment({
      orderId,
      userId: req.user._id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    await recordAudit(req, 'PAYMENT_VERIFIED', {
      orderId,
      paymentId: razorpayPaymentId,
      amount: order.pricing.total,
    });

    return ApiResponse.success(res, order, 'Payment verified successfully.');
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return res.status(400).json({ status: 'invalid_signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.notes && paymentEntity.notes.orderId;

      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.orderStatus = 'payment_confirmed';
          order.razorpayPaymentId = paymentEntity.id;
          order.paidAt = new Date();
          await order.save();
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  getPaymentConfig,
  verifyPayment,
  handleWebhook,
};
