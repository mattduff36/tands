import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";

import { getCalendarService } from "@/lib/calendar/google-calendar";
import {
  getBookingsByStatus,
  updateBookingStatus,
} from "@/lib/database/bookings";
//import { log } from '@/lib/utils/logger';

// GET /api/admin/calendar/events/[eventId] - Get a single calendar event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = params;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    const calendarService = getCalendarService();
    const event = await calendarService.getEvent(eventId);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Transform event for API response
    const transformedEvent = {
      id: event.id,
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: event.start,
      end: event.end,
      attendees: event.attendees?.map((attendee) => ({
        email: attendee.email,
        displayName: attendee.displayName,
        responseStatus: attendee.responseStatus,
      })),
      colorId: event.colorId,
      transparency: event.transparency,
      visibility: event.visibility,
      created: event.created,
      updated: event.updated,
      status: event.status,
      recurringEventId: event.recurringEventId,
      htmlLink: event.htmlLink,
    };

    return NextResponse.json({ event: transformedEvent });
  } catch (error) {
    console.error("Error fetching calendar event:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch calendar event",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

// PUT /api/admin/calendar/events/[eventId] - Update a calendar event
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = params;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Validate required fields
    const { customerName, location, duration } = body;
    if (!customerName || !location || !duration?.start || !duration?.end) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: customerName, location, duration.start, duration.end",
        },
        { status: 400 },
      );
    }

    // Validate duration format
    const startDate = new Date(duration.start);
    const endDate = new Date(duration.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format in duration" },
        { status: 400 },
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 },
      );
    }

    // Create booking data object
    const bookingData = {
      customerName,
      contactDetails: {
        email: body.contactDetails?.email,
        phone: body.contactDetails?.phone,
      },
      location,
      notes: body.notes,
      duration: {
        start: duration.start,
        end: duration.end,
      },
      cost: body.cost,
      paymentMethod: body.paymentMethod,
      bouncyCastleType: body.bouncyCastleType,
      // Include duration and status information for consistent display
      eventDuration: body.eventDuration || 8, // Default to 8 hours if not specified
      status: body.status || "confirmed", // Default to confirmed
    };

    const calendarService = getCalendarService();
    await calendarService.updateBookingEvent(eventId, bookingData);

    return NextResponse.json({
      success: true,
      eventId,
      message: "Booking event updated successfully",
    });
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json(
      {
        error: "Failed to update calendar event",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/calendar/events/[eventId] - Delete a calendar event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = params;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    // First, get the calendar event to extract booking reference
    const calendarService = getCalendarService();
    const event = await calendarService.getEvent(eventId);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Extract booking reference from event description
    const bookingRefMatch = event.description?.match(/Booking Ref: (TS\d{3})/);
    const bookingRef = bookingRefMatch?.[1];

    if (bookingRef) {
      // Find the corresponding database booking and mark it as expired
      const allBookings = await getBookingsByStatus();
      const booking = allBookings.find((b) => b.bookingRef === bookingRef);

      if (booking && booking.status === "confirmed") {
        await updateBookingStatus(booking.id, "expired");
        console.log("Booking marked as expired after calendar event deletion", {
          bookingRef,
        });
      }
    }

    // Delete the calendar event
    await calendarService.deleteBookingEvent(eventId);

    return NextResponse.json({
      success: true,
      eventId,
      bookingRef,
      message:
        "Booking event deleted successfully and database booking marked as expired",
    });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json(
      {
        error: "Failed to delete calendar event",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
