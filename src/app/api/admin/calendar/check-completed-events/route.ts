import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getCalendarService } from '@/lib/calendar/google-calendar';
import { getBookingsByStatus, updateBookingStatus } from '@/lib/database/bookings';

export async function POST(request: NextRequest) {
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

    const calendarService = getCalendarService();
    const now = new Date();
    
    // Get all confirmed bookings from database
    const allBookings = await getBookingsByStatus();
    const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
    
    let completedCount = 0;
    let errors: string[] = [];

    console.log(`🔍 Checking ${confirmedBookings.length} confirmed bookings for completion...`);

    for (const booking of confirmedBookings) {
      try {
        // Extract booking reference from the booking
        const bookingRef = booking.bookingRef;
        
        // Find the corresponding calendar event by searching through events
        // We'll search for events in the past month to find the matching one
        const searchStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const searchEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const events = await calendarService.getEventsInRange(searchStart, searchEnd);

        // Find the event that matches this booking
        const matchingEvent = events.find(event => {
          if (!event.description) return false;
          // Look for the booking reference in the description
          return event.description.includes(bookingRef);
        });

        if (matchingEvent) {
          // Check if the event has ended
          const eventEnd = new Date(matchingEvent.end?.dateTime || matchingEvent.end?.date || '');
          
          if (eventEnd < now) {
            // Event has ended, mark booking as completed
            await updateBookingStatus(booking.id, 'completed');
            console.log(`✅ Marked booking ${bookingRef} as completed (event ended at ${eventEnd.toISOString()})`);
            completedCount++;
          }
        } else {
          console.log(`⚠️ No calendar event found for booking ${bookingRef}`);
        }

      } catch (error) {
        const errorMsg = `Error processing booking ${booking.bookingRef}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    const message = `Completed events check finished: ${completedCount} bookings marked as completed`;
    if (errors.length > 0) {
      console.log('⚠️ Some errors occurred:', errors);
    }

    return NextResponse.json({
      success: true,
      message,
      completedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error checking completed events:', error);
    return NextResponse.json(
      { error: 'Failed to check completed events', details: (error as Error).message },
      { status: 500 }
    );
  }
} 