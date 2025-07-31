/**
 * Custom API Error classes for standardized error handling
 * Provides consistent error responses across all API endpoints
 */

export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export interface ErrorDetails {
  field?: string;
  code?: string;
  message?: string;
  value?: any;
}

export class APIError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly details?: ErrorDetails[];
  public readonly correlationId?: string;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode: ErrorCode,
    details?: ErrorDetails[],
    correlationId?: string
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.correlationId = correlationId;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.errorCode,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        details: this.details,
        correlationId: this.correlationId,
      }
    };
  }

  /**
   * Check if error should be exposed to client
   */
  shouldExposeToClient(): boolean {
    // Don't expose server errors to client in production
    return this.statusCode < 500 || process.env.NODE_ENV === 'development';
  }

  /**
   * Get sanitized error for client
   */
  getClientError() {
    if (this.shouldExposeToClient()) {
      return this.toJSON();
    }

    // Return generic error for server errors in production
    return {
      error: {
        message: 'An internal server error occurred',
        code: ErrorCode.INTERNAL_ERROR,
        statusCode: 500,
        timestamp: this.timestamp,
        correlationId: this.correlationId,
      }
    };
  }
}

// Specific error classes for common scenarios
export class ValidationError extends APIError {
  constructor(message: string, details?: ErrorDetails[], correlationId?: string) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, details, correlationId);
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required', correlationId?: string) {
    super(message, 401, ErrorCode.AUTHENTICATION_REQUIRED, undefined, correlationId);
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Access denied', correlationId?: string) {
    super(message, 403, ErrorCode.ACCESS_DENIED, undefined, correlationId);
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string, correlationId?: string) {
    super(`${resource} not found`, 404, ErrorCode.NOT_FOUND, undefined, correlationId);
  }
}

export class ConflictError extends APIError {
  constructor(message: string, details?: ErrorDetails[], correlationId?: string) {
    super(message, 409, ErrorCode.CONFLICT, details, correlationId);
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded', correlationId?: string) {
    super(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED, undefined, correlationId);
  }
}

export class DatabaseError extends APIError {
  constructor(message: string, details?: ErrorDetails[], correlationId?: string) {
    super(message, 500, ErrorCode.DATABASE_ERROR, details, correlationId);
  }
}

export class ExternalServiceError extends APIError {
  constructor(service: string, message: string, correlationId?: string) {
    super(`External service error (${service}): ${message}`, 502, ErrorCode.EXTERNAL_SERVICE_ERROR, undefined, correlationId);
  }
}

export class ConfigurationError extends APIError {
  constructor(message: string, correlationId?: string) {
    super(`Configuration error: ${message}`, 500, ErrorCode.CONFIGURATION_ERROR, undefined, correlationId);
  }
}

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
  /**
   * Wrap unknown errors in APIError
   */
  static wrap(error: unknown, correlationId?: string): APIError {
    if (error instanceof APIError) {
      return error;
    }

    if (error instanceof Error) {
      return new APIError(
        error.message,
        500,
        ErrorCode.INTERNAL_ERROR,
        undefined,
        correlationId
      );
    }

    return new APIError(
      'An unexpected error occurred',
      500,
      ErrorCode.INTERNAL_ERROR,
      undefined,
      correlationId
    );
  }

  /**
   * Create validation error from field errors
   */
  static validationError(fieldErrors: Record<string, string>, correlationId?: string): ValidationError {
    const details: ErrorDetails[] = Object.entries(fieldErrors).map(([field, message]) => ({
      field,
      message,
    }));

    return new ValidationError('Validation failed', details, correlationId);
  }

  /**
   * Check if error is a client error (4xx)
   */
  static isClientError(error: APIError): boolean {
    return error.statusCode >= 400 && error.statusCode < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  static isServerError(error: APIError): boolean {
    return error.statusCode >= 500;
  }
}

/**
 * Error handler middleware for API routes
 */
export function createErrorHandler(correlationId?: string) {
  return (error: unknown) => {
    const apiError = ErrorUtils.wrap(error, correlationId);
    
    // Log error details
    if (ErrorUtils.isServerError(apiError)) {
      console.error('Server error occurred:', {
        message: apiError.message,
        statusCode: apiError.statusCode,
        errorCode: apiError.errorCode,
        stack: apiError.stack,
        correlationId: apiError.correlationId,
      });
    } else {
      console.warn('Client error occurred:', {
        message: apiError.message,
        statusCode: apiError.statusCode,
        errorCode: apiError.errorCode,
        correlationId: apiError.correlationId,
      });
    }

    return apiError;
  };
}