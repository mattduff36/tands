import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";
import { getPool } from "@/lib/database/connection";

export const dynamic = "force-dynamic";

// POST /api/admin/bookings/[id]/update-payment - Update payment status with admin audit
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { paymentStatus, adminComment } = body;

    // Validate payment status
    const validStatuses = ["pending", "deposit_paid", "paid_full"];
    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        {
          error:
            "Invalid payment status. Must be: pending, deposit_paid, or paid_full",
        },
        { status: 400 },
      );
    }

    // Validate admin comment is provided
    if (!adminComment || !adminComment.trim()) {
      return NextResponse.json(
        { error: "Admin comment is required" },
        { status: 400 },
      );
    }

    const client = await getPool().connect();
    try {
      // First, get the current booking details for audit trail
      const currentBooking = await client.query(
        "SELECT * FROM bookings WHERE id = $1",
        [bookingId],
      );

      if (currentBooking.rows.length === 0) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 },
        );
      }

      const booking = currentBooking.rows[0];

      // Create audit trail entry
      const auditEntry = {
        timestamp: new Date(),
        action: "payment_status_update",
        actor: "admin",
        actorDetails: session.user?.username,
        method: "manual_admin_update",
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: {
          bookingRef: booking.booking_ref,
          previousPaymentStatus: booking.payment_status,
          newPaymentStatus: paymentStatus,
          adminComment: adminComment.trim(),
          timestamp: new Date().toISOString(),
        },
      };

      // Update the booking with new payment status and audit trail
      const currentAuditTrail = booking.audit_trail || [];
      const updatedAuditTrail = [...currentAuditTrail, auditEntry];

      await client.query(
        `UPDATE bookings SET 
          payment_status = $1,
          payment_date = $2,
          admin_payment_comment = $3,
          audit_trail = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5`,
        [
          paymentStatus,
          paymentStatus === "deposit_paid" || paymentStatus === "paid_full"
            ? new Date()
            : null,
          adminComment.trim(),
          JSON.stringify(updatedAuditTrail),
          bookingId,
        ],
      );

      console.log(`✅ Admin payment status update:`, {
        bookingId,
        bookingRef: booking.booking_ref,
        adminEmail: session.user?.username,
        previousStatus: booking.payment_status,
        newStatus: paymentStatus,
        adminComment: adminComment.trim(),
      });

      return NextResponse.json({
        success: true,
        message: "Payment status updated successfully",
        booking: {
          id: bookingId,
          paymentStatus,
          updatedAt: new Date().toISOString(),
        },
        auditEntry,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
