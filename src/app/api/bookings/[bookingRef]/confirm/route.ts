import { NextRequest, NextResponse } from 'next/server';
import { getBookingsByStatus, updateBookingStatus, updateBookingAgreement } from '@/lib/database/bookings';
import { getCalendarService } from '@/lib/calendar/google-calendar';
//import { log } from '@/lib/utils/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingRef: string } }
) {
  try {
    const bookingRef = params.bookingRef;
    const body = await request.json();
    const { agreementSigned, agreementSignedAt } = body;

    if (!agreementSigned) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the booking by reference (search all bookings)
    const allBookings = await getBookingsByStatus();
    const booking = allBookings.find(b => b.bookingRef === bookingRef);

    console.log('Looking for booking confirmation', { bookingRef });
    console.log('Total bookings found', { count: allBookings.length });
    console.log('Booking search result', { found: booking ? 'Yes' : 'No' });
    if (booking) {
      console.log('Booking status check', { status: booking.status });
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is already confirmed or completed
    if (booking.status === 'confirmed') {
      console.log('Booking already confirmed', { bookingRef });
      // Just update the agreement details without changing status
      await updateBookingAgreement(booking.id, agreementSigned, agreementSignedAt, booking.customerName);
      
      return NextResponse.json({
        success: true,
        message: 'Hire agreement signed successfully (booking was already confirmed)',
        bookingRef,
        agreementSignedAt,
        status: 'already_confirmed'
      });
    }

    if (booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot sign agreement - booking is already completed' },
        { status: 400 }
      );
    }

    console.log('Processing booking confirmation', { bookingId: booking.id, currentStatus: booking.status });

    // Create calendar event
    const calendarService = getCalendarService();
    
    // Convert booking date to proper ISO format with times
    const bookingDate = new Date(booking.date);
    const eventStartDateTime = new Date(bookingDate);
    const eventEndDateTime = new Date(bookingDate);
    
    // Set times: 9 AM to 5 PM
    eventStartDateTime.setHours(9, 0, 0, 0);
    eventEndDateTime.setHours(17, 0, 0, 0);
    
    // Add event to Google Calendar
    const createdEvent = await calendarService.createBookingEvent({
      customerName: booking.customerName,
      contactDetails: {
        email: booking.customerEmail,
        phone: booking.customerPhone
      },
      location: booking.customerAddress,
      notes: `Booking Ref: ${booking.bookingRef}\nTotal: £${booking.totalPrice}\nDeposit: £${booking.deposit}\nPayment: ${booking.paymentMethod}\n${booking.notes || ''}`,
      duration: {
        start: eventStartDateTime.toISOString(),
        end: eventEndDateTime.toISOString()
      },
      cost: booking.totalPrice,
      paymentMethod: booking.paymentMethod as 'cash' | 'card',
      // Include agreement status - this is from customer signing the agreement
      agreementSigned: true, // Customer just signed the agreement
      agreementSignedAt: agreementSignedAt,
      status: 'confirmed', // This booking is being confirmed via customer agreement signing
      bouncyCastleType: booking.castleName
    });

    // Update the booking status to confirmed and add agreement details
    console.log('Updating booking status to confirmed', { bookingId: booking.id });
    await updateBookingStatus(booking.id, 'confirmed');
    await updateBookingAgreement(booking.id, agreementSigned, agreementSignedAt, booking.customerName);
    console.log('Booking status updated successfully', { bookingId: booking.id });

    return NextResponse.json({
      success: true,
      message: 'Hire agreement signed successfully and added to calendar',
      bookingRef,
      agreementSignedAt,
      calendarEventId: createdEvent
    });

  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 