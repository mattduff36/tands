import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getCalendarService } from '@/lib/calendar/google-calendar';
//import { log } from '@/lib/utils/logger';

// GET /api/admin/calendar/events - Get calendar events with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const calendarService = getCalendarService();

    // Parse query parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const date = searchParams.get('date');

    let events;

    // Determine which method to use based on parameters
    if (date) {
      // Get events for a specific day
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      events = await calendarService.getEventsForDay(targetDate);
    } else if (year && month) {
      // Get events for a specific month
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
      }
      
      events = await calendarService.getEventsForMonth(yearNum, monthNum);
    } else if (startDate && endDate) {
      // Get events in a date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
      }
      
      if (start >= end) {
        return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
      }
      
      events = await calendarService.getEventsInRange(start, end);
    } else {
      // Default: Get events for current month
      const now = new Date();
      events = await calendarService.getEventsForMonth(now.getFullYear(), now.getMonth() + 1);
    }

    // Transform events for API response
    const transformedEvents = events.map(event => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: event.start,
      end: event.end,
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email,
        displayName: attendee.displayName,
        responseStatus: attendee.responseStatus
      })),
      colorId: event.colorId,
      transparency: event.transparency,
      visibility: event.visibility,
      created: event.created,
      updated: event.updated,
      status: event.status
    }));

    return NextResponse.json({
      events: transformedEvents,
      count: transformedEvents.length,
      query: {
        startDate,
        endDate,
        year,
        month,
        date
      }
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/admin/calendar/events - Create a new calendar event
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Add debugging logs
    console.log('Calendar events API called', { timestamp: new Date().toISOString(), body });
    
    // Validate required fields
    const { customerName, location, duration } = body;
    if (!customerName || !location || !duration?.start || !duration?.end) {
      return NextResponse.json({ 
        error: 'Missing required fields: customerName, location, duration.start, duration.end' 
      }, { status: 400 });
    }

    // Validate duration format
    const startDate = new Date(duration.start);
    const endDate = new Date(duration.end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format in duration' }, { status: 400 });
    }
    
    if (startDate > endDate) {
      return NextResponse.json({ error: 'Start time must be before or equal to end time' }, { status: 400 });
    }

    // Create booking data object
    const bookingData = {
      customerName,
      contactDetails: {
        email: body.contactDetails?.email,
        phone: body.contactDetails?.phone
      },
      location,
      notes: body.notes,
      duration: {
        start: duration.start,
        end: duration.end
      },
      cost: body.cost,
      paymentMethod: body.paymentMethod,
      bouncyCastleType: body.bouncyCastleType,
      // Include duration and status information for consistent display
      eventDuration: body.eventDuration || 8, // Default to 8 hours if not specified
      status: 'confirmed' // Calendar events are typically confirmed
    };

    console.log('Creating calendar booking event', { bookingData });

    const calendarService = getCalendarService();
    const eventId = await calendarService.createBookingEvent(bookingData);

    console.log('Calendar event created successfully', { eventId });

    return NextResponse.json({ 
      success: true,
      eventId,
      message: 'Booking event created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event', details: (error as Error).message },
      { status: 500 }
    );
  }
}