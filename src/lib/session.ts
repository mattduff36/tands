import { getIronSession, SessionOptions } from "iron-session";
import { cookies, headers } from "next/headers";

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

export async function getSession() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  return getIronSession<SessionData>(cookieStore, headerStore, sessionOptions);
}
