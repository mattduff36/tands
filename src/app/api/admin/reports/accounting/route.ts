import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";
import { getPool } from "@/lib/database/connection";
import { format } from "date-fns";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

/**
 * POST /api/admin/reports/accounting
 * Export accounting data for bookings within a date range
 * Supports both CSV and PDF formats
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin access
    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    if (!allowedUsers.includes(session.user?.username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { dateFrom, dateTo, format: exportFormat = "csv" } = body;

    // Validate required parameters
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "dateFrom and dateTo are required" },
        { status: 400 },
      );
    }

    // Validate format
    if (!["csv", "pdf"].includes(exportFormat)) {
      return NextResponse.json(
        { error: "format must be either csv or pdf" },
        { status: 400 },
      );
    }

    console.log(
      `Starting accounting export: ${dateFrom} to ${dateTo}, format: ${exportFormat}`,
    );

    let client: any;
    try {
      // Get database connection with timeout
      client = (await Promise.race([
        getPool().connect(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Database connection timeout")),
            5000,
          ),
        ),
      ])) as any;

      console.log("Database connection established");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Database connection failed. Please try again." },
        { status: 503 },
      );
    }

    try {
      // Get comprehensive booking data for accounting (exclude cancelled and expired bookings)
      const accountingQuery = `
        SELECT 
          booking_ref,
          customer_name,
          customer_email,
          customer_phone,
          castle_name,
          castle_type,
          date as event_date,
          start_date,
          end_date,
          event_duration,
          status,
          payment_method,
          payment_status,
          total_price,
          deposit,
          total_cost,
          payment_amount,
          payment_date,
          payment_type,
          payment_intent_id,
          admin_payment_comment,
          payment_failure_reason,
          created_at,
          updated_at,
          agreement_signed,
          agreement_signed_at,
          notes
        FROM bookings 
        WHERE date >= $1 AND date <= $2
        AND status NOT IN ('cancelled', 'expired')
        ORDER BY date ASC, booking_ref ASC
      `;

      console.log(
        `Querying accounting data from ${dateFrom} to ${dateTo} (excluding cancelled/expired bookings)`,
      );
      const bookingsResult = await Promise.race([
        client.query(accountingQuery, [dateFrom, dateTo]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 10000),
        ),
      ]);

      const bookings = bookingsResult.rows;
      console.log(
        `Retrieved ${bookings.length} bookings for accounting export`,
      );

      if (bookings.length === 0) {
        return NextResponse.json(
          { error: "No bookings found in the specified date range" },
          { status: 404 },
        );
      }

      // Process bookings for accounting export
      const accountingData = bookings.map((booking: any) => {
        // Handle currency conversion - check if values are in pence or pounds
        // Values > 1000 are likely in pence, values < 1000 are likely in pounds
        const isPenceFormat = (amount: number) => amount > 1000;

        const convertAmount = (amount: number | null) => {
          if (!amount) return 0;
          return isPenceFormat(amount) ? amount / 100 : amount;
        };

        const totalPricePounds = convertAmount(booking.total_price);
        const depositPounds = convertAmount(booking.deposit);
        const totalCostPounds = convertAmount(booking.total_cost);
        const paymentAmountPounds = booking.payment_amount
          ? booking.payment_amount / 100
          : 0; // payment_amount is always in pence

        // Fix payment amount for paid_full bookings and historic bookings
        let adjustedPaymentStatus = booking.payment_status;
        let adjustedPaymentAmount = paymentAmountPounds;

        // If payment status is paid_full, ensure payment amount reflects full payment
        if (booking.payment_status === "paid_full") {
          adjustedPaymentAmount = totalPricePounds; // Full payment for paid_full status
        }
        // Fix historic bookings - if status is 'completed' but no payment status, mark as paid in full
        else if (
          booking.status === "completed" &&
          (!booking.payment_status || booking.payment_status === "pending")
        ) {
          adjustedPaymentStatus = "paid_full";
          adjustedPaymentAmount = totalPricePounds; // Assume full payment for completed bookings
        }

        return {
          ...booking,
          // Convert amounts to pounds with proper formatting
          total_price_pounds: totalPricePounds.toFixed(2),
          deposit_pounds: depositPounds.toFixed(2),
          total_cost_pounds: totalCostPounds.toFixed(2),
          payment_amount_pounds: adjustedPaymentAmount.toFixed(2),
          // Calculate outstanding balance
          outstanding_balance: (
            totalPricePounds - adjustedPaymentAmount
          ).toFixed(2),
          // Use adjusted payment status
          payment_status: adjustedPaymentStatus,
          // Format dates
          event_date_formatted: booking.event_date
            ? format(new Date(booking.event_date), "dd/MM/yyyy")
            : "",
          payment_date_formatted: booking.payment_date
            ? format(new Date(booking.payment_date), "dd/MM/yyyy")
            : "",
          created_at_formatted: booking.created_at
            ? format(new Date(booking.created_at), "dd/MM/yyyy HH:mm")
            : "",
          // Payment status for accounting (use adjusted status)
          accounting_status: getAccountingStatus({
            ...booking,
            payment_status: adjustedPaymentStatus,
          }),
          // Revenue recognition
          revenue_status: getRevenueStatus(booking),
        };
      });

      const timestamp = new Date().toISOString().split("T")[0];

      if (exportFormat === "pdf") {
        // Generate PDF report
        console.log("Generating accounting PDF report...");

        try {
          const AccountingReportDocument = createAccountingReportDocument(
            accountingData,
            dateFrom,
            dateTo,
          );

          const pdfBlob = (await Promise.race([
            pdf(AccountingReportDocument).toBlob(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("PDF generation timeout")),
                20000,
              ),
            ),
          ])) as Blob;

          const pdfArrayBuffer = await pdfBlob.arrayBuffer();
          const pdfBuffer = Buffer.from(pdfArrayBuffer);
          console.log(
            `Accounting PDF generated successfully, size: ${pdfBuffer.length} bytes`,
          );

          const filename = `accounting-report-${dateFrom}-to-${dateTo}-${timestamp}.pdf`;

          return new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${filename}"`,
              "Cache-Control": "no-cache",
            },
          });
        } catch (pdfError: any) {
          console.error("PDF generation failed:", pdfError);
          return NextResponse.json(
            {
              error: "PDF generation failed",
              details: pdfError?.message || "Unknown PDF error",
            },
            { status: 500 },
          );
        }
      } else {
        // Generate CSV report
        const filename = `accounting-export-${dateFrom}-to-${dateTo}-${timestamp}.csv`;
        const csvContent = generateAccountingCSV(accountingData);

        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }
    } finally {
      if (client) {
        client.release();
        console.log("Database connection released");
      }
    }
  } catch (error: any) {
    console.error("Error in accounting export:", error);
    return NextResponse.json(
      {
        error: "Failed to export accounting data",
        details: error?.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Helper function to determine accounting status
function getAccountingStatus(booking: any): string {
  if (booking.status === "expired" || booking.status === "cancelled") {
    return "Cancelled";
  }

  switch (booking.payment_status) {
    case "paid_full":
      return "Paid in Full";
    case "deposit_paid":
      return "Deposit Paid";
    case "pending":
      return "Payment Pending";
    case "failed":
      return "Payment Failed";
    case "refunded":
      return "Refunded";
    default:
      return "Unknown";
  }
}

// Helper function to determine revenue recognition status
function getRevenueStatus(booking: any): string {
  const eventDate = new Date(booking.event_date);
  const today = new Date();

  if (booking.status === "expired" || booking.status === "cancelled") {
    return "No Revenue";
  }

  if (eventDate < today && booking.status === "completed") {
    return "Revenue Recognized";
  } else if (eventDate < today) {
    return "Service Delivered";
  } else {
    return "Deferred Revenue";
  }
}

// Generate CSV content for accounting export
function generateAccountingCSV(bookings: any[]): string {
  const headers = [
    "Booking Reference",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Castle Name",
    "Castle Type",
    "Event Date",
    "Event Duration (hours)",
    "Booking Status",
    "Payment Method",
    "Payment Status",
    "Accounting Status",
    "Revenue Status",
    "Total Price (£)",
    "Deposit Required (£)",
    "Amount Paid (£)",
    "Outstanding Balance (£)",
    "Payment Date",
    "Payment Type",
    "Transaction ID",
    "Admin Payment Notes",
    "Payment Issues",
    "Booking Created",
    "Agreement Signed",
    "Agreement Date",
    "Notes",
  ];

  const csvRows = [headers.join(",")];

  bookings.forEach((booking) => {
    const row = [
      escapeCSV(booking.booking_ref),
      escapeCSV(booking.customer_name),
      escapeCSV(booking.customer_email),
      escapeCSV(booking.customer_phone),
      escapeCSV(booking.castle_name),
      escapeCSV(booking.castle_type),
      escapeCSV(booking.event_date_formatted),
      escapeCSV(booking.event_duration || "8"),
      escapeCSV(booking.status),
      escapeCSV(booking.payment_method),
      escapeCSV(booking.payment_status || "pending"),
      escapeCSV(booking.accounting_status),
      escapeCSV(booking.revenue_status),
      escapeCSV(booking.total_price_pounds),
      escapeCSV(booking.deposit_pounds),
      escapeCSV(booking.payment_amount_pounds),
      escapeCSV(booking.outstanding_balance),
      escapeCSV(booking.payment_date_formatted),
      escapeCSV(booking.payment_type || ""),
      escapeCSV(booking.payment_intent_id || ""),
      escapeCSV(booking.admin_payment_comment || ""),
      escapeCSV(booking.payment_failure_reason || ""),
      escapeCSV(booking.created_at_formatted),
      escapeCSV(booking.agreement_signed ? "Yes" : "No"),
      escapeCSV(
        booking.agreement_signed_at
          ? format(new Date(booking.agreement_signed_at), "dd/MM/yyyy HH:mm")
          : "",
      ),
      escapeCSV(booking.notes || ""),
    ];
    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
}

// Helper function to escape CSV values
function escapeCSV(value: string | null | undefined): string {
  if (!value) return "";
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

// PDF Styles for accounting report
const accountingStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 20,
    fontFamily: "Times-Roman",
    fontSize: 9,
    lineHeight: 1.2,
  },
  header: {
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 3,
  },
  dateRange: {
    fontSize: 10,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingHorizontal: 10,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  summaryValue: {
    fontSize: 10,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    fontSize: 7,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
  },
  cell: {
    fontSize: 7,
    paddingHorizontal: 2,
    textAlign: "left",
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    fontSize: 8,
    color: "#666666",
    textAlign: "center",
  },
});

// Create PDF document for accounting report
function createAccountingReportDocument(
  bookings: any[],
  dateFrom: string,
  dateTo: string,
) {
  // Calculate summary statistics
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + parseFloat(booking.total_price_pounds),
    0,
  );
  const totalPaid = bookings.reduce(
    (sum, booking) => sum + parseFloat(booking.payment_amount_pounds),
    0,
  );
  const totalOutstanding = bookings.reduce(
    (sum, booking) => sum + parseFloat(booking.outstanding_balance),
    0,
  );

  const paidInFull = bookings.filter(
    (b) => b.payment_status === "paid_full",
  ).length;
  const depositPaid = bookings.filter(
    (b) => b.payment_status === "deposit_paid",
  ).length;
  const pending = bookings.filter((b) => b.payment_status === "pending").length;

  return React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: "A4", style: accountingStyles.page, orientation: "landscape" },

      // Header
      React.createElement(
        View,
        { style: accountingStyles.header },
        React.createElement(
          Text,
          { style: accountingStyles.title },
          "T&S Bouncy Castle Hire - Accounting Report",
        ),
        React.createElement(
          Text,
          { style: accountingStyles.subtitle },
          "Financial Summary and Transaction Details",
        ),
        React.createElement(
          Text,
          { style: accountingStyles.dateRange },
          `Period: ${format(new Date(dateFrom), "dd/MM/yyyy")} - ${format(new Date(dateTo), "dd/MM/yyyy")}`,
        ),
        React.createElement(
          Text,
          { style: { fontSize: 8, marginTop: 5 } },
          `Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        ),
      ),

      // Summary Section
      React.createElement(
        View,
        { style: accountingStyles.section },
        React.createElement(
          Text,
          { style: accountingStyles.sectionTitle },
          "Financial Summary",
        ),
        React.createElement(
          View,
          { style: accountingStyles.summaryRow },
          React.createElement(
            Text,
            { style: accountingStyles.summaryLabel },
            "Total Bookings:",
          ),
          React.createElement(
            Text,
            { style: accountingStyles.summaryValue },
            totalBookings.toString(),
          ),
        ),
        React.createElement(
          View,
          { style: accountingStyles.summaryRow },
          React.createElement(
            Text,
            { style: accountingStyles.summaryLabel },
            "Total Revenue:",
          ),
          React.createElement(
            Text,
            { style: accountingStyles.summaryValue },
            `£${totalRevenue.toFixed(2)}`,
          ),
        ),
        React.createElement(
          View,
          { style: accountingStyles.summaryRow },
          React.createElement(
            Text,
            { style: accountingStyles.summaryLabel },
            "Total Paid:",
          ),
          React.createElement(
            Text,
            { style: accountingStyles.summaryValue },
            `£${totalPaid.toFixed(2)}`,
          ),
        ),
        React.createElement(
          View,
          { style: accountingStyles.summaryRow },
          React.createElement(
            Text,
            { style: accountingStyles.summaryLabel },
            "Outstanding:",
          ),
          React.createElement(
            Text,
            { style: accountingStyles.summaryValue },
            `£${totalOutstanding.toFixed(2)}`,
          ),
        ),
        React.createElement(
          View,
          { style: accountingStyles.summaryRow },
          React.createElement(
            Text,
            { style: accountingStyles.summaryLabel },
            "Paid in Full:",
          ),
          React.createElement(
            Text,
            { style: accountingStyles.summaryValue },
            `${paidInFull} bookings`,
          ),
        ),
        React.createElement(
          View,
          { style: accountingStyles.summaryRow },
          React.createElement(
            Text,
            { style: accountingStyles.summaryLabel },
            "Deposit Paid:",
          ),
          React.createElement(
            Text,
            { style: accountingStyles.summaryValue },
            `${depositPaid} bookings`,
          ),
        ),
        React.createElement(
          View,
          { style: accountingStyles.summaryRow },
          React.createElement(
            Text,
            { style: accountingStyles.summaryLabel },
            "Payment Pending:",
          ),
          React.createElement(
            Text,
            { style: accountingStyles.summaryValue },
            `${pending} bookings`,
          ),
        ),
      ),

      // Detailed Transactions Table
      React.createElement(
        View,
        { style: accountingStyles.section },
        React.createElement(
          Text,
          { style: accountingStyles.sectionTitle },
          "Detailed Transaction Records",
        ),
        React.createElement(
          View,
          { style: accountingStyles.table },
          // Table Header
          React.createElement(
            View,
            { style: accountingStyles.tableHeader },
            React.createElement(
              Text,
              { style: [accountingStyles.cell, { width: "8%" }] },
              "Ref",
            ),
            React.createElement(
              Text,
              { style: [accountingStyles.cell, { width: "12%" }] },
              "Customer",
            ),
            React.createElement(
              Text,
              { style: [accountingStyles.cell, { width: "8%" }] },
              "Event Date",
            ),
            React.createElement(
              Text,
              { style: [accountingStyles.cell, { width: "10%" }] },
              "Castle",
            ),
            React.createElement(
              Text,
              { style: [accountingStyles.cell, { width: "8%" }] },
              "Total £",
            ),
            React.createElement(
              Text,
              { style: [accountingStyles.cell, { width: "8%" }] },
              "Paid £",
            ),
            React.createElement(
              Text,
              { style: [accountingStyles.cell, { width: "8%" }] },
              "Outstanding £",
            ),
            React.createElement(
              Text,
              { style: [accountingStyles.cell, { width: "10%" }] },
              "Payment Status",
            ),
            React.createElement(
              Text,
              { style: [accountingStyles.cell, { width: "8%" }] },
              "Payment Date",
            ),
            React.createElement(
              Text,
              { style: [accountingStyles.cell, { width: "10%" }] },
              "Revenue Status",
            ),
            React.createElement(
              Text,
              { style: [accountingStyles.cell, { width: "10%" }] },
              "Notes",
            ),
          ),
          // Table Rows
          ...bookings
            .slice(0, 50)
            .map((booking, index) =>
              React.createElement(
                View,
                { key: index, style: accountingStyles.tableRow },
                React.createElement(
                  Text,
                  { style: [accountingStyles.cell, { width: "8%" }] },
                  booking.booking_ref,
                ),
                React.createElement(
                  Text,
                  { style: [accountingStyles.cell, { width: "12%" }] },
                  booking.customer_name.substring(0, 15),
                ),
                React.createElement(
                  Text,
                  { style: [accountingStyles.cell, { width: "8%" }] },
                  booking.event_date_formatted,
                ),
                React.createElement(
                  Text,
                  { style: [accountingStyles.cell, { width: "10%" }] },
                  (booking.castle_name || "").substring(0, 12),
                ),
                React.createElement(
                  Text,
                  { style: [accountingStyles.cell, { width: "8%" }] },
                  booking.total_price_pounds,
                ),
                React.createElement(
                  Text,
                  { style: [accountingStyles.cell, { width: "8%" }] },
                  booking.payment_amount_pounds,
                ),
                React.createElement(
                  Text,
                  { style: [accountingStyles.cell, { width: "8%" }] },
                  booking.outstanding_balance,
                ),
                React.createElement(
                  Text,
                  { style: [accountingStyles.cell, { width: "10%" }] },
                  booking.accounting_status,
                ),
                React.createElement(
                  Text,
                  { style: [accountingStyles.cell, { width: "8%" }] },
                  booking.payment_date_formatted,
                ),
                React.createElement(
                  Text,
                  { style: [accountingStyles.cell, { width: "10%" }] },
                  booking.revenue_status,
                ),
                React.createElement(
                  Text,
                  { style: [accountingStyles.cell, { width: "10%" }] },
                  (booking.admin_payment_comment || "").substring(0, 15),
                ),
              ),
            ),
        ),
        bookings.length > 50
          ? React.createElement(
              Text,
              {
                style: {
                  fontSize: 8,
                  fontStyle: "italic",
                  marginTop: 10,
                  textAlign: "center",
                },
              },
              `Showing first 50 of ${bookings.length} bookings. Full data available in CSV export.`,
            )
          : null,
      ),

      // Footer
      React.createElement(
        View,
        { style: accountingStyles.footer },
        React.createElement(
          Text,
          {},
          "T&S Bouncy Castle Hire - Accounting Report",
        ),
        React.createElement(
          Text,
          {},
          "This report contains financial data for accounting and tax purposes",
        ),
        React.createElement(
          Text,
          {},
          "All amounts are in GBP. Outstanding balances calculated as Total - Amount Paid",
        ),
      ),
    ),
  );
}
