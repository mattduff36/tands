/**
 * Next.js middleware for security, rate limiting, and authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { getIronSession, SessionOptions } from "iron-session";

type SessionData = {
  user?: {
    username: string;
  };
};

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: "auth",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

const PROTECTED = [/^\/admin/, /^\/api\/admin/];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const isProtected = PROTECTED.some((rx) => rx.test(url.pathname));
  if (!isProtected) return NextResponse.next();

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (session?.user?.username) return res;

  url.pathname = "/admin/signin";
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
