const crypto = require('crypto');
const razorpayConfig = require('../config/razorpay');
const ApiError = require('../utils/apiError');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const logger = require('../utils/logger');

class PaymentService {
  /**
   * Create Razorpay Order on server side
   * Amount must always be calculated by backend, NEVER trusted from client
   */
  async createRazorpayOrder({ orderId, amountInRupees, currency = 'INR', receipt }) {
    if (!razorpayConfig.isRazorpayConfigured || !razorpayConfig.razorpay) {
      throw ApiError.badRequest(
        'Razorpay payment gateway is not yet configured. Please set valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env to process online payments, or choose Cash on Delivery.'
      );
    }

    // Razorpay requires amount in smallest currency unit (Paisa for INR)
    const amountInPaisa = Math.round(amountInRupees * 100);

    const options = {
      amount: amountInPaisa,
      currency,
      receipt: String(receipt || orderId),
      payment_capture: 1, // Auto capture
      notes: {
        orderId: String(orderId),
      },
    };

    try {
      const razorpayOrder = await razorpay.orders.create(options);
      return razorpayOrder;
    } catch (error) {
      logger.error('Razorpay order creation failed:', error);
      throw ApiError.badRequest(`Payment gateway order creation failed: ${error.message || error.description}`);
    }
  }

  /**
   * Cryptographically verify Razorpay Payment Signature
   * Signature = HMAC_SHA256(order_id + "|" + payment_id, secret)
   */
  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature, secret = null }) {
    const activeSecret = secret || razorpayConfig.keySecret;
    if (!activeSecret) {
      throw ApiError.internal('Payment gateway configuration missing key secret.');
    }

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', activeSecret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(String(razorpaySignature), 'utf-8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    const isValid = crypto.timingSafeEqual(expectedBuf, actualBuf);
    return isValid;
  }

  /**
   * Verify Razorpay Webhook Signature
   */
  verifyWebhookSignature(rawBody, signatureHeader, secret = null) {
    const activeSecret = secret || razorpayConfig.webhookSecret;
    if (!activeSecret) {
      logger.warn('RAZORPAY_WEBHOOK_SECRET is not configured.');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', activeSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const headerBuf = Buffer.from(String(signatureHeader), 'utf-8');

    if (expectedBuf.length !== headerBuf.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(expectedBuf, headerBuf);
    } catch (e) {
      return false;
    }
  }

  /**
   * Verify and process paid order
   */
  async confirmPayment({ orderId, userId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const order = await Order.findOne({ _id: orderId, customer: userId });
    if (!order) {
      throw ApiError.notFound('Order not found or unauthorized access.');
    }

    if (order.paymentStatus === 'paid') {
      return order; // Already confirmed, idempotent
    }

    // Verify cryptographic signature
    const isValid = this.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      logger.error('Invalid Razorpay signature submitted for order:', orderId);
      throw ApiError.badRequest('Invalid payment signature. Payment verification failed.');
    }

    // Record verified Payment record
    const payment = await Payment.create({
      order: order._id,
      user: userId,
      paymentMethod: 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount: order.pricing.total,
      currency: 'INR',
      status: 'captured',
      capturedAt: new Date(),
    });

    // Record ledger Transaction
    await Transaction.create({
      order: order._id,
      payment: payment._id,
      user: userId,
      type: 'payment',
      amount: order.pricing.total,
      currency: 'INR',
      status: 'success',
      gatewayReference: razorpayPaymentId,
      metadata: { razorpayOrderId },
    });

    // Update order state
    order.paymentStatus = 'paid';
    order.orderStatus = 'payment_confirmed';
    order.paidAt = new Date();
    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.statusHistory.push({
      status: 'payment_confirmed',
      comment: `Online payment of ₹${order.pricing.total} verified successfully via Razorpay (${razorpayPaymentId}).`,
      updatedBy: userId,
    });

    await order.save();
    return order;
  }
}

module.exports = new PaymentService();
