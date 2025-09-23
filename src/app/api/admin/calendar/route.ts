import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";

import { getCalendarService } from "@/lib/calendar/google-calendar";

// GET /api/admin/calendar - Get calendar status and connection info
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.username) {
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

    const calendarService = getCalendarService();

    // Test connection
    const isConnected = await calendarService.testConnection();

    if (!isConnected) {
      return NextResponse.json(
        {
          status: "disconnected",
          error: "Failed to connect to Google Calendar API",
          message: "Please check your service account credentials",
        },
        { status: 503 },
      );
    }

    // Get current month's events count for status
    const now = new Date();
    const events = await calendarService.getEventsForMonth(
      now.getFullYear(),
      now.getMonth() + 1,
    );

    return NextResponse.json({
      status: "connected",
      message: "Google Calendar API connected successfully",
      eventsThisMonth: events.length,
      lastUpdated: new Date().toISOString(),
      calendarSettings: {
        timeZone: "Europe/London",
        businessHours: {
          start: "09:00",
          end: "18:00",
        },
      },
    });
  } catch (error) {
    console.error("Error checking calendar status:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to check calendar status",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

// POST /api/admin/calendar - Calendar operations
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.username) {
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
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action parameter is required" },
        { status: 400 },
      );
    }

    const calendarService = getCalendarService();

    switch (action) {
      case "test-connection":
        const isConnected = await calendarService.testConnection();
        return NextResponse.json({
          success: isConnected,
          message: isConnected
            ? "Calendar connection successful"
            : "Calendar connection failed",
        });

      case "check-availability":
        const { startDate, endDate } = body;
        if (!startDate || !endDate) {
          return NextResponse.json(
            {
              error:
                "startDate and endDate are required for availability check",
            },
            { status: 400 },
          );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return NextResponse.json(
            { error: "Invalid date format" },
            { status: 400 },
          );
        }

        const isAvailable = await calendarService.checkAvailability(start, end);
        return NextResponse.json({
          available: isAvailable,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          message: isAvailable
            ? "Time slot is available"
            : "Time slot is not available",
        });

      case "get-available-slots":
        const { date, duration = 4 } = body;
        if (!date) {
          return NextResponse.json(
            { error: "date is required" },
            { status: 400 },
          );
        }

        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid date format" },
            { status: 400 },
          );
        }

        const slots = await calendarService.getAvailableTimeSlots(
          targetDate,
          duration,
        );
        return NextResponse.json({
          date: targetDate.toISOString().split("T")[0],
          duration,
          availableSlots: slots.map((slot) => ({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
          })),
        });

      case "create-maintenance":
        const { maintenanceStart, maintenanceEnd, reason } = body;
        if (!maintenanceStart || !maintenanceEnd) {
          return NextResponse.json(
            {
              error: "maintenanceStart and maintenanceEnd are required",
            },
            { status: 400 },
          );
        }

        const mStart = new Date(maintenanceStart);
        const mEnd = new Date(maintenanceEnd);

        if (isNaN(mStart.getTime()) || isNaN(mEnd.getTime())) {
          return NextResponse.json(
            { error: "Invalid maintenance date format" },
            { status: 400 },
          );
        }

        if (mStart >= mEnd) {
          return NextResponse.json(
            {
              error: "Maintenance start time must be before end time",
            },
            { status: 400 },
          );
        }

        const maintenanceId = await calendarService.createMaintenanceBlock(
          mStart,
          mEnd,
          reason,
        );

        return NextResponse.json({
          success: true,
          maintenanceId,
          message: "Maintenance period created successfully",
          period: {
            start: mStart.toISOString(),
            end: mEnd.toISOString(),
            reason: reason || "Maintenance",
          },
        });

      case "sync-calendar":
        // Basic sync operation - could be expanded to sync with external systems
        const syncStart = new Date();
        syncStart.setMonth(syncStart.getMonth() - 1); // Sync last month
        const syncEnd = new Date();
        syncEnd.setMonth(syncEnd.getMonth() + 2); // Sync next 2 months

        const syncedEvents = await calendarService.getEventsInRange(
          syncStart,
          syncEnd,
        );

        return NextResponse.json({
          success: true,
          message: "Calendar sync completed",
          syncedEvents: syncedEvents.length,
          syncPeriod: {
            start: syncStart.toISOString(),
            end: syncEnd.toISOString(),
          },
        });

      default:
        return NextResponse.json(
          {
            error: `Unknown action: ${action}`,
            availableActions: [
              "test-connection",
              "check-availability",
              "get-available-slots",
              "create-maintenance",
              "sync-calendar",
            ],
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error performing calendar operation:", error);
    return NextResponse.json(
      {
        error: "Failed to perform calendar operation",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
