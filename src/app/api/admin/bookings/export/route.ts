import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database/connection";

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

    console.log(`Starting booking export for: ${bookingRef}`);

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
      // Get complete booking data
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
          confirmed_by
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

      // Get audit trail entries (if stored in separate table)
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

      let auditTrail = [];
      try {
        const auditResult = await client.query(auditQuery, [booking.id]);
        auditTrail = auditResult.rows;
      } catch (auditError) {
        // Audit trail table might not exist yet, use JSONB audit_trail field instead
        console.log("Using JSONB audit trail instead of separate table");
        auditTrail = booking.audit_trail || [];
      }

      // Prepare comprehensive export data
      const exportData = {
        exportInfo: {
          bookingReference: bookingRef,
          exportedAt: new Date().toISOString(),
          exportedBy: "admin", // In a real system, you'd get this from session
          exportReason: "Administrative data export",
        },
        bookingDetails: {
          // Core booking information
          id: booking.id,
          bookingReference: booking.booking_ref,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          customerPhone: booking.customer_phone,
          customerAddress: booking.customer_address,

          // Castle and event details
          castleId: booking.castle_id,
          castleName: booking.castle_name,
          castleType: booking.castle_type,
          eventDate: booking.date,
          startDate: booking.start_date,
          endDate: booking.end_date,
          eventDuration: booking.event_duration,

          // Financial information
          paymentMethod: booking.payment_method,
          totalPrice: booking.total_price,
          deposit: booking.deposit,
          totalCost: booking.total_cost,

          // Booking status and lifecycle
          status: booking.status,
          notes: booking.notes,
          createdAt: booking.created_at,
          updatedAt: booking.updated_at,

          // Calendar integration
          calendarEventId: booking.calendar_event_id,

          // Email tracking
          emailSent: booking.email_sent,
          emailSentAt: booking.email_sent_at,

          // Manual confirmation tracking
          manualConfirmation: booking.manual_confirmation,
          confirmedBy: booking.confirmed_by,
        },
        agreementInformation: {
          // Core agreement data
          agreementSigned: booking.agreement_signed,
          agreementSignedAt: booking.agreement_signed_at,
          agreementSignedBy: booking.agreement_signed_by,
          agreementSignedMethod: booking.agreement_signed_method,

          // Digital signature evidence
          signerIpAddress: booking.agreement_ip_address,
          signerUserAgent: booking.agreement_user_agent,

          // Document tracking
          pdfGenerated: booking.agreement_pdf_generated,
          pdfGeneratedAt: booking.agreement_pdf_generated_at,

          // Email interaction tracking
          agreementEmailOpened: booking.agreement_email_opened,
          agreementEmailOpenedAt: booking.agreement_email_opened_at,
          agreementViewed: booking.agreement_viewed,
          agreementViewedAt: booking.agreement_viewed_at,
        },
        auditTrail: auditTrail,
        legalInformation: {
          dataExportPurpose: "Legal and administrative compliance",
          dataRetentionPolicy:
            "Data retained as per UK business records requirements",
          electronicSignatureCompliance:
            "UK Electronic Communications Act 2000 & EU eIDAS Regulation",
          privacyPolicy: "Data processed in accordance with UK GDPR",
          notes: [
            "This export contains all stored data for the specified booking",
            "Electronic signature data includes IP address and user agent for legal verification",
            "Audit trail shows complete history of booking modifications and interactions",
            "Data is exported for legal compliance and business record keeping purposes",
          ],
        },
      };

      // Return the data as JSON for download
      return NextResponse.json(
        {
          success: true,
          data: exportData,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="booking-${bookingRef}-export-${new Date().toISOString().split("T")[0]}.json"`,
          },
        },
      );
    } finally {
      if (client) {
        client.release();
        console.log("Database connection released");
      }
    }
  } catch (error: any) {
    console.error("Error exporting booking data:", error);
    return NextResponse.json(
      {
        error: "Failed to export booking data",
        details: error?.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
