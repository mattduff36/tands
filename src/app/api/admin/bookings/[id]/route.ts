import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { updateBookingStatus, deleteBooking, updateBooking, getBookingById, addAuditTrailEntry } from '@/lib/database/bookings';
import { sendCancellationEmail } from '@/lib/email/email-service';

// PUT /api/admin/bookings/[id] - Update booking status or details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    const updateData = await request.json();

    // If just updating status
    if (updateData.status && Object.keys(updateData).length === 1) {
      await updateBookingStatus(bookingId, updateData.status);
      return NextResponse.json({ success: true, message: 'Booking status updated' });
    }

    // Otherwise update full booking details
    await updateBooking(bookingId, updateData);
    return NextResponse.json({ success: true, message: 'Booking updated successfully' });

  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/bookings/[id] - Delete a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    // Parse optional decline reason body (DELETE with body is allowed by fetch)
    let reasonKey: 'distance_too_far' | 'castle_unavailable' | 'other' | undefined;
    let adminMessage: string | undefined;
    try {
      const body = await request.json();
      reasonKey = body?.reasonKey;
      adminMessage = body?.adminMessage;
    } catch (e) {
      // Ignore if no body
    }

    // Fetch booking for email data
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // If reason provided, send cancellation email first (best-effort)
    if (reasonKey) {
      const emailData = {
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        castleName: booking.castleName,
        date: booking.date as any,
        startDate: booking.startDate as any,
        endDate: booking.endDate as any,
        eventDuration: booking.eventDuration,
        eventAddress: booking.customerAddress,
        totalCost: booking.totalPrice,
        deposit: booking.deposit,
        notes: booking.notes || undefined,
      };
      try {
        await sendCancellationEmail(emailData as any, { reasonKey, adminMessage });
      } catch (e) {
        console.warn('Cancellation email failed but proceeding with deletion');
      }

      // Add audit trail entry
      try {
        await addAuditTrailEntry(bookingId, {
        action: 'declined',
        actor: 'admin',
        actorDetails: session.user.email,
        method: 'manual_admin_update',
        details: {
          reasonKey,
          adminMessage: adminMessage || null,
        },
        }, request.headers.get('x-forwarded-for') || undefined, request.headers.get('user-agent') || undefined);
      } catch (e) {
        console.warn('Failed to write audit log for decline');
      }
    }

    await deleteBooking(bookingId);
    return NextResponse.json({ success: true, message: 'Booking deleted successfully' });

  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
} 