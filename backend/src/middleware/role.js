const ApiError = require('../utils/apiError');
const Seller = require('../models/Seller');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Access forbidden. This endpoint requires one of the following roles: [${roles.join(', ')}]`)
      );
    }

    next();
  };
};

// Ensures the authenticated user has an active, admin-approved Seller record
const requireApprovedSeller = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    // Admins bypass seller checks for management purposes
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== 'seller') {
      return next(ApiError.forbidden('Only registered sellers can perform this action.'));
    }

    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return next(ApiError.forbidden('Seller profile not found. Please complete seller registration.'));
    }

    if (seller.status !== 'approved') {
      return next(
        ApiError.forbidden(
          `Your seller account status is currently '${seller.status}'. You must be approved by HumanNeed administrators to manage products or fulfill orders.`
        )
      );
    }

    req.seller = seller;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authorize,
  requireApprovedSeller,
};
