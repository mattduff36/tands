import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database/bookings';

export async function POST(request: NextRequest) {
  try {
    const client = await getPool().connect();
    
    try {
      // Fix bookings sequence
      const maxBookingIdResult = await client.query('SELECT COALESCE(MAX(id), 0) as max_id FROM bookings');
      const maxBookingId = maxBookingIdResult.rows[0].max_id;
      await client.query(`SELECT setval('bookings_id_seq', $1, true)`, [maxBookingId]);
      
      // Fix castles sequence
      const maxCastleIdResult = await client.query('SELECT COALESCE(MAX(id), 0) as max_id FROM castles');
      const maxCastleId = maxCastleIdResult.rows[0].max_id;
      await client.query(`SELECT setval('castles_id_seq', $1, true)`, [maxCastleId]);
      
      return NextResponse.json({
        success: true,
        message: `Sequences fixed successfully. Bookings sequence set to ${maxBookingId}, Castles sequence set to ${maxCastleId}`,
        data: {
          bookings: { maxId: maxBookingId },
          castles: { maxId: maxCastleId }
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error fixing sequences:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix sequences',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 