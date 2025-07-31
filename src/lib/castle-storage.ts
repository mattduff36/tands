import fs from 'fs';
import path from 'path';

export interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
}

// Path to the JSON data file - use /tmp in production for Vercel compatibility
const DATA_FILE_PATH = process.env.NODE_ENV === 'production'
  ? path.join('/tmp', 'castles.json')
  : path.join(process.cwd(), 'data', 'castles.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Initialize with default data if file doesn't exist
function initializeDataFile() {
  ensureDataDirectory();
  
  if (!fs.existsSync(DATA_FILE_PATH)) {
    const defaultCastles: Castle[] = [
      {
        id: 13,
        name: "Emoji",
        theme: "Fun",
        size: "11ft x 15ft",
        price: 80,
        description: "Emoji is the perfect addition to any celebration! This fun-themed bouncy castle (11ft x 15ft) combines safety, fun, and excitement. At just £80.00 per day, it's an affordable way to make your event unforgettable. Fully insured, PIPA tested, and guaranteed to be the highlight of your party! Keep overnight for only an extra £20!",
        imageUrl: "/IMG_2360.JPEG",
      },
      {
        id: 14,
        name: "Party",
        theme: "Classic",
        size: "11ft x 15ft",
        price: 80,
        description: "A timeless classic that never goes out of style! This 11ft x 15ft bouncy castle is great for bigger celebrations and larger groups - our premium option with extra special features. Fully cleaned, safety tested, and guaranteed to bring smiles to faces of all ages! Keep overnight for only an extra £20!",
        imageUrl: "/IMG_2361.JPEG",
      },
      {
        id: 15,
        name: "Disco",
        theme: "Adult",
        size: "15ft x 15ft",
        price: 120,
        description: "Features bright, colorful designs! This 15ft x 15ft bouncy castle is great for bigger celebrations and larger groups - our premium option with extra special features. Fully cleaned, safety tested, and guaranteed to bring smiles to faces of all ages! Keep overnight for only an extra £20!",
        imageUrl: "/IMG_2362.JPEG",
      },
    ];
    
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(defaultCastles, null, 2));
  }
}

// Read all castles
export function getCastles(): Castle[] {
  initializeDataFile();
  
  try {
    const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading castle data:', error);
    return [];
  }
}

// Get a single castle by ID
export function getCastleById(id: number): Castle | null {
  const castles = getCastles();
  return castles.find(castle => castle.id === id) || null;
}

// Add a new castle
export function addCastle(castleData: Omit<Castle, 'id'>): Castle {
  const castles = getCastles();
  const newId = Math.max(0, ...castles.map(c => c.id)) + 1;
  
  const newCastle: Castle = {
    ...castleData,
    id: newId
  };
  
  castles.push(newCastle);
  saveCastles(castles);
  
  return newCastle;
}

// Update an existing castle
export function updateCastle(id: number, castleData: Omit<Castle, 'id'>): Castle | null {
  const castles = getCastles();
  const index = castles.findIndex(castle => castle.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedCastle: Castle = {
    ...castleData,
    id
  };
  
  castles[index] = updatedCastle;
  saveCastles(castles);
  
  return updatedCastle;
}

// Delete a castle
export function deleteCastle(id: number): boolean {
  const castles = getCastles();
  const index = castles.findIndex(castle => castle.id === id);
  
  if (index === -1) {
    return false;
  }
  
  castles.splice(index, 1);
  saveCastles(castles);
  
  return true;
}

// Save castles to file
function saveCastles(castles: Castle[]): void {
  try {
    ensureDataDirectory();
    console.log('Attempting to save castles to:', DATA_FILE_PATH);
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(castles, null, 2));
    console.log('Successfully saved castles data');
  } catch (error) {
    console.error('Error saving castle data to:', DATA_FILE_PATH);
    console.error('Error details:', error);
    
    // In production, provide more helpful error message
    if (process.env.NODE_ENV === 'production') {
      console.error('PRODUCTION STORAGE ISSUE: File-based storage is not persistent in Vercel serverless environment');
    }
    
    throw new Error(`Failed to save castle data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Update castle image URLs (for migration)
export function updateCastleImageUrls(updates: { id: number; imageUrl: string }[]): void {
  const castles = getCastles();
  
  updates.forEach(update => {
    const castle = castles.find(c => c.id === update.id);
    if (castle) {
      castle.imageUrl = update.imageUrl;
    }
  });
  
  saveCastles(castles);
}