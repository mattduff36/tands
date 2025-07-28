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

    // Sample castle data
    const castles = [
      {
        name: 'Princess Castle',
        theme: 'Princess',
        size: '3m x 3m',
        price: 150,
        description: 'Beautiful pink princess castle perfect for little princesses',
        imageUrl: '/bouncy-castle-1.jpg'
      },
      {
        name: 'Superhero Obstacle',
        theme: 'Superhero',
        size: '4m x 3m',
        price: 180,
        description: 'Action-packed obstacle course for superhero adventures',
        imageUrl: '/bouncy-castle-2.jpg'
      },
      {
        name: 'Jungle Adventure',
        theme: 'Jungle',
        size: '3.5m x 3m',
        price: 160,
        description: 'Wild jungle-themed castle with animal decorations',
        imageUrl: '/bouncy-castle-3.jpg'
      },
      {
        name: 'Medieval Castle',
        theme: 'Medieval',
        size: '4m x 4m',
        price: 200,
        description: 'Grand medieval castle for knights and princesses',
        imageUrl: '/bouncy-castle-4.jpg'
      },
      {
        name: 'Disco',
        theme: 'Party',
        size: '3m x 3m',
        price: 120,
        description: 'Fun disco-themed castle with colorful lights',
        imageUrl: '/bouncy-castle-1.jpg'
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