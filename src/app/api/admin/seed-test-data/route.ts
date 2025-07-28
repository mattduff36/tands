import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getPool } from '@/lib/database/connection';

export async function POST(request: NextRequest) {
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
      // Check if bookings exist
      const existingBookings = await client.query('SELECT COUNT(*) FROM bookings');
      const count = parseInt(existingBookings.rows[0].count);

      if (count > 0) {
        return NextResponse.json({ 
          message: `Found ${count} existing bookings, skipping seed.`,
          existingCount: count 
        });
      }

      // Get castle IDs
      const castles = await client.query('SELECT id, name FROM castles LIMIT 3');
      
      if (castles.rows.length === 0) {
        return NextResponse.json({ 
          error: 'No castles found. Please seed castles first.' 
        }, { status: 400 });
      }

      // Sample booking data for December 2024
      const bookings = [
        {
          bookingRef: 'TS241215001',
          customerName: 'Sarah Johnson',
          customerEmail: 'sarah@example.com',
          customerPhone: '07700 900123',
          customerAddress: '123 Main Street, London',
          castleId: castles.rows[0].id,
          castleName: castles.rows[0].name,
          date: '2024-12-15',
          paymentMethod: 'card',
          totalPrice: 150,
          deposit: 50,
          status: 'confirmed',
          notes: 'Birthday party for Emma'
        },
        {
          bookingRef: 'TS241220002',
          customerName: 'Mike Williams',
          customerEmail: 'mike@example.com',
          customerPhone: '07700 900456',
          customerAddress: '456 Oak Avenue, Manchester',
          castleId: castles.rows[1].id,
          castleName: castles.rows[1].name,
          date: '2024-12-20',
          paymentMethod: 'cash',
          totalPrice: 180,
          deposit: 60,
          status: 'pending',
          notes: 'Corporate event'
        },
        {
          bookingRef: 'TS241225003',
          customerName: 'Emma Davis',
          customerEmail: 'emma@example.com',
          customerPhone: '07700 900789',
          customerAddress: '789 Pine Road, Birmingham',
          castleId: castles.rows[2].id,
          castleName: castles.rows[2].name,
          date: '2024-12-25',
          paymentMethod: 'card',
          totalPrice: 160,
          deposit: 50,
          status: 'confirmed',
          notes: 'Christmas party'
        },
        {
          bookingRef: 'TS241228004',
          customerName: 'John Smith',
          customerEmail: 'john@example.com',
          customerPhone: '07700 900012',
          customerAddress: '321 Elm Street, Leeds',
          castleId: castles.rows[0].id,
          castleName: castles.rows[0].name,
          date: '2024-12-28',
          paymentMethod: 'card',
          totalPrice: 150,
          deposit: 50,
          status: 'confirmed',
          notes: 'New Year celebration'
        },
        {
          bookingRef: 'TS241230005',
          customerName: 'Lisa Brown',
          customerEmail: 'lisa@example.com',
          customerPhone: '07700 900345',
          customerAddress: '654 Maple Drive, Liverpool',
          castleId: castles.rows[1].id,
          castleName: castles.rows[1].name,
          date: '2024-12-30',
          paymentMethod: 'cash',
          totalPrice: 180,
          deposit: 60,
          status: 'pending',
          notes: 'Family gathering'
        }
      ];

      // Insert bookings
      for (const booking of bookings) {
        await client.query(`
          INSERT INTO bookings (
            booking_ref, customer_name, customer_email, customer_phone, 
            customer_address, castle_id, castle_name, date, payment_method, 
            total_price, deposit, status, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          booking.bookingRef,
          booking.customerName,
          booking.customerEmail,
          booking.customerPhone,
          booking.customerAddress,
          booking.castleId,
          booking.castleName,
          booking.date,
          booking.paymentMethod,
          booking.totalPrice,
          booking.deposit,
          booking.status,
          booking.notes
        ]);
      }

      return NextResponse.json({ 
        message: `Successfully seeded ${bookings.length} bookings`,
        seededCount: bookings.length
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error seeding test data:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 