const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { slugify, generateSKU } = require('../utils/helpers');
const { recordAudit } = require('../middleware/audit');
const analyticsService = require('../services/analyticsService');

const applySeller = async (req, res, next) => {
  try {
    const existing = await Seller.findOne({ user: req.user._id });
    if (existing) {
      return ApiResponse.success(
        res,
        existing,
        `You have already submitted a seller application (Status: ${existing.status}).`
      );
    }

    const { storeName, storeDescription, businessEmail, businessPhone, gstin, pan, businessAddress, bankDetails } =
      req.body;

    const nameExists = await Seller.findOne({ storeName: storeName.trim() });
    if (nameExists) {
      throw ApiError.conflict('A store with this name already exists. Please choose a different store name.');
    }

    const seller = await Seller.create({
      user: req.user._id,
      storeName: storeName.trim(),
      storeDescription,
      businessEmail,
      businessPhone,
      gstin,
      pan,
      businessAddress,
      bankDetails,
      status: 'pending', // Requires admin review
    });

    // Update user role to seller
    await User.findByIdAndUpdate(req.user._id, { role: 'seller' });
    await recordAudit(req, 'SELLER_APPLICATION_SUBMITTED', { storeName, sellerId: seller._id });

    return ApiResponse.created(
      res,
      seller,
      'Seller registration submitted successfully. HumanNeed administrators will review your application.'
    );
  } catch (error) {
    next(error);
  }
};

const getSellerProfile = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return ApiResponse.success(res, null, 'No seller profile found.');
    }
    return ApiResponse.success(res, seller);
  } catch (error) {
    next(error);
  }
};

const updateSellerProfile = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      throw ApiError.notFound('Seller profile not found.');
    }

    const { storeDescription, storeLogo, storeBanner, businessAddress, bankDetails } = req.body;

    if (storeDescription !== undefined) seller.storeDescription = storeDescription;
    if (storeLogo !== undefined) seller.storeLogo = storeLogo;
    if (storeBanner !== undefined) seller.storeBanner = storeBanner;
    if (businessAddress) seller.businessAddress = { ...seller.businessAddress, ...businessAddress };
    if (bankDetails) seller.bankDetails = { ...seller.bankDetails, ...bankDetails };

    await seller.save();
    return ApiResponse.success(res, seller, 'Store profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

const getSellerProducts = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      throw ApiError.forbidden('Seller profile not found.');
    }

    const { page = 1, limit = 10, status, search } = req.query;
    const query = { seller: seller._id };

    if (status) query.status = status;
    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const currentPage = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (currentPage - 1) * pageLimit;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('brand', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean({ virtuals: true }),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    return ApiResponse.success(res, products, 'Seller products retrieved', 200, {
      totalCount,
      currentPage,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller || seller.status !== 'approved') {
      throw ApiError.forbidden('Only approved sellers can list products on HumanNeed.');
    }

    const {
      title,
      description,
      shortDescription,
      category,
      brand,
      price,
      discountPrice,
      stockQuantity,
      lowStockThreshold,
      images,
      specifications,
      highlights,
      tags,
      status,
      isFeatured,
    } = req.body;

    const baseSlug = slugify(title);
    const uniqueSuffix = Date.now().toString().slice(-4);
    const slug = `${baseSlug}-${uniqueSuffix}`;
    const sku = generateSKU();

    const product = await Product.create({
      title: title.trim(),
      slug,
      description,
      shortDescription,
      sku,
      seller: seller._id,
      category,
      brand: brand || null,
      price,
      discountPrice: discountPrice || price,
      stockQuantity,
      lowStockThreshold: lowStockThreshold || 5,
      images: images || [],
      specifications: specifications || [],
      highlights: highlights || [],
      tags: tags || [],
      status: status || 'active',
      isFeatured: Boolean(isFeatured),
    });

    await recordAudit(req, 'PRODUCT_CREATED', {
      productId: product._id,
      title: product.title,
      sellerId: seller._id,
    });

    return ApiResponse.created(res, product, 'Product listed successfully.');
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      throw ApiError.forbidden('Seller not found.');
    }

    const { id } = req.params;
    // Ownership check: seller can only update their own product
    const product = await Product.findOne({ _id: id, seller: seller._id });
    if (!product) {
      throw ApiError.notFound('Product not found or you are not authorized to edit this product.');
    }

    const {
      title,
      description,
      shortDescription,
      category,
      brand,
      price,
      discountPrice,
      stockQuantity,
      lowStockThreshold,
      images,
      specifications,
      highlights,
      tags,
      status,
      isFeatured,
    } = req.body;

    if (title) product.title = title.trim();
    if (description) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (category) product.category = category;
    if (brand !== undefined) product.brand = brand || null;
    if (price !== undefined) product.price = price;
    if (discountPrice !== undefined) product.discountPrice = discountPrice;
    if (stockQuantity !== undefined) product.stockQuantity = stockQuantity;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
    if (images) product.images = images;
    if (specifications) product.specifications = specifications;
    if (highlights) product.highlights = highlights;
    if (tags) product.tags = tags;
    if (status) product.status = status;
    if (isFeatured !== undefined && req.user.role === 'admin') product.isFeatured = isFeatured;

    await product.save();
    await recordAudit(req, 'PRODUCT_UPDATED', { productId: product._id });

    return ApiResponse.success(res, product, 'Product updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      throw ApiError.forbidden('Seller not found.');
    }

    const { id } = req.params;
    const product = await Product.findOne({ _id: id, seller: seller._id });
    if (!product) {
      throw ApiError.notFound('Product not found or unauthorized.');
    }

    // Soft delete / archive product so historical orders retain integrity
    product.status = 'archived';
    await product.save();

    await recordAudit(req, 'PRODUCT_ARCHIVED', { productId: product._id });

    return ApiResponse.success(res, null, 'Product archived successfully.');
  } catch (error) {
    next(error);
  }
};

