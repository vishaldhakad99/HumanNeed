const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
      default: '',
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: [true, 'Seller reference is required'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'MRP / Price is required'],
      min: [0, 'Price must be positive'],
    },
    discountPrice: {
      type: Number,
      default: function () {
        return this.price;
      },
      min: [0, 'Discount price must be positive'],
      validate: {
        validator: function (val) {
          return val <= this.price;
        },
        message: 'Selling / Discount price cannot exceed MRP',
      },
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      index: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    images: {
      type: [String],
      default: [],
    },
    specifications: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    highlights: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
      set: (val) => Math.round(val * 10) / 10,
      index: true,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    salesCount: {
      type: Number,
      default: 0,
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'out_of_stock', 'archived'],
      default: 'active',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (!this.price || this.price <= 0 || !this.discountPrice) return 0;
  if (this.price <= this.discountPrice) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Text index for search functionality
productSchema.index({
  title: 'text',
  description: 'text',
  shortDescription: 'text',
  tags: 'text',
});

// Compound index for category + price filtering and sorting
productSchema.index({ category: 1, discountPrice: 1, ratingsAverage: -1 });
productSchema.index({ seller: 1, status: 1 });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
