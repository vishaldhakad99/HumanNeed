const Brand = require('../models/Brand');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { slugify } = require('../utils/helpers');

const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 }).lean();
    return ApiResponse.success(res, brands);
  } catch (error) {
    next(error);
  }
};

const createBrand = async (req, res, next) => {
  try {
    const { name, logo, description, website, isFeatured } = req.body;
    if (!name || !name.trim()) {
      throw ApiError.badRequest('Brand name is required.');
    }

    const slug = slugify(name);
    const existing = await Brand.findOne({ slug });
    if (existing) {
      throw ApiError.conflict('A brand with this name or slug already exists.');
    }

    const brand = await Brand.create({
      name: name.trim(),
      slug,
      logo,
      description,
      website,
      isFeatured: Boolean(isFeatured),
    });

    return ApiResponse.created(res, brand, 'Brand created successfully.');
  } catch (error) {
    next(error);
  }
};

const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, logo, description, website, isFeatured, isActive } = req.body;

    const brand = await Brand.findById(id);
    if (!brand) {
      throw ApiError.notFound('Brand not found.');
    }

    if (name) {
      brand.name = name.trim();
      brand.slug = slugify(name);
    }
    if (logo !== undefined) brand.logo = logo;
    if (description !== undefined) brand.description = description;
    if (website !== undefined) brand.website = website;
    if (isFeatured !== undefined) brand.isFeatured = isFeatured;
    if (isActive !== undefined) brand.isActive = isActive;

    await brand.save();

    return ApiResponse.success(res, brand, 'Brand updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productsUsing = await Product.countDocuments({ brand: id });
    if (productsUsing > 0) {
      throw ApiError.badRequest(`Cannot delete brand. There are ${productsUsing} products associated with it.`);
    }

    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) {
      throw ApiError.notFound('Brand not found.');
    }

    return ApiResponse.success(res, null, 'Brand deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
};
