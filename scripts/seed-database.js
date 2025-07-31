const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const defaultCastles = [
  {
    name: "Emoji",
    theme: "Fun",
    size: "11ft x 15ft",
    price: 80,
    description: "Emoji is the perfect addition to any celebration! This fun-themed bouncy castle (11ft x 15ft) combines safety, fun, and excitement. At just £80.00 per day, it's an affordable way to make your event unforgettable. Fully insured, PIPA tested, and guaranteed to be the highlight of your party! Keep overnight for only an extra £20!",
    image_url: "/IMG_2360.JPEG",
  },
  {
    name: "Party",
    theme: "Classic",
    size: "11ft x 15ft",
    price: 80,
    description: "A timeless classic that never goes out of style! This 11ft x 15ft bouncy castle is great for bigger celebrations and larger groups - our premium option with extra special features. Fully cleaned, safety tested, and guaranteed to bring smiles to faces of all ages! Keep overnight for only an extra £20!",
    image_url: "/IMG_2361.JPEG",
  },
  {
    name: "Disco",
    theme: "Adult",
    size: "15ft x 15ft",
    price: 120,
    description: "Features bright, colorful designs! This 15ft x 15ft bouncy castle is great for bigger celebrations and larger groups - our premium option with extra special features. Fully cleaned, safety tested, and guaranteed to bring smiles to faces of all ages! Keep overnight for only an extra £20!",
    image_url: "/IMG_2362.JPEG",
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
        price INTEGER NOT NULL,
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