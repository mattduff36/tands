import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

type SessionData = {
  user?: {
    username: string;
  };
};

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "status";

    switch (action) {
      case "status":
        return handleAuthStatus(request);
      default:
        return NextResponse.json(
          { error: "Invalid action", code: "INVALID_ACTION" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Admin auth GET error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

async function handleAuthStatus(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions,
    );

    if (!session?.user?.username) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        username: session.user.username,
      },
    });
  } catch (error) {
    console.error("Auth status check error:", error);
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }
}
