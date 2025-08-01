/**
 * Database operations for castle fleet management
 * PostgreSQL implementation for persistent storage
 */

import { query, initializeDatabase } from './connection';
import { measureDatabaseOperation } from '@/lib/utils/performance-monitor';
//import { log } from '@/lib/utils/logger';

export interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
  maintenanceStatus?: 'available' | 'maintenance' | 'out_of_service';
  maintenanceNotes?: string;
  maintenanceStartDate?: string;
  maintenanceEndDate?: string;
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
      console.error('Failed to initialize castle database', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

/**
 * Get all castles from database
 */
export async function getCastles(): Promise<Castle[]> {
  return measureDatabaseOperation('getCastles', async () => {
    try {
      await ensureInitialized();
      
      const result = await query(`
        SELECT id, name, theme, size, price, description, image_url as "imageUrl",
               COALESCE(maintenance_status, 'available') as "maintenanceStatus", 
               maintenance_notes as "maintenanceNotes",
               maintenance_start_date as "maintenanceStartDate", 
               maintenance_end_date as "maintenanceEndDate"
        FROM castles 
        ORDER BY id ASC
      `);
      
      console.log('select', 0, { operation: 'getCastles', count: result.rows.length });
      return result.rows;
    } catch (error) {
      console.error('Error retrieving castles from database', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to retrieve castles');
    }
  }, { table: 'castles' });
}

/**
 * Get a single castle by ID from database
 */
export async function getCastleById(id: number): Promise<Castle | null> {
  try {
    await ensureInitialized();
    
    const result = await query(`
      SELECT id, name, theme, size, price, description, image_url as "imageUrl",
             COALESCE(maintenance_status, 'available') as "maintenanceStatus", 
             maintenance_notes as "maintenanceNotes",
             maintenance_start_date as "maintenanceStartDate", 
             maintenance_end_date as "maintenanceEndDate"
      FROM castles 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      console.log('Castle not found', { castleId: id });
      return null;
    }
    
    console.log('select', 0, { operation: 'getCastleById', castleId: id, castleName: result.rows[0].name });
    return result.rows[0];
  } catch (error) {
    console.error('Error retrieving castle from database', error instanceof Error ? error : new Error(String(error)), { castleId: id });
    
    // Fallback to static data if database is unavailable
    const { castles: staticCastles } = await import('@/lib/castle-data');
    const staticCastle = staticCastles.find(castle => castle.id === id);
    if (staticCastle) {
      console.warn('Database unavailable, returning static castle data for ID:', id);
      return staticCastle;
    }
    
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
    console.log('Castle added successfully', { castleId: newCastle.id, castleName: newCastle.name });
    
    return newCastle;
  } catch (error) {
    console.error('Error adding castle to database', error instanceof Error ? error : new Error(String(error)));
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
      console.log('Castle not found for update', { castleId: id });
      return null;
    }
    
    const updatedCastle = result.rows[0];
    console.log('Castle updated successfully', { castleId: updatedCastle.id, castleName: updatedCastle.name });
    
    return updatedCastle;
  } catch (error) {
    console.error('Error updating castle in database', error instanceof Error ? error : new Error(String(error)), { castleId: id });
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
      console.log('Castle not found for deletion', { castleId: id });
      return false;
    }
    
    const deletedCastle = result.rows[0];
    console.log('Castle deleted successfully', { castleId: deletedCastle.id, castleName: deletedCastle.name });
    
    return true;
  } catch (error) {
    console.error('Error deleting castle from database', error instanceof Error ? error : new Error(String(error)), { castleId: id });
    throw new Error('Failed to delete castle');
  }
}

/**
 * Update castle image URLs (for migration)
 */
export async function updateCastleImageUrls(updates: { id: number; imageUrl: string }[]): Promise<void> {
  try {
    await ensureInitialized();
    
    console.log('Updating castle image URLs', { count: updates.length });
    
    for (const update of updates) {
      await query(`
        UPDATE castles 
        SET image_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [update.imageUrl, update.id]);
      
      console.log('Updated castle image URL', { castleId: update.id });
    }
    
    console.log('All castle image URLs updated successfully');
  } catch (error) {
    console.error('Error updating castle image URLs in database', error instanceof Error ? error : new Error(String(error)));
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
        ROUND(AVG(price), 0) as average_price
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
      averagePrice: parseInt(statsResult.rows[0].average_price) || 0,
      themes: themesResult.rows
    };
  } catch (error) {
    console.error('Error retrieving castle statistics', error instanceof Error ? error : new Error(String(error)));
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
    
    console.log('Castle database test successful', { castleCount: count });
    return true;
  } catch (error) {
    console.error('Castle database test failed', error instanceof Error ? error : new Error(String(error)));
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
  console.warn('getCastleData() called - this function is deprecated with PostgreSQL backend');
  return [];
}

/**
 * Update castle maintenance status
 */
export async function updateCastleMaintenance(
  id: number, 
  maintenanceData: {
    status: 'available' | 'maintenance' | 'out_of_service';
    notes?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<Castle | null> {
  try {
    await ensureInitialized();
    
    const result = await query(`
      UPDATE castles 
      SET maintenance_status = $1, 
          maintenance_notes = $2, 
          maintenance_start_date = $3, 
          maintenance_end_date = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, theme, size, price, description, image_url as "imageUrl",
                maintenance_status as "maintenanceStatus", maintenance_notes as "maintenanceNotes",
                maintenance_start_date as "maintenanceStartDate", maintenance_end_date as "maintenanceEndDate"
    `, [
      maintenanceData.status,
      maintenanceData.notes || null,
      maintenanceData.startDate || null,
      maintenanceData.endDate || null,
      id
    ]);
    
    if (result.rows.length === 0) {
      console.log('Castle not found for maintenance update', { castleId: id });
      return null;
    }
    
    console.log('Updated castle maintenance status', { castleId: id, castleName: result.rows[0].name });
    return result.rows[0];
  } catch (error) {
    console.error('Error updating castle maintenance status', error instanceof Error ? error : new Error(String(error)), { castleId: id });
    throw new Error('Failed to update castle maintenance status');
  }
}

/**
 * Get castles by maintenance status
 */
export async function getCastlesByMaintenanceStatus(status: 'available' | 'maintenance' | 'out_of_service'): Promise<Castle[]> {
  try {
    await ensureInitialized();
    
    const result = await query(`
      SELECT id, name, theme, size, price, description, image_url as "imageUrl",
             maintenance_status as "maintenanceStatus", maintenance_notes as "maintenanceNotes",
             maintenance_start_date as "maintenanceStartDate", maintenance_end_date as "maintenanceEndDate"
      FROM castles 
      WHERE maintenance_status = $1
      ORDER BY id ASC
    `, [status]);
    
    console.log('select', 0, { operation: 'getCastlesByMaintenanceStatus', status, count: result.rows.length });
    return result.rows;
  } catch (error) {
    console.error('Error retrieving castles by maintenance status', error instanceof Error ? error : new Error(String(error)), { status });
    throw new Error('Failed to retrieve castles by maintenance status');
  }
}