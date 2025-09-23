import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { verify, allowedUser } from "@/lib/credentials";
import { validateCsrf } from "@/lib/csrf";

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

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const maxReq = Number(process.env.RATE_LIMIT_MAX || 10);
const buckets = new Map<string, { count: number; ts: number }>();

function throttle(ip: string) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.ts > windowMs) {
    buckets.set(ip, { count: 1, ts: now });
    return false;
  }
  b.count += 1;
  return b.count > maxReq;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttle(ip))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { username, password, csrfToken } = await req.json().catch(() => ({}));
  if (!username || !password)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  if (!(await validateCsrf(csrfToken)))
    return NextResponse.json({ error: "Invalid CSRF" }, { status: 400 });

  const bad = !allowedUser(username) || !verify(username, password);
  await sleep(200 + Math.floor(Math.random() * 200));
  if (bad) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const response = new NextResponse(null, { status: 204 });
  const session = await getIronSession<SessionData>(
    req,
    response,
    sessionOptions,
  );
  session.user = { username };
  await session.save();
  return response;
}
