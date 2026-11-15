const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const { recordAudit } = require('../middleware/audit');
const env = require('../config/env');

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const sendTokenResponse = async (user, statusCode, res, message = 'Success') => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in user document
  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  // Set HTTP-only cookie for refresh token
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return ApiResponse.success(
    res,
    {
      user: user.toSafeObject(),
      accessToken,
    },
    message,
    statusCode
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    // First user in the platform can be made admin if no users exist
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'customer';

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      isEmailVerified: true, // Auto-verified for instant onboarding in dev/demo
    });

    await recordAudit(req, 'USER_REGISTERED', { email: user.email, role: user.role });

    return sendTokenResponse(user, 201, res, 'Account created successfully!');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (user.isBlocked) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support@humanneed.in.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    await recordAudit(req, 'USER_LOGGED_IN', { userId: user._id, email: user.email });

    return sendTokenResponse(user, 200, res, 'Logged in successfully!');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      req.user.refreshToken = undefined;
      await req.user.save({ validateBeforeSave: false });
      await recordAudit(req, 'USER_LOGGED_OUT', { userId: req.user._id });
    }

    res.clearCookie('refreshToken', cookieOptions);
    res.clearCookie('accessToken');

    return ApiResponse.success(res, null, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      throw ApiError.unauthorized('Refresh token is required.');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token. Please log in again.');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      throw ApiError.unauthorized('Refresh token is invalid or has been revoked.');
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    return ApiResponse.success(res, {
      accessToken: newAccessToken,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return ApiResponse.success(res, { user: req.user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    await recordAudit(req, 'USER_PROFILE_UPDATED', { userId: user._id });

    return ApiResponse.success(res, { user: user.toSafeObject() }, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password does not match our records.');
    }

    user.password = newPassword;
    await user.save();

    await recordAudit(req, 'USER_PASSWORD_CHANGED', { userId: user._id });

    return ApiResponse.success(res, null, 'Password updated successfully. Please use your new password next time.');
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Do not reveal if email exists or not to prevent user enumeration
      return ApiResponse.success(
        res,
        null,
        'If an account exists with that email address, a password reset link has been dispatched.'
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    await recordAudit(req, 'PASSWORD_RESET_REQUESTED', { email: user.email });

    return ApiResponse.success(
      res,
      {
        resetToken: env.NODE_ENV === 'development' ? resetToken : undefined,
      },
      'If an account exists with that email address, a password reset link has been dispatched.'
    );
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw ApiError.badRequest('Password reset token is invalid or has expired.');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await recordAudit(req, 'PASSWORD_RESET_COMPLETED', { userId: user._id });

    return ApiResponse.success(res, null, 'Password has been reset successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
