const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const defaultCastles = [
  {
    name: "The Classic Fun",
    theme: "Classic",
    size: "12ft x 15ft",
    price: 60,
    description: "A timeless classic, perfect for any party or event. Bright, colorful, and guaranteed to bring smiles.",
    image_url: "/bouncy-castle-1.jpg",
  },
  {
    name: "Princess Palace",
    theme: "Princess",
    size: "15ft x 15ft",
    price: 75,
    description: "A magical castle for your little princess. Features beautiful artwork of enchanting characters.",
    image_url: "/bouncy-castle-2.jpg",
  },
  {
    name: "Jungle Adventure",
    theme: "Jungle",
    size: "12ft x 18ft with slide",
    price: 80,
    description: "Go on a wild adventure! This castle includes a fun slide and is decorated with jungle animals.",
    image_url: "/bouncy-castle-3.jpg",
  },
  {
    name: "Superhero Base",
    theme: "Superhero",
    size: "14ft x 14ft",
    price: 70,
    description: "Become a superhero for a day! This castle is perfect for action-packed parties.",
    image_url: "/bouncy-castle-4.jpg",
  },
  {
    name: "Party Time Bouncer",
    theme: "Party",
    size: "10ft x 12ft",
    price: 55,
    description: "Ideal for smaller gardens, this compact bouncer is all about celebrating in style.",
    image_url: "/bouncy-castle-1.jpg",
  },
  {
    name: "Under The Sea",
    theme: "Ocean",
    size: "15ft x 16ft",
    price: 75,
    description: "Dive into fun with our ocean-themed bouncy castle, complete with colorful sea creatures.",
    image_url: "/bouncy-castle-2.jpg",
  },
];

async function seedDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    console.log('Dropping existing castles table...');
    await client.query('DROP TABLE IF EXISTS castles;');

    console.log('Creating castles table...');
    await client.query(`
      CREATE TABLE castles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        theme VARCHAR(100) NOT NULL,
        size VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Inserting default castle data...');
    for (const castle of defaultCastles) {
      await client.query(
        'INSERT INTO castles (name, theme, size, price, description, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
        [castle.name, castle.theme, castle.size, castle.price, castle.description, castle.image_url]
      );
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.release();
    await pool.end();
  }
}

seedDatabase();