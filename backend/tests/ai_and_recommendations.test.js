const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const User = require('../src/models/User');
const Seller = require('../src/models/Seller');

require('./setup');

jest.setTimeout(30000);

describe('AI Assistant & Recommendation Engine Tests', () => {
  let category, seller, product;

  beforeEach(async () => {
    // Create test category
    category = await Category.create({
      name: 'Smart Gadgets',
      slug: 'smart-gadgets',
      description: 'Cutting edge electronics',
    });

    // Create seller
    const user = await User.create({
      name: 'Gadget Store Owner',
      email: 'gadgets@humanneed.in',
      password: 'StrongPassword123!',
      role: 'seller',
      isEmailVerified: true,
    });

    seller = await Seller.create({
      user: user._id,
      storeName: 'GadgetHub India',
      businessEmail: 'contact@gadgethub.in',
      businessPhone: '9876543210',
      address: {
        street: '10 Tech Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      status: 'approved',
      isVerified: true,
    });

    // Create product
    product = await Product.create({
      title: 'Noise Cancelling Wireless Earbuds Pro',
      slug: 'noise-cancelling-wireless-earbuds-pro',
      sku: 'EARBUD-PRO-001',
      description: 'High-fidelity audio earbuds with active noise cancellation and 30-hour battery life.',
      price: 2999,
      discountPrice: 1999,
      category: category._id,
      seller: seller._id,
      stockQuantity: 25,
      ratingsAverage: 4.8,
      ratingsCount: 12,
      salesCount: 5,
      status: 'active',
      tags: ['audio', 'earbuds', 'wireless', 'bluetooth'],
    });
  });

  describe('GET /api/products/recommended', () => {
    it('should return recommended products ordered by ratings and sales', async () => {
      const res = await request(app).get('/api/products/recommended');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toBe('Noise Cancelling Wireless Earbuds Pro');
    });

    it('should filter recommendations by category correctly', async () => {
      const res = await request(app).get(`/api/products/recommended?category=${category.slug}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/ai/chat', () => {
    it('should reject request without a message', async () => {
      const res = await request(app).post('/api/ai/chat').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should answer return and policy questions informatively', async () => {
      const res = await request(app).post('/api/ai/chat').send({
        message: 'What is your return policy?',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/7-day return policy/i);
      expect(Array.isArray(res.body.data.followUps)).toBe(true);
    });

    it('should recommend relevant database products for budget search', async () => {
      const res = await request(app).post('/api/ai/chat').send({
        message: 'Looking for earbuds under 2500',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.products[0].title).toBe('Noise Cancelling Wireless Earbuds Pro');
      expect(res.body.data.products[0].discountPrice).toBeLessThanOrEqual(2500);
    });
  });
});
