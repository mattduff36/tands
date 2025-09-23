import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

const sessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: "auth",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
};

export type SessionData = { user?: { username: string } };

/**
 * Check if the current user is authenticated and authorized as an admin
 * @param request - The NextRequest object
 * @returns Object with session data and response, or error response if unauthorized
 */
export async function checkAdminAuth(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions,
    );

    if (!session?.user?.username) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        session: null,
        response: null,
      };
    }

    // Check if user is admin
    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    if (!allowedUsers.includes(session.user.username)) {
      return {
        error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        session: null,
        response: null,
      };
    }

    return {
      error: null,
      session,
      response,
    };
  } catch (error) {
    console.error("Auth check error:", error);
    return {
      error: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      ),
      session: null,
      response: null,
    };
  }
}

/**
 * Legacy compatibility function for routes that expect the old session format
 * This is a drop-in replacement for the old NextAuth getServerSession
 * @param authOptions - Ignored, kept for compatibility
 * @param request - The NextRequest object (optional, will be extracted from context if not provided)
 * @returns Session object or null if not authenticated
 */
export async function getServerSession(
  authOptions?: any,
  request?: NextRequest,
) {
  // If called with just authOptions (old style), we need to get the request from the context
  // For now, we'll throw an error to identify where this is happening
  if (!request && typeof authOptions === "object" && !authOptions.password) {
    throw new Error(
      "getServerSession called without NextRequest - this route needs to be updated to pass the request object",
    );
  }

  // If called with (authOptions, request) pattern
  const req = request || authOptions;
  if (!req || typeof req.headers !== "object") {
    throw new Error("getServerSession requires a NextRequest object");
  }

  const authResult = await checkAdminAuth(req);
  if (authResult.error || !authResult.session) {
    return null;
  }

  // Return a session object that matches the old NextAuth format
  return {
    user: {
      username: authResult.session.user?.username,
      email: `${authResult.session.user?.username}@admin.local`, // Fake email for compatibility
    },
  };
}

// Export authOptions as empty object for compatibility
export const authOptions = {};
