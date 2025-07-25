import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isAdminEmail } from './google-auth';

export interface AdminMiddlewareOptions {
  requireAuth?: boolean;
  adminOnly?: boolean;
  redirectTo?: string;
}

/**
 * Middleware to protect admin routes
 * Checks for valid authentication and admin permissions
 */
export async function withAdminAuth(
  request: NextRequest,
  options: AdminMiddlewareOptions = {}
) {
  const {
    requireAuth = true,
    adminOnly = true,
    redirectTo = '/admin/signin'
  } = options;

  try {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If auth is required but no token exists
    if (requireAuth && !token) {
      console.log('No token found, redirecting to sign in');
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // If admin access is required
    if (adminOnly && token) {
      // Check if user email is admin
      if (!token.user?.email || !isAdminEmail(token.user.email)) {
        console.warn(`Non-admin access attempt: ${token.user?.email}`);
        return NextResponse.redirect(new URL('/admin/error?error=access_denied', request.url));
      }

      // Check if user has admin flag
      if (!token.user?.isAdmin) {
        console.warn(`Invalid admin token for: ${token.user?.email}`);
        return NextResponse.redirect(new URL('/admin/error?error=invalid_token', request.url));
      }
    }

    // Add user info to request headers for downstream usage
    if (token?.user) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-admin-user-id', token.user.id);
      requestHeaders.set('x-admin-user-email', token.user.email);
      requestHeaders.set('x-admin-user-name', token.user.name || '');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return NextResponse.redirect(new URL('/admin/error?error=middleware_error', request.url));
  }
}

/**
 * Higher-order function to create protected API routes
 */
export function withAdminApiAuth(handler: (req: NextRequest, context: any) => Promise<Response>) {
  return async (req: NextRequest, context: any) => {
    try {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      if (!token.user?.email || !isAdminEmail(token.user.email) || !token.user?.isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required', code: 'ADMIN_ACCESS_DENIED' },
          { status: 403 }
        );
      }

      // Add user info to the request context
      context.adminUser = token.user;
      context.accessToken = token.accessToken;

      return handler(req, context);
    } catch (error) {
      console.error('API middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'MIDDLEWARE_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * Utility function to extract admin user from request headers
 */
export function getAdminUserFromHeaders(request: NextRequest) {
  const userId = request.headers.get('x-admin-user-id');
  const email = request.headers.get('x-admin-user-email');
  const name = request.headers.get('x-admin-user-name');

  if (!userId || !email) {
    return null;
  }

  return {
    id: userId,
    email,
    name: name || email.split('@')[0],
    isAdmin: true,
  };
}

/**
 * Middleware configuration for different admin routes
 */
export const adminRouteConfig = {
  // Public admin routes (sign in, error pages)
  public: [
    '/admin/signin',
    '/admin/error',
    '/admin/api/health'
  ],
  
  // Protected admin routes
  protected: [
    '/admin',
    '/admin/dashboard',
    '/admin/bookings',
    '/admin/calendar',
    '/admin/settings'
  ],
  
  // API routes that require admin access
  api: [
    '/api/admin'
  ]
};

/**
 * Check if a path requires admin authentication
 */
export function requiresAdminAuth(pathname: string): boolean {
  // Check if it's a public admin route
  if (adminRouteConfig.public.some(route => pathname.startsWith(route))) {
    return false;
  }
  
  // Check if it's a protected admin route or API
  return adminRouteConfig.protected.some(route => pathname.startsWith(route)) ||
         adminRouteConfig.api.some(route => pathname.startsWith(route));
}

/**
 * Main admin middleware function for global middleware.ts
 */
export async function adminMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-admin routes
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  // Check if this route requires admin authentication
  if (!requiresAdminAuth(pathname)) {
    return NextResponse.next();
  }

  // Apply admin authentication
  return withAdminAuth(request, {
    requireAuth: true,
    adminOnly: true,
    redirectTo: '/admin/signin'
  });
}