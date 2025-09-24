import { getIronSession, SessionOptions } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

export type SessionData = { user?: { username: string } };

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: "auth",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession(request: NextRequest) {
  const response = NextResponse.next();
  return getIronSession<SessionData>(request, response, sessionOptions);
}
