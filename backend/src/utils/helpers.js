const crypto = require('crypto');

const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `HN-${dateStr}-${randomHex}`;
};

const generateSKU = (categoryPrefix = 'GEN') => {
  const cleanPrefix = categoryPrefix.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `HN-${cleanPrefix}-${randomStr}`;
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const validateIndianPinCode = (pincode) => {
  const pinRegex = /^[1-9][0-9]{5}$/;
  return pinRegex.test(String(pincode).trim());
};

const calculateOrderPricing = ({ items, coupon = null }) => {
  let subtotal = 0;

  for (const item of items) {
    const itemPrice = Number(item.price) || 0;
    const itemQty = Number(item.quantity) || 1;
    subtotal += itemPrice * itemQty;
  }

  let discount = 0;
  if (coupon && coupon.isActive) {
    if (!coupon.minPurchase || subtotal >= coupon.minPurchase) {
      if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'fixed') {
        discount = Math.min(coupon.discountValue, subtotal);
      }
    }
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  // Free delivery on orders above ₹500
  const shippingFee = taxableAmount >= 500 || taxableAmount === 0 ? 0 : 49;
  // Estimated included GST (5% standard e-commerce rate calculated for breakdown, or 0 if prices are already inclusive)
  const tax = Math.round(taxableAmount * 0.05);
  const total = Math.max(0, Math.round(taxableAmount + shippingFee));

  return {
    subtotal: Math.round(subtotal),
    discount: Math.round(discount),
    shippingFee,
    tax,
    total,
  };
};

module.exports = {
  generateOrderNumber,
  generateSKU,
  slugify,
  validateIndianPinCode,
  calculateOrderPricing,
};
