const { Pool } = require('pg');

async function migrateMaintenanceFields() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Starting migration to add maintenance fields...');

    // Check if maintenance_status column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'castles' AND column_name = 'maintenance_status'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('Maintenance fields already exist, skipping migration.');
      return;
    }

    // Add maintenance columns
    await pool.query(`
      ALTER TABLE castles 
      ADD COLUMN maintenance_status VARCHAR(20) DEFAULT 'available',
      ADD COLUMN maintenance_notes TEXT,
      ADD COLUMN maintenance_start_date DATE,
      ADD COLUMN maintenance_end_date DATE
    `);

    console.log('Successfully added maintenance fields to castles table');

    // Verify the migration
    const verifyColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'castles' 
      AND column_name IN ('maintenance_status', 'maintenance_notes', 'maintenance_start_date', 'maintenance_end_date')
    `);

    console.log('Verification - Found columns:', verifyColumns.rows.map(row => row.column_name));

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateMaintenanceFields()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateMaintenanceFields }; 