import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getBookingsByStatus } from '@/lib/database/bookings';

export const dynamic = 'force-dynamic';

// GET /api/admin/bookings - Fetch all database bookings only (no calendar events)
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
    const bookingRef = searchParams.get('bookingRef');

    // Get database bookings - either all bookings or filtered by status
    let dbBookings = await getBookingsByStatus(status || undefined);
    
    // Filter by booking reference if provided
    if (bookingRef) {
      dbBookings = dbBookings.filter(booking => booking.bookingRef === bookingRef);
    }
    
    // Transform to consistent format with source indicator
    const bookings = dbBookings.map(booking => ({
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
      // Agreement fields for admin interface
      agreementSigned: booking.agreementSigned,
      agreementSignedAt: booking.agreementSignedAt,
      agreementSignedBy: booking.agreementSignedBy,
      agreementSignedMethod: booking.agreementSignedMethod,
      source: 'database'
    }));

    // Sort bookings by created date (most recent first)
    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ 
      bookings,
      summary: {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        expired: bookings.filter(b => b.status === 'expired').length,
        fromDatabase: bookings.length, // All bookings are from database now
        fromCalendar: 0 // No calendar bookings returned
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