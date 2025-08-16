import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingRef } = body;

    if (!bookingRef) {
      return NextResponse.json(
        { error: "Booking reference is required" },
        { status: 400 },
      );
    }

    console.log(`Starting PDF generation for booking: ${bookingRef}`);

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
      // Get complete booking data with timeout
      const bookingQuery = `
        SELECT 
          id,
          booking_ref,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          castle_id,
          castle_name,
          date,
          payment_method,
          total_price,
          deposit,
          status,
          notes,
          created_at,
          updated_at,
          castle_type,
          start_date,
          end_date,
          event_duration,
          total_cost,
          calendar_event_id,
          agreement_signed,
          agreement_signed_at,
          agreement_signed_by,
          agreement_signed_method,
          agreement_ip_address,
          agreement_user_agent,
          agreement_pdf_generated,
          agreement_pdf_generated_at,
          agreement_email_opened,
          agreement_email_opened_at,
          agreement_viewed,
          agreement_viewed_at,
          audit_trail,
          email_sent,
          email_sent_at,
          manual_confirmation,
          confirmed_by,
          payment_status,
          payment_intent_id,
          payment_date,
          payment_amount,
          payment_type,
          payment_failure_reason,
          admin_payment_comment
        FROM bookings 
        WHERE booking_ref = $1
      `;

      console.log(`Querying booking data for: ${bookingRef}`);
      const bookingResult = await Promise.race([
        client.query(bookingQuery, [bookingRef]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000),
        ),
      ]);

      if (bookingResult.rows.length === 0) {
        console.log(`Booking not found: ${bookingRef}`);
        return NextResponse.json(
          { error: `Booking ${bookingRef} not found` },
          { status: 404 },
        );
      }

      const booking = bookingResult.rows[0];
      console.log(`Booking data retrieved for: ${booking.booking_ref}`);

      // Get audit trail (with fallback to JSONB field)
      let auditTrail = [];
      try {
        const auditQuery = `
          SELECT 
            timestamp,
            action,
            actor,
            actor_details,
            method,
            ip_address,
            user_agent,
            details
          FROM booking_audit_trail 
          WHERE booking_id = $1 
          ORDER BY timestamp ASC
        `;
        const auditResult = await client.query(auditQuery, [booking.id]);
        auditTrail = auditResult.rows;
        console.log(`Audit trail retrieved: ${auditTrail.length} entries`);
      } catch (auditError) {
        console.log("Audit trail table not found, using JSONB field");
        auditTrail = booking.audit_trail || [];
      }

      // Sanitize audit trail data for PDF rendering
      auditTrail = auditTrail.map((entry: any) => ({
        timestamp: entry.timestamp,
        action:
          typeof entry.action === "string"
            ? entry.action
            : JSON.stringify(entry.action),
        actor:
          typeof entry.actor === "string"
            ? entry.actor
            : JSON.stringify(entry.actor),
        method:
          typeof entry.method === "string"
            ? entry.method
            : JSON.stringify(entry.method),
        details:
          typeof entry.details === "string"
            ? entry.details
            : typeof entry.details === "object"
              ? JSON.stringify(entry.details).substring(0, 100) + "..."
              : String(entry.details),
        isPaymentRelated:
          entry.action &&
          (entry.action.includes("payment") ||
            entry.action.includes("Payment") ||
            entry.action.includes("paid") ||
            entry.action.includes("deposit") ||
            entry.action.includes("cash")),
      }));

      console.log(`Audit trail sanitized: ${auditTrail.length} entries`);

      // Generate PDF using React PDF
      console.log("Starting PDF generation...");

      try {
        const BookingReportDocument = createBookingReportDocument(
          booking,
          auditTrail,
        );

        console.log("Converting React components to PDF...");
        const pdfBlob = (await Promise.race([
          pdf(BookingReportDocument).toBlob(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("PDF generation timeout")),
              15000,
            ),
          ),
        ])) as Blob;

        const pdfArrayBuffer = await pdfBlob.arrayBuffer();
        const pdfBuffer = Buffer.from(pdfArrayBuffer);
        console.log(
          `PDF generated successfully, size: ${pdfBuffer.length} bytes`,
        );

        // Return PDF as response
        return new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="booking-${bookingRef}-report-${new Date().toISOString().split("T")[0]}.pdf"`,
            "Cache-Control": "no-cache",
          },
        });
      } catch (pdfError: any) {
        console.error("PDF generation failed:", pdfError);
        return NextResponse.json(
          {
            error: "PDF generation failed",
            details: pdfError?.message || "Unknown PDF error",
            bookingRef: bookingRef,
          },
          { status: 500 },
        );
      }
    } finally {
      if (client) {
        client.release();
        console.log("Database connection released");
      }
    }
  } catch (error: any) {
    console.error("Error generating booking report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate booking report",
        details: error?.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// React PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Times-Roman",
    fontSize: 10,
    lineHeight: 1.3,
  },
  header: {
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 10,
    marginBottom: 15,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 3,
  },
  companyTagline: {
    fontSize: 9,
    fontStyle: "italic",
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 3,
  },
  reportDate: {
    fontSize: 8,
    color: "#666666",
  },
  section: {
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  leftColumn: {
    width: "50%",
    paddingRight: 10,
  },
  rightColumn: {
    width: "50%",
  },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    borderBottomStyle: "dotted",
    paddingVertical: 2,
    marginBottom: 2,
  },
  infoLabel: {
    fontWeight: "bold",
    width: "40%",
    fontSize: 9,
  },
  infoValue: {
    width: "60%",
    fontSize: 9,
  },
  statusBadge: {
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: "#000000",
  },
  highlightValue: {
    fontWeight: "bold",
    textDecoration: "underline",
  },
  financialHighlight: {
    fontWeight: "bold",
    fontSize: 10,
  },
  signatureSection: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 8,
    marginVertical: 8,
    backgroundColor: "#f9f9f9",
  },
  signatureVerified: {
    fontWeight: "bold",
    fontSize: 9,
    marginBottom: 5,
  },
  auditTable: {
    marginTop: 8,
  },
  auditRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingVertical: 3,
  },
  auditHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    fontSize: 8,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  auditCell: {
    fontSize: 8,
    paddingHorizontal: 6,
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

// Utility functions
const formatDate = (date: string | null) => {
  if (!date) return "Not available";
  try {
    return format(new Date(date), "dd/MM/yyyy HH:mm");
  } catch {
    return date;
  }
};

const formatDateOnly = (date: string | null) => {
  if (!date) return "Not available";
  try {
    return format(new Date(date), "dd/MM/yyyy");
  } catch {
    return date;
  }
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return "£0.00";
  return `£${amount.toFixed(2)}`;
};

// Generate payment summary text based on booking data and audit trail
const getPaymentSummaryText = (booking: any) => {
  const totalAmount = booking.total_price || booking.total_cost || 0;
  const depositAmount = booking.deposit || 0;
  const balanceAmount = totalAmount - depositAmount;
  const paymentStatus = booking.payment_status || "pending";
  const paymentMethod = booking.payment_method || "not specified";

  let summary = "";

  switch (paymentStatus) {
    case "pending":
      summary = `No payment received yet. Customer selected ${paymentMethod} payment method. `;
      if (paymentMethod === "cash") {
        summary += `Deposit of ${formatCurrency(depositAmount)} required online, balance of ${formatCurrency(balanceAmount)} to be paid in cash on delivery.`;
      } else {
        summary += `Full amount of ${formatCurrency(totalAmount)} to be paid online.`;
      }
      break;

    case "deposit_paid":
      summary = `Deposit of ${formatCurrency(depositAmount)} has been paid`;
      if (booking.payment_date) {
        summary += ` on ${formatDate(booking.payment_date)}`;
      }
      summary += `. Balance of ${formatCurrency(balanceAmount)} `;
      if (paymentMethod === "cash") {
        summary += `to be paid in cash on delivery.`;
      } else {
        summary += `still outstanding.`;
      }
      break;

    case "paid_full":
      summary = `Payment completed in full (${formatCurrency(totalAmount)})`;
      if (booking.payment_date) {
        summary += ` on ${formatDate(booking.payment_date)}`;
      }
      summary += `. `;

      // Check if this was a mixed payment (deposit online + cash balance)
      if (paymentMethod === "cash" && booking.payment_amount) {
        const onlinePortion = booking.payment_amount / 100; // Convert from pence
        const cashPortion = totalAmount - onlinePortion;
        if (cashPortion > 0) {
          summary += `Payment split: ${formatCurrency(onlinePortion)} paid online, ${formatCurrency(cashPortion)} paid in cash.`;
        } else {
          summary += `Full amount paid online.`;
        }
      } else {
        summary += `Payment method: ${paymentMethod}.`;
      }

      // Add admin comment if payment was manually marked as paid
      if (booking.admin_payment_comment) {
        summary += ` Admin notes: ${booking.admin_payment_comment}`;
      }
      break;

    case "refunded":
      summary = `Payment was refunded`;
      if (booking.payment_date) {
        summary += ` (original payment: ${formatDate(booking.payment_date)})`;
      }
      summary += `. `;
      if (booking.admin_payment_comment) {
        summary += `Refund reason: ${booking.admin_payment_comment}`;
      }
      break;

    case "failed":
      summary = `Payment attempt failed. `;
      if (booking.payment_failure_reason) {
        summary += `Reason: ${booking.payment_failure_reason}. `;
      }
      summary += `Customer needs to retry payment.`;
      break;

    default:
      summary = `Payment status: ${paymentStatus}. Payment method: ${paymentMethod}.`;
  }

  return summary;
};

// React PDF Document Component (using React.createElement for .ts compatibility)
function createBookingReportDocument(booking: any, auditTrail: any[]) {
  return React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          Text,
          { style: styles.companyName },
          "T&S Bouncy Castle Hire",
        ),
        React.createElement(
          Text,
          { style: styles.companyTagline },
          "Professional Bouncy Castle Rental Services",
        ),
        React.createElement(
          Text,
          { style: styles.reportTitle },
          "Comprehensive Booking Report",
        ),
        React.createElement(
          Text,
          { style: styles.reportDate },
          `Generated on ${formatDate(new Date().toISOString())}`,
        ),
      ),

      // Booking Overview
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          "Booking Overview",
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(
            View,
            { style: styles.leftColumn },
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Booking Reference:",
              ),
              React.createElement(
                Text,
                { style: [styles.infoValue, styles.highlightValue] },
                String(booking.booking_ref),
              ),
            ),
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Status:"),
              React.createElement(
                Text,
                { style: [styles.infoValue, styles.statusBadge] },
                String(booking.status),
              ),
            ),
          ),
          React.createElement(
            View,
            { style: styles.rightColumn },
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Booking Created:",
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                formatDate(booking.created_at),
              ),
            ),
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Last Updated:",
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                formatDate(booking.updated_at),
              ),
            ),
          ),
        ),
      ),

      // Customer Information
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          "Customer Information",
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(
            View,
            { style: styles.leftColumn },
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Name:"),
              React.createElement(
                Text,
                { style: styles.infoValue },
                String(booking.customer_name || "Not provided"),
              ),
            ),
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Email:"),
              React.createElement(
                Text,
                { style: styles.infoValue },
                String(booking.customer_email || "Not provided"),
              ),
            ),
          ),
          React.createElement(
            View,
            { style: styles.rightColumn },
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Phone:"),
              React.createElement(
                Text,
                { style: styles.infoValue },
                String(booking.customer_phone || "Not provided"),
              ),
            ),
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Address:",
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                String(booking.customer_address || "Not provided"),
              ),
            ),
          ),
        ),
      ),

      // Event Details
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          "Event Details",
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(
            View,
            { style: styles.leftColumn },
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Castle:"),
              React.createElement(
                Text,
                { style: styles.infoValue },
                String(booking.castle_name || "Not specified"),
              ),
            ),
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Castle Type:",
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                String(booking.castle_type || "Not specified"),
              ),
            ),
          ),
          React.createElement(
            View,
            { style: styles.rightColumn },
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Event Date:",
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                formatDateOnly(booking.date || booking.start_date),
              ),
            ),
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Duration:",
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                String(booking.event_duration || "Not specified"),
              ),
            ),
          ),
        ),
        booking.notes
          ? React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Notes:"),
              React.createElement(
                Text,
                { style: styles.infoValue },
                String(booking.notes),
              ),
            )
          : null,
      ),

      // Financial Information
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          "Financial Information",
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(
            View,
            { style: styles.leftColumn },
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Total Price:",
              ),
              React.createElement(
                Text,
                { style: [styles.infoValue, styles.financialHighlight] },
                formatCurrency(booking.total_price || booking.total_cost),
              ),
            ),
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Deposit Required:",
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                formatCurrency(booking.deposit),
              ),
            ),
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Balance Due:",
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                formatCurrency(
                  (booking.total_price || booking.total_cost || 0) -
                    (booking.deposit || 0),
                ),
              ),
            ),
          ),
          React.createElement(
            View,
            { style: styles.rightColumn },
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Payment Method:",
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                String(booking.payment_method || "Not specified"),
              ),
            ),
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Payment Status:",
              ),
              React.createElement(
                Text,
                { style: [styles.infoValue, styles.statusBadge] },
                String(booking.payment_status || "pending").toUpperCase(),
              ),
            ),
          ),
        ),

        // Payment Status Details Section
        React.createElement(
          View,
          {
            style: {
              marginTop: 10,
              borderTopWidth: 1,
              borderTopColor: "#cccccc",
              paddingTop: 8,
            },
          },
          React.createElement(
            Text,
            { style: [styles.sectionTitle, { fontSize: 10, marginBottom: 6 }] },
            "Payment Status Details",
          ),

          // Payment amount and date if available
          booking.payment_amount || booking.payment_date
            ? React.createElement(
                View,
                { style: styles.row },
                React.createElement(
                  View,
                  { style: styles.leftColumn },
                  booking.payment_amount
                    ? React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(
                          Text,
                          { style: styles.infoLabel },
                          "Amount Paid:",
                        ),
                        React.createElement(
                          Text,
                          {
                            style: [
                              styles.infoValue,
                              styles.financialHighlight,
                            ],
                          },
                          formatCurrency(booking.payment_amount / 100), // Convert from pence
                        ),
                      )
                    : null,
                  booking.payment_type
                    ? React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(
                          Text,
                          { style: styles.infoLabel },
                          "Payment Type:",
                        ),
                        React.createElement(
                          Text,
                          { style: styles.infoValue },
                          String(
                            booking.payment_type === "deposit"
                              ? "Deposit Payment"
                              : booking.payment_type === "full"
                                ? "Full Payment"
                                : booking.payment_type,
                          ),
                        ),
                      )
                    : null,
                ),
                React.createElement(
                  View,
                  { style: styles.rightColumn },
                  booking.payment_date
                    ? React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(
                          Text,
                          { style: styles.infoLabel },
                          "Payment Date:",
                        ),
                        React.createElement(
                          Text,
                          { style: styles.infoValue },
                          formatDate(booking.payment_date),
                        ),
                      )
                    : null,
                  booking.payment_intent_id
                    ? React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(
                          Text,
                          { style: styles.infoLabel },
                          "Transaction ID:",
                        ),
                        React.createElement(
                          Text,
                          { style: [styles.infoValue, { fontSize: 7 }] },
                          String(booking.payment_intent_id).substring(0, 20) +
                            "...",
                        ),
                      )
                    : null,
                ),
              )
            : null,

          // Admin payment comments or failure reasons
          booking.admin_payment_comment || booking.payment_failure_reason
            ? React.createElement(
                View,
                { style: { marginTop: 6 } },
                booking.admin_payment_comment
                  ? React.createElement(
                      View,
                      { style: styles.infoRow },
                      React.createElement(
                        Text,
                        { style: styles.infoLabel },
                        "Admin Notes:",
                      ),
                      React.createElement(
                        Text,
                        { style: styles.infoValue },
                        String(booking.admin_payment_comment),
                      ),
                    )
                  : null,
                booking.payment_failure_reason
                  ? React.createElement(
                      View,
                      { style: styles.infoRow },
                      React.createElement(
                        Text,
                        { style: styles.infoLabel },
                        "Payment Issues:",
                      ),
                      React.createElement(
                        Text,
                        { style: [styles.infoValue, { color: "#cc0000" }] },
                        String(booking.payment_failure_reason),
                      ),
                    )
                  : null,
              )
            : null,

          // Payment summary based on status
          React.createElement(
            View,
            {
              style: {
                marginTop: 8,
                padding: 6,
                backgroundColor: "#f5f5f5",
                borderRadius: 3,
              },
            },
            React.createElement(
              Text,
              { style: { fontSize: 9, fontWeight: "bold", marginBottom: 3 } },
              "Payment Summary:",
            ),
            React.createElement(
              Text,
              { style: { fontSize: 8 } },
              getPaymentSummaryText(booking),
            ),
          ),

          // Payment-related audit entries
          auditTrail.filter((entry) => entry.isPaymentRelated).length > 0
            ? React.createElement(
                View,
                { style: { marginTop: 8 } },
                React.createElement(
                  Text,
                  {
                    style: [
                      styles.sectionTitle,
                      { fontSize: 9, marginBottom: 4 },
                    ],
                  },
                  "Payment History:",
                ),
                ...auditTrail
                  .filter((entry) => entry.isPaymentRelated)
                  .slice(0, 5)
                  .map((entry, index) =>
                    React.createElement(
                      View,
                      {
                        key: index,
                        style: {
                          flexDirection: "row",
                          marginBottom: 3,
                          padding: 3,
                          backgroundColor: "#fff3cd",
                          borderRadius: 2,
                          borderLeftWidth: 3,
                          borderLeftColor: "#ffc107",
                        },
                      },
                      React.createElement(
                        Text,
                        { style: { fontSize: 7, width: "30%" } },
                        formatDate(entry.timestamp),
                      ),
                      React.createElement(
                        Text,
                        {
                          style: {
                            fontSize: 7,
                            width: "70%",
                            fontWeight: "bold",
                          },
                        },
                        `${entry.action} (${entry.actor})`,
                      ),
                    ),
                  ),
              )
            : null,
        ),
      ),

      // Agreement Information
      booking.agreement_signed
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              "Agreement & Legal Information",
            ),
            React.createElement(
              View,
              { style: styles.signatureSection },
              React.createElement(
                Text,
                { style: styles.signatureVerified },
                "✓ AGREEMENT DIGITALLY SIGNED",
              ),
              React.createElement(
                View,
                { style: styles.row },
                React.createElement(
                  View,
                  { style: styles.leftColumn },
                  React.createElement(
                    View,
                    { style: styles.infoRow },
                    React.createElement(
                      Text,
                      { style: styles.infoLabel },
                      "Signed By:",
                    ),
                    React.createElement(
                      Text,
                      { style: styles.infoValue },
                      String(booking.agreement_signed_by || "Not recorded"),
                    ),
                  ),
                  React.createElement(
                    View,
                    { style: styles.infoRow },
                    React.createElement(
                      Text,
                      { style: styles.infoLabel },
                      "Signed At:",
                    ),
                    React.createElement(
                      Text,
                      { style: styles.infoValue },
                      formatDate(booking.agreement_signed_at),
                    ),
                  ),
                  React.createElement(
                    View,
                    { style: styles.infoRow },
                    React.createElement(
                      Text,
                      { style: styles.infoLabel },
                      "Method:",
                    ),
                    React.createElement(
                      Text,
                      { style: styles.infoValue },
                      String(
                        booking.agreement_signed_method || "Digital signature",
                      ),
                    ),
                  ),
                ),
                React.createElement(
                  View,
                  { style: styles.rightColumn },
                  React.createElement(
                    View,
                    { style: styles.infoRow },
                    React.createElement(
                      Text,
                      { style: styles.infoLabel },
                      "IP Address:",
                    ),
                    React.createElement(
                      Text,
                      { style: styles.infoValue },
                      String(booking.agreement_ip_address || "Not recorded"),
                    ),
                  ),
                  booking.agreement_user_agent
                    ? React.createElement(
                        View,
                        { style: styles.infoRow },
                        React.createElement(
                          Text,
                          { style: styles.infoLabel },
                          "User Agent:",
                        ),
                        React.createElement(
                          Text,
                          { style: [styles.infoValue, { fontSize: 7 }] },
                          String(booking.agreement_user_agent),
                        ),
                      )
                    : null,
                ),
              ),
            ),
          )
        : React.createElement(
            View,
            { style: styles.section },
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              "Agreement Status",
            ),
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(
                Text,
                { style: styles.infoLabel },
                "Agreement Status:",
              ),
              React.createElement(
                Text,
                { style: [styles.infoValue, { fontWeight: "bold" }] },
                "⏳ Pending Signature",
              ),
            ),
          ),

      // Audit Trail
      auditTrail.length > 0
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              "Audit Trail",
            ),
            React.createElement(
              View,
              { style: styles.auditTable },
              React.createElement(
                View,
                { style: styles.auditHeader },
                React.createElement(
                  Text,
                  { style: [styles.auditCell, { width: "25%" }] },
                  "Date/Time",
                ),
                React.createElement(
                  Text,
                  { style: [styles.auditCell, { width: "20%" }] },
                  "Action",
                ),
                React.createElement(
                  Text,
                  { style: [styles.auditCell, { width: "15%" }] },
                  "Actor",
                ),
                React.createElement(
                  Text,
                  { style: [styles.auditCell, { width: "15%" }] },
                  "Method",
                ),
                React.createElement(
                  Text,
                  { style: [styles.auditCell, { width: "25%" }] },
                  "Details",
                ),
              ),
              ...auditTrail.slice(0, 10).map((entry, index) =>
                React.createElement(
                  View,
                  {
                    key: index,
                    style: [
                      styles.auditRow,
                      entry.isPaymentRelated
                        ? { backgroundColor: "#fff3cd" }
                        : {},
                    ],
                  },
                  React.createElement(
                    Text,
                    { style: [styles.auditCell, { width: "25%" }] },
                    formatDate(entry.timestamp),
                  ),
                  React.createElement(
                    Text,
                    {
                      style: [
                        styles.auditCell,
                        { width: "20%" },
                        entry.isPaymentRelated ? { fontWeight: "bold" } : {},
                      ],
                    },
                    String(entry.action || "N/A"),
                  ),
                  React.createElement(
                    Text,
                    { style: [styles.auditCell, { width: "15%" }] },
                    String(entry.actor || "System"),
                  ),
                  React.createElement(
                    Text,
                    { style: [styles.auditCell, { width: "15%" }] },
                    String(entry.method || "N/A"),
                  ),
                  React.createElement(
                    Text,
                    { style: [styles.auditCell, { width: "25%" }] },
                    typeof entry.details === "object"
                      ? JSON.stringify(entry.details).substring(0, 50) + "..."
                      : String(entry.details || "N/A"),
                  ),
                ),
              ),
            ),
          )
        : null,

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          {},
          "T&S Bouncy Castle Hire - Booking Management System",
        ),
        React.createElement(
          Text,
          {},
          `This report contains all available data for booking ${String(booking.booking_ref)}`,
        ),
        React.createElement(
          Text,
          {},
          "Document includes digital signature verification and audit trails for legal compliance",
        ),
      ),
    ),
  );
}
