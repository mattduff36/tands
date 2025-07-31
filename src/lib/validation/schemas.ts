/**
 * Zod validation schemas for API routes and forms
 * Provides type-safe validation and sanitization
 */

import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email().max(254).toLowerCase().trim();
const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional();
const nameSchema = z.string().min(1).max(100).trim();
const messageSchema = z.string().min(1).max(2000).trim();

// Castle validation schemas
export const castleSchema = z.object({
  name: z.string().min(1, 'Castle name is required').max(100).trim(),
  theme: z.string().min(1, 'Theme is required').max(50).trim(),
  size: z.string().min(1, 'Size is required').max(50).trim(),
  price: z.number().min(0, 'Price must be positive').max(10000, 'Price too high'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000).trim(),
  imageUrl: z.string().url('Invalid image URL').max(500),
});

export const updateCastleSchema = castleSchema.partial().extend({
  id: z.number().int().positive(),
});

// Booking validation schemas
export const bookingSchema = z.object({
  customerName: nameSchema,
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  eventDate: z.string().datetime('Invalid date format'),
  eventDuration: z.number().int().min(1).max(168), // Max 1 week
  castleId: z.number().int().positive(),
  eventAddress: z.string().min(1, 'Address is required').max(200).trim(),
  eventPostcode: z.string().min(1, 'Postcode is required').max(10).trim().toUpperCase(),
  specialRequests: z.string().max(500).trim().optional(),
  agreedToTerms: z.boolean().refine(val => val === true, 'Must agree to terms'),
  isOvernight: z.boolean().default(false),
  totalPrice: z.number().min(0).max(10000),
});

export const updateBookingSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().max(1000).trim().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded']).optional(),
});

// Contact form validation schema
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  subject: z.string().min(1, 'Subject is required').max(100).trim(),
  message: messageSchema,
});

// User authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Calendar event schemas
export const calendarEventSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().max(200).trim().optional(),
});

// Admin settings schemas
export const adminSettingsSchema = z.object({
  businessName: z.string().min(1).max(100).trim(),
  businessEmail: emailSchema,
  businessPhone: z.string().min(1).max(20).trim(),
  priceOvernight: z.number().min(0).max(1000),
  deliveryRadius: z.number().min(1).max(100),
  minimumBookingHours: z.number().int().min(1).max(48),
});

// Maintenance schemas
export const maintenanceSchema = z.object({
  castleId: z.number().int().positive(),
  status: z.enum(['available', 'maintenance', 'out_of_service']),
  notes: z.string().max(500).trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const bookingFiltersSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  castleId: z.coerce.number().int().positive().optional(),
  customerEmail: emailSchema.optional(),
}).merge(dateRangeSchema).merge(paginationSchema);

// File upload schemas
export const imageUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/, 'Invalid image type'),
  size: z.number().max(5 * 1024 * 1024, 'Image too large (max 5MB)'),
});

// API response schemas for type safety
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.string().optional(),
  code: z.string().optional(),
});

// Helper function to validate and sanitize data
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

// Export types for TypeScript usage
export type Castle = z.infer<typeof castleSchema>;
export type UpdateCastle = z.infer<typeof updateCastleSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type UpdateBooking = z.infer<typeof updateBookingSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type AdminSettings = z.infer<typeof adminSettingsSchema>;
export type Maintenance = z.infer<typeof maintenanceSchema>;
export type BookingFilters = z.infer<typeof bookingFiltersSchema>;
export type ImageUpload = z.infer<typeof imageUploadSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;