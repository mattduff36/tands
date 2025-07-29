const { Pool } = require('pg');

async function migrateBookingStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting booking status migration...');
    
    // Delete all 'cancelled' bookings since they're not needed
    const result = await pool.query(`
      DELETE FROM bookings 
      WHERE status = 'cancelled'
    `);
    
    console.log(`Deleted ${result.rowCount} cancelled bookings`);
    
    // Update expired confirmed bookings to complete
    const expiredResult = await pool.query(`
      UPDATE bookings 
      SET status = 'complete', updated_at = CURRENT_TIMESTAMP 
      WHERE status = 'confirmed' 
      AND end_date IS NOT NULL 
      AND end_date < CURRENT_TIMESTAMP
    `);
    
    console.log(`Updated ${expiredResult.rowCount} expired confirmed bookings to 'complete'`);
    
    console.log('Booking status migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrateBookingStatus();
}

module.exports = { migrateBookingStatus };