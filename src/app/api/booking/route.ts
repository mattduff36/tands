import { NextRequest, NextResponse } from 'next/server';
import { bookingSchema, validateAndSanitize } from '@/lib/validation/schemas';
import { createBooking } from '@/lib/database/bookings';
import { getCastleById } from '@/lib/database/castles';
import { sendBookingConfirmationEmail } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate and sanitize input data
    let validatedData;
    try {
      validatedData = validateAndSanitize(bookingSchema, body);
    } catch (error) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid booking data', 
        details: error instanceof Error ? error.message : 'Validation failed' 
      }, { status: 400 });
    }

    // Verify castle exists
    const castle = await getCastleById(validatedData.castleId);
    if (!castle) {
      return NextResponse.json({ 
        success: false,
        error: 'Castle not found' 
      }, { status: 404 });
    }

    // Validate event date is in the future
    const eventDate = new Date(validatedData.eventDate);
    const now = new Date();
    if (eventDate <= now) {
      return NextResponse.json({ 
        success: false,
        error: 'Event date must be in the future' 
      }, { status: 400 });
    }

    // Create booking in database
    const booking = await createBooking({
      ...validatedData,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Send confirmation email
    try {
      await sendBookingConfirmationEmail(booking, castle);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      bookingId: booking.id,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}