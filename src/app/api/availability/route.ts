import { NextRequest, NextResponse } from 'next/server';

// Mock database - in real app, this would be replaced with actual database operations
interface BookingEvent {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  castle: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  isUnavailable?: boolean;
  maintenanceNote?: string;
}

// Mock booking data - this would come from database in real app
const mockBookings: BookingEvent[] = [
  {
    id: '1',
    date: '2024-01-25',
    startTime: '10:00',
    endTime: '16:00',
    castle: 'Princess Castle',
    status: 'confirmed'
  },
  {
    id: '2',
    date: '2024-01-26',
    startTime: '09:00',
    endTime: '17:00',
    castle: 'Superhero Obstacle Course',
    status: 'pending'
  },
  {
    id: '3',
    date: '2024-01-28',
    startTime: '11:00',
    endTime: '15:00',
    castle: 'Jungle Adventure',
    status: 'confirmed'
  },
  {
    id: '4',
    date: '2024-01-30',
    startTime: '12:00',
    endTime: '18:00',
    castle: 'Medieval Castle',
    status: 'cancelled'
  }
];

// Mock unavailable dates - this would come from admin settings
const unavailableDates = [
  {
    date: '2024-01-27',
    reason: 'Equipment maintenance',
    isUnavailable: true
  },
  {
    date: '2024-01-31',
    reason: 'Weather forecast - high winds',
    isUnavailable: true
  }
];

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

// Available bouncy castles
const availableCastles = [
  'Princess Castle',
  'Superhero Obstacle Course',
  'Jungle Adventure',
  'Medieval Castle',
  'Space Adventure',
  'Pirate Ship'
];

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
      const availability = getAvailabilityForDate(date, castle);
      return NextResponse.json(availability);
    }

    // Date range query
    if (startDate && endDate) {
      const availability = getAvailabilityForRange(startDate, endDate, castle, format);
      return NextResponse.json(availability);
    }

    // Default: return next 30 days
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    const availability = getAvailabilityForRange(
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

function getAvailabilityForDate(date: string, castleFilter?: string | null): AvailabilityResponse {
  // Check if date is unavailable due to maintenance/weather
  const unavailable = unavailableDates.find(u => u.date === date);
  if (unavailable) {
    return {
      date,
      available: false,
      reason: unavailable.reason,
      availableCastles: [],
      bookedCastles: [],
      timeSlots: []
    };
  }

  // Get bookings for this date (excluding cancelled)
  const dayBookings = mockBookings.filter(
    booking => booking.date === date && booking.status !== 'cancelled'
  );

  // Filter by castle if specified
  const filteredCastles = castleFilter 
    ? availableCastles.filter(c => c === castleFilter)
    : availableCastles;

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
}

function getAvailabilityForRange(
  startDate: string,
  endDate: string,
  castleFilter?: string | null,
  format: string = 'summary'
): DayAvailability[] | AvailabilityResponse[] {
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
      const availability = getAvailabilityForDate(dateStr, castleFilter);
      result.push(availability);
    }
    return result;
  } else {
    const result: DayAvailability[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Summary format
      const availability = getAvailabilityForDate(dateStr, castleFilter);
      const unavailable = unavailableDates.find(u => u.date === dateStr);
      
      let status: DayAvailability['status'] = 'available';
      let reason: string | undefined;

      if (unavailable) {
        status = unavailable.reason.toLowerCase().includes('maintenance') ? 'maintenance' : 'unavailable';
        reason = unavailable.reason;
      } else if (availability.availableCastles.length === 0) {
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

    // Check if date is unavailable
    const unavailable = unavailableDates.find(u => u.date === date);
    if (unavailable) {
      return NextResponse.json({
        available: false,
        reason: unavailable.reason,
        type: 'unavailable'
      });
    }

    // Check for conflicting bookings
    const conflicts = mockBookings.filter(booking => {
      if (booking.date !== date || booking.status === 'cancelled') {
        return false;
      }

      // If castle is specified, only check conflicts with same castle
      if (castle && booking.castle !== castle) {
        return false;
      }

      // Check time overlap
      return (
        (startTime >= booking.startTime && startTime < booking.endTime) ||
        (endTime > booking.startTime && endTime <= booking.endTime) ||
        (startTime <= booking.startTime && endTime >= booking.endTime)
      );
    });

    if (conflicts.length > 0) {
      return NextResponse.json({
        available: false,
        reason: `Time slot conflicts with existing booking${conflicts.length > 1 ? 's' : ''}`,
        type: 'conflict',
        conflicts: conflicts.map(c => ({
          castle: c.castle,
          startTime: c.startTime,
          endTime: c.endTime,
          status: c.status
        }))
      });
    }

    // Check castle availability if specified
    if (castle) {
      const castleBookedOnDate = mockBookings.some(booking =>
        booking.date === date &&
        booking.castle === castle &&
        booking.status !== 'cancelled' &&
        (
          (startTime >= booking.startTime && startTime < booking.endTime) ||
          (endTime > booking.startTime && endTime <= booking.endTime) ||
          (startTime <= booking.startTime && endTime >= booking.endTime)
        )
      );

      if (castleBookedOnDate) {
        return NextResponse.json({
          available: false,
          reason: `${castle} is already booked for this time slot`,
          type: 'castle_unavailable'
        });
      }
    }

    return NextResponse.json({
      available: true,
      message: 'Time slot is available',
      availableCastles: castle 
        ? [castle]
        : availableCastles.filter(c => {
            // Filter out castles that are booked at this time
            return !mockBookings.some(booking =>
              booking.date === date &&
              booking.castle === c &&
              booking.status !== 'cancelled' &&
              (
                (startTime >= booking.startTime && startTime < booking.endTime) ||
                (endTime > booking.startTime && endTime <= booking.endTime) ||
                (startTime <= booking.startTime && endTime >= booking.endTime)
              )
            );
          })
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