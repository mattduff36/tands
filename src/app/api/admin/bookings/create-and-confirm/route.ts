import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";
import { createPendingBooking } from "@/lib/database/bookings";
import { updateBookingStatus } from "@/lib/database/bookings";
import { getCalendarService } from "@/lib/calendar/google-calendar";
import { getCastleById } from "@/lib/database/castles";

// POST /api/admin/bookings/create-and-confirm - Atomically create and confirm booking for admin
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

    const body = await request.json();
    const {
      castleId,
      customerName,
      customerEmail,
      customerPhone,
      eventDate,
      eventDuration,
      eventStartTime,
      eventEndTime,
      eventAddress,
      specialRequests,
      totalPrice,
      paymentMethod,
      deposit,
    } = body;

    console.log("Creating admin booking atomically...");

    // Get castle details first
    const castle = await getCastleById(castleId);
    if (!castle) {
      return NextResponse.json({ error: "Castle not found" }, { status: 400 });
    }

    // Step 1: Create pending booking (internally, never shows in UI)
    const booking = await createPendingBooking({
      customerName,
      customerEmail,
      customerPhone,
      customerAddress: eventAddress,
      castleId,
      castleName: castle.name,
      date: eventDate,
      startDate: eventStartTime ? new Date(eventStartTime) : undefined,
      endDate: eventEndTime ? new Date(eventEndTime) : undefined,
      eventDuration,
      paymentMethod,
      totalPrice,
      deposit: deposit ?? Math.floor(totalPrice * 0.25),
      notes: specialRequests,
    });

    console.log("Booking created with ID:", booking.id);

    // Step 2: Immediately confirm the booking (creates calendar event)
    const calendarService = getCalendarService();

    // Convert booking date to proper ISO format with times
    const bookingDate = new Date(eventDate);
    const eventStartDateTime = new Date(eventStartTime || eventDate);
    const eventEndDateTime = new Date(eventEndTime || eventDate);

    // Set default times if not provided (9 AM to 5 PM)
    if (!eventStartTime) {
      eventStartDateTime.setHours(9, 0, 0, 0);
    }
    if (!eventEndTime) {
      eventEndDateTime.setHours(17, 0, 0, 0);
    }

    // Create calendar event
    const createdEvent = await calendarService.createBookingEvent({
      customerName: booking.customerName,
      contactDetails: {
        email: booking.customerEmail,
        phone: booking.customerPhone,
      },
      location: eventAddress,
      notes: `Booking Ref: ${booking.bookingRef}\nTotal: £${totalPrice}\nDeposit: £${deposit ?? Math.floor(totalPrice * 0.25)}\nPayment: ${paymentMethod}\nCreated by Admin\n${specialRequests || ""}`,
      duration: {
        start: eventStartDateTime.toISOString(),
        end: eventEndDateTime.toISOString(),
      },
      cost: totalPrice,
      paymentMethod: paymentMethod as "cash" | "card",
      agreementSigned: false,
      status: "confirmed",
      bouncyCastleType: castle.name,
    });

    // Step 3: Update booking status to confirmed
    await updateBookingStatus(booking.id, "confirmed");

    console.log("Admin booking created and confirmed successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Admin booking created and confirmed successfully",
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        calendarEventId: createdEvent,
        status: "confirmed",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating admin booking:", error);
    return NextResponse.json(
      { error: "Failed to create admin booking" },
      { status: 500 },
    );
  }
}
