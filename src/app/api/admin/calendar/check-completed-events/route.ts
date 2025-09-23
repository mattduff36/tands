import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";

import { getCalendarService } from "@/lib/calendar/google-calendar";
import {
  getBookingsByStatus,
  updateBookingStatus,
} from "@/lib/database/bookings";
//import { log } from '@/lib/utils/logger';

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

    const calendarService = getCalendarService();
    const now = new Date();

    // Part 1: Check database bookings for completion
    const allBookings = await getBookingsByStatus();
    const confirmedBookings = allBookings.filter(
      (b) => b.status === "confirmed",
    );

    let dbCompletedCount = 0;
    let dbErrors: string[] = [];

    console.log("Checking confirmed database bookings for completion", {
      count: confirmedBookings.length,
    });

    for (const booking of confirmedBookings) {
      try {
        // Extract booking reference from the booking
        const bookingRef = booking.bookingRef;

        // Find the corresponding calendar event by searching through events
        // We'll search for events in the past month to find the matching one
        const searchStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const searchEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const events = await calendarService.getEventsInRange(
          searchStart,
          searchEnd,
        );

        // Find the event that matches this booking
        const matchingEvent = events.find((event) => {
          if (!event.description) return false;
          // Look for the booking reference in the description
          return event.description.includes(bookingRef);
        });

        if (matchingEvent) {
          // Check if the event has ended
          const eventEnd = new Date(
            matchingEvent.end?.dateTime || matchingEvent.end?.date || "",
          );

          if (eventEnd < now) {
            // Event has ended, mark booking as completed
            await updateBookingStatus(booking.id, "completed");
            console.log(
              "Database booking marked as completed after event ended",
              { bookingRef, eventEnd: eventEnd.toISOString() },
            );
            dbCompletedCount++;
          }
        } else {
          console.warn("No calendar event found for database booking", {
            bookingRef,
          });
        }
      } catch (error) {
        const errorMsg = `Error processing database booking ${booking.bookingRef}: ${error}`;
        console.error(errorMsg);
        dbErrors.push(errorMsg);
      }
    }

    // Part 2: Check calendar events for completion
    console.log("Checking calendar events for completion...");

    let calendarCompletedCount = 0;
    let calendarErrors: string[] = [];

    try {
      const calendarResult =
        await calendarService.checkAndMarkCompletedEvents();
      calendarCompletedCount = calendarResult.completed;
      calendarErrors = calendarResult.errors.map(
        (err) => `Calendar event ${err.eventId}: ${err.error}`,
      );

      console.log(
        `Calendar completion check: ${calendarResult.completed}/${calendarResult.checked} events marked as completed`,
      );
    } catch (error) {
      const errorMsg = `Error checking calendar events: ${error}`;
      console.error(errorMsg);
      calendarErrors.push(errorMsg);
    }

    // Combine results
    const totalCompleted = dbCompletedCount + calendarCompletedCount;
    const totalErrors = [...dbErrors, ...calendarErrors];

    const message = `Completed events check finished: ${dbCompletedCount} database bookings and ${calendarCompletedCount} calendar events marked as completed`;

    if (totalErrors.length > 0) {
      console.error(
        "Errors occurred while checking completed events",
        new Error("Multiple completion errors"),
        { errors: totalErrors },
      );
    }

    return NextResponse.json({
      success: true,
      message,
      databaseCompleted: dbCompletedCount,
      calendarCompleted: calendarCompletedCount,
      totalCompleted,
      errors: totalErrors.length > 0 ? totalErrors : undefined,
    });
  } catch (error) {
    console.error("Error checking completed events:", error);
    return NextResponse.json(
      {
        error: "Failed to check completed events",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
