const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (currentPage - 1) * pageLimit;

    const [reviews, totalCount] = await Promise.all([
      Review.find({ product: productId, isApproved: true })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Review.countDocuments({ product: productId, isApproved: true }),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    return ApiResponse.success(res, reviews, 'Product reviews retrieved', 200, {
      totalCount,
      currentPage,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment, images } = req.body;

    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found.');

    const existingReview = await Review.findOne({ product: productId, user: req.user._id });
    if (existingReview) {
      throw ApiError.conflict('You have already submitted a review for this product.');
    }

    // Verify if customer has actually purchased this product
    const verifiedOrder = await Order.findOne({
      customer: req.user._id,
      'items.product': productId,
      orderStatus: 'delivered',
    });

    const isVerifiedPurchase = Boolean(verifiedOrder);

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      title: title || '',
      comment,
      images: images || [],
      isVerifiedPurchase,
      isApproved: true,
    });

    await review.populate('user', 'name avatar');

    return ApiResponse.created(res, review, 'Review submitted successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) throw ApiError.notFound('Review not found.');

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to delete this review.');
    }

    await Review.findByIdAndDelete(id);

    return ApiResponse.success(res, null, 'Review deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductReviews,
  createReview,
  deleteReview,
};
