/**
 * Database operations for castle fleet management
 * PostgreSQL implementation for persistent storage
 */

import { query, initializeDatabase } from './connection';

export interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
}

// Database initialization flag to prevent multiple initialization calls
let isInitialized = false;

/**
 * Initialize database if not already done
 */
async function ensureInitialized() {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
      console.log('Castle database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize castle database:', error);
      throw error;
    }
  }
}

/**
 * Get all castles from database
 */
export async function getCastles(): Promise<Castle[]> {
  try {
    await ensureInitialized();
    
    const result = await query(`
      SELECT id, name, theme, size, price, description, image_url as "imageUrl"
      FROM castles 
      ORDER BY id ASC
    `);
    
    console.log(`Retrieved ${result.rows.length} castles from database`);
    return result.rows;
  } catch (error) {
    console.error('Error retrieving castles from database:', error);
    throw new Error('Failed to retrieve castles');
  }
}

/**
 * Get a single castle by ID from database
 */
export async function getCastleById(id: number): Promise<Castle | null> {
  try {
    await ensureInitialized();
    
    const result = await query(`
      SELECT id, name, theme, size, price, description, image_url as "imageUrl"
      FROM castles 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      console.log(`Castle with ID ${id} not found`);
      return null;
    }
    
    console.log(`Retrieved castle: ${result.rows[0].name}`);
    return result.rows[0];
  } catch (error) {
    console.error(`Error retrieving castle ${id} from database:`, error);
    throw new Error('Failed to retrieve castle');
  }
}

/**
 * Add a new castle to database
 */
export async function addCastle(castleData: Omit<Castle, 'id'>): Promise<Castle> {
  try {
    await ensureInitialized();
    
    const result = await query(`
      INSERT INTO castles (name, theme, size, price, description, image_url) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, theme, size, price, description, image_url as "imageUrl"
    `, [
      castleData.name,
      castleData.theme,
      castleData.size,
      castleData.price,
      castleData.description,
      castleData.imageUrl
    ]);
    
    const newCastle = result.rows[0];
    console.log(`Castle added successfully: ${newCastle.name} (ID: ${newCastle.id})`);
    
    return newCastle;
  } catch (error) {
    console.error('Error adding castle to database:', error);
    throw new Error('Failed to add castle');
  }
}

/**
 * Update an existing castle in database
 */
export async function updateCastle(id: number, castleData: Omit<Castle, 'id'>): Promise<Castle | null> {
  try {
    await ensureInitialized();
    
    const result = await query(`
      UPDATE castles 
      SET name = $1, theme = $2, size = $3, price = $4, description = $5, image_url = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, name, theme, size, price, description, image_url as "imageUrl"
    `, [
      castleData.name,
      castleData.theme,
      castleData.size,
      castleData.price,
      castleData.description,
      castleData.imageUrl,
      id
    ]);
    
    if (result.rows.length === 0) {
      console.log(`Castle with ID ${id} not found for update`);
      return null;
    }
    
    const updatedCastle = result.rows[0];
    console.log(`Castle updated successfully: ${updatedCastle.name} (ID: ${updatedCastle.id})`);
    
    return updatedCastle;
  } catch (error) {
    console.error(`Error updating castle ${id} in database:`, error);
    throw new Error('Failed to update castle');
  }
}

/**
 * Delete a castle from database
 */
export async function deleteCastle(id: number): Promise<boolean> {
  try {
    await ensureInitialized();
    
    const result = await query(`
      DELETE FROM castles 
      WHERE id = $1
      RETURNING id, name
    `, [id]);
    
    if (result.rows.length === 0) {
      console.log(`Castle with ID ${id} not found for deletion`);
      return false;
    }
    
    const deletedCastle = result.rows[0];
    console.log(`Castle deleted successfully: ${deletedCastle.name} (ID: ${deletedCastle.id})`);
    
    return true;
  } catch (error) {
    console.error(`Error deleting castle ${id} from database:`, error);
    throw new Error('Failed to delete castle');
  }
}

/**
 * Update castle image URLs (for migration)
 */
export async function updateCastleImageUrls(updates: { id: number; imageUrl: string }[]): Promise<void> {
  try {
    await ensureInitialized();
    
    console.log(`Updating image URLs for ${updates.length} castles...`);
    
    for (const update of updates) {
      await query(`
        UPDATE castles 
        SET image_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [update.imageUrl, update.id]);
      
      console.log(`Updated image URL for castle ID ${update.id}`);
    }
    
    console.log('All castle image URLs updated successfully');
  } catch (error) {
    console.error('Error updating castle image URLs in database:', error);
    throw new Error('Failed to update castle image URLs');
  }
}

/**
 * Get database statistics
 */
export async function getCastleStats(): Promise<{
  totalCastles: number;
  averagePrice: number;
  themes: { theme: string; count: number }[];
}> {
  try {
    await ensureInitialized();
    
    // Get total count and average price
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_castles,
        ROUND(AVG(price), 2) as average_price
      FROM castles
    `);
    
    // Get theme distribution
    const themesResult = await query(`
      SELECT theme, COUNT(*) as count
      FROM castles
      GROUP BY theme
      ORDER BY count DESC
    `);
    
    return {
      totalCastles: parseInt(statsResult.rows[0].total_castles),
      averagePrice: parseFloat(statsResult.rows[0].average_price) || 0,
      themes: themesResult.rows
    };
  } catch (error) {
    console.error('Error retrieving castle statistics:', error);
    throw new Error('Failed to retrieve castle statistics');
  }
}

/**
 * Test database connection and functionality
 */
export async function testCastleDatabase(): Promise<boolean> {
  try {
    await ensureInitialized();
    
    // Test basic query
    const result = await query('SELECT COUNT(*) as count FROM castles');
    const count = parseInt(result.rows[0].count);
    
    console.log(`Castle database test successful - ${count} castles found`);
    return true;
  } catch (error) {
    console.error('Castle database test failed:', error);
    return false;
  }
}

// Legacy compatibility functions (for gradual migration)
export function clearCastleData(): void {
  console.warn('clearCastleData() called - this function is deprecated with PostgreSQL backend');
}

export function resetCastleData(): void {
  console.warn('resetCastleData() called - this function is deprecated with PostgreSQL backend');
}

export function getCastleData() {
  console.warn('getCastleData() called - use getCastles() instead for PostgreSQL backend');
  return { castles: [] };
}