import { NextRequest } from 'next/server';
import { adminMiddleware } from './src/lib/auth/middleware';

export async function middleware(request: NextRequest) {
  // Handle admin routes
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return adminMiddleware(request);
  }

  // Add other middleware here as needed
  // For example: customer route middleware, API rate limiting, etc.

  // Default: continue to the requested page
  return;
}

export const config = {
  matcher: [
    // Admin routes
    '/admin/:path*',
    '/api/admin/:path*',
    
    // Exclude static files and API auth routes
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};