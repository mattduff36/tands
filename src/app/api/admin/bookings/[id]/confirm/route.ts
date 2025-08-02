import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { updateBookingStatus, getBookingsByStatus } from '@/lib/database/bookings';
import { getCalendarService } from '@/lib/calendar/google-calendar';

// POST /api/admin/bookings/[id]/confirm - Confirm a pending booking and add to calendar
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

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    // Get the booking details
    const allBookings = await getBookingsByStatus();
    const booking = allBookings.find(b => b.id === bookingId);
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'confirmed') {
      return NextResponse.json({ error: 'Booking is already confirmed' }, { status: 400 });
    }

    // Create calendar event
    const calendarService = getCalendarService();
    
    // Convert booking date to proper ISO format with times
    const bookingDate = new Date(booking.date);
    const eventStartDateTime = new Date(bookingDate);
    const eventEndDateTime = new Date(bookingDate);
    
    // Set times: 9 AM to 5 PM
    eventStartDateTime.setHours(9, 0, 0, 0);
    eventEndDateTime.setHours(17, 0, 0, 0);
    
    const calendarEvent = {
      summary: `🏰 ${booking.customerName} - ${booking.castleName}`,
      description: `Booking Ref: ${booking.bookingRef}\n` +
                  `Castle: ${booking.castleName}\n` +
                  `Customer: ${booking.customerName}\n` +
                  `Phone: ${booking.customerPhone}\n` +
                  `Email: ${booking.customerEmail}\n` +
                  `Total: £${booking.totalPrice}\n` +
                  `Deposit: £${booking.deposit}\n` +
                  `Payment: ${booking.paymentMethod}\n` +
                  `Notes: ${booking.notes || 'None'}`,
      location: booking.customerAddress,
      start: {
        dateTime: eventStartDateTime.toISOString(),
        timeZone: 'Europe/London'
      },
      end: {
        dateTime: eventEndDateTime.toISOString(),
        timeZone: 'Europe/London'
      }
    };

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
      // Include agreement status
      agreementSigned: booking.agreementSigned || false,
      agreementSignedAt: booking.agreementSignedAt,
      status: 'confirmed', // This booking is being confirmed
      bouncyCastleType: booking.castleName
    });

    // Update booking status to confirmed
    await updateBookingStatus(bookingId, 'confirmed');

    return NextResponse.json({ 
      success: true, 
      message: 'Booking confirmed and added to calendar',
      calendarEventId: createdEvent
    });

  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { error: 'Failed to confirm booking' },
      { status: 500 }
    );
  }
} 