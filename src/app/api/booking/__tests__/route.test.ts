/**
 * Unit tests for booking API route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/validation/schemas', () => ({
  bookingSchema: {
    parse: vi.fn(),
  },
  validateAndSanitize: vi.fn(),
}));

vi.mock('@/lib/database/castles', () => ({
  getCastleById: vi.fn(),
}));

vi.mock('@/lib/database/bookings', () => ({
  createBooking: vi.fn(),
}));

vi.mock('@/lib/email/email-service', () => ({
  sendBookingConfirmationEmail: vi.fn(),
}));

import { POST } from '../route';
import { validateAndSanitize } from '@/lib/validation/schemas';
import { getCastleById } from '@/lib/database/castles';
import { createBooking } from '@/lib/database/bookings';
import { sendBookingConfirmationEmail } from '@/lib/email/email-service';

// Create a mock request helper
function createMockRequest(body: any) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

describe('/api/booking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should create a booking successfully', async () => {
      const mockBookingData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        eventDate: '2024-12-25T10:00:00Z',
        castleId: 1,
        totalPrice: 80,
        agreedToTerms: true,
      };

      const mockCastle = {
        id: 1,
        name: 'Test Castle',
        theme: 'Test',
        price: 80,
      };

      const mockBooking = {
        id: 1,
        ...mockBookingData,
        status: 'pending',
      };

      // Setup mocks
      (validateAndSanitize as any).mockReturnValue(mockBookingData);
      (getCastleById as any).mockResolvedValue(mockCastle);
      (createBooking as any).mockResolvedValue(mockBooking);
      (sendBookingConfirmationEmail as any).mockResolvedValue(undefined);

      const request = createMockRequest(mockBookingData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.bookingId).toBe(1);
      expect(createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockBookingData,
          status: 'pending',
          paymentStatus: 'pending',
        })
      );
    });

    it('should return 400 for invalid booking data', async () => {
      const invalidData = {
        customerName: '',
        customerEmail: 'invalid-email',
      };

      (validateAndSanitize as any).mockImplementation(() => {
        throw new Error('Validation failed: customerName: String must contain at least 1 character(s)');
      });

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid booking data');
    });

    it('should return 404 for non-existent castle', async () => {
      const mockBookingData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        eventDate: '2024-12-25T10:00:00Z',
        castleId: 999,
        totalPrice: 80,
        agreedToTerms: true,
      };

      (validateAndSanitize as any).mockReturnValue(mockBookingData);
      (getCastleById as any).mockResolvedValue(null);

      const request = createMockRequest(mockBookingData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Castle not found');
    });

    it('should return 400 for past event date', async () => {
      const mockBookingData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        eventDate: '2020-01-01T10:00:00Z', // Past date
        castleId: 1,
        totalPrice: 80,
        agreedToTerms: true,
      };

      const mockCastle = {
        id: 1,
        name: 'Test Castle',
      };

      (validateAndSanitize as any).mockReturnValue(mockBookingData);
      (getCastleById as any).mockResolvedValue(mockCastle);

      const request = createMockRequest(mockBookingData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Event date must be in the future');
    });

    it('should handle email sending failure gracefully', async () => {
      const mockBookingData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        eventDate: '2024-12-25T10:00:00Z',
        castleId: 1,
        totalPrice: 80,
        agreedToTerms: true,
      };

      const mockCastle = {
        id: 1,
        name: 'Test Castle',
      };

      const mockBooking = {
        id: 1,
        ...mockBookingData,
        status: 'pending',
      };

      (validateAndSanitize as any).mockReturnValue(mockBookingData);
      (getCastleById as any).mockResolvedValue(mockCastle);
      (createBooking as any).mockResolvedValue(mockBooking);
      (sendBookingConfirmationEmail as any).mockRejectedValue(new Error('Email service down'));

      const request = createMockRequest(mockBookingData);
      const response = await POST(request);
      const responseData = await response.json();

      // Should still succeed even if email fails
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.bookingId).toBe(1);
    });

    it('should return 500 for database errors', async () => {
      const mockBookingData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        eventDate: '2024-12-25T10:00:00Z',
        castleId: 1,
        totalPrice: 80,
        agreedToTerms: true,
      };

      (validateAndSanitize as any).mockReturnValue(mockBookingData);
      (getCastleById as any).mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest(mockBookingData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Internal server error');
    });
  });
});