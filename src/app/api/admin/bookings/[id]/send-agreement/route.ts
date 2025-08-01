/**
 * Send Agreement Email API Route
 * Sends hire agreement email to customer for a specific booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getBookingById } from '@/lib/database/bookings';
import { sendAgreementEmail } from '@/lib/email/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    // Get booking details
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Prepare email data
    const emailData = {
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      castleName: booking.castleName,
      date: booking.date,
      startDate: booking.startDate ? booking.startDate.toISOString() : booking.createdAt.toISOString(),
      endDate: booking.endDate ? booking.endDate.toISOString() : booking.createdAt.toISOString(),
      eventDuration: booking.eventDuration,
      eventAddress: booking.customerAddress,
      totalCost: booking.totalPrice,
      deposit: booking.deposit,
      notes: booking.notes
    };

    // Send agreement email
    const emailSent = await sendAgreementEmail(emailData);

    if (emailSent) {
      return NextResponse.json({ 
        success: true, 
        message: 'Agreement email sent successfully',
        sentTo: booking.customerEmail
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send agreement email - email service may be disabled or misconfigured' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending agreement email:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}