import { z } from 'zod'
import validator from 'validator'

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return input

  // Escape HTML characters
  return validator.escape(input.trim())
}

/**
 * Sanitize all string fields in an object
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj

  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' ? sanitizeObject(item) :
        typeof item === 'string' ? sanitizeString(item) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

/**
 * Common validation schemas using Zod
 */
export const schemas = {
  email: z.string().email('Invalid email format'),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Name contains invalid characters'),

  organizationName: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name is too long'),

  accessKey: z.string()
    .regex(/^QW-[A-F0-9]{16}$/, 'Invalid access key format'),

  sku: z.string()
    .min(1, 'SKU is required')
    .max(50, 'SKU is too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores'),

  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .optional(),

  url: z.string().url('Invalid URL format').optional(),

  positiveNumber: z.number().positive('Must be a positive number'),

  nonNegativeNumber: z.number().min(0, 'Must be zero or greater'),
}

/**
 * Validate signup data
 */
export const signupSchema = z.object({
  name: schemas.name,
  email: schemas.email,
  password: schemas.password,
  organizationName: schemas.organizationName,
  accessKey: schemas.accessKey
})

/**
 * Validate product data
 */
export const productSchema = z.object({
  sku: schemas.sku,
  name: z.string().min(1, 'Product name is required').max(200),
  categoryId: z.number().int().positive(),
  stock: schemas.nonNegativeNumber.optional(),
  minStock: schemas.nonNegativeNumber.optional(),
  location: z.string().max(100).optional(),
  value: schemas.nonNegativeNumber.optional(),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  image: z.string().url().optional().nullable()
})

/**
 * Validate order data
 */
export const orderSchema = z.object({
  orderId: z.string().min(1).max(50),
  customer: z.string().min(1).max(100),
  email: schemas.email,
  phone: schemas.phone,
  billingAddress: z.string().max(500).optional(),
  subtotal: schemas.nonNegativeNumber,
  total: schemas.nonNegativeNumber,
  status: z.string().min(1),
  priority: z.string().min(1),
  dueDate: z.string(),
  assignedTo: z.string().max(100),
  items: z.array(z.object({
    sku: schemas.sku,
    name: z.string().min(1),
    price: schemas.nonNegativeNumber,
    quantity: z.number().int().positive(),
    productId: z.number().int().positive().optional()
  })).min(1, 'Order must have at least one item')
})

/**
 * Helper to validate data against a schema
 */
export function validate(schema, data) {
  try {
    return {
      success: true,
      data: schema.parse(data)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }]
    }
  }
}

/**
 * Rate limiting helper (simple in-memory store)
 * For production, use Redis or a proper rate limiting service
 */
const rateLimitStore = new Map()

export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now()
  const key = `ratelimit:${identifier}`

  // Clean up old entries
  if (rateLimitStore.size > 10000) {
    rateLimitStore.clear()
  }

  const record = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs }

  // Reset if window expired
  if (now > record.resetAt) {
    record.count = 0
    record.resetAt = now + windowMs
  }

  record.count++
  rateLimitStore.set(key, record)

  const allowed = record.count <= maxRequests
  const resetIn = Math.ceil((record.resetAt - now) / 1000)

  return {
    allowed,
    remaining: Math.max(0, maxRequests - record.count),
    resetIn
  }
}
