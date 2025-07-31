/**
 * Unit tests for validation schemas
 */

import { describe, it, expect } from 'vitest';
import { 
  castleSchema, 
  bookingSchema, 
  contactSchema,
  validateAndSanitize 
} from '../schemas';

describe('Validation Schemas', () => {
  describe('castleSchema', () => {
    it('should validate a valid castle object', () => {
      const validCastle = {
        name: 'Test Castle',
        theme: 'Test Theme',
        size: '12ft x 15ft',
        price: 80,
        description: 'A test castle for validation',
        imageUrl: 'https://example.com/image.jpg',
      };

      const result = validateAndSanitize(castleSchema, validCastle);
      expect(result).toEqual(validCastle);
    });

    it('should reject castle with invalid data', () => {
      const invalidCastle = {
        name: '', // Empty name
        theme: 'Test Theme',
        size: '12ft x 15ft',
        price: -10, // Negative price
        description: 'Short', // Too short description
        imageUrl: 'not-a-url', // Invalid URL
      };

      expect(() => validateAndSanitize(castleSchema, invalidCastle)).toThrow();
    });

    it('should trim and sanitize string fields', () => {
      const castleWithWhitespace = {
        name: '  Test Castle  ',
        theme: '  Test Theme  ',
        size: '  12ft x 15ft  ',
        price: 80,
        description: '  A test castle for validation  ',
        imageUrl: 'https://example.com/image.jpg',
      };

      const result = validateAndSanitize(castleSchema, castleWithWhitespace);
      expect(result.name).toBe('Test Castle');
      expect(result.theme).toBe('Test Theme');
      expect(result.size).toBe('12ft x 15ft');
      expect(result.description).toBe('A test castle for validation');
    });
  });

  describe('bookingSchema', () => {
    it('should validate a valid booking object', () => {
      const validBooking = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        eventDate: '2024-12-25T10:00:00Z',
        eventDuration: 6,
        castleId: 1,
        eventAddress: '123 Test Street',
        eventPostcode: 'NG21 9AG',
        specialRequests: 'Please deliver early',
        agreedToTerms: true,
        isOvernight: false,
        totalPrice: 80,
      };

      const result = validateAndSanitize(bookingSchema, validBooking);
      expect(result.customerEmail).toBe('john@example.com');
      expect(result.eventPostcode).toBe('NG21 9AG');
    });

    it('should reject booking with invalid email', () => {
      const invalidBooking = {
        customerName: 'John Doe',
        customerEmail: 'invalid-email',
        eventDate: '2024-12-25T10:00:00Z',
        eventDuration: 6,
        castleId: 1,
        eventAddress: '123 Test Street',
        eventPostcode: 'NG21 9AG',
        agreedToTerms: true,
        isOvernight: false,
        totalPrice: 80,
      };

      expect(() => validateAndSanitize(bookingSchema, invalidBooking)).toThrow();
    });

    it('should require terms agreement', () => {
      const bookingWithoutTerms = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        eventDate: '2024-12-25T10:00:00Z',
        eventDuration: 6,
        castleId: 1,
        eventAddress: '123 Test Street',
        eventPostcode: 'NG21 9AG',
        agreedToTerms: false, // Not agreed
        isOvernight: false,
        totalPrice: 80,
      };

      expect(() => validateAndSanitize(bookingSchema, bookingWithoutTerms)).toThrow();
    });

    it('should normalize email to lowercase', () => {
      const bookingWithUppercaseEmail = {
        customerName: 'John Doe',
        customerEmail: 'JOHN@EXAMPLE.COM',
        eventDate: '2024-12-25T10:00:00Z',
        eventDuration: 6,
        castleId: 1,
        eventAddress: '123 Test Street',
        eventPostcode: 'NG21 9AG',
        agreedToTerms: true,
        isOvernight: false,
        totalPrice: 80,
      };

      const result = validateAndSanitize(bookingSchema, bookingWithUppercaseEmail);
      expect(result.customerEmail).toBe('john@example.com');
    });
  });

  describe('contactSchema', () => {
    it('should validate a valid contact form', () => {
      const validContact = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        subject: 'Inquiry about booking',
        message: 'I would like to book a castle for my event.',
      };

      const result = validateAndSanitize(contactSchema, validContact);
      expect(result.email).toBe('jane@example.com');
    });

    it('should make phone optional', () => {
      const contactWithoutPhone = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: 'Inquiry about booking',
        message: 'I would like to book a castle for my event.',
      };

      const result = validateAndSanitize(contactSchema, contactWithoutPhone);
      expect(result).toBeDefined();
      expect(result.phone).toBeUndefined();
    });

    it('should reject contact with too long message', () => {
      const contactWithLongMessage = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: 'Inquiry',
        message: 'x'.repeat(2001), // Too long
      };

      expect(() => validateAndSanitize(contactSchema, contactWithLongMessage)).toThrow();
    });
  });

  describe('validateAndSanitize helper', () => {
    it('should throw descriptive error messages', () => {
      const invalidData = {
        name: '', // Empty name required field
        email: 'invalid',
      };

      try {
        validateAndSanitize(contactSchema, invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Validation failed');
      }
    });
  });
});