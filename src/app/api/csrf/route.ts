import { NextResponse } from "next/server";
import { getOrSetCsrf } from "@/lib/csrf";

export async function GET() {
  const token = await getOrSetCsrf();
  return NextResponse.json(
    { token },
    {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
        "X-Cache-Control": "no-cache",
        "X-Debug-Timestamp": Date.now().toString(),
        "X-Debug-CSRF-Generated": "true",
      },
    },
  );
}