const getSellerOrders = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      throw ApiError.forbidden('Seller profile not found.');
    }

    const { page = 1, limit = 10 } = req.query;
    const currentPage = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (currentPage - 1) * pageLimit;

    // Find orders where at least one item belongs to this seller
    const query = { 'items.seller': seller._id };

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate('customer', 'name email phone')
        .populate('items.product', 'title sku images')
        .lean(),
      Order.countDocuments(query),
    ]);

    // For privacy, filter each order's items so seller ONLY sees their own items!
    const filteredOrders = orders.map((order) => {
      const sellerItems = order.items.filter(
        (it) => it.seller && it.seller.toString() === seller._id.toString()
      );
      const sellerSubtotal = sellerItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

      return {
        ...order,
        items: sellerItems,
        sellerSubtotal,
      };
    });

    const totalPages = Math.ceil(totalCount / pageLimit);

    return ApiResponse.success(res, filteredOrders, 'Seller orders retrieved', 200, {
      totalCount,
      currentPage,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const updateSellerOrderStatus = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      throw ApiError.forbidden('Seller not found.');
    }

    const { orderId } = req.params;
    const { status, courierName, trackingNumber, trackingUrl, comment } = req.body;

    const order = await Order.findOne({ _id: orderId, 'items.seller': seller._id });
    if (!order) {
      throw ApiError.notFound('Order not found or no items belong to your store.');
    }

    // Update status on seller's items in this order
    let updatedAny = false;
    for (const item of order.items) {
      if (item.seller.toString() === seller._id.toString()) {
        item.status = status;
        if (courierName) item.tracking.courierName = courierName;
        if (trackingNumber) item.tracking.trackingNumber = trackingNumber;
        if (trackingUrl) item.tracking.trackingUrl = trackingUrl;
        updatedAny = true;
      }
    }

    // Also update top-level order status if appropriate
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    order.orderStatus = status;
    order.statusHistory.push({
      status,
      comment: comment || `Status updated to ${status} by seller ${seller.storeName}.`,
      updatedBy: req.user._id,
    });

    await order.save();
    await recordAudit(req, 'SELLER_ORDER_STATUS_UPDATED', { orderId, status });

    return ApiResponse.success(res, order, `Order status updated to ${status}.`);
  } catch (error) {
    next(error);
  }
};

const getSellerAnalytics = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      throw ApiError.forbidden('Seller not found.');
    }

    const metrics = await analyticsService.getSellerMetrics(seller._id);
    return ApiResponse.success(res, metrics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applySeller,
  getSellerProfile,
  updateSellerProfile,
  getSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerOrders,
  updateSellerOrderStatus,
  getSellerAnalytics,
};
