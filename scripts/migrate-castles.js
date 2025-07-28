const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateCastles() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Starting castle migration...');

    // Read existing castle data
    const dataPath = path.resolve(__dirname, '../data/castles.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const castles = JSON.parse(rawData);

    console.log(`Found ${castles.length} castles to migrate`);

    // Check if castles already exist in database
    const existingCastles = await pool.query('SELECT COUNT(*) FROM castles');
    const count = parseInt(existingCastles.rows[0].count);

    if (count > 0) {
      console.log(`Database already has ${count} castles, skipping migration.`);
      return;
    }

    // Insert castles with maintenance fields
    for (const castle of castles) {
      const { id, ...castleData } = castle; // Remove id to let DB auto-increment
      
      await pool.query(`
        INSERT INTO castles (name, theme, size, price, description, image_url, maintenance_status)
        VALUES ($1, $2, $3, $4, $5, $6, 'available')
      `, [
        castleData.name,
        castleData.theme,
        castleData.size,
        castleData.price,
        castleData.description,
        castleData.imageUrl
      ]);
      
      console.log(`Migrated: ${castleData.name}`);
    }

    console.log(`Successfully migrated ${castles.length} castles`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateCastles()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateCastles }; 