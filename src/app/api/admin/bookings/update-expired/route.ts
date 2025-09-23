import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";

import { updateExpiredBookings } from "@/lib/database/bookings";

// POST /api/admin/bookings/update-expired - Update expired bookings to complete status
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

    // Update expired bookings
    await updateExpiredBookings();

    return NextResponse.json({
      success: true,
      message: "Expired bookings updated to complete status",
    });
  } catch (error) {
    console.error("Error updating expired bookings:", error);
    return NextResponse.json(
      { error: "Failed to update expired bookings" },
      { status: 500 },
    );
  }
}
