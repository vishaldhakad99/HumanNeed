const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');

class AnalyticsService {
  /**
   * Admin Platform Metrics
   * Calculated strictly from real database records
   */
  async getAdminMetrics() {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalSellers = await Seller.countDocuments();
    const approvedSellers = await Seller.countDocuments({ status: 'approved' });
    const pendingSellers = await Seller.countDocuments({ status: 'pending' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.countDocuments({
      orderStatus: { $in: ['pending_payment', 'processing', 'packed'] },
    });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'cancelled' });
    const returnRequests = await Order.countDocuments({
      'returnDetails.status': 'requested',
    });

    // Real verified revenue from paid orders or delivered COD orders
    const revenueAgg = await Order.aggregate([
      {
        $match: {
          $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'cod', orderStatus: 'delivered' }],
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
        },
      },
    ]);
    const verifiedRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Monthly revenue timeline (past 6 months) from real data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'cod', orderStatus: 'delivered' }],
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$pricing.total' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Order status distribution
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalCustomers,
      totalSellers,
      approvedSellers,
      pendingSellers,
      totalProducts,
      totalOrders,
      verifiedRevenue,
      pendingOrders,
      cancelledOrders,
      returnRequests,
      monthlyRevenue,
      statusDistribution,
    };
  }

  /**
   * Seller Analytics
   * Strictly isolated to this seller's products and orders
   */
  async getSellerMetrics(sellerId) {
    const totalProducts = await Product.countDocuments({ seller: sellerId });
    const activeProducts = await Product.countDocuments({ seller: sellerId, status: 'active' });
    const outOfStockProducts = await Product.countDocuments({
      seller: sellerId,
      stockQuantity: { $lte: 0 },
    });

    // Orders containing this seller's items
    const ordersAgg = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      {
        $group: {
          _id: null,
          totalOrders: { $addToSet: '$_id' },
          totalItemsSold: { $sum: '$items.quantity' },
          totalSalesRevenue: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$paymentStatus', 'paid'] },
                    { $and: [{ $eq: ['$paymentMethod', 'cod'] }, { $eq: ['$orderStatus', 'delivered'] }] },
                  ],
                },
                { $multiply: ['$items.price', '$items.quantity'] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalOrdersCount = ordersAgg.length > 0 ? ordersAgg[0].totalOrders.length : 0;
    const totalItemsSold = ordersAgg.length > 0 ? ordersAgg[0].totalItemsSold : 0;
    const totalEarnings = ordersAgg.length > 0 ? ordersAgg[0].totalSalesRevenue : 0;

    return {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      totalOrders: totalOrdersCount,
      totalItemsSold,
      totalEarnings,
    };
  }
}

module.exports = new AnalyticsService();
