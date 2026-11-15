const { z } = require('zod');

const registerSellerSchema = z.object({
  storeName: z
    .string({ required_error: 'Store name is required' })
    .min(2, 'Store name must be at least 2 characters')
    .max(100, 'Store name cannot exceed 100 characters')
    .trim(),
  storeDescription: z.string().max(1000).optional().default(''),
  businessEmail: z
    .string({ required_error: 'Business email is required' })
    .email('Invalid business email')
    .toLowerCase(),
  businessPhone: z
    .string({ required_error: 'Business phone is required' })
    .min(10, 'Valid phone number required'),
  gstin: z.string().optional().default(''),
  pan: z.string().optional().default(''),
  businessAddress: z
    .object({
      street: z.string().optional().default(''),
      city: z.string().optional().default(''),
      state: z.string().optional().default(''),
      pincode: z.string().optional().default(''),
      country: z.string().optional().default('India'),
    })
    .optional(),
  bankDetails: z
    .object({
      accountHolderName: z.string().optional().default(''),
      accountNumber: z.string().optional().default(''),
      ifscCode: z.string().optional().default(''),
      bankName: z.string().optional().default(''),
    })
    .optional(),
});

const updateSellerStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']),
  rejectionReason: z.string().optional().default(''),
});

module.exports = {
  registerSellerSchema,
  updateSellerStatusSchema,
};
