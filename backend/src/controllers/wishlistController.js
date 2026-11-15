const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
};

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);
    await wishlist.populate({
      path: 'products',
      select: 'title slug price discountPrice images stockQuantity status ratingsAverage category',
      populate: { path: 'category', select: 'name slug' },
    });

    return ApiResponse.success(res, wishlist.products);
  } catch (error) {
    next(error);
  }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      throw ApiError.badRequest('Product ID is required.');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    const wishlist = await getOrCreateWishlist(req.user._id);
    const existingIndex = wishlist.products.findIndex((p) => p.toString() === productId);

    let isInWishlist = false;
    if (existingIndex > -1) {
      wishlist.products.splice(existingIndex, 1);
      isInWishlist = false;
    } else {
      wishlist.products.push(productId);
      isInWishlist = true;
    }

    await wishlist.save();

    return ApiResponse.success(
      res,
      { isInWishlist, count: wishlist.products.length },
      isInWishlist ? 'Product added to your wishlist.' : 'Product removed from your wishlist.'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
};
