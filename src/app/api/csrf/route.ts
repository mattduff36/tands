import { NextResponse } from "next/server";
import { getOrSetCsrf } from "@/lib/csrf";

export async function GET() {
  const token = await getOrSetCsrf();
  return NextResponse.json({ token });
}
