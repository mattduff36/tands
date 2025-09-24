import { getSession } from "./session";
import { NextRequest } from "next/server";

export async function requireUser(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.user?.username) {
    throw new Error("Authentication required");
  }
  return session.user;
}
