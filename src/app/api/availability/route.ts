import { NextRequest, NextResponse } from 'next/server';

import { getCastles } from '@/lib/database/castles';

// Interface for calendar events from Google Calendar API
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  status?: string;
}

// Simple booking interface for availability checking (simplified from complex validation)
interface ExistingBooking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  castle: string;
  status: string;
}

interface AvailabilityResponse {
  date: string;
  available: boolean;
  reason?: string;
  availableCastles: string[];
  bookedCastles: string[];
  timeSlots: {
    startTime: string;
    endTime: string;
    available: boolean;
    castle?: string;
  }[];
}

interface DayAvailability {
  date: string;
  status: 'available' | 'partially_booked' | 'fully_booked' | 'unavailable' | 'maintenance';
  availableSlots: number;
  totalSlots: number;
  reason?: string;
}

// Convert CalendarEvent to ExistingBooking for validation
const convertToExistingBooking = (event: CalendarEvent): ExistingBooking => {
  // Extract castle name from description or summary
  const castleName = extractCastleFromEvent(event);
  
  // Extract date and time from event
  const startDate = event.start.dateTime || event.start.date;
  const endDate = event.end.dateTime || event.end.date;
  
  let date, startTime, endTime;
  
  if (startDate?.includes('T')) {
    // DateTime format
    date = startDate.split('T')[0];
    startTime = startDate.split('T')[1].substring(0, 5);
    endTime = endDate?.split('T')[1].substring(0, 5) || '18:00';
  } else {
    // All-day event format
    date = startDate || '';
    startTime = '09:00';
    endTime = '18:00';
  }

  return {
    id: event.id,
    date,
    startTime,
    endTime,
    castle: castleName,
    status: 'confirmed' // Assume confirmed for calendar events
  };
};

// Extract castle name from event description or summary
const extractCastleFromEvent = (event: CalendarEvent): string => {
  const description = event.description || '';
  const summary = event.summary || '';
  
  // Look for "Castle: " pattern in description
  const castleMatch = description.match(/Castle:\s*([^(\n]+)/);
  if (castleMatch) {
    return castleMatch[1].trim();
  }
  
  // Fallback to summary if no castle found in description
  return summary;
};

// Fetch calendar events directly from Google Calendar API (bypassing admin auth)
async function fetchCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  try {
    // Import Google Calendar service directly
    const { getCalendarService } = await import('@/lib/calendar/google-calendar');
    const calendarService = getCalendarService();
    
    // Convert string dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Fetch events directly from Google Calendar
    const googleEvents = await calendarService.getEventsInRange(start, end);
    
    // Convert Google Calendar events to our CalendarEvent interface
    const events: CalendarEvent[] = (googleEvents || []).map(event => ({
      id: event.id || '',
      summary: event.summary || '',
      description: event.description || '',
      location: event.location || '',
      start: {
        dateTime: event.start?.dateTime || undefined,
        date: event.start?.date || undefined
      },
      end: {
        dateTime: event.end?.dateTime || undefined,
        date: event.end?.date || undefined
      },
      status: event.status || 'confirmed'
    }));
    
    return events;
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return []; // Return empty array on error instead of throwing
  }
}

