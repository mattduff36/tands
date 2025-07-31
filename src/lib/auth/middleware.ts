/**
 * Authentication and rate limiting middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './nextauth.config';

// Rate limiting storage (in production, use Redis or external store)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMITS = {
  // API endpoints rate limits (requests per minute)
  '/api/contact': { requests: 5, window: 60 * 1000 }, // 5 requests per minute
  '/api/booking': { requests: 10, window: 60 * 1000 }, // 10 requests per minute
  '/api/availability': { requests: 30, window: 60 * 1000 }, // 30 requests per minute
  '/api/castles': { requests: 60, window: 60 * 1000 }, // 60 requests per minute
  // Admin endpoints (more restrictive)
  '/api/admin': { requests: 100, window: 60 * 1000 }, // 100 requests per minute for admin
};

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = forwardedFor?.split(',')[0] || realIP || request.ip || 'unknown';
  return clientIP;
}

/**
 * Check if request exceeds rate limit
 */
function isRateLimited(clientIP: string, endpoint: string): boolean {
  const rateLimit = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS];
  if (!rateLimit) return false;

  const key = `${clientIP}:${endpoint}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up old records periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupOldRecords();
  }

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + rateLimit.window });
    return false;
  }

  if (record.count >= rateLimit.requests) {
    return true; // Rate limited
  }

  // Increment count
  record.count += 1;
  rateLimitStore.set(key, record);
  return false;
}

/**
 * Clean up old rate limit records
 */
function cleanupOldRecords(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const clientIP = getClientIP(request);

  // Find matching rate limit pattern
  const matchingEndpoint = Object.keys(RATE_LIMITS).find(endpoint => 
    pathname.startsWith(endpoint)
  );

  if (matchingEndpoint && isRateLimited(clientIP, matchingEndpoint)) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(RATE_LIMITS[matchingEndpoint as keyof typeof RATE_LIMITS].window / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(RATE_LIMITS[matchingEndpoint as keyof typeof RATE_LIMITS].window / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMITS[matchingEndpoint as keyof typeof RATE_LIMITS].requests),
          'X-RateLimit-Window': String(RATE_LIMITS[matchingEndpoint as keyof typeof RATE_LIMITS].window / 1000),
        }
      }
    );
  }

  return null; // No rate limiting applied
}

/**
 * Admin authentication middleware
 */
export async function adminAuthMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Only apply to admin routes
  if (!request.nextUrl.pathname.startsWith('/api/admin')) {
    return null;
  }

  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Check if user is authorized admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const userEmail = session.user?.email?.toLowerCase();
    
    if (!userEmail || !adminEmails.some(email => email.toLowerCase() === userEmail)) {
      return NextResponse.json({ 
        success: false,
        error: 'Admin access required' 
      }, { status: 403 });
    }

    return null; // Authentication passed
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Authentication error' 
    }, { status: 500 });
  }
}

/**
 * CSRF protection middleware
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  // Only apply CSRF protection to state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return null;
  }

  // Skip CSRF for public API endpoints that don't modify user data
  const publicEndpoints = ['/api/castles', '/api/availability'];
  if (publicEndpoints.some(endpoint => request.nextUrl.pathname.startsWith(endpoint))) {
    return null;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // In development, allow localhost origins
  if (process.env.NODE_ENV === 'development') {
    if (origin?.includes('localhost') || referer?.includes('localhost')) {
      return null;
    }
  }

  // Check origin header
  if (!origin) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Missing origin header' 
      },
      { status: 403 }
    );
  }

  // Verify origin matches host
  const originHost = new URL(origin).host;
  if (originHost !== host) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Invalid origin' 
      },
      { status: 403 }
    );
  }

  return null; // CSRF check passed
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(response: NextResponse): NextResponse {
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy (adjust as needed)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspDirectives);

  return response;
}