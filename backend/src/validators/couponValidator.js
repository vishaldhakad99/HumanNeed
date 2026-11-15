const { z } = require('zod');

const createCouponSchema = z.object({
  code: z
    .string({ required_error: 'Coupon code is required' })
    .min(3)
    .max(20)
    .toUpperCase()
    .trim(),
  description: z.string().optional().default(''),
  discountType: z.enum(['percentage', 'fixed'], {
    required_error: 'Discount type must be percentage or fixed',
  }),
  discountValue: z
    .number({ required_error: 'Discount value is required' })
    .positive('Discount value must be greater than 0'),
  minPurchase: z.number().min(0).optional().default(0),
  maxDiscount: z.number().positive().optional().nullable(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string({ required_error: 'Expiration date is required' }),
  usageLimit: z.number().int().min(1).optional().default(1000),
  isActive: z.boolean().optional().default(true),
});

const applyCouponSchema = z.object({
  code: z.string({ required_error: 'Coupon code is required' }).trim().toUpperCase(),
});

module.exports = {
  createCouponSchema,
  applyCouponSchema,
};
