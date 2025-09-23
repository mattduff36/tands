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

export async function POST(req: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  const session = await getIronSession<SessionData>(
    req,
    response,
    sessionOptions,
  );
  await session.destroy();
  return response;
}
