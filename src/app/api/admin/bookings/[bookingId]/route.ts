import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { BookingValidator, type BookingData, type ExistingBooking } from '@/lib/validation/booking-validation';

// Mock database - in real app, this would be replaced with actual database operations
// This would be imported from a shared location in a real app
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

let mockBookings: ExistingBooking[] = mockFullBookings.map(booking => ({
  id: booking.id,
  date: booking.date,
  startTime: booking.startTime,
  endTime: booking.endTime,
  castle: booking.castle,
  status: booking.status
}));

/**
 * GET /api/admin/bookings/[bookingId] - Get a specific booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.bookingId;
    const booking = mockFullBookings.find(b => b.id === bookingId);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ booking });

  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/bookings/[bookingId] - Update a specific booking
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.bookingId;
    const updateData = await request.json();

    const existingBookingIndex = mockFullBookings.findIndex(b => b.id === bookingId);
    if (existingBookingIndex === -1) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const existingBooking = mockFullBookings[existingBookingIndex];

    // Validate updated booking data
    const validator = new BookingValidator(mockBookings);
    const validationResult = validator.validateBooking(updateData, bookingId);

    if (!validationResult.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        validation: validationResult
      }, { status: 400 });
    }

    // Check for critical conflicts (excluding current booking)
    const criticalConflicts = validationResult.conflicts.filter(conflict =>
      conflict.type === 'same_castle' || conflict.type === 'time_overlap'
    );

    if (criticalConflicts.length > 0) {
      return NextResponse.json({
        error: 'Booking conflict detected',
        conflicts: criticalConflicts,
        suggestions: validator.suggestAlternativeSlots(updateData)
      }, { status: 409 });
    }

    // Update the booking
    const updatedBooking: FullBooking = {
      ...existingBooking,
      ...updateData,
      id: bookingId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    // Update in mock databases
    mockFullBookings[existingBookingIndex] = updatedBooking;
    
    const mockBookingIndex = mockBookings.findIndex(b => b.id === bookingId);
    if (mockBookingIndex !== -1) {
      mockBookings[mockBookingIndex] = {
        id: updatedBooking.id,
        date: updatedBooking.date,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        castle: updatedBooking.castle,
        status: updatedBooking.status
      };
    }

    return NextResponse.json({
      booking: updatedBooking,
      validation: validationResult
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bookings/[bookingId] - Delete a specific booking
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.bookingId;
    const bookingIndex = mockFullBookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const deletedBooking = mockFullBookings[bookingIndex];

    // Remove from mock databases
    mockFullBookings.splice(bookingIndex, 1);
    
    const mockBookingIndex = mockBookings.findIndex(b => b.id === bookingId);
    if (mockBookingIndex !== -1) {
      mockBookings.splice(mockBookingIndex, 1);
    }

    return NextResponse.json({
      message: 'Booking deleted successfully',
      booking: deletedBooking
    });

  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bookings/[bookingId] - Update booking status only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.bookingId;
    const { status } = await request.json();

    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, confirmed, cancelled, completed' },
        { status: 400 }
      );
    }

    const bookingIndex = mockFullBookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update status
    mockFullBookings[bookingIndex].status = status as any;
    mockFullBookings[bookingIndex].updatedAt = new Date().toISOString();

    // Update in mock bookings array too
    const mockBookingIndex = mockBookings.findIndex(b => b.id === bookingId);
    if (mockBookingIndex !== -1) {
      mockBookings[mockBookingIndex].status = status as any;
    }

    return NextResponse.json({
      booking: mockFullBookings[bookingIndex],
      message: `Booking status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}