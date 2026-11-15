const Order = require('../models/Order');
const orderService = require('../services/orderService');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { recordAudit } = require('../middleware/audit');

const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, couponCode } = req.body;

    const result = await orderService.createOrder({
      userId: req.user._id,
      shippingAddress,
      paymentMethod,
      couponCode,
    });

    await recordAudit(req, 'ORDER_CREATED', {
      orderId: result.order._id,
      orderNumber: result.order.orderNumber,
      total: result.order.pricing.total,
      paymentMethod,
    });

    return ApiResponse.created(res, result, 'Order initiated successfully.');
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const currentPage = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (currentPage - 1) * pageLimit;

    const query = { customer: req.user._id };
    if (status) {
      query.orderStatus = status;
    }

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate('items.product', 'title slug images')
        .populate('items.seller', 'storeName')
        .lean(),
      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    return ApiResponse.success(res, orders, 'Orders retrieved successfully', 200, {
      totalCount,
      currentPage,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Must be either the customer who placed the order or an admin/seller associated with an item
    const order = await Order.findById(id)
      .populate('items.product', 'title slug images price discountPrice')
      .populate('items.seller', 'storeName businessEmail businessPhone');

    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    // Role-based security check
    const isCustomer = order.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isSellerOfItem =
      req.user.role === 'seller' &&
      order.items.some((item) => item.seller && item.seller._id.toString() === req.seller?._id.toString());

    if (!isCustomer && !isAdmin && !isSellerOfItem) {
      throw ApiError.forbidden('You are not authorized to view this order.');
    }

    return ApiResponse.success(res, order);
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await orderService.cancelOrder({
      orderId: id,
      userId: req.user._id,
      role: req.user.role,
      reason: reason || 'Customer requested cancellation.',
    });

    await recordAudit(req, 'ORDER_CANCELLED', { orderId: order._id, reason });

    return ApiResponse.success(res, order, 'Order has been cancelled successfully.');
  } catch (error) {
    next(error);
  }
};

const requestReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: id, customer: req.user._id });
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    if (order.orderStatus !== 'delivered') {
      throw ApiError.badRequest('Return can only be requested for delivered orders.');
    }

    // Check 7-day return policy
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 3600 * 24);
    if (daysSinceDelivery > 7) {
      throw ApiError.badRequest('The 7-day return window for this order has expired.');
    }

    order.orderStatus = 'return_requested';
    order.returnDetails = {
      reason,
      requestedAt: new Date(),
      status: 'requested',
    };
    order.statusHistory.push({
      status: 'return_requested',
      comment: `Return requested by customer. Reason: ${reason}`,
      updatedBy: req.user._id,
    });

    await order.save();
    await recordAudit(req, 'ORDER_RETURN_REQUESTED', { orderId: order._id, reason });

    return ApiResponse.success(res, order, 'Return request submitted successfully. Our team will review it.');
  } catch (error) {
    next(error);
  }
};

const getOrderInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'title sku')
      .populate('items.seller', 'storeName gstin businessAddress');

    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    if (order.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('Access denied.');
    }

    const invoice = {
      invoiceNumber: `INV-${order.orderNumber}`,
      invoiceDate: order.createdAt,
      orderNumber: order.orderNumber,
      customer: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
        address: order.shippingAddress,
      },
      items: order.items.map((it) => ({
        title: it.title,
        sku: it.sku,
        quantity: it.quantity,
        unitPrice: it.price,
        total: it.price * it.quantity,
        seller: it.seller ? it.seller.storeName : 'HumanNeed Partner',
      })),
      pricing: order.pricing,
      paymentMethod: order.paymentMethod.toUpperCase(),
      paymentStatus: order.paymentStatus.toUpperCase(),
      paidAt: order.paidAt,
    };

    return ApiResponse.success(res, invoice);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  requestReturn,
  getOrderInvoice,
};
