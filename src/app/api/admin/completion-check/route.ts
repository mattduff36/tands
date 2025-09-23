import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";

import { comprehensiveCompletionCheck } from "@/lib/utils/status-transitions";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    if (!allowedUsers.includes(session.user?.username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log(
      "🔄 Manual completion check triggered by admin:",
      session.user?.username,
    );

    // Run the comprehensive completion check
    const result = await comprehensiveCompletionCheck();

    const message = `Completion check completed: ${result.databaseCompleted} database bookings and ${result.calendarCompleted} calendar events marked as completed`;

    return NextResponse.json({
      success: true,
      message,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error during manual completion check:", error);
    return NextResponse.json(
      {
        error: "Failed to run completion check",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    if (!allowedUsers.includes(session.user?.username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: "Completion check endpoint is available",
      endpoints: {
        POST: "/api/admin/completion-check - Trigger manual completion check",
        GET: "/api/admin/completion-check - Get endpoint info",
      },
      description:
        "This endpoint allows admins to manually trigger a comprehensive completion check for both database bookings and calendar events.",
    });
  } catch (error) {
    console.error("Error in completion check info endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to get endpoint info",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
