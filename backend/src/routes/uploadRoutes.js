const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// Single image upload
router.post('/single', authenticate, upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No image file uploaded.');
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return ApiResponse.created(
      res,
      {
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      'Image uploaded successfully.'
    );
  } catch (error) {
    next(error);
  }
});

// Multiple images upload (up to 5 images for products)
router.post('/multiple', authenticate, upload.array('images', 5), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw ApiError.badRequest('No image files uploaded.');
    }

    const uploaded = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    }));

    return ApiResponse.created(res, uploaded, 'Images uploaded successfully.');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
