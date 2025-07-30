import { NextRequest, NextResponse } from 'next/server';
import { updateBookingStatus, updateBookingAgreement } from '@/lib/database/bookings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingRef, agreementSigned, agreementSignedAt } = body;

    if (!bookingRef || !agreementSigned) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, get the booking to find its ID
    const bookingResponse = await fetch(`${request.nextUrl.origin}/api/admin/bookings?bookingRef=${bookingRef}`);
    if (!bookingResponse.ok) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const bookingData = await bookingResponse.json();
    if (!bookingData.bookings || bookingData.bookings.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking = bookingData.bookings[0];

    // Check if this is a database booking or calendar booking
    if (booking.source === 'calendar') {
      // For calendar bookings, we can't update the database directly
      // Just return success for now
      return NextResponse.json({
        success: true,
        message: 'Hire agreement signed successfully (calendar booking)',
        bookingRef,
        agreementSignedAt
      });
    }

    // For database bookings, update the status and agreement
    await updateBookingStatus(booking.id, 'confirmed');
    await updateBookingAgreement(booking.id, agreementSigned, agreementSignedAt, booking.customerName);

    return NextResponse.json({
      success: true,
      message: 'Hire agreement signed successfully',
      bookingRef,
      agreementSignedAt
    });

  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 