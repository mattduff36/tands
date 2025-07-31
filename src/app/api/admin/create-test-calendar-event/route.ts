import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getCalendarService, BookingEventData } from '@/lib/calendar/google-calendar';
import { log } from '@/lib/utils/logger';

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

          log.info('Creating test calendar event');
    
    const calendarService = getCalendarService();
    
    // Create a test calendar event that matches our test booking
    const testBookingData: BookingEventData = {
      customerName: 'Graham baguley',
      contactDetails: {
        email: 'no@email.com',
        phone: '07966044671'
      },
      location: 'Bilsthorpe scout hut',
      notes: 'Test booking for completed events functionality',
      duration: {
        start: '2025-07-28T10:00:00.000Z', // 10:00 AM on July 28th, 2025
        end: '2025-07-28T18:00:00.000Z'   // 6:00 PM on July 28th, 2025
      },
      cost: 110,
      paymentMethod: 'cash',
      bouncyCastleType: 'Emoji'
    };

    // Create the calendar event
    const eventId = await calendarService.createBookingEvent(testBookingData);
    
          log.info('Test calendar event created successfully', { eventId });

    return NextResponse.json({
      success: true,
      message: 'Test calendar event created successfully',
      eventId,
      bookingData: testBookingData
    });

  } catch (error) {
    console.error('Error creating test calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create test calendar event', details: (error as Error).message },
      { status: 500 }
    );
  }
} 