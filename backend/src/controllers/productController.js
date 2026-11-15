const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { status: 'active' };

    // Search query (text search or title regex fallback)
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    // Category filter (slug or ID)
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) query.category = cat._id;
      }
    }

    // Brand filter (slug or ID)
    if (brand) {
      if (brand.match(/^[0-9a-fA-F]{24}$/)) {
        query.brand = brand;
      } else {
        const b = await Brand.findOne({ slug: brand });
        if (b) query.brand = b._id;
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.discountPrice = {};
      if (minPrice !== undefined && !isNaN(minPrice)) {
        query.discountPrice.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(maxPrice)) {
        query.discountPrice.$lte = Number(maxPrice);
      }
    }

    // Minimum rating filter
    if (minRating !== undefined && !isNaN(minRating)) {
      query.ratingsAverage = { $gte: Number(minRating) };
    }

    // In stock only filter
    if (inStock === 'true' || inStock === true) {
      query.stockQuantity = { $gt: 0 };
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'price_low_high':
        sortOption = { discountPrice: 1 };
        break;
      case 'price_high_low':
        sortOption = { discountPrice: -1 };
        break;
      case 'rating':
        sortOption = { ratingsAverage: -1 };
        break;
      case 'popularity':
        sortOption = { salesCount: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const currentPage = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (currentPage - 1) * pageLimit;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .populate('seller', 'storeName rating isVerified')
        .sort(sortOption)
        .skip(skip)
        .limit(pageLimit)
        .lean({ virtuals: true }),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    return ApiResponse.success(res, products, 'Products retrieved successfully', 200, {
      totalCount,
      currentPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    });
  } catch (error) {
    next(error);
  }
};

const getProductBySlugOrId = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let query = {};

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: identifier };
    } else {
      query = { slug: identifier };
    }

    const product = await Product.findOne(query)
      .populate('category', 'name slug image')
      .populate('brand', 'name slug logo description')
      .populate('seller', 'storeName storeLogo rating totalReviews isVerified');

    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    // Increment view count asynchronously
    Product.findByIdAndUpdate(product._id, { $inc: { viewsCount: 1 } }).exec();

    // Fetch related products in same category
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      status: 'active',
    })
      .populate('category', 'name slug')
      .limit(6)
      .lean({ virtuals: true });

    return ApiResponse.success(res, {
      product: product.toObject({ virtuals: true }),
      relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

const getLiveSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return ApiResponse.success(res, { products: [], categories: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const [products, categories] = await Promise.all([
      Product.find({ title: regex, status: 'active' })
        .select('title slug discountPrice images category')
        .limit(5)
        .lean(),
      Category.find({ name: regex, isActive: true })
        .select('name slug')
        .limit(3)
        .lean(),
    ]);

    return ApiResponse.success(res, { products, categories });
  } catch (error) {
    next(error);
  }
};

const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true, status: 'active' })
      .populate('category', 'name slug')
      .populate('seller', 'storeName rating isVerified')
      .limit(8)
      .lean({ virtuals: true });

    return ApiResponse.success(res, products);
  } catch (error) {
    next(error);
  }
};

const getTrendingProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ status: 'active' })
      .populate('category', 'name slug')
      .populate('seller', 'storeName rating isVerified')
      .sort({ viewsCount: -1, ratingsAverage: -1 })
      .limit(8)
      .lean({ virtuals: true });

    return ApiResponse.success(res, products);
  } catch (error) {
    next(error);
  }
};

const getBestSellers = async (req, res, next) => {
  try {
    // Only return products that have real recorded salesCount > 0
    const products = await Product.find({ status: 'active', salesCount: { $gt: 0 } })
      .populate('category', 'name slug')
      .populate('seller', 'storeName rating isVerified')
      .sort({ salesCount: -1 })
      .limit(8)
      .lean({ virtuals: true });

    return ApiResponse.success(res, products);
  } catch (error) {
    next(error);
  }
};

const getRecommendedProducts = async (req, res, next) => {
  try {
    const { category, excludeId } = req.query;
    const filter = { status: 'active', stockQuantity: { $gt: 0 } };

    if (excludeId && excludeId.match(/^[0-9a-fA-F]{24}$/)) {
      filter._id = { $ne: excludeId };
    }

    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) filter.category = cat._id;
      }
    }

    let products = await Product.find(filter)
      .populate('category', 'name slug')
      .populate('seller', 'storeName rating isVerified')
      .sort({ ratingsAverage: -1, salesCount: -1, viewsCount: -1 })
      .limit(8)
      .lean({ virtuals: true });

    // Fallback if specific category filter yielded too few items
    if (products.length < 4 && filter.category) {
      const existingIds = products.map((p) => p._id);
      const fallback = await Product.find({
        status: 'active',
        stockQuantity: { $gt: 0 },
        _id: { $nin: existingIds },
      })
        .populate('category', 'name slug')
        .populate('seller', 'storeName rating isVerified')
        .sort({ ratingsAverage: -1, salesCount: -1 })
        .limit(8 - products.length)
        .lean({ virtuals: true });

      products = [...products, ...fallback];
    }

    return ApiResponse.success(res, products);
  } catch (error) {
    next(error);
  }
};

const compareProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4) {
      throw ApiError.badRequest('Please provide between 2 and 4 product IDs for comparison.');
    }

    const products = await Product.find({ _id: { $in: ids }, status: 'active' })
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean({ virtuals: true });

    return ApiResponse.success(res, products);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlugOrId,
  getLiveSearchSuggestions,
  getFeaturedProducts,
  getTrendingProducts,
  getBestSellers,
  getRecommendedProducts,
  compareProducts,
};
