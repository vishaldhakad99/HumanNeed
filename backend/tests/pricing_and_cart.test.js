const { calculateOrderPricing } = require('../src/utils/helpers');

describe('Order Pricing & Coupon Calculation Engine', () => {
  it('should calculate standard order below free shipping threshold with ₹49 shipping', () => {
    const items = [
      { price: 150, quantity: 2 }, // ₹300
    ];
    const pricing = calculateOrderPricing({ items, coupon: null });

    expect(pricing.subtotal).toBe(300);
    expect(pricing.discount).toBe(0);
    expect(pricing.shippingFee).toBe(49);
    expect(pricing.tax).toBe(15); // 5% of 300 = 15
    expect(pricing.total).toBe(349); // 300 + 49
  });

  it('should grant free shipping when subtotal is ₹500 or higher', () => {
    const items = [
      { price: 600, quantity: 1 },
    ];
    const pricing = calculateOrderPricing({ items, coupon: null });

    expect(pricing.subtotal).toBe(600);
    expect(pricing.shippingFee).toBe(0);
    expect(pricing.total).toBe(600);
  });

  it('should correctly apply percentage coupon with maximum discount cap', () => {
    const items = [
      { price: 2000, quantity: 1 },
    ];
    // 20% discount on ₹2000 = ₹400, but capped at maxDiscount ₹250
    const coupon = {
      isActive: true,
      discountType: 'percentage',
      discountValue: 20,
      minPurchase: 500,
      maxDiscount: 250,
    };

    const pricing = calculateOrderPricing({ items, coupon });

    expect(pricing.subtotal).toBe(2000);
    expect(pricing.discount).toBe(250);
    expect(pricing.shippingFee).toBe(0);
    expect(pricing.total).toBe(1750); // 2000 - 250
  });

  it('should correctly apply fixed amount coupon', () => {
    const items = [
      { price: 400, quantity: 2 }, // ₹800
    ];
    const coupon = {
      isActive: true,
      discountType: 'fixed',
      discountValue: 100,
      minPurchase: 500,
    };

    const pricing = calculateOrderPricing({ items, coupon });

    expect(pricing.subtotal).toBe(800);
    expect(pricing.discount).toBe(100);
    expect(pricing.shippingFee).toBe(0);
    expect(pricing.total).toBe(700);
  });
});
