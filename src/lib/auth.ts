import { getSession } from "./session";

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.username) {
    throw new Error("Authentication required");
  }
  return session.user;
}
