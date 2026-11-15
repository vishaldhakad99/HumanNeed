const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Seller = require('../src/models/Seller');
const Category = require('../src/models/Category');

require('./setup');

describe('Multi-Vendor Seller Isolation & Admin Permissions', () => {
  let adminToken, customerToken, sellerUserToken, sellerDoc, testCategory;

  beforeEach(async () => {
    // 1. Create Admin
    const adminUser = await User.create({
      name: 'Platform Admin',
      email: 'admin@humanneed.in',
      password: 'AdminPassword123',
      role: 'admin',
      isEmailVerified: true,
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@humanneed.in',
      password: 'AdminPassword123',
    });
    adminToken = adminLogin.body.data.accessToken;

    // 2. Create Regular Customer
    await User.create({
      name: 'Regular Customer',
      email: 'customer@example.com',
      password: 'CustomerPassword123',
      role: 'customer',
      isEmailVerified: true,
    });
    const customerLogin = await request(app).post('/api/auth/login').send({
      email: 'customer@example.com',
      password: 'CustomerPassword123',
    });
    customerToken = customerLogin.body.data.accessToken;

    // 3. Create Seller User
    const sellerUser = await User.create({
      name: 'Seller Partner',
      email: 'seller@example.com',
      password: 'SellerPassword123',
      role: 'seller',
      isEmailVerified: true,
    });
    const sellerLogin = await request(app).post('/api/auth/login').send({
      email: 'seller@example.com',
      password: 'SellerPassword123',
    });
    sellerUserToken = sellerLogin.body.data.accessToken;

    // 4. Create Category
    testCategory = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Devices and gadgets',
    });
  });

  it('should prevent non-admin from accessing admin endpoints (RBAC check)', async () => {
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow admin to access metrics with zero fake data', async () => {
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalProducts).toBe(0); // Zero dummy data verified
    expect(res.body.data.verifiedRevenue).toBe(0);
  });

  it('should prevent unapproved seller from creating products', async () => {
    // Submit application (status: pending)
    const applyRes = await request(app)
      .post('/api/seller/apply')
      .set('Authorization', `Bearer ${sellerUserToken}`)
      .send({
        storeName: 'ElectroHub Store',
        businessEmail: 'store@electrohub.com',
        businessPhone: '9876543210',
        gstin: '07AAAAA0000A1Z5',
      });
    expect(applyRes.status).toBe(201);
    expect(applyRes.body.data.status).toBe('pending');

    // Attempt product creation before approval
    const prodRes = await request(app)
      .post('/api/seller/products')
      .set('Authorization', `Bearer ${sellerUserToken}`)
      .send({
        title: 'Wireless Bluetooth Headphones',
        description: 'Noise cancelling over-ear headphones with 40h battery life.',
        category: testCategory._id.toString(),
        price: 2999,
        discountPrice: 1999,
        stockQuantity: 25,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
      });

    // MUST be forbidden because seller is not approved yet!
    expect(prodRes.status).toBe(403);
  });

  it('should allow seller to create products once approved by Admin', async () => {
    // 1. Submit application
    const applyRes = await request(app)
      .post('/api/seller/apply')
      .set('Authorization', `Bearer ${sellerUserToken}`)
      .send({
        storeName: 'Premium Goods Store',
        businessEmail: 'contact@premiumgoods.com',
        businessPhone: '9876543210',
      });
    const sellerId = applyRes.body.data._id;

    // 2. Admin approves seller
    const approveRes = await request(app)
      .put(`/api/admin/sellers/${sellerId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('approved');

    // 3. Seller creates product successfully
    const prodRes = await request(app)
      .post('/api/seller/products')
      .set('Authorization', `Bearer ${sellerUserToken}`)
      .send({
        title: 'Ergonomic Wireless Mouse',
        description: 'Precision tracking ergonomic mouse with silent clicks.',
        category: testCategory._id.toString(),
        price: 999,
        discountPrice: 799,
        stockQuantity: 50,
        images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46'],
      });

    expect(prodRes.status).toBe(201);
    expect(prodRes.body.data.title).toBe('Ergonomic Wireless Mouse');
    expect(prodRes.body.data.sku).toBeDefined();
  });
});
