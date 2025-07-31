/**
 * Send Confirmation Email API Route  
 * Sends booking confirmation email after agreement is signed
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getBookingById } from '@/lib/database/bookings';
import { sendConfirmationEmail } from '@/lib/email/email-service';

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

    // Only send confirmation for completed bookings
    if (booking.status !== 'confirmed') {
      return NextResponse.json({ 
        error: 'Booking must be confirmed before sending confirmation email' 
      }, { status: 400 });
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
      startDate: booking.createdAt.toISOString(), // Use created date as fallback
      endDate: booking.createdAt.toISOString(), // Use created date as fallback
      totalCost: booking.totalPrice,
      deposit: booking.deposit,
      notes: booking.notes
    };

    // Send confirmation email
    const emailSent = await sendConfirmationEmail(emailData);

    if (emailSent) {
      return NextResponse.json({ 
        success: true, 
        message: 'Confirmation email sent successfully',
        sentTo: booking.customerEmail
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send confirmation email - email service may be disabled or misconfigured' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}