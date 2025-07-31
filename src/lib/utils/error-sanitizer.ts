/**
 * Error sanitization utility to prevent data leaks in error messages
 */

// Sensitive patterns that should never appear in error messages
const SENSITIVE_PATTERNS = [
  // Database connection strings
  /postgresql:\/\/[^@]+@[^\/]+\/\w+/gi,
  /mongodb:\/\/[^@]+@[^\/]+\/\w+/gi,
  
  // API keys and tokens
  /api[_-]?key[_-]?[:=]\s*['\"]?[\w-]+['\"]?/gi,
  /access[_-]?token[_-]?[:=]\s*['\"]?[\w-]+['\"]?/gi,
  /secret[_-]?key[_-]?[:=]\s*['\"]?[\w-]+['\"]?/gi,
  /bearer\s+[\w-]+/gi,
  
  // Email credentials
  /smtp[_-]?user[_-]?[:=]\s*['\"]?[^'"\s]+['\"]?/gi,
  /smtp[_-]?pass[_-]?[:=]\s*['\"]?[^'"\s]+['\"]?/gi,
  
  // File paths that might reveal server structure
  /[a-z]:\\\\[\w\\-_.]+/gi,
  /\/(?:home|usr|var|etc)\/[\w\/-]+/gi,
  
  // IP addresses (internal ones)
  /192\.168\.\d{1,3}\.\d{1,3}/g,
  /10\.\d{1,3}\.\d{1,3}\.\d{1,3}/g,
  /172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/g,
  
  // Common sensitive environment variables
  /DATABASE_URL[_-]?[:=]\s*['\"]?[^'"\s]+['\"]?/gi,
  /NEXTAUTH_SECRET[_-]?[:=]\s*['\"]?[^'"\s]+['\"]?/gi,
  /GOOGLE_CLIENT_SECRET[_-]?[:=]\s*['\"]?[^'"\s]+['\"]?/gi,
];

// Generic error messages for different error types
const GENERIC_MESSAGES = {
  database: 'Database operation failed',
  authentication: 'Authentication error',
  authorization: 'Access denied',
  validation: 'Invalid input provided',
  network: 'Network request failed',
  file: 'File operation failed',
  email: 'Email service error',
  payment: 'Payment processing error',
  calendar: 'Calendar service error',
  unknown: 'An unexpected error occurred',
};

/**
 * Sanitize error message to remove sensitive information
 */
export function sanitizeErrorMessage(error: unknown, context?: string): string {
  let message: string;

  // Convert error to string
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = String(error);
  }

  // Remove sensitive patterns
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  // If the message contained sensitive info, replace with generic message
  if (sanitized.includes('[REDACTED]')) {
    return getGenericMessage(context || 'unknown');
  }

  // Check for other potential leaks and replace with generic messages
  if (containsSensitiveInfo(sanitized)) {
    return getGenericMessage(context || 'unknown');
  }

  // Truncate very long messages
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200) + '...';
  }

  return sanitized;
}

/**
 * Get generic error message based on context
 */
function getGenericMessage(context: string): string {
  const lowerContext = context.toLowerCase();
  
  if (lowerContext.includes('database') || lowerContext.includes('sql')) {
    return GENERIC_MESSAGES.database;
  }
  if (lowerContext.includes('auth')) {
    return GENERIC_MESSAGES.authentication;
  }
  if (lowerContext.includes('permission') || lowerContext.includes('forbidden')) {
    return GENERIC_MESSAGES.authorization;
  }
  if (lowerContext.includes('validation') || lowerContext.includes('invalid')) {
    return GENERIC_MESSAGES.validation;
  }
  if (lowerContext.includes('network') || lowerContext.includes('fetch')) {
    return GENERIC_MESSAGES.network;
  }
  if (lowerContext.includes('file') || lowerContext.includes('upload')) {
    return GENERIC_MESSAGES.file;
  }
  if (lowerContext.includes('email') || lowerContext.includes('smtp')) {
    return GENERIC_MESSAGES.email;
  }
  if (lowerContext.includes('payment') || lowerContext.includes('stripe')) {
    return GENERIC_MESSAGES.payment;
  }
  if (lowerContext.includes('calendar') || lowerContext.includes('google')) {
    return GENERIC_MESSAGES.calendar;
  }
  
  return GENERIC_MESSAGES.unknown;
}

/**
 * Check if message contains potentially sensitive information
 */
function containsSensitiveInfo(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Check for common sensitive keywords
  const sensitiveKeywords = [
    'password', 'secret', 'key', 'token', 'credential', 
    'connection string', 'database url', 'smtp', 'auth',
    'private', 'internal', 'localhost', '127.0.0.1',
    'environment', 'config', '.env'
  ];
  
  return sensitiveKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Create sanitized error response for API endpoints
 */
export function createSanitizedErrorResponse(
  error: unknown, 
  context?: string,
  statusCode: number = 500
): { success: false; error: string; details?: string } {
  const sanitizedMessage = sanitizeErrorMessage(error, context);
  
  // In development, include more details
  const response: { success: false; error: string; details?: string } = {
    success: false,
    error: sanitizedMessage,
  };
  
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    // Only include stack trace in development and if it doesn't contain sensitive info
    const sanitizedStack = sanitizeErrorMessage(error.stack || '', context);
    if (sanitizedStack !== getGenericMessage(context || 'unknown')) {
      response.details = sanitizedStack;
    }
  }
  
  return response;
}

/**
 * Log error safely without exposing sensitive information
 */
export function logSafeError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    // In development, log full error for debugging
    console.error(`[${context || 'ERROR'}]:`, error);
  } else {
    // In production, log sanitized version
    const sanitized = sanitizeErrorMessage(error, context);
    console.error(`[${context || 'ERROR'}]:`, sanitized);
  }
}