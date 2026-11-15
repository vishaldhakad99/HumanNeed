const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { slugify } = require('../utils/helpers');

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parentCategory', 'name slug')
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    return ApiResponse.success(res, categories);
  } catch (error) {
    next(error);
  }
};

const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug, isActive: true }).populate('parentCategory', 'name slug');
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    const productCount = await Product.countDocuments({ category: category._id, status: 'active' });

    return ApiResponse.success(res, {
      category,
      productCount,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, icon, parentCategory, displayOrder, isFeatured } = req.body;
    if (!name || !name.trim()) {
      throw ApiError.badRequest('Category name is required.');
    }

    const slug = slugify(name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      throw ApiError.conflict('A category with this name or slug already exists.');
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description,
      image,
      icon,
      parentCategory: parentCategory || null,
      displayOrder: displayOrder || 0,
      isFeatured: Boolean(isFeatured),
    });

    return ApiResponse.created(res, category, 'Category created successfully.');
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, icon, parentCategory, displayOrder, isFeatured, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    if (name) {
      category.name = name.trim();
      category.slug = slugify(name);
    }
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isFeatured !== undefined) category.isFeatured = isFeatured;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    return ApiResponse.success(res, category, 'Category updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productsUsing = await Product.countDocuments({ category: id });
    if (productsUsing > 0) {
      throw ApiError.badRequest(`Cannot delete category. There are ${productsUsing} products assigned to it.`);
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    return ApiResponse.success(res, null, 'Category deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
