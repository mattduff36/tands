const { Pool } = require('pg');

async function seedBookings() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Checking for existing bookings...');

    // Check if bookings exist
    const existingBookings = await pool.query('SELECT COUNT(*) FROM bookings');
    const count = parseInt(existingBookings.rows[0].count);

    if (count > 0) {
      console.log(`Found ${count} existing bookings, skipping seed.`);
      return;
    }

    console.log('No bookings found, seeding sample data...');

    // Get castle IDs
    const castles = await pool.query('SELECT id, name FROM castles LIMIT 3');
    
    if (castles.rows.length === 0) {
      console.log('No castles found. Please seed castles first.');
      return;
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
      await pool.query(`
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

    console.log(`Successfully seeded ${bookings.length} bookings`);

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedBookings()
    .then(() => {
      console.log('Booking seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Booking seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedBookings }; 