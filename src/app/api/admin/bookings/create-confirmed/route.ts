import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth.config";
import { createConfirmedBooking } from "@/lib/database/bookings";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin access
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      address,
      castleType,
      startDate,
      endDate,
      totalCost,
      status,
      calendarEventId,
      notes,
      paymentMethod,
      deposit,
    } = body;

    // Validate required fields
    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !address ||
      !castleType ||
      !startDate ||
      !endDate ||
      !totalCost ||
      !calendarEventId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create the confirmed booking in the database (booking reference will be auto-generated)
    const booking = await createConfirmedBooking({
      customerName,
      customerEmail,
      customerPhone,
      address,
      castleType,
      startDate,
      endDate,
      totalCost,
      status,
      calendarEventId,
      notes: notes || "",
      paymentMethod: paymentMethod || "cash",
      deposit: deposit,
    });

    return NextResponse.json({
      success: true,
      booking,
      message: "Confirmed booking created successfully",
    });
  } catch (error) {
    console.error("Error creating confirmed booking:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to create confirmed booking",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
