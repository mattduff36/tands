import { NextRequest, NextResponse } from 'next/server';
import { bookingSchema, validateAndSanitize } from '@/lib/validation/schemas';
import { createPendingBooking } from '@/lib/database/bookings';
import { getCastleById } from '@/lib/database/castles';
import { sendAgreementEmail } from '@/lib/email/email-service';

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
    const booking = await createPendingBooking({
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      customerPhone: validatedData.customerPhone || '',
      customerAddress: validatedData.eventAddress,
      castleId: validatedData.castleId,
      castleName: castle.name,
      date: new Date(validatedData.eventDate).toISOString().split('T')[0],
      paymentMethod: 'pending',
      totalPrice: validatedData.totalPrice,
      deposit: Math.floor(validatedData.totalPrice * 0.3), // 30% deposit
      notes: validatedData.specialRequests,
    });

    // Send agreement email
    try {
      await sendAgreementEmail({
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        castleName: booking.castleName,
        date: booking.date,
        startDate: validatedData.eventDate,
        endDate: new Date(new Date(validatedData.eventDate).getTime() + (validatedData.eventDuration * 60 * 60 * 1000)).toISOString(),
        totalCost: booking.totalPrice,
        deposit: booking.deposit,
        notes: booking.notes,
      });
    } catch (emailError) {
      console.error('Failed to send agreement email:', emailError);
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