const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/error');
const ApiError = require('./utils/apiError');

// Route imports
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration - restricted to configured frontend origins
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman) or matched origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Global Rate Limiter
app.use(generalLimiter);

// Morgan HTTP request logging in non-test mode
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request parsers with size limit protection
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Static file serving for uploads with cache control
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API Endpoints
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/ai', aiRoutes);

// Catch-all 404 handler for undefined API routes
app.use('*', (req, res, next) => {
  next(ApiError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
