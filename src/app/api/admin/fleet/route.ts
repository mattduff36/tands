import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { getCastles, addCastle } from "@/lib/database/castles";
import { castleSchema, validateAndSanitize } from "@/lib/validation/schemas";
import {
  createSanitizedErrorResponse,
  logSafeError,
} from "@/lib/utils/error-sanitizer";

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

// Helper function to trigger revalidation
async function triggerRevalidation() {
  try {
    if (process.env.REVALIDATION_SECRET) {
      await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/revalidate/castles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            secret: process.env.REVALIDATION_SECRET,
          }),
        },
      );
    }
  } catch (error) {
    console.warn("Failed to trigger revalidation:", error);
    // Don't fail the main operation if revalidation fails
  }
}

// GET - Fetch all castles
export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions,
    );

    if (!session?.user?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    if (
      !session.user?.username ||
      !allowedUsers.includes(session.user.username)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get castles from persistent storage
    const castles = await getCastles();
    return NextResponse.json(castles);
  } catch (error) {
    logSafeError(error, "admin-fleet-get");
    const sanitizedError = createSanitizedErrorResponse(error, "database", 500);
    return NextResponse.json(sanitizedError, { status: 500 });
  }
}

// POST - Create new castle
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions,
    );

    if (!session?.user?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    if (
      !session.user?.username ||
      !allowedUsers.includes(session.user.username)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate and sanitize input data
    let validatedData;
    try {
      validatedData = validateAndSanitize(castleSchema, body);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: error instanceof Error ? error.message : "Validation failed",
        },
        { status: 400 },
      );
    }

    const { name, theme, size, price, description, imageUrl } = validatedData;

    // Add castle to persistent storage
    const newCastle = await addCastle({
      name,
      theme,
      size,
      price: Number(price),
      description,
      imageUrl,
    });

    // Trigger revalidation to clear caches
    await triggerRevalidation();

    return NextResponse.json(newCastle, { status: 201 });
  } catch (error) {
    logSafeError(error, "admin-fleet-create");
    const sanitizedError = createSanitizedErrorResponse(error, "database", 500);
    return NextResponse.json(sanitizedError, { status: 500 });
  }
}
