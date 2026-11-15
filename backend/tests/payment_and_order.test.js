const crypto = require('crypto');
const paymentService = require('../src/services/paymentService');
const orderService = require('../src/services/orderService');
const User = require('../src/models/User');
const Seller = require('../src/models/Seller');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');

require('./setup');

describe('Payment Cryptography & Inventory Safety Suite', () => {
  it('should cryptographically verify valid Razorpay payment signature and reject tampered signature', () => {
    const testSecret = 'test_razorpay_secret_key_123';
    // Temporarily inject test secret for unit verification
    const originalSecret = require('../src/config/razorpay').keySecret;
    require('../src/config/razorpay').keySecret = testSecret;

    const razorpayOrderId = 'order_DA9vF99sXvD81';
    const razorpayPaymentId = 'pay_29QQoUBi66xm2f';
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const validSignature = crypto.createHmac('sha256', testSecret).update(payload).digest('hex');

    const isValid = paymentService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: validSignature,
      secret: testSecret,
    });
    expect(isValid).toBe(true);

    const isTamperedValid = paymentService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: 'tampered_fake_signature_hash',
      secret: testSecret,
    });
    expect(isTamperedValid).toBe(false);

    // Restore original secret
    require('../src/config/razorpay').keySecret = originalSecret;
  });

  it('should atomically reserve stock upon COD order and replenish stock upon cancellation', async () => {
    // 1. Setup User, Category, Seller, Product
    const customer = await User.create({
      name: 'Order Tester',
      email: 'ordertest@example.com',
      password: 'Password123',
      role: 'customer',
      isEmailVerified: true,
    });

    const sellerUser = await User.create({
      name: 'Merchant Partner',
      email: 'merchant@example.com',
      password: 'Password123',
      role: 'seller',
    });

    const seller = await Seller.create({
      user: sellerUser._id,
      storeName: 'Merchant Store',
      businessEmail: 'merchant@example.com',
      businessPhone: '9876543210',
      status: 'approved',
    });

    const category = await Category.create({
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
    });

    const initialStock = 10;
    const product = await Product.create({
      title: 'Stainless Steel Water Bottle 1L',
      slug: 'ss-water-bottle-1l',
      sku: 'HN-HOM-0001',
      description: 'Durable 1000ml stainless steel insulated water bottle for all day hydration.',
      seller: seller._id,
      category: category._id,
      price: 699,
      discountPrice: 499,
      stockQuantity: initialStock,
      images: ['https://example.com/bottle.jpg'],
    });

    // 2. Put 3 units in Cart
    await Cart.create({
      user: customer._id,
      items: [
        {
          product: product._id,
          quantity: 3,
          price: 499,
          savedForLater: false,
        },
      ],
    });

    // 3. Place order via Cash On Delivery
    const { order } = await orderService.createOrder({
      userId: customer._id,
      shippingAddress: {
        fullName: 'Order Tester',
        phone: '9876543210',
        addressLine1: 'Flat 402, Green Avenue',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      paymentMethod: 'cod',
    });

    expect(order.orderNumber).toMatch(/^HN-\d{8}-[A-F0-9]{6}$/);
    expect(order.orderStatus).toBe('processing');

    // Verify atomic stock decrement (10 - 3 = 7)
    const productAfterOrder = await Product.findById(product._id);
    expect(productAfterOrder.stockQuantity).toBe(7);
    expect(productAfterOrder.salesCount).toBe(3);

    // 4. Cancel order and verify stock replenishment (7 + 3 = 10)
    await orderService.cancelOrder({
      orderId: order._id,
      userId: customer._id,
      role: 'customer',
      reason: 'Ordered by mistake',
    });

    const productAfterCancel = await Product.findById(product._id);
    expect(productAfterCancel.stockQuantity).toBe(10);
    expect(productAfterCancel.salesCount).toBe(0);
  });
});
