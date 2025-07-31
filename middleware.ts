/**
 * Next.js middleware for security, rate limiting, and authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, csrfMiddleware, securityHeadersMiddleware } from './src/lib/auth/middleware';

export async function middleware(request: NextRequest) {
  let response: NextResponse;

  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return securityHeadersMiddleware(rateLimitResponse);
    }

    // Apply CSRF protection
    const csrfResponse = csrfMiddleware(request);
    if (csrfResponse) {
      return securityHeadersMiddleware(csrfResponse);
    }

    // Continue with the request
    response = NextResponse.next();

    // Apply security headers to all responses
    response = securityHeadersMiddleware(response);

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Return a safe error response
    const errorResponse = NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
    
    return securityHeadersMiddleware(errorResponse);
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Match all request paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};