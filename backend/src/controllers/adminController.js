const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Banner = require('../models/Banner');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const analyticsService = require('../services/analyticsService');
const { recordAudit } = require('../middleware/audit');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await analyticsService.getAdminMetrics();
    return ApiResponse.success(res, metrics);
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const currentPage = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (currentPage - 1) * pageLimit;

    const [users, totalCount] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageLimit).lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    return ApiResponse.success(res, users, 'Users retrieved', 200, {
      totalCount,
      currentPage,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'seller', 'admin'].includes(role)) {
      throw ApiError.badRequest('Invalid role.');
    }

    const user = await User.findById(id);
    if (!user) throw ApiError.notFound('User not found.');

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await recordAudit(req, 'USER_ROLE_CHANGED', { userId: id, oldRole, newRole: role });

    return ApiResponse.success(res, user.toSafeObject(), `User role updated to ${role}.`);
  } catch (error) {
    next(error);
  }
};

const toggleBlockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound('User not found.');

    if (user.role === 'admin') {
      throw ApiError.badRequest('Admin users cannot be blocked.');
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    await recordAudit(req, user.isBlocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED', { userId: id });

    return ApiResponse.success(
      res,
      user.toSafeObject(),
      `User ${user.isBlocked ? 'deactivated' : 'activated'} successfully.`
    );
  } catch (error) {
    next(error);
  }
};

const getSellers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search && search.trim()) {
      query.$or = [
        { storeName: { $regex: search.trim(), $options: 'i' } },
        { businessEmail: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const currentPage = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (currentPage - 1) * pageLimit;

    const [sellers, totalCount] = await Promise.all([
      Seller.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Seller.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    return ApiResponse.success(res, sellers, 'Sellers retrieved', 200, {
      totalCount,
      currentPage,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const updateSellerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      throw ApiError.badRequest('Invalid status.');
    }

    const seller = await Seller.findById(id);
    if (!seller) throw ApiError.notFound('Seller not found.');

    seller.status = status;
    if (status === 'approved') {
      seller.isVerified = true;
      seller.approvedAt = new Date();
      seller.approvedBy = req.user._id;
      seller.rejectionReason = '';
    } else if (status === 'rejected') {
      seller.rejectionReason = rejectionReason || 'Application criteria not met.';
    }

    await seller.save();
    await recordAudit(req, `SELLER_STATUS_${status.toUpperCase()}`, {
      sellerId: id,
      status,
      rejectionReason,
    });

    return ApiResponse.success(res, seller, `Seller status updated to ${status}.`);
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};

    if (status) query.orderStatus = status;
    if (search && search.trim()) {
      query.orderNumber = { $regex: search.trim(), $options: 'i' };
    }

    const currentPage = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (currentPage - 1) * pageLimit;

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email phone')
        .populate('items.seller', 'storeName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    return ApiResponse.success(res, orders, 'All orders retrieved', 200, {
      totalCount,
      currentPage,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatusAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound('Order not found.');

    order.orderStatus = status;
    if (status === 'delivered') order.deliveredAt = new Date();
    if (status === 'payment_confirmed') order.paymentStatus = 'paid';

    order.statusHistory.push({
      status,
      comment: comment || `Status updated to ${status} by administrator.`,
      updatedBy: req.user._id,
    });

    await order.save();
    await recordAudit(req, 'ADMIN_ORDER_STATUS_UPDATED', { orderId: id, status });

    return ApiResponse.success(res, order, `Order status updated to ${status}.`);
  } catch (error) {
    next(error);
  }
};

const processReturnRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'

    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound('Order not found.');

    if (order.orderStatus !== 'return_requested') {
      throw ApiError.badRequest('Order is not in return_requested status.');
    }

    if (action === 'approve') {
      order.orderStatus = 'refund_processing';
      order.returnDetails.status = 'approved';
      order.returnDetails.approvedAt = new Date();
      order.statusHistory.push({
        status: 'refund_processing',
        comment: 'Return request approved by admin. Refund is being processed.',
        updatedBy: req.user._id,
      });
    } else {
      order.orderStatus = 'delivered'; // revert to delivered
      order.returnDetails.status = 'rejected';
      order.returnDetails.rejectionReason = rejectionReason || 'Return rejected.';
      order.statusHistory.push({
        status: 'delivered',
        comment: `Return request rejected. Reason: ${rejectionReason}`,
        updatedBy: req.user._id,
      });
    }

    await order.save();
    await recordAudit(req, `RETURN_${action.toUpperCase()}D`, { orderId: id });

    return ApiResponse.success(res, order, `Return request ${action}d successfully.`);
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const query = {};
    if (action) query.action = action;

    const currentPage = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (currentPage - 1) * pageLimit;

    const [logs, totalCount] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    return ApiResponse.success(res, logs, 'Audit logs retrieved', 200, {
      totalCount,
      currentPage,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getUsers,
  updateUserRole,
  toggleBlockUser,
  getSellers,
  updateSellerStatus,
  getAllOrders,
  updateOrderStatusAdmin,
  processReturnRequest,
  getAuditLogs,
};
