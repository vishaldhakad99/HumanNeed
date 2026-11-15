const { z } = require('zod');

const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    phone: z.string().min(10, 'Valid 10-digit phone number is required'),
    alternatePhone: z.string().optional().default(''),
    addressLine1: z.string().min(3, 'Address line 1 is required'),
    addressLine2: z.string().optional().default(''),
    landmark: z.string().optional().default(''),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit Indian PIN Code'),
  }),
  paymentMethod: z.enum(['razorpay', 'cod'], {
    required_error: 'Payment method must be razorpay or cod',
  }),
  couponCode: z.string().optional().nullable(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending_payment',
    'payment_confirmed',
    'processing',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'return_requested',
    'returned',
    'refund_processing',
    'refunded',
  ]),
  comment: z.string().optional().default(''),
  courierName: z.string().optional().default(''),
  trackingNumber: z.string().optional().default(''),
  trackingUrl: z.string().optional().default(''),
});

const returnOrderSchema = z.object({
  reason: z.string().min(5, 'Return reason must be at least 5 characters'),
});

const cancelOrderSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required'),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  returnOrderSchema,
  cancelOrderSchema,
};
