/**
 * Database operations for bouncy castle booking management
 * Mock implementation for development - can be replaced with real database
 */

import { getPool } from './connection';

export interface PendingBooking {
  id: number;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  castleId: number;
  castleName: string;
  date: string;
  paymentMethod: string;
  totalPrice: number;
  deposit: number;
  status: 'pending' | 'confirmed' | 'completed' | 'expired';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Initialize bookings table
export async function initializeBookingsTable(): Promise<void> {
  const client = await getPool().connect();
  try {
    // First, create the base table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_ref VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_address TEXT NOT NULL,
        castle_id INTEGER NOT NULL,
        castle_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        total_price INTEGER NOT NULL,
        deposit INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns for confirmed bookings if they don't exist
    await client.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS castle_type VARCHAR(255),
      ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS total_cost INTEGER,
      ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS agreement_signed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS agreement_signed_by VARCHAR(255)
    `);
    
    console.log('Bookings table initialized successfully');
    
    // Update expired bookings to complete status
    await updateExpiredBookings();
  } catch (error) {
    console.error('Error initializing bookings table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Generate user-friendly booking reference (TS001, TS002, etc.)
async function generateFriendlyBookingRef(): Promise<string> {
  const client = await getPool().connect();
  try {
    // Get the highest booking reference number
    const result = await client.query(`
      SELECT booking_ref 
      FROM bookings 
      WHERE booking_ref ~ '^TS\\d{3}$'
      ORDER BY CAST(SUBSTRING(booking_ref FROM 3) AS INTEGER) DESC 
      LIMIT 1
    `);
    
    let nextNumber = 1;
    if (result.rows.length > 0) {
      const lastRef = result.rows[0].booking_ref;
      const lastNumber = parseInt(lastRef.substring(2));
      nextNumber = lastNumber + 1;
    }
    
    // Ensure we don't exceed 999
    if (nextNumber > 999) {
      // If we've exceeded 999, find the first available number
      const allRefs = await client.query(`
        SELECT booking_ref 
        FROM bookings 
        WHERE booking_ref ~ '^TS\\d{3}$'
        ORDER BY CAST(SUBSTRING(booking_ref FROM 3) AS INTEGER) ASC
      `);
      
      const usedNumbers = new Set(allRefs.rows.map(row => parseInt(row.booking_ref.substring(2))));
      for (let i = 1; i <= 999; i++) {
        if (!usedNumbers.has(i)) {
          nextNumber = i;
          break;
        }
      }
      
      // If all numbers are used, fall back to timestamp
      if (nextNumber > 999) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `TS${year}${month}${day}${random}`;
      }
    }
    
    return `TS${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating friendly booking ref:', error);
    // Fallback to timestamp-based ref if there's an error
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TS${year}${month}${day}${random}`;
  } finally {
    client.release();
  }
}

// Generate unique booking reference (legacy function - keeping for backward compatibility)
function generateBookingRef(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TS${year}${month}${day}${random}`;
}

// Create a new pending booking
export async function createPendingBooking(booking: Omit<PendingBooking, 'id' | 'bookingRef' | 'status' | 'createdAt' | 'updatedAt'>): Promise<PendingBooking> {
  const client = await getPool().connect();
  try {
    const bookingRef = await generateFriendlyBookingRef();
    
    const result = await client.query(`
      INSERT INTO bookings (
        booking_ref, customer_name, customer_email, customer_phone, 
        customer_address, castle_id, castle_name, date, payment_method, 
        total_price, deposit, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      bookingRef,
      booking.customerName,
      booking.customerEmail,
      booking.customerPhone,
      booking.customerAddress,
      booking.castleId,
      booking.castleName,
      booking.date,
      booking.paymentMethod,
      booking.totalPrice,
      booking.deposit,
      booking.notes || null
    ]);

    return {
      id: result.rows[0].id,
      bookingRef: result.rows[0].booking_ref,
      customerName: result.rows[0].customer_name,
      customerEmail: result.rows[0].customer_email,
      customerPhone: result.rows[0].customer_phone,
      customerAddress: result.rows[0].customer_address,
      castleId: result.rows[0].castle_id,
      castleName: result.rows[0].castle_name,
      date: result.rows[0].date,
      paymentMethod: result.rows[0].payment_method,
      totalPrice: result.rows[0].total_price,
      deposit: result.rows[0].deposit,
      status: result.rows[0].status,
      notes: result.rows[0].notes,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
  } catch (error) {
    console.error('Error creating pending booking:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Create a new confirmed booking with calendar event ID
export async function createConfirmedBooking(booking: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  castleType: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: string;
  calendarEventId: string;
  bookingRef: string;
  notes?: string;
}): Promise<any> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      INSERT INTO bookings (
        booking_ref, customer_name, customer_email, customer_phone, 
        customer_address, castle_id, castle_name, date, payment_method, 
        total_price, deposit, status, notes, castle_type, start_date, 
        end_date, total_cost, calendar_event_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      booking.bookingRef,
      booking.customerName,
      booking.customerEmail,
      booking.customerPhone,
      booking.address,
      1, // Default castle_id for confirmed bookings
      booking.castleType,
      new Date(booking.startDate).toISOString().split('T')[0], // Extract date part
      'card', // Default payment method for confirmed bookings
      booking.totalCost,
      Math.floor(booking.totalCost * 0.3), // 30% deposit
      booking.status,
      booking.notes || null,
      booking.castleType,
      booking.startDate,
      booking.endDate,
      booking.totalCost,
      booking.calendarEventId
    ]);

    return {
      id: result.rows[0].id,
      bookingRef: result.rows[0].booking_ref,
      customerName: result.rows[0].customer_name,
      customerEmail: result.rows[0].customer_email,
      customerPhone: result.rows[0].customer_phone,
      customerAddress: result.rows[0].customer_address,
      castleId: result.rows[0].castle_id,
      castleName: result.rows[0].castle_name,
      date: result.rows[0].date,
      paymentMethod: result.rows[0].payment_method,
      totalPrice: result.rows[0].total_price,
      deposit: result.rows[0].deposit,
      status: result.rows[0].status,
      notes: result.rows[0].notes,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
      castleType: result.rows[0].castle_type,
      startDate: result.rows[0].start_date,
      endDate: result.rows[0].end_date,
      totalCost: result.rows[0].total_cost,
      calendarEventId: result.rows[0].calendar_event_id
    };
  } catch (error) {
    console.error('Error creating confirmed booking:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get all bookings by status
export async function getBookingsByStatus(status?: string): Promise<PendingBooking[]> {
  const client = await getPool().connect();
  try {
    let query = 'SELECT * FROM bookings';
    let params: any[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params = [status];
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await client.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      bookingRef: row.booking_ref,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      customerAddress: row.customer_address,
      castleId: row.castle_id,
      castleName: row.castle_name,
      date: row.date,
      paymentMethod: row.payment_method,
      totalPrice: row.total_price,
      deposit: row.deposit,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Update booking status
export async function updateBookingStatus(id: number, status: 'pending' | 'confirmed' | 'completed' | 'expired'): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(
      'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );
  } finally {
    client.release();
  }
}

// Update booking agreement signing
export async function updateBookingAgreement(id: number, agreementSigned: boolean, agreementSignedAt: string, agreementSignedBy?: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(
      'UPDATE bookings SET agreement_signed = $1, agreement_signed_at = $2, agreement_signed_by = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [agreementSigned, agreementSignedAt, agreementSignedBy || null, id]
    );
  } finally {
    client.release();
  }
}

// Automatically update confirmed bookings to complete after their end date
export async function updateExpiredBookings(): Promise<void> {
  const client = await getPool().connect();
  try {
    // Update confirmed bookings where the end date has passed
    await client.query(`
      UPDATE bookings 
      SET status = 'complete', updated_at = CURRENT_TIMESTAMP 
      WHERE status = 'confirmed' 
      AND end_date IS NOT NULL 
      AND end_date < CURRENT_TIMESTAMP
    `);
    
    console.log('Updated expired bookings to complete status');
  } catch (error) {
    console.error('Error updating expired bookings:', error);
  } finally {
    client.release();
  }
}

// Delete booking
export async function deleteBooking(id: number): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('DELETE FROM bookings WHERE id = $1', [id]);
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Update booking details
export async function updateBooking(id: number, updates: Partial<Omit<PendingBooking, 'id' | 'bookingRef' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const client = await getPool().connect();
  try {
    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (updates.customerName) {
      setClause.push(`customer_name = $${paramCount++}`);
      values.push(updates.customerName);
    }
    if (updates.customerEmail) {
      setClause.push(`customer_email = $${paramCount++}`);
      values.push(updates.customerEmail);
    }
    if (updates.customerPhone) {
      setClause.push(`customer_phone = $${paramCount++}`);
      values.push(updates.customerPhone);
    }
    if (updates.customerAddress) {
      setClause.push(`customer_address = $${paramCount++}`);
      values.push(updates.customerAddress);
    }
    if (updates.castleId) {
      setClause.push(`castle_id = $${paramCount++}`);
      values.push(updates.castleId);
    }
    if (updates.castleName) {
      setClause.push(`castle_name = $${paramCount++}`);
      values.push(updates.castleName);
    }
    if (updates.date) {
      setClause.push(`date = $${paramCount++}`);
      values.push(updates.date);
    }
    if (updates.paymentMethod) {
      setClause.push(`payment_method = $${paramCount++}`);
      values.push(updates.paymentMethod);
    }
    if (updates.totalPrice !== undefined) {
      setClause.push(`total_price = $${paramCount++}`);
      values.push(updates.totalPrice);
    }
    if (updates.deposit !== undefined) {
      setClause.push(`deposit = $${paramCount++}`);
      values.push(updates.deposit);
    }
    if (updates.status) {
      setClause.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.notes !== undefined) {
      setClause.push(`notes = $${paramCount++}`);
      values.push(updates.notes);
    }

    if (setClause.length === 0) return;

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE bookings SET ${setClause.join(', ')} WHERE id = $${paramCount}`;
    
    await client.query(query, values);
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export queryBookings as an alias for getBookingsByStatus
export const queryBookings = getBookingsByStatus;

// Query bookings with complex filters
export async function queryBookingsWithFilters(query: {
  dateFrom?: string;
  dateTo?: string;
  castleId?: string;
  status?: string | string[];
}): Promise<{ bookings: PendingBooking[] }> {
  const client = await getPool().connect();
  try {
    let sqlQuery = 'SELECT * FROM bookings WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    // Add date range filter
    if (query.dateFrom) {
      sqlQuery += ` AND date >= $${paramCount++}`;
      params.push(query.dateFrom);
    }
    if (query.dateTo) {
      sqlQuery += ` AND date <= $${paramCount++}`;
      params.push(query.dateTo);
    }

    // Add castle filter
    if (query.castleId) {
      sqlQuery += ` AND castle_id = $${paramCount++}`;
      params.push(parseInt(query.castleId));
    }

    // Add status filter
    if (query.status) {
      if (Array.isArray(query.status)) {
        if (query.status.length > 0) {
          const statusPlaceholders = query.status.map(() => `$${paramCount++}`).join(',');
          sqlQuery += ` AND status IN (${statusPlaceholders})`;
          params.push(...query.status);
        }
      } else {
        // Single status string
        sqlQuery += ` AND status = $${paramCount++}`;
        params.push(query.status);
      }
    }

    sqlQuery += ' ORDER BY created_at DESC';

    const result = await client.query(sqlQuery, params);
    
    const bookings = result.rows.map(row => ({
      id: row.id,
      bookingRef: row.booking_ref,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      customerAddress: row.customer_address,
      castleId: row.castle_id,
      castleName: row.castle_name,
      date: row.date,
      paymentMethod: row.payment_method,
      totalPrice: row.total_price,
      deposit: row.deposit,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return { bookings };
  } catch (error) {
    console.error('Error querying bookings with filters:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get booking statistics
export async function getBookingStats(query?: {
  dateFrom?: string;
  dateTo?: string;
  castleIds?: string[];
  statuses?: string[];
}): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  revenue: number;
}> {
  const client = await getPool().connect();
  try {
    let sqlQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_price ELSE 0 END), 0) as revenue
      FROM bookings
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    let whereClause = '';

    // Add date range filter
    if (query?.dateFrom) {
      whereClause += ` WHERE date >= $${paramCount++}`;
      params.push(query.dateFrom);
    }
    if (query?.dateTo) {
      whereClause += whereClause ? ` AND date <= $${paramCount++}` : ` WHERE date <= $${paramCount++}`;
      params.push(query.dateTo);
    }

    // Add castle filter
    if (query?.castleIds && query.castleIds.length > 0) {
      const castlePlaceholders = query.castleIds.map(() => `$${paramCount++}`).join(',');
      whereClause += whereClause ? ` AND castle_id IN (${castlePlaceholders})` : ` WHERE castle_id IN (${castlePlaceholders})`;
      params.push(...query.castleIds.map(id => parseInt(id)));
    }

    // Add status filter
    if (query?.statuses && query.statuses.length > 0) {
      const statusPlaceholders = query.statuses.map(() => `$${paramCount++}`).join(',');
      whereClause += whereClause ? ` AND status IN (${statusPlaceholders})` : ` WHERE status IN (${statusPlaceholders})`;
      params.push(...query.statuses);
    }

    sqlQuery += whereClause;

    const result = await client.query(sqlQuery, params);

    const stats = result.rows[0];
    return {
      total: parseInt(stats.total),
      pending: parseInt(stats.pending),
      confirmed: parseInt(stats.confirmed),
      completed: parseInt(stats.completed),
      revenue: parseInt(stats.revenue)
    };
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    throw error;
  } finally {
    client.release();
  }
}