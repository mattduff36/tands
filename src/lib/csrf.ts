import crypto from "crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE = "csrf_token";

export async function getOrSetCsrf() {
  const c = await cookies();
  const existing = c.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  const token = crypto.randomBytes(16).toString("hex");
  c.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return token;
}

export async function validateCsrf(token: string | undefined) {
  const c = await cookies();
  return Boolean(token && c.get(CSRF_COOKIE)?.value === token);
}
