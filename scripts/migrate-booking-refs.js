/**
 * Migration script to update existing booking references to friendly format
 * Run this script to convert old booking references to TS001, TS002, etc.
 */

const { Pool } = require('pg');

async function migrateBookingRefs() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting booking reference migration...');

    // Get all bookings with old format references
    const result = await pool.query(`
      SELECT id, booking_ref 
      FROM bookings 
      WHERE booking_ref NOT LIKE 'TS%' OR booking_ref ~ '^TS\\d{6,}'
      ORDER BY id ASC
    `);

    console.log(`Found ${result.rows.length} bookings to migrate`);

    for (let i = 0; i < result.rows.length; i++) {
      const booking = result.rows[i];
      const newRef = `TS${(i + 1).toString().padStart(3, '0')}`;
      
      await pool.query(`
        UPDATE bookings 
        SET booking_ref = $1 
        WHERE id = $2
      `, [newRef, booking.id]);

      console.log(`Migrated booking ${booking.id}: ${booking.booking_ref} -> ${newRef}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateBookingRefs();
}

module.exports = { migrateBookingRefs };