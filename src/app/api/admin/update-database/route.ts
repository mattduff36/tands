import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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

    const body = await request.json();
    const { rawData } = body;

    if (!rawData || !rawData.bookings || !rawData.castles) {
      return NextResponse.json({ 
        error: 'Invalid data format. Expected rawData with bookings and castles arrays.' 
      }, { status: 400 });
    }

    const client = await getPool().connect();

    try {
      console.log('⚠️ Manual database update initiated by admin');
      
      let updatedBookings = 0;
      let updatedCastles = 0;
      let errors = [];

      // Update bookings
      for (const booking of rawData.bookings) {
        try {
          const result = await client.query(`
            UPDATE bookings 
            SET 
              customer_name = $1,
              customer_email = $2,
              customer_phone = $3,
              customer_address = $4,
              castle_id = $5,
              castle_name = $6,
              date = $7,
              payment_method = $8,
              total_price = $9,
              deposit = $10,
              status = $11,
              notes = $12,
              agreement_signed = $13,
              agreement_signed_at = $14,
              agreement_signed_by = $15,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $16
          `, [
            booking.customer_name,
            booking.customer_email,
            booking.customer_phone,
            booking.customer_address,
            booking.castle_id,
            booking.castle_name,
            booking.date,
            booking.payment_method,
            booking.total_price,
            booking.deposit,
            booking.status,
            booking.notes,
            booking.agreement_signed || false,
            booking.agreement_signed_at,
            booking.agreement_signed_by,
            booking.id
          ]);

          if (result.rowCount && result.rowCount > 0) {
            updatedBookings++;
            console.log(`✅ Updated booking ID ${booking.id}`);
          }
        } catch (error) {
          console.error(`❌ Error updating booking ID ${booking.id}:`, error);
          errors.push(`Booking ID ${booking.id}: ${error}`);
        }
      }

      // Update castles
      for (const castle of rawData.castles) {
        try {
          const result = await client.query(`
            UPDATE castles 
            SET 
              name = $1,
              theme = $2,
              size = $3,
              price = $4,
              description = $5,
              image_url = $6,
              maintenance_status = $7,
              maintenance_notes = $8,
              maintenance_start_date = $9,
              maintenance_end_date = $10,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $11
          `, [
            castle.name,
            castle.theme,
            castle.size,
            castle.price,
            castle.description,
            castle.image_url,
            castle.maintenance_status || 'available',
            castle.maintenance_notes,
            castle.maintenance_start_date,
            castle.maintenance_end_date,
            castle.id
          ]);

          if (result.rowCount && result.rowCount > 0) {
            updatedCastles++;
            console.log(`✅ Updated castle ID ${castle.id}`);
          }
        } catch (error) {
          console.error(`❌ Error updating castle ID ${castle.id}:`, error);
          errors.push(`Castle ID ${castle.id}: ${error}`);
        }
      }

      const message = `Database updated: ${updatedBookings} bookings, ${updatedCastles} castles`;
      if (errors.length > 0) {
        console.log('⚠️ Some updates failed:', errors);
      }

      return NextResponse.json({
        success: true,
        message,
        updatedBookings,
        updatedCastles,
        errors: errors.length > 0 ? errors : undefined
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating database:', error);
    return NextResponse.json(
      { error: 'Failed to update database', details: (error as Error).message },
      { status: 500 }
    );
  }
} 