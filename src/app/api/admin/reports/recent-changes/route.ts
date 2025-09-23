import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth-helpers";

import { getPool } from "@/lib/database/connection";

/**
 * GET /api/admin/reports/recent-changes
 * Get recent booking changes for the reports dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getPool().connect();
    try {
      // Get recent booking changes (excluding expired bookings)
      const result = await client.query(`
        SELECT 
          id,
          booking_ref,
          customer_name,
          status,
          total_price,
          date,
          updated_at,
          created_at
        FROM bookings 
        WHERE status != 'expired'
        ORDER BY updated_at DESC 
        LIMIT 10
      `);

      const recentChanges = result.rows.map((row) => ({
        id: row.id,
        bookingRef: row.booking_ref,
        customerName: row.customer_name,
        status: row.status,
        totalPrice: row.total_price,
        date: row.date,
        updatedAt: row.updated_at,
        createdAt: row.created_at,
      }));

      return NextResponse.json({ recentChanges });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error in GET /api/admin/reports/recent-changes:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
