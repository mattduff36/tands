import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getBookingsByStatus } from '@/lib/database/bookings';
import { getCalendarService } from '@/lib/calendar/google-calendar';

// GET /api/admin/bookings - Fetch all bookings (pending from DB, confirmed from calendar)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const bookings = [];

    // 1. Get pending bookings from database
    if (!status || status === 'pending') {
      const pendingBookings = await getBookingsByStatus('pending');
      const dbBookings = pendingBookings.map(booking => ({
        id: booking.id,
        bookingRef: booking.bookingRef,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        customerAddress: booking.customerAddress,
        castleId: booking.castleId,
        castleName: booking.castleName,
        date: booking.date,
        paymentMethod: booking.paymentMethod,
        totalPrice: booking.totalPrice,
        deposit: booking.deposit,
        status: booking.status,
        notes: booking.notes,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        source: 'database'
      }));
      bookings.push(...dbBookings);
    }

    // 2. Get confirmed bookings from Google Calendar
    if (!status || status === 'confirmed') {
      try {
        const calendarService = getCalendarService();
        
        // Get events for the next 12 months (to catch all confirmed bookings)
        const now = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 12);
        
        const calendarEvents = await calendarService.getEventsInRange(now, endDate);
        
        // Filter and transform calendar events that represent confirmed bookings
        const confirmedBookings = calendarEvents
          .filter(event => {
            // Include events that look like booking events
            return event.description && 
                   event.summary && 
                   (event.description.includes('🏰 Bouncy Castle Booking') || 
                    event.description.includes('Booking Ref:')) &&
                   (event.summary.includes(' - ') || event.summary.includes('🏰'));
          })
          .map(event => {
            // Parse booking information from event description
            const description = event.description || '';
            const summary = event.summary || '';
            
            // Handle both calendar tab format and database confirmation format
            let customerName = 'Unknown';
            let castleName = 'Unknown';
            let bookingRef = 'N/A';
            let email = '';
            let phone = '';
            let totalPrice = 0;
            let deposit = 0;
            let paymentMethod = 'Unknown';
            let notes = '';
            
            // Check if this is a calendar tab format (🏰 Bouncy Castle Booking)
            if (description.includes('🏰 Bouncy Castle Booking')) {
              // Parse calendar tab format
              const customerMatch = description.match(/Customer: ([^\n]+)/);
              const emailMatch = description.match(/Email: ([^\n]+)/);
              const phoneMatch = description.match(/Phone: ([^\n]+)/);
              const castleTypeMatch = description.match(/Castle Type: ([^\n]+)/);
              const costMatch = description.match(/Cost: £([^\n]+)/);
              const paymentMatch = description.match(/Payment: ([^\n]+)/);
              const notesMatch = description.match(/Notes: ([^\n]+)/);
              
              customerName = customerMatch?.[1] || 'Unknown';
              email = emailMatch?.[1] || '';
              phone = phoneMatch?.[1] || '';
              castleName = castleTypeMatch?.[1] || 'Bouncy Castle';
              totalPrice = parseInt(costMatch?.[1] || '0');
              paymentMethod = paymentMatch?.[1] || 'Unknown';
              notes = notesMatch?.[1] || '';
              
              // Generate a booking ref for calendar events
              bookingRef = `CAL-${event.id?.slice(-8) || 'UNKNOWN'}`;
            } else {
              // Parse database confirmation format
              const bookingRefMatch = description.match(/Booking Ref: ([^\n]+)/);
              const castleMatch = description.match(/Castle: ([^\n]+)/);
              const customerMatch = description.match(/Customer: ([^\n]+)/);
              const phoneMatch = description.match(/Phone: ([^\n]+)/);
              const emailMatch = description.match(/Email: ([^\n]+)/);
              const totalMatch = description.match(/Total: £([^\n]+)/);
              const depositMatch = description.match(/Deposit: £([^\n]+)/);
              const paymentMatch = description.match(/Payment: ([^\n]+)/);
              const notesMatch = description.match(/Notes: ([^\n]+)/);
              
              bookingRef = bookingRefMatch?.[1] || 'N/A';
              customerName = customerMatch?.[1] || 'Unknown';
              castleName = castleMatch?.[1] || 'Unknown';
              email = emailMatch?.[1] || '';
              phone = phoneMatch?.[1] || '';
              totalPrice = parseInt(totalMatch?.[1] || '0');
              deposit = parseInt(depositMatch?.[1] || '0');
              paymentMethod = paymentMatch?.[1] || 'Unknown';
              notes = notesMatch?.[1] || '';
            }
            
            // Extract customer name from summary if not found in description
            if (customerName === 'Unknown') {
              if (summary.includes('🏰')) {
                // Calendar tab format: "🏰 Customer Name - Castle Type"
                const summaryParts = summary.replace('🏰 ', '').split(' - ');
                customerName = summaryParts[0] || 'Unknown';
                castleName = summaryParts[1] || 'Bouncy Castle';
              } else if (summary.includes(' - ')) {
                // Database confirmation format: "Customer Name - Castle Name"
                const summaryParts = summary.split(' - ');
                customerName = summaryParts[0] || 'Unknown';
                castleName = summaryParts[1] || 'Unknown';
              }
            }
            
            // Parse date from event start time
            const startDate = event.start?.dateTime || event.start?.date;
            const date = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
            
            return {
              id: `cal-${event.id}`, // Prefix to distinguish from DB IDs
              bookingRef: bookingRef,
              customerName: customerName,
              customerEmail: email,
              customerPhone: phone,
              customerAddress: event.location || '',
              castleId: 0, // Calendar events don't have castle IDs
              castleName: castleName,
              date: date,
              paymentMethod: paymentMethod,
              totalPrice: totalPrice,
              deposit: deposit,
              status: 'confirmed',
              notes: notes,
              createdAt: event.created ? new Date(event.created) : new Date(),
              updatedAt: event.updated ? new Date(event.updated) : new Date(),
              source: 'calendar',
              calendarEventId: event.id
            };
          });
        
        bookings.push(...confirmedBookings);
      } catch (calendarError) {
        console.error('Error fetching calendar events:', calendarError);
        // Don't fail the entire request if calendar fails, just log the error
      }
    }

    // Sort bookings by date (most recent first)
    bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ 
      bookings,
      summary: {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        fromDatabase: bookings.filter(b => b.source === 'database').length,
        fromCalendar: bookings.filter(b => b.source === 'calendar').length
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}