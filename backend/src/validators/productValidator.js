const { z } = require('zod');

const createProductSchema = z.object({
  title: z
    .string({ required_error: 'Product title is required' })
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  description: z
    .string({ required_error: 'Product description is required' })
    .min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().max(300).optional().default(''),
  category: z.string({ required_error: 'Category ID is required' }),
  brand: z.string().optional().nullable(),
  price: z
    .number({ required_error: 'Price / MRP is required' })
    .positive('Price must be greater than 0'),
  discountPrice: z
    .number()
    .positive('Discount price must be greater than 0')
    .optional(),
  stockQuantity: z
    .number({ required_error: 'Stock quantity is required' })
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0).optional().default(5),
  images: z.array(z.string()).min(1, 'At least one product image is required'),
  specifications: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .optional()
    .default([]),
  highlights: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'active', 'out_of_stock', 'archived']).optional().default('active'),
  isFeatured: z.boolean().optional().default(false),
});

const updateProductSchema = createProductSchema.partial();

module.exports = {
  createProductSchema,
  updateProductSchema,
};
