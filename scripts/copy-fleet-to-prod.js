// Script to copy all fleet (castles) data from local DB to production Supabase DB
// Usage: node scripts/copy-fleet-to-prod.js

const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
const dotenv = require('dotenv');

// Load local DB credentials from .env.local
const localEnv = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') }).parsed || {};
// Load production DB credentials from .env.production
const prodEnv = dotenv.config({ path: path.resolve(process.cwd(), '.env.production') }).parsed || {};

const LOCAL_DB_URL = localEnv.DATABASE_URL;
const PROD_DB_URL = prodEnv.DATABASE_URL;

if (!LOCAL_DB_URL || !PROD_DB_URL) {
  console.error('Both local and production DATABASE_URLs must be set in .env.local and .env.production');
  process.exit(1);
}

async function copyFleet() {
  const localClient = new Client({ connectionString: LOCAL_DB_URL });
  const prodClient = new Client({ connectionString: PROD_DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await localClient.connect();
    await prodClient.connect();
    console.log('Connected to both local and production databases.');

    // Fetch all castles from local
    const res = await localClient.query('SELECT name, theme, size, price, description, image_url FROM castles ORDER BY id ASC');
    const castles = res.rows;
    if (!castles.length) {
      console.error('No castles found in local database!');
      process.exit(1);
    }
    console.log(`Fetched ${castles.length} castles from local DB.`);

    // Wipe production castles table
    await prodClient.query('DELETE FROM castles');
    console.log('Wiped production castles table.');

    // Insert all local castles into production
    for (const castle of castles) {
      await prodClient.query(
        `INSERT INTO castles (name, theme, size, price, description, image_url) VALUES ($1, $2, $3, $4, $5, $6)`,
        [castle.name, castle.theme, castle.size, castle.price, castle.description, castle.image_url]
      );
      console.log(`Inserted: ${castle.name}`);
    }
    console.log('All castles copied to production database!');
  } catch (err) {
    console.error('Error during fleet copy:', err);
    process.exit(1);
  } finally {
    await localClient.end();
    await prodClient.end();
  }
}

copyFleet(); 