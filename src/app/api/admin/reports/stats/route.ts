import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth-helpers";

import { getBookingStats } from "@/lib/database/bookings";
import { ReportingQuery } from "@/lib/types/booking";
import { RetryHelper } from "@/lib/utils/retry-helper";
import { getPool } from "@/lib/database/connection";
import { getCalendarService } from "@/lib/calendar/google-calendar";

/**
 * GET /api/admin/reports/stats
 * Get booking statistics for reporting
 */
export async function GET(request: NextRequest) {
  // Check if this is a debug request
  const searchParams = request.nextUrl.searchParams;
  const debug = searchParams.get("debug");

  if (debug === "true") {
    try {
      const client = await getPool().connect();
      try {
        const result = await client.query(`
          SELECT id, booking_ref, customer_name, customer_email, status, 
                 date, total_price, created_at, updated_at
          FROM bookings 
          ORDER BY created_at DESC 
          LIMIT 10
        `);
        return NextResponse.json({ bookings: result.rows });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error("Error in debug endpoint:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Original GET logic continues here...
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const castleIds = searchParams.get("castleIds")?.split(",").filter(Boolean);
    const statuses = searchParams.get("statuses")?.split(",").filter(Boolean);
    const groupBy = searchParams.get("groupBy") as
      | "day"
      | "week"
      | "month"
      | null;

    // Validate required parameters
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "dateFrom and dateTo are required" },
        { status: 400 },
      );
    }

    // Get database statistics only (no calendar data)
    const query: ReportingQuery = {
      dateFrom,
      dateTo,
      castleIds: castleIds?.length ? castleIds : undefined,
      statuses: statuses?.length ? (statuses as any) : undefined,
      groupBy: groupBy || "week",
    };

    const dbStats = await RetryHelper.withRetry(() => getBookingStats(query), {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000,
    });

    // Return database statistics only (no calendar data)
    const stats = {
      total: dbStats.total,
      pending: dbStats.pending,
      confirmed: dbStats.confirmed,
      complete: dbStats.completed, // Note: using 'complete' to match the reports page interface
      revenue: dbStats.revenue,
      popularCastles: dbStats.popularCastles || [],
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error in GET /api/admin/reports/stats:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/reports/stats
 * Get booking statistics for reporting (with request body)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { dateFrom, dateTo, castleIds, statuses, groupBy } = body;

    // Validate required parameters
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "dateFrom and dateTo are required" },
        { status: 400 },
      );
    }

    const query: ReportingQuery = {
      dateFrom,
      dateTo,
      castleIds: castleIds?.length ? castleIds : undefined,
      statuses: statuses?.length ? statuses : undefined,
      groupBy: groupBy || "week",
    };

    // Get statistics with retry logic
    const stats = await RetryHelper.withRetry(() => getBookingStats(query), {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000,
    });

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error in POST /api/admin/reports/stats:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
