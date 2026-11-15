const Address = require('../models/Address');
const Order = require('../models/Order');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { validateIndianPinCode } = require('../utils/helpers');

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    return ApiResponse.success(res, addresses);
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const { fullName, phone, alternatePhone, addressLine1, addressLine2, landmark, city, state, pincode, addressType, isDefault } =
      req.body;

    if (!validateIndianPinCode(pincode)) {
      throw ApiError.badRequest('Please enter a valid 6-digit Indian PIN code.');
    }

    const addressCount = await Address.countDocuments({ user: req.user._id });
    const shouldBeDefault = Boolean(isDefault) || addressCount === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      fullName,
      phone,
      alternatePhone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      addressType: addressType || 'home',
      isDefault: shouldBeDefault,
    });

    return ApiResponse.created(res, address, 'Delivery address saved successfully.');
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const address = await Address.findOne({ _id: id, user: req.user._id });

    if (!address) {
      throw ApiError.notFound('Address not found.');
    }

    const { fullName, phone, alternatePhone, addressLine1, addressLine2, landmark, city, state, pincode, addressType, isDefault } =
      req.body;

    if (pincode && !validateIndianPinCode(pincode)) {
      throw ApiError.badRequest('Please enter a valid 6-digit Indian PIN code.');
    }

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
      address.isDefault = true;
    }

    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (alternatePhone !== undefined) address.alternatePhone = alternatePhone;
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (landmark !== undefined) address.landmark = landmark;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;
    if (addressType) address.addressType = addressType;

    await address.save();

    return ApiResponse.success(res, address, 'Address updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const address = await Address.findOneAndDelete({ _id: id, user: req.user._id });

    if (!address) {
      throw ApiError.notFound('Address not found.');
    }

    // If deleted address was default, promote newest address to default
    if (address.isDefault) {
      const remaining = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    return ApiResponse.success(res, null, 'Address deleted successfully.');
  } catch (error) {
    next(error);
  }
};

const validatePincodeDelivery = async (req, res, next) => {
  try {
    const { pincode } = req.params;
    const isValid = validateIndianPinCode(pincode);

    if (!isValid) {
      return ApiResponse.error(res, 'Please enter a valid 6-digit Indian PIN code.', 400);
    }

    // Delivery is serviceable across all major pin codes
    const estimatedDays = ['110', '122', '201', '400', '560', '600', '700'].some((prefix) =>
      pincode.startsWith(prefix)
    )
      ? '2-3 Days (Express Service)'
      : '3-5 Business Days (Standard Delivery)';

    return ApiResponse.success(res, {
      pincode,
      isServiceable: true,
      estimatedDelivery: estimatedDays,
      codAvailable: true,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerDashboardSummary = async (req, res, next) => {
  try {
    const [totalOrders, wishlist, totalReviews] = await Promise.all([
      Order.countDocuments({ customer: req.user._id }),
      Wishlist.findOne({ user: req.user._id }),
      Review.countDocuments({ user: req.user._id }),
    ]);

    const recentOrders = await Order.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    return ApiResponse.success(res, {
      totalOrders,
      wishlistCount: wishlist && wishlist.products ? wishlist.products.length : 0,
      totalReviews,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  validatePincodeDelivery,
  getCustomerDashboardSummary,
};
