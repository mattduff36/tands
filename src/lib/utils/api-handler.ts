/**
 * API route handler utilities for standardized request/response handling
 * Provides consistent error handling, logging, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { APIError, AuthenticationError, AuthorizationError, createErrorHandler } from '@/lib/errors/APIError';
import { logger } from '@/lib/utils/logger';
import { performanceMonitor } from '@/lib/utils/performance-monitor';

export interface APIHandlerOptions {
  requireAuth?: boolean;
  requiredRole?: 'admin' | 'user';
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  cors?: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
  };
}

export interface APIContext {
  req: NextRequest;
  session: any;
  correlationId: string;
}

export type APIHandler<T = any> = (context: APIContext) => Promise<T>;

/**
 * Wrapper for API route handlers with standardized error handling
 */
export function withAPIHandler<T>(
  handler: APIHandler<T>,
  options: APIHandlerOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const correlationId = generateCorrelationId();
    const method = req.method || 'GET';
    const path = new URL(req.url).pathname;
    
    // Set correlation ID for this request
    logger.setCorrelationId(correlationId);
    
    // Start performance monitoring
    const timer = performanceMonitor.startTimer(`api_${method}_${path.replace(/\//g, '_')}`, {
      method,
      path,
      correlationId,
    });

    try {
      logger.api(method, path, 0, 0, { correlationId, stage: 'started' });

      // Handle CORS preflight
      if (method === 'OPTIONS' && options.cors) {
        return handleCORS(options.cors);
      }

      // Authentication check
      let session = null;
      if (options.requireAuth) {
        session = await getServerSession(authOptions);
        if (!session?.user?.email) {
          throw new AuthenticationError('Authentication required', correlationId);
        }

        // Role-based authorization
        if (options.requiredRole === 'admin') {
          const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
          if (!adminEmails.includes(session.user.email)) {
            throw new AuthorizationError('Admin access required', correlationId);
          }
        }
      }

      // Rate limiting (basic implementation)
      if (options.rateLimit) {
        await checkRateLimit(req, options.rateLimit, correlationId);
      }

      // Execute handler
      const context: APIContext = {
        req,
        session,
        correlationId,
      };

      const result = await handler(context);
      const duration = timer.end();

      // Log successful response
      logger.api(method, path, 200, duration, { 
        correlationId, 
        stage: 'completed',
        resultType: typeof result,
      });

      // Create response
      const response = NextResponse.json(result);

      // Apply CORS headers if configured
      if (options.cors) {
        applyCORSHeaders(response, options.cors);
      }

      return response;

    } catch (error) {
      const duration = timer.end();
      const errorHandler = createErrorHandler(correlationId);
      const apiError = errorHandler(error);
      
      // Log the error with correlation ID
      logger.api(method, path, apiError.statusCode, duration, { 
        correlationId, 
        stage: 'error',
        errorCode: apiError.errorCode,
        errorMessage: apiError.message,
      });

      // Create error response
      const errorResponse = NextResponse.json(
        apiError.getClientError(),
        { status: apiError.statusCode }
      );

      // Apply CORS headers if configured
      if (options.cors) {
        applyCORSHeaders(errorResponse, options.cors);
      }

      return errorResponse;

    } finally {
      // Clear correlation ID
      logger.clearCorrelationId();
    }
  };
}

/**
 * Generate a unique correlation ID for request tracking
 */
function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(corsOptions: NonNullable<APIHandlerOptions['cors']>): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  applyCORSHeaders(response, corsOptions);
  return response;
}

/**
 * Apply CORS headers to response
 */
function applyCORSHeaders(response: NextResponse, corsOptions: NonNullable<APIHandlerOptions['cors']>) {
  const { origin = '*', methods = ['GET', 'POST', 'PUT', 'DELETE'], headers = ['Content-Type', 'Authorization'] } = corsOptions;

  if (typeof origin === 'string') {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    // For multiple origins, you'd need to check the request origin
    response.headers.set('Access-Control-Allow-Origin', origin[0] || '*');
  }

  response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', headers.join(', '));
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Basic rate limiting implementation
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(
  req: NextRequest,
  rateLimit: NonNullable<APIHandlerOptions['rateLimit']>,
  correlationId: string
) {
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const key = `rate_limit_${clientIP}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + rateLimit.windowMs,
    });
    return;
  }
  
  if (record.count >= rateLimit.requests) {
    logger.warn('Rate limit exceeded', {
      clientIP,
      correlationId,
      limit: rateLimit.requests,
      windowMs: rateLimit.windowMs,
    }, 'RATE_LIMIT');
    
    throw new APIError(
      'Rate limit exceeded. Please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED' as any,
      [{
        field: 'requests',
        message: `Maximum ${rateLimit.requests} requests per ${rateLimit.windowMs}ms exceeded`,
      }],
      correlationId
    );
  }
  
  // Increment counter
  record.count++;
  rateLimitStore.set(key, record);
}

/**
 * Utility for handling async operations with error wrapping
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  correlationId?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const errorHandler = createErrorHandler(correlationId);
    throw errorHandler(error);
  }
}

/**
 * Validate request body with Zod schema (if available)
 */
export async function validateRequestBody<T>(
  req: NextRequest,
  schema: any,
  correlationId?: string
): Promise<T> {
  try {
    const body = await req.json();
    
    if (schema && typeof schema.parse === 'function') {
      return schema.parse(body);
    }
    
    return body;
  } catch (error) {
    if (error instanceof Error && error.message.includes('JSON')) {
      throw new APIError(
        'Invalid JSON in request body',
        400,
        'VALIDATION_ERROR' as any,
        [{ field: 'body', message: 'Request body must be valid JSON' }],
        correlationId
      );
    }
    
    // Zod validation error
    throw new APIError(
      'Request validation failed',
      400,
      'VALIDATION_ERROR' as any,
      [{ field: 'body', message: error instanceof Error ? error.message : 'Invalid request body' }],
      correlationId
    );
  }
}