const { Pool } = require('pg');

async function seedCastles() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Checking for existing castles...');

    // Check if castles exist
    const existingCastles = await pool.query('SELECT COUNT(*) FROM castles');
    const count = parseInt(existingCastles.rows[0].count);

    if (count > 0) {
      console.log(`Found ${count} existing castles, skipping seed.`);
      return;
    }

    console.log('No castles found, seeding sample data...');

    // Real castle data - only the actual castles in use
    const castles = [
      {
        name: 'Emoji',
        theme: 'Fun',
        size: '11ft x 15ft',
        price: 80,
        description: 'Emoji is the perfect addition to any celebration! This fun-themed bouncy castle (11ft x 15ft) combines safety, fun, and excitement. At just £80.00 per day, it\'s an affordable way to make your event unforgettable. Fully insured, PIPA tested, and guaranteed to be the highlight of your party! Keep overnight for only an extra £20!',
        imageUrl: '/IMG_2360.JPEG'
      },
      {
        name: 'Party',
        theme: 'Classic',
        size: '11ft x 15ft',
        price: 80,
        description: 'A timeless classic that never goes out of style! This 11ft x 15ft bouncy castle is great for bigger celebrations and larger groups - our premium option with extra special features. Fully cleaned, safety tested, and guaranteed to bring smiles to faces of all ages! Keep overnight for only an extra £20!',
        imageUrl: '/IMG_2361.JPEG'
      },
      {
        name: 'Disco',
        theme: 'Adult',
        size: '15ft x 15ft',
        price: 120,
        description: 'Features bright, colorful designs! This 15ft x 15ft bouncy castle is great for bigger celebrations and larger groups - our premium option with extra special features. Fully cleaned, safety tested, and guaranteed to bring smiles to faces of all ages! Keep overnight for only an extra £20!',
        imageUrl: '/IMG_2362.JPEG'
      }
    ];

    // Insert castles
    for (const castle of castles) {
      await pool.query(`
        INSERT INTO castles (name, theme, size, price, description, image_url)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [castle.name, castle.theme, castle.size, castle.price, castle.description, castle.imageUrl]);
    }

    console.log(`Successfully seeded ${castles.length} castles`);

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedCastles()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCastles }; 