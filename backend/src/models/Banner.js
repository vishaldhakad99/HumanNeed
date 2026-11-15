const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      required: [true, 'Banner image URL is required'],
    },
    link: {
      type: String,
      default: '/shop',
    },
    buttonText: {
      type: String,
      default: 'Shop Now',
    },
    position: {
      type: String,
      enum: ['hero', 'promo_top', 'promo_middle', 'sidebar'],
      default: 'hero',
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Banner = mongoose.model('Banner', bannerSchema);
module.exports = Banner;
