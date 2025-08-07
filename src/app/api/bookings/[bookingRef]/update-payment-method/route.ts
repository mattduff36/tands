import { NextRequest, NextResponse } from 'next/server';
import { getBookingsByStatus, updateBookingPaymentMethod } from '@/lib/database/bookings';

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingRef: string } }
) {
  try {
    const bookingRef = params.bookingRef;
    const body = await request.json();
    const { paymentMethod } = body;

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = ['cash', 'online', 'card', 'other'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Get the booking by reference
    const pendingBookings = await getBookingsByStatus('pending');
    const booking = pendingBookings.find(b => b.bookingRef === bookingRef);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update the payment method
    await updateBookingPaymentMethod(booking.id, paymentMethod);

    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully',
      bookingRef,
      paymentMethod
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}