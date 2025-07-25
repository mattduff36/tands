import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { 
  isAdminEmail, 
  verifyAdminUser, 
  createAdminToken,
  verifyAdminToken,
  AdminAccessDeniedError 
} from '@/lib/auth/google-auth';
import { 
  sessionManager, 
  createUserSession,
  getUserSession,
  refreshUserToken,
  revokeUserSession 
} from '@/lib/auth/session-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        return handleAuthStatus(request);
      case 'session':
        return handleSessionInfo(request);
      case 'stats':
        return handleSessionStats(request);
      default:
        return NextResponse.json(
          { error: 'Invalid action', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin auth GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'validate':
        return handleTokenValidation(request, body);
      case 'refresh':
        return handleTokenRefresh(request, body);
      case 'extend':
        return handleExtendSession(request, body);
      default:
        return NextResponse.json(
          { error: 'Invalid action', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin auth POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'logout';

    switch (action) {
      case 'logout':
        return handleLogout(request);
      case 'revoke-all':
        return handleRevokeAllSessions(request);
      default:
        return NextResponse.json(
          { error: 'Invalid action', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin auth DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Handler Functions

async function handleAuthStatus(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({
      authenticated: false,
      isAdmin: false,
      user: null
    });
  }

  const isAdmin = token.user?.isAdmin && isAdminEmail(token.user.email);

  return NextResponse.json({
    authenticated: !!token,
    isAdmin,
    user: isAdmin ? {
      id: token.user.id,
      email: token.user.email,
      name: token.user.name,
      image: token.user.image
    } : null,
    sessionExpiry: token.exp && typeof token.exp === 'number' ? new Date(token.exp * 1000).toISOString() : null
  });
}

async function handleSessionInfo(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required', code: 'ADMIN_ACCESS_DENIED' },
      { status: 403 }
    );
  }

  const sessionId = request.headers.get('x-session-id') || token.sub || '';
  const session = await getUserSession(sessionId);

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    sessionId,
    user: session.user,
    expiresAt: new Date(session.expiresAt).toISOString(),
    hasAccessToken: !!session.accessToken,
    hasRefreshToken: !!session.refreshToken
  });
}

async function handleSessionStats(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required', code: 'ADMIN_ACCESS_DENIED' },
      { status: 403 }
    );
  }

  const stats = sessionManager.getSessionStats();
  const userSessions = sessionManager.getUserSessions(token.user.email);

  return NextResponse.json({
    globalStats: stats,
    userSessions: userSessions.length,
    userSessionDetails: userSessions.map(({ sessionId, session }) => ({
      sessionId,
      expiresAt: new Date(session.expiresAt).toISOString(),
      hasAccessToken: !!session.accessToken
    }))
  });
}

async function handleTokenValidation(request: NextRequest, body: any) {
  const { token: tokenToValidate } = body;

  if (!tokenToValidate) {
    return NextResponse.json(
      { error: 'Token required', code: 'TOKEN_REQUIRED' },
      { status: 400 }
    );
  }

  try {
    const adminUser = verifyAdminToken(tokenToValidate);
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: adminUser
    });
  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: 'Token validation failed'
    });
  }
}

async function handleTokenRefresh(request: NextRequest, body: any) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required', code: 'ADMIN_ACCESS_DENIED' },
      { status: 403 }
    );
  }

  const { sessionId } = body;
  const sessionIdToUse = sessionId || token.sub || '';

  try {
    const newAccessToken = await refreshUserToken(sessionIdToUse);
    
    if (!newAccessToken) {
      return NextResponse.json(
        { error: 'Token refresh failed', code: 'REFRESH_FAILED' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed', code: 'REFRESH_ERROR' },
      { status: 500 }
    );
  }
}

async function handleExtendSession(request: NextRequest, body: any) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required', code: 'ADMIN_ACCESS_DENIED' },
      { status: 403 }
    );
  }

  const { sessionId, additionalTime } = body;
  const sessionIdToUse = sessionId || token.sub || '';
  const timeToAdd = additionalTime || 24 * 60 * 60 * 1000; // 24 hours default

  try {
    const success = sessionManager.extendSession(sessionIdToUse, timeToAdd);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updatedSession = await getUserSession(sessionIdToUse);
    
    return NextResponse.json({
      success: true,
      expiresAt: updatedSession ? new Date(updatedSession.expiresAt).toISOString() : null
    });
  } catch (error) {
    console.error('Extend session error:', error);
    return NextResponse.json(
      { error: 'Failed to extend session', code: 'EXTEND_ERROR' },
      { status: 500 }
    );
  }
}

async function handleLogout(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({
      success: true,
      message: 'No active session'
    });
  }

  const sessionId = token.sub || '';

  try {
    const success = await revokeUserSession(sessionId);
    
    return NextResponse.json({
      success: true,
      message: success ? 'Session revoked' : 'Session not found'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed', code: 'LOGOUT_ERROR' },
      { status: 500 }
    );
  }
}

async function handleRevokeAllSessions(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required', code: 'ADMIN_ACCESS_DENIED' },
      { status: 403 }
    );
  }

  try {
    const revokedCount = sessionManager.revokeUserSessions(token.user.email);
    
    return NextResponse.json({
      success: true,
      revokedSessions: revokedCount,
      message: `${revokedCount} sessions revoked`
    });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke sessions', code: 'REVOKE_ERROR' },
      { status: 500 }
    );
  }
}