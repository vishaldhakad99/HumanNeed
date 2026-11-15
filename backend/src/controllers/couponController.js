const Coupon = require('../models/Coupon');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return ApiResponse.success(res, coupons);
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const { code, description, discountType, discountValue, minPurchase, maxDiscount, validFrom, validUntil, usageLimit, isActive } =
      req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      throw ApiError.conflict('A coupon with this code already exists.');
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      description,
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || null,
      validFrom: validFrom || new Date(),
      validUntil: new Date(validUntil),
      usageLimit: usageLimit || 1000,
      isActive: isActive !== undefined ? isActive : true,
    });

    return ApiResponse.created(res, coupon, 'Coupon created successfully.');
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!coupon) throw ApiError.notFound('Coupon not found.');

    return ApiResponse.success(res, coupon, 'Coupon updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) throw ApiError.notFound('Coupon not found.');

    return ApiResponse.success(res, null, 'Coupon deleted successfully.');
  } catch (error) {
    next(error);
  }
};

const validateCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    if (!code) throw ApiError.badRequest('Coupon code is required.');

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) throw ApiError.notFound('Coupon not found or is no longer active.');

    const subtotal = Number(amount) || 0;
    const check = coupon.isValidForAmount(subtotal);

    if (!check.valid) {
      return ApiResponse.error(res, check.message, 400);
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === 'percentage') {
      calculatedDiscount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
        calculatedDiscount = coupon.maxDiscount;
      }
    } else {
      calculatedDiscount = Math.min(coupon.discountValue, subtotal);
    }

    return ApiResponse.success(res, {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(calculatedDiscount),
      description: coupon.description,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
