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
  const response = new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
      "X-Cache-Control": "no-cache",
      // Clear the auth cookie explicitly
      "Set-Cookie":
        "auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax",
    },
  });
  const session = await getIronSession<SessionData>(
    req,
    response,
    sessionOptions,
  );
  await session.destroy();
  return response;
}
