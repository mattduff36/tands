import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { addCastle } from '../src/lib/database/castles';

async function seed() {
  const dataPath = path.resolve(__dirname, '../data/castles.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const castles = JSON.parse(raw);

  for (const castle of castles) {
    // Remove id to let DB auto-increment
    const { id, ...castleData } = castle;
    try {
      await addCastle(castleData);
      console.log(`Seeded: ${castleData.name}`);
    } catch (err) {
      console.error(`Failed to seed: ${castleData.name}`, err);
    }
  }
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
}); 