/**
 * GET /api/availability - Get availability for dates
 * Query parameters:
 * - date: specific date (YYYY-MM-DD)
 * - start: start date for range (YYYY-MM-DD)  
 * - end: end date for range (YYYY-MM-DD)
 * - castle: filter by specific castle
 * - format: 'summary' | 'detailed' (default: 'summary')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const castle = searchParams.get('castle');
    const format = searchParams.get('format') || 'summary';

    // Single date query
    if (date) {
      const availability = await getAvailabilityForDate(date, castle);
      return NextResponse.json(availability);
    }

    // Date range query
    if (startDate && endDate) {
      const availability = await getAvailabilityForRange(startDate, endDate, castle, format);
      return NextResponse.json(availability);
    }

    // Default: return next 30 days
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    const availability = await getAvailabilityForRange(
      today.toISOString().split('T')[0],
      thirtyDaysLater.toISOString().split('T')[0],
      castle,
      format
    );

    return NextResponse.json({
      range: {
        start: today.toISOString().split('T')[0],
        end: thirtyDaysLater.toISOString().split('T')[0]
      },
      availability
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch availability',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getAvailabilityForDate(date: string, castleFilter?: string | null): Promise<AvailabilityResponse> {
  try {
    // Fetch calendar events for the date
    const events = await fetchCalendarEvents(date, date);
    
    // Convert to ExistingBookings format
    const existingBookings = events.map(convertToExistingBooking);
    
    // Get available castles from database
    const allCastles = await getCastles();
    const availableCastles = allCastles.map(c => c.name);
    
    // Filter by castle if specified
    const filteredCastles = castleFilter 
      ? availableCastles.filter(c => c === castleFilter)
      : availableCastles;

    // Get bookings for this specific date
    const dayBookings = existingBookings.filter(booking => booking.date === date);
    const bookedCastles = dayBookings.map(b => b.castle);
    const availableCastlesForDay = filteredCastles.filter(c => !bookedCastles.includes(c));

    // Generate time slots (simplified - 4 hour slots from 9 AM to 6 PM)
    const timeSlots = [];
    const slots = [
      { start: '09:00', end: '13:00' },
      { start: '10:00', end: '14:00' },
      { start: '11:00', end: '15:00' },
      { start: '12:00', end: '16:00' },
      { start: '13:00', end: '17:00' },
      { start: '14:00', end: '18:00' }
    ];

    for (const slot of slots) {
      // Check if any booking conflicts with this time slot
      const conflictingBooking = dayBookings.find(booking => {
        const bookingStart = booking.startTime;
        const bookingEnd = booking.endTime;
        
        // Check if time ranges overlap
        return (
          (slot.start >= bookingStart && slot.start < bookingEnd) ||
          (slot.end > bookingStart && slot.end <= bookingEnd) ||
          (slot.start <= bookingStart && slot.end >= bookingEnd)
        );
      });

      timeSlots.push({
        startTime: slot.start,
        endTime: slot.end,
        available: !conflictingBooking && availableCastlesForDay.length > 0,
        castle: conflictingBooking?.castle
      });
    }

    return {
      date,
      available: availableCastlesForDay.length > 0 && timeSlots.some(slot => slot.available),
      availableCastles: availableCastlesForDay,
      bookedCastles: bookedCastles,
      timeSlots
    };
  } catch (error) {
    console.error(`Error getting availability for date ${date}:`, error);
    return {
      date,
      available: false,
      reason: 'Error checking availability',
      availableCastles: [],
      bookedCastles: [],
      timeSlots: []
    };
  }
}

async function getAvailabilityForRange(
  startDate: string,
  endDate: string,
  castleFilter?: string | null,
  format: string = 'summary'
): Promise<DayAvailability[] | AvailabilityResponse[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Limit range to prevent abuse
  const dayDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (dayDifference > 365) {
    throw new Error('Date range cannot exceed 365 days');
  }

  if (format === 'detailed') {
    const result: AvailabilityResponse[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const availability = await getAvailabilityForDate(dateStr, castleFilter);
      result.push(availability);
    }
    return result;
  } else {
    const result: DayAvailability[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Summary format
      const availability = await getAvailabilityForDate(dateStr, castleFilter);
      
      let status: DayAvailability['status'] = 'available';
      let reason: string | undefined;

      if (availability.availableCastles.length === 0) {
        status = 'fully_booked';
      } else if (availability.bookedCastles.length > 0) {
        status = 'partially_booked';
      }

      const totalSlots = availability.timeSlots.length;
      const availableSlots = availability.timeSlots.filter(slot => slot.available).length;

      result.push({
        date: dateStr,
        status,
        availableSlots,
        totalSlots,
        reason
      });
    }
    return result;
  }
}

/**
 * POST /api/availability/check - Check availability for specific booking request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, startTime, endTime, castle } = body;

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: date, startTime, endTime' },
        { status: 400 }
      );
    }

    // Fetch calendar events for the date
    const events = await fetchCalendarEvents(date, date);
    const existingBookings = events.map(convertToExistingBooking);
    
    // Get available castles from database
    const allCastles = await getCastles();
    const availableCastles = allCastles.map(c => c.name);



    // Create validation data for the requested booking
    const validationData = {
      customerName: 'Temp Customer',
      customerEmail: 'temp@example.com',
      customerPhone: '0000000000',
      date,
      startTime,
      endTime,
      castle: castle || 'Any Castle',
      location: 'TBD',
      address: 'TBD',
      totalPrice: 100,
      deposit: 30,
      status: 'pending' as const,
      notes: ''
    };

    // Simplified duplicate prevention: check if castle is already booked on this date
    const conflictingBooking = existingBookings.find(booking => 
      booking.castle === (castle?.name || '') && 
      booking.date === date && 
      booking.status !== 'expired'
    );

    if (conflictingBooking) {
      return NextResponse.json({
        available: false,
        reason: `${castle?.name || 'This castle'} is already booked on ${date}`,
        type: 'conflict',
        conflicts: [{
          castle: castle?.name || 'Unknown',
          date: conflictingBooking.date,
          customerName: 'Existing Customer',
          status: conflictingBooking.status
        }]
      });
    }

    // Get available castles for this time slot
    const availableCastlesForSlot = castle 
      ? [castle]
      : availableCastles.filter(castleName => {
          // Check if this castle is available at the requested time
          const castleBookings = existingBookings.filter(booking => 
            booking.castle === castleName && booking.date === date
          );
          
          return !castleBookings.some(booking => {
            return (
              (startTime >= booking.startTime && startTime < booking.endTime) ||
              (endTime > booking.startTime && endTime <= booking.endTime) ||
              (startTime <= booking.startTime && endTime >= booking.endTime)
            );
          });
        });

    return NextResponse.json({
      available: availableCastlesForSlot.length > 0,
      message: availableCastlesForSlot.length > 0 
        ? 'Time slot is available' 
        : 'No castles available for this time slot',
      availableCastles: availableCastlesForSlot
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check availability',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}