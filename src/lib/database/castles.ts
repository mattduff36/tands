/**
 * Database operations for castle fleet management
 * In-memory implementation compatible with Vercel serverless environment
 */

export interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
}

// In-memory castle storage
let castleStorage: Castle[] = [];
let idCounter = 1;

// Initialize with default data
function initializeCastleData() {
  if (castleStorage.length > 0) return;

  const defaultCastles: Castle[] = [
    {
      id: 1,
      name: "The Classic Fun",
      theme: "Classic",
      size: "12ft x 15ft",
      price: 60,
      description: "A timeless classic, perfect for any party or event. Bright, colorful, and guaranteed to bring smiles.",
      imageUrl: "/bouncy-castle-1.jpg",
    },
    {
      id: 2,
      name: "Princess Palace",
      theme: "Princess",
      size: "15ft x 15ft",
      price: 75,
      description: "A magical castle for your little princess. Features beautiful artwork of enchanting characters.",
      imageUrl: "/bouncy-castle-2.jpg",
    },
    {
      id: 3,
      name: "Jungle Adventure",
      theme: "Jungle",
      size: "12ft x 18ft with slide",
      price: 80,
      description: "Go on a wild adventure! This castle includes a fun slide and is decorated with jungle animals.",
      imageUrl: "/bouncy-castle-3.jpg",
    },
    {
      id: 4,
      name: "Superhero Base",
      theme: "Superhero",
      size: "14ft x 14ft",
      price: 70,
      description: "Become a superhero for a day! This castle is perfect for action-packed parties.",
      imageUrl: "/bouncy-castle-4.jpg",
    },
    {
      id: 5,
      name: "Party Time Bouncer",
      theme: "Party",
      size: "10ft x 12ft",
      price: 55,
      description: "Ideal for smaller gardens, this compact bouncer is all about celebrating in style.",
      imageUrl: "/bouncy-castle-1.jpg",
    },
    {
      id: 6,
      name: "Under The Sea",
      theme: "Ocean",
      size: "15ft x 16ft",
      price: 75,
      description: "Dive into fun with our ocean-themed bouncy castle, complete with colorful sea creatures.",
      imageUrl: "/bouncy-castle-2.jpg",
    },
  ];
  
  castleStorage = defaultCastles;
  idCounter = Math.max(...defaultCastles.map(c => c.id)) + 1;
}

// Initialize on module load
initializeCastleData();

/**
 * Get all castles
 */
export function getCastles(): Castle[] {
  initializeCastleData();
  return [...castleStorage];
}

/**
 * Get a single castle by ID
 */
export function getCastleById(id: number): Castle | null {
  initializeCastleData();
  return castleStorage.find(castle => castle.id === id) || null;
}

/**
 * Add a new castle
 */
export function addCastle(castleData: Omit<Castle, 'id'>): Castle {
  initializeCastleData();
  
  const newCastle: Castle = {
    ...castleData,
    id: idCounter++
  };
  
  castleStorage.push(newCastle);
  console.log('Castle added successfully:', newCastle.name);
  
  return newCastle;
}

/**
 * Update an existing castle
 */
export function updateCastle(id: number, castleData: Omit<Castle, 'id'>): Castle | null {
  initializeCastleData();
  
  const index = castleStorage.findIndex(castle => castle.id === id);
  
  if (index === -1) {
    console.error('Castle not found for update:', id);
    return null;
  }
  
  const updatedCastle: Castle = {
    ...castleData,
    id
  };
  
  castleStorage[index] = updatedCastle;
  console.log('Castle updated successfully:', updatedCastle.name);
  
  return updatedCastle;
}

/**
 * Delete a castle
 */
export function deleteCastle(id: number): boolean {
  initializeCastleData();
  
  const index = castleStorage.findIndex(castle => castle.id === id);
  
  if (index === -1) {
    console.error('Castle not found for deletion:', id);
    return false;
  }
  
  const deletedCastle = castleStorage[index];
  castleStorage.splice(index, 1);
  console.log('Castle deleted successfully:', deletedCastle.name);
  
  return true;
}

/**
 * Update castle image URLs (for migration)
 */
export function updateCastleImageUrls(updates: { id: number; imageUrl: string }[]): void {
  initializeCastleData();
  
  updates.forEach(update => {
    const castle = castleStorage.find(c => c.id === update.id);
    if (castle) {
      castle.imageUrl = update.imageUrl;
      console.log(`Updated image URL for castle ${castle.name}`);
    }
  });
}

/**
 * Clear all castle data (for testing)
 */
export function clearCastleData(): void {
  castleStorage = [];
  idCounter = 1;
}

/**
 * Reset to initial data (for testing)
 */
export function resetCastleData(): void {
  clearCastleData();
  initializeCastleData();
}

/**
 * Get mock data for debugging
 */
export function getCastleData() {
  return { castles: castleStorage };
}