/**
 * Unit tests for error sanitization utility
 */

import { describe, it, expect } from 'vitest';
import { 
  sanitizeErrorMessage, 
  createSanitizedErrorResponse, 
  logSafeError 
} from '../error-sanitizer';

describe('Error Sanitizer', () => {
  describe('sanitizeErrorMessage', () => {
    it('should sanitize database connection strings', () => {
      const errorWithConnectionString = 'Connection failed: postgresql://user:password@localhost:5432/dbname';
      const result = sanitizeErrorMessage(errorWithConnectionString, 'database');
      
      expect(result).toBe('Database operation failed');
      expect(result).not.toContain('password');
      expect(result).not.toContain('postgresql://');
    });

    it('should sanitize API keys', () => {
      const errorWithApiKey = 'Request failed with api_key: abc123secret456';
      const result = sanitizeErrorMessage(errorWithApiKey, 'network');
      
      expect(result).toBe('Network request failed');
      expect(result).not.toContain('abc123secret456');
    });

    it('should sanitize file paths', () => {
      const errorWithPath = 'File not found: C:\\Users\\admin\\sensitive\\config.json';
      const result = sanitizeErrorMessage(errorWithPath, 'file');
      
      expect(result).toBe('File operation failed');
      expect(result).not.toContain('C:\\Users\\admin');
    });

    it('should preserve safe error messages', () => {
      const safeError = 'Invalid email format provided';
      const result = sanitizeErrorMessage(safeError, 'validation');
      
      expect(result).toBe('Invalid email format provided');
    });

    it('should handle Error objects', () => {
      const error = new Error('Database connection failed with password: secret123');
      const result = sanitizeErrorMessage(error, 'database');
      
      expect(result).toBe('Database operation failed');
    });

    it('should truncate very long messages', () => {
      const longError = 'x'.repeat(300);
      const result = sanitizeErrorMessage(longError);
      
      expect(result.length).toBeLessThanOrEqual(203); // 200 + "..."
      expect(result.endsWith('...')).toBe(true);
    });

    it('should handle non-string inputs', () => {
      const result1 = sanitizeErrorMessage(null);
      const result2 = sanitizeErrorMessage(undefined);
      const result3 = sanitizeErrorMessage(123);
      
      expect(result1).toBe('An unexpected error occurred');
      expect(result2).toBe('An unexpected error occurred');
      expect(result3).toBe('123');
    });
  });

  describe('createSanitizedErrorResponse', () => {
    it('should create proper error response structure', () => {
      const error = new Error('Test error');
      const response = createSanitizedErrorResponse(error, 'test', 400);
      
      expect(response).toHaveProperty('success', false);
      expect(response).toHaveProperty('error');
      expect(typeof response.error).toBe('string');
    });

    it('should include details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';
      
      const error = new Error('Safe test error');
      error.stack = 'Error: Safe test error\n    at test.js:1:1';
      
      const response = createSanitizedErrorResponse(error, 'test');
      
      expect(response).toHaveProperty('details');
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should not include details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      
      const error = new Error('Test error');
      const response = createSanitizedErrorResponse(error, 'test');
      
      expect(response).not.toHaveProperty('details');
      
      (process.env as any).NODE_ENV = originalEnv;
    });
  });

  describe('logSafeError', () => {
    it('should not throw when logging errors', () => {
      expect(() => {
        logSafeError('Test error', 'test');
        logSafeError(new Error('Test error'), 'test');
        logSafeError(null, 'test');
      }).not.toThrow();
    });
  });

  describe('context-based sanitization', () => {
    it('should return database-specific messages for database context', () => {
      const error = 'Something went wrong with sensitive info';
      const result = sanitizeErrorMessage(error, 'database');
      
      expect(result).toBe('Database operation failed');
    });

    it('should return auth-specific messages for auth context', () => {
      const error = 'Auth failed with token: abc123';
      const result = sanitizeErrorMessage(error, 'authentication');
      
      expect(result).toBe('Authentication error');
    });

    it('should return validation-specific messages for validation context', () => {
      const error = 'Validation failed';
      const result = sanitizeErrorMessage(error, 'validation');
      
      expect(result).toBe('Validation failed'); // This one is safe
    });
  });
});