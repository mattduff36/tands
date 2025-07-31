import { NextRequest, NextResponse } from 'next/server';
import { getBookingsByStatus } from '@/lib/database/bookings';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingRef: string } }
) {
  try {
    const bookingRef = params.bookingRef;

    if (!bookingRef) {
      return NextResponse.json(
        { error: 'Booking reference is required' },
        { status: 400 }
      );
    }

    // Get all bookings and filter by booking reference
    const allBookings = await getBookingsByStatus();
    const booking = allBookings.find(b => b.bookingRef === bookingRef);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Return the booking details in the format expected by the hire agreement page
    return NextResponse.json({
      booking: {
        bookingRef: booking.bookingRef,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        customerAddress: booking.customerAddress,
        castleName: booking.castleName,
        date: booking.date,
        totalPrice: booking.totalPrice,
        deposit: booking.deposit,
        paymentMethod: booking.paymentMethod,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 