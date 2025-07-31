import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';

export const dynamic = 'force-dynamic';

// DEBUG endpoint to test what's causing the 500 error
export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG BOOKINGS API START ===');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Session check passed:', !!session?.user?.email);
    
    if (!session?.user?.email) {
      console.log('No session, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    console.log('Admin emails configured:', adminEmails.length > 0);
    console.log('User email:', session.user.email);
    
    if (!adminEmails.includes(session.user.email)) {
      console.log('User not admin, returning 403');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('About to test database connection...');
    
    // Test basic database connection
    const { getPool } = await import('@/lib/database/connection');
    const pool = getPool();
    console.log('Got pool instance');
    
    const client = await pool.connect();
    console.log('Connected to database');
    
    // Test simple query
    const testResult = await client.query('SELECT NOW() as current_time');
    console.log('Simple query result:', testResult.rows[0]);
    
    // Test bookings table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'bookings'
    `);
    console.log('Bookings table exists:', tableCheck.rows.length > 0);
    
    // Test bookings count
    const countResult = await client.query('SELECT COUNT(*) as count FROM bookings');
    console.log('Bookings count:', countResult.rows[0].count);
    
    client.release();
    console.log('Database connection test successful');
    
    console.log('About to call getBookingsByStatus...');
    
    // Now test the actual function
    const { getBookingsByStatus } = await import('@/lib/database/bookings');
    const bookings = await getBookingsByStatus();
    
    console.log('getBookingsByStatus returned:', bookings.length, 'bookings');
    console.log('=== DEBUG BOOKINGS API SUCCESS ===');
    
    return NextResponse.json({ 
      success: true,
      bookingsCount: bookings.length,
      hasSession: true,
      isAdmin: true,
      databaseConnected: true
    });

  } catch (error) {
    console.error('=== DEBUG BOOKINGS API ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('=== END DEBUG ERROR ===');
    
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        message: error instanceof Error ? error.message : String(error),
        type: typeof error
      },
      { status: 500 }
    );
  }
}