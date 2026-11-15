const Banner = require('../models/Banner');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

const getActiveBanners = async (req, res, next) => {
  try {
    const { position } = req.query;
    const query = { isActive: true };
    if (position) query.position = position;

    const banners = await Banner.find(query).sort({ displayOrder: 1, createdAt: -1 }).lean();
    return ApiResponse.success(res, banners);
  } catch (error) {
    next(error);
  }
};

const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
    return ApiResponse.success(res, banners);
  } catch (error) {
    next(error);
  }
};

const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, image, link, buttonText, position, displayOrder, isActive } = req.body;
    if (!title || !image) {
      throw ApiError.badRequest('Banner title and image URL are required.');
    }

    const banner = await Banner.create({
      title,
      subtitle,
      image,
      link: link || '/shop',
      buttonText: buttonText || 'Shop Now',
      position: position || 'hero',
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return ApiResponse.created(res, banner, 'Banner created successfully.');
  } catch (error) {
    next(error);
  }
};

const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!banner) throw ApiError.notFound('Banner not found.');

    return ApiResponse.success(res, banner, 'Banner updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) throw ApiError.notFound('Banner not found.');

    return ApiResponse.success(res, null, 'Banner deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
