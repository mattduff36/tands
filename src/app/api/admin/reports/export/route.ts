import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";

import { queryBookingsWithFilters } from "@/lib/database/bookings";
import { BookingQuery, BookingStatus } from "@/lib/types/booking";
import { RetryHelper } from "@/lib/utils/retry-helper";

/**
 * GET /api/admin/reports/export
 * Export booking data as CSV or JSON
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const castleIds = searchParams.get("castleIds")?.split(",").filter(Boolean);
    const statuses = searchParams
      .get("statuses")
      ?.split(",")
      .filter(Boolean) as BookingStatus[];
    const format = searchParams.get("format") || "csv"; // csv or json

    // Validate required parameters
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "dateFrom and dateTo are required" },
        { status: 400 },
      );
    }

    // Validate format
    if (!["csv", "json"].includes(format)) {
      return NextResponse.json(
        { error: "format must be either csv or json" },
        { status: 400 },
      );
    }

    const query: BookingQuery = {
      dateFrom,
      dateTo,
      castleId: castleIds?.[0], // Use first castle ID if provided
      status: statuses?.length ? statuses : undefined,
    };

    // Get bookings with retry logic
    const bookingResult = await RetryHelper.withRetry(
      () => queryBookingsWithFilters(query),
      {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000,
      },
    );

    const bookings = bookingResult.bookings;

    if (format === "json") {
      // Return JSON format
      const filename = `bookings_${dateFrom}_to_${dateTo}.json`;

      return new NextResponse(
        JSON.stringify(
          {
            exportDate: new Date().toISOString(),
            filters: query,
            totalRecords: bookings.length,
            data: bookings,
          },
          null,
          2,
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        },
      );
    } else {
      // Return CSV format
      const filename = `bookings_${dateFrom}_to_${dateTo}.csv`;
      const csvContent = generateCSV(bookings);

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error: any) {
    console.error("Error in GET /api/admin/reports/export:", error);
    return NextResponse.json(
      {
        error: "Failed to export booking data",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/reports/export
 * Export booking data with detailed filtering (via request body)
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
    const {
      dateFrom,
      dateTo,
      castleIds,
      statuses,
      format = "csv",
      fields = [], // specific fields to export
      includeCustomerInfo = true,
      includePricing = true,
    } = body;

    // Validate required parameters
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "dateFrom and dateTo are required" },
        { status: 400 },
      );
    }

    // Validate format
    if (!["csv", "json"].includes(format)) {
      return NextResponse.json(
        { error: "format must be either csv or json" },
        { status: 400 },
      );
    }

    const query: BookingQuery = {
      dateFrom,
      dateTo,
      castleId: castleIds?.[0], // Use first castle ID if provided
      status: statuses?.length ? statuses : undefined,
    };

    // Get bookings with retry logic
    const bookingResult = await RetryHelper.withRetry(
      () => queryBookingsWithFilters(query),
      {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000,
      },
    );

    let bookings = bookingResult.bookings;

    // Filter fields if specified
    let processedBookings = bookings;
    if (fields.length > 0) {
      processedBookings = bookings.map((booking) => {
        const filtered: any = {};
        fields.forEach((field: string) => {
          if (field in booking) {
            filtered[field] = booking[field as keyof typeof booking];
          }
        });
        return filtered;
      });
    }

    // Remove sensitive data based on options
    if (!includeCustomerInfo) {
      processedBookings = processedBookings.map((booking) => {
        // Remove customer email and phone from the customer object
        const bookingCopy = JSON.parse(JSON.stringify(booking));
        if (bookingCopy.customer) {
          delete bookingCopy.customer.email;
          delete bookingCopy.customer.phone;
          delete bookingCopy.customer.alternativePhone;
        }
        return bookingCopy;
      });
    }

    if (!includePricing) {
      processedBookings = processedBookings.map((booking) => {
        // Remove payment information
        const bookingCopy = JSON.parse(JSON.stringify(booking));
        if (bookingCopy.payment) {
          delete bookingCopy.payment.totalAmount;
          delete bookingCopy.payment.paidAmount;
          delete bookingCopy.payment.depositAmount;
          delete bookingCopy.payment.refundAmount;
        }
        return bookingCopy;
      });
    }

    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "json") {
      // Return JSON format
      const filename = `bookings_export_${timestamp}.json`;

      return new NextResponse(
        JSON.stringify(
          {
            exportDate: new Date().toISOString(),
            filters: query,
            options: { includeCustomerInfo, includePricing, fields },
            totalRecords: processedBookings.length,
            data: processedBookings,
          },
          null,
          2,
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        },
      );
    } else {
      // Return CSV format
      const filename = `bookings_export_${timestamp}.csv`;
      const csvContent = generateCSV(processedBookings);

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error: any) {
    console.error("Error in POST /api/admin/reports/export:", error);
    return NextResponse.json(
      {
        error: "Failed to export booking data",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * Generate CSV content from booking data
 */
function generateCSV(bookings: any[]): string {
  if (bookings.length === 0) {
    return "No data to export\n";
  }

  // Get all unique keys from all booking objects
  const allKeys = new Set<string>();
  bookings.forEach((booking) => {
    Object.keys(booking).forEach((key) => allKeys.add(key));
  });

  const headers = Array.from(allKeys);

  // Create CSV header row
  const csvRows = [headers.join(",")];

  // Create CSV data rows
  bookings.forEach((booking) => {
    const row = headers.map((header) => {
      const value = booking[header];

      // Handle different data types
      if (value === null || value === undefined) {
        return "";
      }

      if (typeof value === "object") {
        // Convert objects/arrays to JSON string
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }

      if (typeof value === "string") {
        // Escape quotes and wrap in quotes if contains comma or quotes
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
      }

      return String(value);
    });

    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
}

/**
 * Sanitize filename for safe download
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}
