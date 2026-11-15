const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Seller = require('../models/Seller');
const ApiError = require('../utils/apiError');
const { generateOrderNumber, calculateOrderPricing } = require('../utils/helpers');
const paymentService = require('./paymentService');
const { keyId } = require('../config/razorpay');

class OrderService {
  /**
   * Create an order from active user's cart
   */
  async createOrder({ userId, shippingAddress, paymentMethod, couponCode }) {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || !cart.items || cart.items.length === 0) {
      throw ApiError.badRequest('Your shopping cart is empty.');
    }

    const activeItems = cart.items.filter((item) => !item.savedForLater);
    if (activeItems.length === 0) {
      throw ApiError.badRequest('No active items to checkout in your cart.');
    }

    // Validate inventory and prepare order items
    const orderItems = [];
    for (const item of activeItems) {
      const product = item.product;
      if (!product || product.status !== 'active') {
        throw ApiError.badRequest(`Product "${product ? product.title : 'Unknown'}" is currently unavailable.`);
      }

      if (product.stockQuantity < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for "${product.title}". Requested: ${item.quantity}, Available: ${product.stockQuantity}`
        );
      }

      orderItems.push({
        product: product._id,
        seller: product.seller,
        title: product.title,
        sku: product.sku,
        price: product.discountPrice || product.price,
        quantity: item.quantity,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        status: paymentMethod === 'cod' ? 'processing' : 'pending_payment',
      });
    }

    // Coupon validation
    let validCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const tempSubtotal = orderItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
        const check = coupon.isValidForAmount(tempSubtotal);
        if (check.valid) {
          validCoupon = coupon;
        } else {
          throw ApiError.badRequest(check.message);
        }
      } else {
        throw ApiError.badRequest('Invalid or expired coupon code.');
      }
    }

    // Server-computed pricing
    const pricing = calculateOrderPricing({ items: orderItems, coupon: validCoupon });
    const orderNumber = generateOrderNumber();

    // Create Order document
    const order = new Order({
      orderNumber,
      customer: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: paymentMethod === 'cod' ? 'processing' : 'pending_payment',
      pricing,
      couponApplied: validCoupon
        ? {
            code: validCoupon.code,
            discountAmount: pricing.discount,
          }
        : { code: null, discountAmount: 0 },
      statusHistory: [
        {
          status: paymentMethod === 'cod' ? 'processing' : 'pending_payment',
          comment:
            paymentMethod === 'cod'
              ? 'Order placed with Cash on Delivery.'
              : 'Order initiated, awaiting Razorpay payment.',
          updatedBy: userId,
        },
      ],
    });

    // Handle COD vs Razorpay
    if (paymentMethod === 'cod') {
      // For COD, immediately decrement stock and increment sales count
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: -item.quantity, salesCount: item.quantity },
        });
      }

      // Update coupon usage
      if (validCoupon) {
        await Coupon.findByIdAndUpdate(validCoupon._id, { $inc: { usedCount: 1 } });
      }

      // Clear cart
      cart.items = cart.items.filter((item) => item.savedForLater);
      cart.appliedCoupon = { code: null, discountType: null, discountValue: 0, discountAmount: 0 };
      await cart.save();

      await order.save();

      return {
        order,
        razorpayOrder: null,
      };
    } else {
      // For Razorpay, create a server-side order
      let razorpayOrder = null;
      try {
        razorpayOrder = await paymentService.createRazorpayOrder({
          orderId: order._id,
          amountInRupees: pricing.total,
          currency: 'INR',
          receipt: orderNumber,
        });
        order.razorpayOrderId = razorpayOrder.id;
      } catch (err) {
        // If razorpay is not configured, give a clear helpful message
        throw err;
      }

      await order.save();

      // Clear cart once order is initiated
      cart.items = cart.items.filter((item) => item.savedForLater);
      await cart.save();

      return {
        order,
        razorpayOrder,
        razorpayKeyId: keyId,
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder({ orderId, userId, role, reason }) {
    const query = role === 'admin' ? { _id: orderId } : { _id: orderId, customer: userId };
    const order = await Order.findOne(query);

    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    const nonCancellable = ['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (nonCancellable.includes(order.orderStatus)) {
      throw ApiError.badRequest(`Order cannot be cancelled in its current state: "${order.orderStatus}".`);
    }

    // Replenish stock if order was active (COD or paid)
    if (order.paymentStatus === 'paid' || order.paymentMethod === 'cod') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: item.quantity, salesCount: -item.quantity },
        });
      }
    }

    order.orderStatus = 'cancelled';
    order.cancellation = {
      reason,
      cancelledBy: userId,
      cancelledAt: new Date(),
    };
    order.statusHistory.push({
      status: 'cancelled',
      comment: `Order cancelled. Reason: ${reason}`,
      updatedBy: userId,
    });

    await order.save();
    return order;
  }
}

module.exports = new OrderService();
