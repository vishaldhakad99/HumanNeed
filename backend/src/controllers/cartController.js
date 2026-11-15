const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { calculateOrderPricing } = require('../utils/helpers');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const formatCartResponse = async (cart) => {
  await cart.populate({
    path: 'items.product',
    select: 'title slug price discountPrice stockQuantity images status category seller',
    populate: { path: 'seller', select: 'storeName' },
  });

  // Filter out any deleted products safely
  cart.items = cart.items.filter((item) => item.product !== null);

  const activeItems = [];
  const savedItems = [];

  for (const item of cart.items) {
    const p = item.product;
    const currentPrice = p.discountPrice || p.price;
    const itemData = {
      _id: item._id,
      product: p,
      quantity: item.quantity,
      price: currentPrice,
      savedForLater: item.savedForLater,
      isAvailable: p.status === 'active' && p.stockQuantity >= item.quantity,
      availableStock: p.stockQuantity,
    };

    if (item.savedForLater) {
      savedItems.push(itemData);
    } else {
      activeItems.push(itemData);
    }
  }

  // Calculate dynamic pricing
  let validCoupon = null;
  if (cart.appliedCoupon && cart.appliedCoupon.code) {
    const coupon = await Coupon.findOne({ code: cart.appliedCoupon.code, isActive: true });
    if (coupon) {
      const tempSubtotal = activeItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
      const check = coupon.isValidForAmount(tempSubtotal);
      if (check.valid) {
        validCoupon = coupon;
      }
    }
  }

  const pricing = calculateOrderPricing({
    items: activeItems.map((it) => ({ price: it.price, quantity: it.quantity })),
    coupon: validCoupon,
  });

  return {
    _id: cart._id,
    items: activeItems,
    savedForLaterItems: savedItems,
    itemCount: activeItems.reduce((acc, it) => acc + it.quantity, 0),
    appliedCoupon: validCoupon
      ? {
          code: validCoupon.code,
          discountType: validCoupon.discountType,
          discountValue: validCoupon.discountValue,
          discountAmount: pricing.discount,
        }
      : null,
    pricing,
  };
};

const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const formatted = await formatCartResponse(cart);
    return ApiResponse.success(res, formatted);
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId) {
      throw ApiError.badRequest('Product ID is required.');
    }
    if (qty < 1 || qty > 10) {
      throw ApiError.badRequest('Quantity must be between 1 and 10.');
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      throw ApiError.notFound('Product is unavailable or out of stock.');
    }

    if (product.stockQuantity < qty) {
      throw ApiError.badRequest(`Only ${product.stockQuantity} items in stock.`);
    }

    const cart = await getOrCreateCart(req.user._id);
    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && !item.savedForLater
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + qty;
      if (newQty > 10) {
        throw ApiError.badRequest('You cannot add more than 10 units of this product.');
      }
      if (product.stockQuantity < newQty) {
        throw ApiError.badRequest(`Cannot add more. Only ${product.stockQuantity} items available in stock.`);
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        quantity: qty,
        price: product.discountPrice || product.price,
        savedForLater: false,
      });
    }

    await cart.save();
    const formatted = await formatCartResponse(cart);
    return ApiResponse.success(res, formatted, 'Item added to cart.');
  } catch (error) {
    next(error);
  }
};

const updateCartQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (qty < 1 || qty > 10) {
      throw ApiError.badRequest('Quantity must be between 1 and 10.');
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.id(itemId);
    if (!item) {
      throw ApiError.notFound('Cart item not found.');
    }

    const product = await Product.findById(item.product);
    if (!product) {
      throw ApiError.notFound('Product no longer exists.');
    }
    if (product.stockQuantity < qty) {
      throw ApiError.badRequest(`Only ${product.stockQuantity} items in stock.`);
    }

    item.quantity = qty;
    await cart.save();

    const formatted = await formatCartResponse(cart);
    return ApiResponse.success(res, formatted, 'Cart updated.');
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await getOrCreateCart(req.user._id);

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();

    const formatted = await formatCartResponse(cart);
    return ApiResponse.success(res, formatted, 'Item removed from cart.');
  } catch (error) {
    next(error);
  }
};

const toggleSaveForLater = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.id(itemId);

    if (!item) {
      throw ApiError.notFound('Cart item not found.');
    }

    item.savedForLater = !item.savedForLater;
    await cart.save();

    const formatted = await formatCartResponse(cart);
    return ApiResponse.success(res, formatted);
  } catch (error) {
    next(error);
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      throw ApiError.badRequest('Coupon code is required.');
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
    if (!coupon) {
      throw ApiError.badRequest('Invalid or expired coupon code.');
    }

    const cart = await getOrCreateCart(req.user._id);
    await cart.populate('items.product');

    const activeItems = cart.items.filter((it) => !it.savedForLater && it.product);
    const subtotal = activeItems.reduce(
      (sum, it) => sum + (it.product.discountPrice || it.product.price) * it.quantity,
      0
    );

    const check = coupon.isValidForAmount(subtotal);
    if (!check.valid) {
      throw ApiError.badRequest(check.message);
    }

    cart.appliedCoupon = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    };
    await cart.save();

    const formatted = await formatCartResponse(cart);
    return ApiResponse.success(res, formatted, `Coupon "${coupon.code}" applied successfully!`);
  } catch (error) {
    next(error);
  }
};

const removeCoupon = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.appliedCoupon = {
      code: null,
      discountType: null,
      discountValue: 0,
      discountAmount: 0,
    };
    await cart.save();

    const formatted = await formatCartResponse(cart);
    return ApiResponse.success(res, formatted, 'Coupon removed.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  toggleSaveForLater,
  applyCoupon,
  removeCoupon,
};
