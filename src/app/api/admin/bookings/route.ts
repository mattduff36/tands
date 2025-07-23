import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { BookingValidator, BookingSchema, type BookingData, type ExistingBooking } from '@/lib/validation/booking-validation';

// Mock database - in real app, this would be replaced with actual database operations
let mockBookings: ExistingBooking[] = [
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
  }
];

interface FullBooking extends ExistingBooking {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  location: string;
  address: string;
  totalPrice: number;
  deposit: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

let mockFullBookings: FullBooking[] = [
  {
    id: '1',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.johnson@email.com',
    customerPhone: '+44 7123 456789',
    date: '2024-01-25',
    startTime: '10:00',
    endTime: '16:00',
    castle: 'Princess Castle',
    location: 'Hyde Park',
    address: 'Hyde Park, London W2 2UH',
    totalPrice: 250,
    deposit: 50,
    status: 'confirmed',
    notes: 'Birthday party for 6-year-old. Need setup by 9:30 AM.',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z'
  },
  {
    id: '2',
    customerName: 'Mike Williams',
    customerEmail: 'mike.williams@email.com',
    customerPhone: '+44 7234 567890',
    date: '2024-01-26',
    startTime: '09:00',
    endTime: '17:00',
    castle: 'Superhero Obstacle Course',
    location: 'Regent\'s Park',
    address: 'Regent\'s Park, London NW1 4NU',
    totalPrice: 350,
    deposit: 70,
    status: 'pending',
    notes: 'Corporate team building event.',
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T14:30:00Z'
  }
];

/**
 * GET /api/admin/bookings - Get all bookings with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const castle = searchParams.get('castle');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filteredBookings = [...mockFullBookings];

    // Apply filters
    if (date) {
      filteredBookings = filteredBookings.filter(booking => booking.date === date);
    }

    if (status) {
      filteredBookings = filteredBookings.filter(booking => booking.status === status);
    }

    if (castle) {
      filteredBookings = filteredBookings.filter(booking => booking.castle === castle);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredBookings = filteredBookings.filter(booking =>
        booking.customerName.toLowerCase().includes(searchLower) ||
        booking.customerEmail.toLowerCase().includes(searchLower) ||
        booking.castle.toLowerCase().includes(searchLower) ||
        booking.location.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date and start time
    filteredBookings.sort((a, b) => {
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      return a.startTime.localeCompare(b.startTime);
    });

    // Apply pagination
    const paginatedBookings = filteredBookings.slice(offset, offset + limit);

    return NextResponse.json({
      bookings: paginatedBookings,
      total: filteredBookings.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/bookings - Create a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingData = await request.json();

    // Validate booking data
    const validator = new BookingValidator(mockBookings);
    const validationResult = validator.validateBooking(bookingData);

    if (!validationResult.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        validation: validationResult
      }, { status: 400 });
    }

    // Check for critical conflicts
    const criticalConflicts = validationResult.conflicts.filter(conflict =>
      conflict.type === 'same_castle' || conflict.type === 'time_overlap'
    );

    if (criticalConflicts.length > 0) {
      return NextResponse.json({
        error: 'Booking conflict detected',
        conflicts: criticalConflicts,
        suggestions: validator.suggestAlternativeSlots(bookingData)
      }, { status: 409 });
    }

    // Create new booking
    const newBooking: FullBooking = {
      id: Date.now().toString(),
      ...bookingData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to mock database
    mockFullBookings.push(newBooking);
    mockBookings.push({
      id: newBooking.id,
      date: newBooking.date,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      castle: newBooking.castle,
      status: newBooking.status
    });

    return NextResponse.json({
      booking: newBooking,
      validation: validationResult
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/bookings/validate - Validate booking without creating
 */
export async function POST_VALIDATE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingData = await request.json();
    const excludeId = request.nextUrl.searchParams.get('excludeId');

    // Validate booking data
    const validator = new BookingValidator(mockBookings);
    const validationResult = validator.validateBooking(bookingData, excludeId || undefined);

    return NextResponse.json({
      validation: validationResult,
      suggestions: validationResult.isValid ? [] : validator.suggestAlternativeSlots(bookingData)
    });

  } catch (error) {
    console.error('Error validating booking:', error);
    return NextResponse.json(
      { error: 'Failed to validate booking' },
      { status: 500 }
    );
  }
}