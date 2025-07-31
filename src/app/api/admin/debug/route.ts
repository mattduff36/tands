import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getBookingsByStatus } from '@/lib/database/bookings';
import { getPool } from '@/lib/database/connection';

export const dynamic = 'force-dynamic';

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

    const client = await getPool().connect();

    try {
      // Get all bookings with essential data
      const bookingsResult = await client.query(`
        SELECT id, booking_ref, customer_name, customer_email, status, 
               date, total_price, castle_id, castle_name, created_at, updated_at,
               agreement_signed, email_sent
        FROM bookings 
        ORDER BY created_at DESC
      `);

      // Get all castles with essential data
      const castlesResult = await client.query(`
        SELECT id, name, theme, size, price, description, image_url,
               maintenance_status, maintenance_notes
        FROM castles 
        ORDER BY id ASC
      `);

      // Get database schema information
      const schemaResult = await client.query(`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('bookings', 'castles')
        ORDER BY table_name, ordinal_position
      `);

      return NextResponse.json({
        success: true,
        data: {
          bookings: bookingsResult.rows,
          castles: castlesResult.rows,
          schema: schemaResult.rows,
          timestamp: new Date().toISOString()
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching debug data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
} 