/**
 * Database operations for bouncy castle booking management
 * Mock implementation for development - can be replaced with real database
 */

import { getPool } from './connection';
import { BookingStatus } from '@/lib/types/booking';
// import { log } from '@/lib/utils/logger'; // Temporarily disabled

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
  startDate?: Date;
  endDate?: Date;
  paymentMethod: string;
  totalPrice: number;
  deposit: number;
  status: BookingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Email automation tracking
  emailSent?: boolean;
  emailSentAt?: Date;
  manualConfirmation?: boolean;
  confirmedBy?: string;
  // Agreement tracking
  agreementSigned?: boolean;
  agreementSignedAt?: Date;
  agreementSignedBy?: string;
  // Enhanced audit trail
  agreementSignedMethod?: 'email' | 'manual' | 'physical' | 'admin_override';
  agreementIpAddress?: string;
  agreementUserAgent?: string;
  agreementPdfGenerated?: boolean;
  agreementPdfGeneratedAt?: Date;
  agreementEmailOpened?: boolean;
  agreementEmailOpenedAt?: Date;
  agreementViewed?: boolean;
  agreementViewedAt?: Date;
  auditTrail?: AuditTrailEntry[];
}

export interface AuditTrailEntry {
  timestamp: Date;
  action: string;
  actor: string; // 'customer', 'admin', 'system'
  actorDetails: string; // email, name, or 'system'
  method?: string; // 'email', 'manual', 'physical', 'admin_override'
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
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

    // Add email tracking fields for automated workflow
    await client.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS manual_confirmation BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS confirmed_by VARCHAR(255)
    `);

    // Add comprehensive agreement signing audit trail fields
    await client.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS agreement_signed_method VARCHAR(50), -- 'email', 'manual', 'physical', 'admin_override'
      ADD COLUMN IF NOT EXISTS agreement_ip_address INET, -- IP address for digital signatures
      ADD COLUMN IF NOT EXISTS agreement_user_agent TEXT, -- Browser/device info for digital signatures
      ADD COLUMN IF NOT EXISTS agreement_pdf_generated BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS agreement_pdf_generated_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS agreement_email_opened BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS agreement_email_opened_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS agreement_viewed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS agreement_viewed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS audit_trail JSONB DEFAULT '[]'::jsonb -- Complete audit log as JSON
    `);

    // Add simplified duplicate prevention: unique constraint for castle + date + active status
    // This prevents the most critical duplicate: same castle on same date
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_castle_date_active 
      ON bookings (castle_id, date) 
      WHERE status NOT IN ('expired')
    `);

    // Add performance indexes for frequently queried fields
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_status_date 
      ON bookings (status, date)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_customer_email 
      ON bookings (customer_email)
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

// Generate user-friendly booking reference (TS001, TS002, etc.) with automatic conflict resolution
async function generateFriendlyBookingRef(retryCount = 0): Promise<string> {
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
    
    // Add automatic gap detection and fixing for conflicts
    if (retryCount > 0) {
      console.warn('Booking reference conflict detected, retryCount:', retryCount);
      // Find the first available gap in the sequence
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
          console.log('Using gap in booking sequence:', `TS${i.toString().padStart(3, '0')}`);
          break;
        }
      }
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
        console.warn('All TS### numbers used, falling back to timestamp format');
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

// Legacy function removed - now using generateFriendlyBookingRef() consistently

// Fix sequence if it's out of sync
async function fixBookingSequence(): Promise<void> {
  const client = await getPool().connect();
  try {
    // Get the current maximum ID
    const maxIdResult = await client.query('SELECT COALESCE(MAX(id), 0) as max_id FROM bookings');
    const maxId = maxIdResult.rows[0].max_id;
    
    // Reset the sequence to the next value after the maximum ID
    await client.query(`SELECT setval('bookings_id_seq', $1, true)`, [maxId]);
    
    console.log('Fixed bookings sequence, maxId:', maxId);
  } catch (error) {
    console.error('Error fixing booking sequence:', error);
  } finally {
    client.release();
  }
}

// Create a new pending booking with automatic conflict resolution
export async function createPendingBooking(booking: Omit<PendingBooking, 'id' | 'bookingRef' | 'status' | 'createdAt' | 'updatedAt'>): Promise<PendingBooking> {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
  const client = await getPool().connect();
  try {
      // First attempt: try to fix the sequence if there might be an issue
      if (attempt === 0) {
    await fixBookingSequence();
      }
    
      const bookingRef = await generateFriendlyBookingRef(attempt);
    
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

      // Success! Return the booking
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
      // Email automation tracking
      emailSent: result.rows[0].email_sent || false,
      emailSentAt: result.rows[0].email_sent_at || null,
      manualConfirmation: result.rows[0].manual_confirmation || false,
      confirmedBy: result.rows[0].confirmed_by || null,
      // Agreement tracking
      agreementSigned: result.rows[0].agreement_signed || false,
      agreementSignedAt: result.rows[0].agreement_signed_at || null,
      agreementSignedBy: result.rows[0].agreement_signed_by || null,
      // Enhanced audit trail
      agreementSignedMethod: result.rows[0].agreement_signed_method || null,
      agreementIpAddress: result.rows[0].agreement_ip_address || null,
      agreementUserAgent: result.rows[0].agreement_user_agent || null,
      agreementPdfGenerated: result.rows[0].agreement_pdf_generated || false,
      agreementPdfGeneratedAt: result.rows[0].agreement_pdf_generated_at || null,
      agreementEmailOpened: result.rows[0].agreement_email_opened || false,
      agreementEmailOpenedAt: result.rows[0].agreement_email_opened_at || null,
      agreementViewed: result.rows[0].agreement_viewed || false,
      agreementViewedAt: result.rows[0].agreement_viewed_at || null,
      auditTrail: result.rows[0].audit_trail || []
    };

    } catch (error: any) {
      console.error(`Error creating pending booking (attempt ${attempt + 1}):`, error);
      
      // Handle duplicate booking constraint violation (not retryable)
      if (error.code === '23505' && error.constraint === 'idx_bookings_castle_date_active') {
        throw new Error('A booking already exists for this castle on this date. Please choose a different date or castle.');
      }
      
      // Handle booking reference constraint violation (retryable)
      if (error.code === '23505' && error.constraint === 'bookings_booking_ref_key') {
        if (attempt < maxRetries) {
          console.warn('Booking reference conflict, retrying', { attempt: attempt + 1 });
          // Don't return here, let the finally block release and continue the loop
        } else {
          throw new Error('Booking reference conflict persisted after multiple attempts. Please try again later.');
        }
      } else {
        // Other errors (not retryable)
    throw error;
      }
  } finally {
    client.release();
  }
}

  // This should never be reached, but just in case
  throw new Error('Failed to create booking after all retry attempts');
}

// Create a new confirmed booking with calendar event ID and automatic conflict resolution
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
  notes?: string;
}): Promise<any> {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
  const client = await getPool().connect();
  try {
      // Generate consistent booking reference using database sequence with retry context
      const bookingRef = await generateFriendlyBookingRef(attempt);
    
    const result = await client.query(`
      INSERT INTO bookings (
        booking_ref, customer_name, customer_email, customer_phone, 
        customer_address, castle_id, castle_name, date, payment_method, 
        total_price, deposit, status, notes, castle_type, start_date, 
        end_date, total_cost, calendar_event_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      bookingRef,
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

      // Success! Return the booking
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

    } catch (error: any) {
      console.error(`Error creating confirmed booking (attempt ${attempt + 1}):`, error);
      
      // Handle duplicate booking constraint violation (not retryable)
      if (error.code === '23505' && error.constraint === 'idx_bookings_castle_date_active') {
        throw new Error('A booking already exists for this castle on this date. Please choose a different date or castle.');
      }
      
      // Handle booking reference constraint violation (retryable)
      if (error.code === '23505' && error.constraint === 'bookings_booking_ref_key') {
        if (attempt < maxRetries) {
          console.warn('Booking reference conflict, retrying', { attempt: attempt + 1 });
          // Don't return here, let the finally block release and continue the loop
        } else {
          throw new Error('Booking reference conflict persisted after multiple attempts. Please try again later.');
        }
      } else {
        // Other errors (not retryable)
    throw error;
      }
  } finally {
    client.release();
  }
  }
  
  // This should never be reached, but just in case
  throw new Error('Failed to create confirmed booking after all retry attempts');
}

// Get all bookings by status
export async function getBookingsByStatus(status?: string): Promise<PendingBooking[]> {
  const client = await getPool().connect();
  try {
    let query = `SELECT 
      id, booking_ref, customer_name, customer_email, customer_phone, customer_address,
      castle_id, castle_name, date, payment_method, total_price, deposit, status, notes,
      created_at, updated_at
    FROM bookings`;
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
      updatedAt: row.updated_at,
      // Email automation tracking - default values since columns don't exist yet
      emailSent: false,
      emailSentAt: undefined,
      manualConfirmation: false,
      confirmedBy: undefined,
      // Agreement tracking - default values since columns don't exist yet
      agreementSigned: false,
      agreementSignedAt: undefined,
      agreementSignedBy: undefined,
      // Enhanced audit trail - default values since columns don't exist yet
      agreementSignedMethod: undefined,
      agreementIpAddress: undefined,
      agreementUserAgent: undefined,
      agreementPdfGenerated: false,
      agreementPdfGeneratedAt: undefined,
      agreementEmailOpened: false,
      agreementEmailOpenedAt: undefined,
      agreementViewed: false,
      agreementViewedAt: undefined,
      auditTrail: undefined
    }));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Update booking status with proper flow validation
export async function updateBookingStatus(id: number, status: BookingStatus): Promise<void> {
  const client = await getPool().connect();
  try {
    console.log('Update booking status', 'system', { bookingId: id, newStatus: status });
    
    // Get current booking status to validate transition
    const currentBookingResult = await client.query('SELECT status FROM bookings WHERE id = $1', [id]);
    if (currentBookingResult.rows.length === 0) {
      throw new Error(`Booking with ID ${id} not found`);
    }
    
    const currentStatus = currentBookingResult.rows[0].status;
    
    // Validate status transition flow: pending → confirmed → completed
    if (!isValidStatusTransition(currentStatus, status)) {
      throw new Error(`Invalid status transition from '${currentStatus}' to '${status}'. Valid flow: pending → confirmed → completed`);
    }
    
    const result = await client.query(
      'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );
    console.log('update', 0, { operation: 'updateBookingStatus', rowsAffected: result.rowCount });
    console.log('Status transition completed', { bookingId: id, from: currentStatus, to: status });
  } catch (error) {
    console.error('Error in updateBookingStatus', error instanceof Error ? error : new Error(String(error)), { bookingId: id, targetStatus: status });
    throw error;
  } finally {
    client.release();
  }
}

// Validate proper status transition flow
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    'pending': ['confirmed', 'expired'], // Pending can go to confirmed or expired
    'confirmed': ['completed', 'expired'], // Confirmed can go to completed or expired
    'completed': [], // Completed is final
    'expired': [] // Expired is final
  };
  
  // Allow same status (idempotent updates)
  if (currentStatus === newStatus) {
    return true;
  }
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

// Update booking agreement signing
export async function updateBookingAgreement(id: number, agreementSigned: boolean, agreementSignedAt: string, agreementSignedBy?: string): Promise<void> {
  const client = await getPool().connect();
  try {
    console.log('Update booking agreement', agreementSignedBy || 'system', { bookingId: id, signed: agreementSigned });
    const result = await client.query(
      'UPDATE bookings SET agreement_signed = $1, agreement_signed_at = $2, agreement_signed_by = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [agreementSigned, agreementSignedAt, agreementSignedBy || null, id]
    );
    console.log('update', 0, { operation: 'updateBookingAgreement', rowsAffected: result.rowCount });
  } catch (error) {
    console.error('Error in updateBookingAgreement', error instanceof Error ? error : new Error(String(error)), { bookingId: id });
    throw error;
  } finally {
    client.release();
  }
}

// Update booking email tracking
export async function updateBookingEmailStatus(id: number, emailSent: boolean, emailSentAt?: Date): Promise<void> {
  const client = await getPool().connect();
  try {
    console.log('Update booking email status', { bookingId: id, emailSent });
    const result = await client.query(
      'UPDATE bookings SET email_sent = $1, email_sent_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [emailSent, emailSentAt || new Date(), id]
    );
    console.log('update', 0, { operation: 'updateBookingEmailStatus', rowsAffected: result.rowCount });
  } catch (error) {
    console.error('Error in updateBookingEmailStatus', error instanceof Error ? error : new Error(String(error)), { bookingId: id });
    throw error;
  } finally {
    client.release();
  }
}

// Update booking manual confirmation tracking
export async function updateBookingConfirmation(id: number, manualConfirmation: boolean, confirmedBy?: string): Promise<void> {
  const client = await getPool().connect();
  try {
    console.log('Update booking confirmation', confirmedBy || 'system', { bookingId: id, manual: manualConfirmation });
    
    // Add audit trail entry
    if (manualConfirmation && confirmedBy) {
      await addAuditTrailEntry(id, {
        action: 'manual_confirmation',
        actor: 'admin',
        actorDetails: confirmedBy,
        method: 'admin_override',
        details: { reason: 'Manual confirmation by admin' }
      });
    }
    
    const result = await client.query(
      'UPDATE bookings SET manual_confirmation = $1, confirmed_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [manualConfirmation, confirmedBy || null, id]
    );
    console.log('update', 0, { operation: 'updateBookingConfirmation', rowsAffected: result.rowCount });
  } catch (error) {
    console.error('Error in updateBookingConfirmation', error instanceof Error ? error : new Error(String(error)), { bookingId: id });
    throw error;
  } finally {
    client.release();
  }
}

// Add entry to audit trail
export async function addAuditTrailEntry(
  bookingId: number, 
  entry: Omit<AuditTrailEntry, 'timestamp'>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const client = await getPool().connect();
  try {
    const auditEntry: AuditTrailEntry = {
      ...entry,
      timestamp: new Date(),
      ipAddress: ipAddress || entry.ipAddress,
      userAgent: userAgent || entry.userAgent
    };

    console.log('Add audit trail entry', auditEntry.actor, { bookingId, action: auditEntry.action });

    await client.query(`
      UPDATE bookings 
      SET audit_trail = COALESCE(audit_trail, '[]'::jsonb) || $1::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [JSON.stringify(auditEntry), bookingId]);

  } catch (error) {
    console.error('Error adding audit trail entry', error instanceof Error ? error : new Error(String(error)), { bookingId });
    throw error;
  } finally {
    client.release();
  }
}

// Enhanced agreement signing function with full audit trail
export async function updateBookingAgreementSigning(
  id: number, 
  agreementSigned: boolean, 
  agreementSignedAt: string, 
  agreementSignedBy: string,
  method: 'email' | 'manual' | 'physical' | 'admin_override',
  ipAddress?: string,
  userAgent?: string,
  additionalDetails?: Record<string, any>
): Promise<void> {
  const client = await getPool().connect();
  try {
    console.log('Update booking agreement signing', agreementSignedBy, { bookingId: id, method, signed: agreementSigned });
    
    // Update basic agreement fields
    const result = await client.query(
      `UPDATE bookings 
       SET agreement_signed = $1, 
           agreement_signed_at = $2, 
           agreement_signed_by = $3,
           agreement_signed_method = $4,
           agreement_ip_address = $5,
           agreement_user_agent = $6,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7`,
      [agreementSigned, agreementSignedAt, agreementSignedBy, method, ipAddress || null, userAgent || null, id]
    );

    // Add comprehensive audit trail entry
    await addAuditTrailEntry(id, {
      action: 'agreement_signed',
      actor: method === 'admin_override' ? 'admin' : 'customer',
      actorDetails: agreementSignedBy,
      method: method,
      details: {
        agreementSigned,
        signedAt: agreementSignedAt,
        ...additionalDetails
      }
    }, ipAddress, userAgent);

    console.log('update', 0, { operation: 'updateBookingAgreementSigning', rowsAffected: result.rowCount });
  } catch (error) {
    console.error('Error in updateBookingAgreementSigning', error instanceof Error ? error : new Error(String(error)), { bookingId: id });
    throw error;
  } finally {
    client.release();
  }
}

// Get booking by ID for email sending
export async function getBookingById(id: number): Promise<PendingBooking | null> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      SELECT b.*, c.name as castle_name 
      FROM bookings b 
      LEFT JOIN castles c ON b.castle_id = c.id 
      WHERE b.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
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
      updatedAt: row.updated_at,
      // Email automation tracking
      emailSent: row.email_sent || false,
      emailSentAt: row.email_sent_at || null,
      manualConfirmation: row.manual_confirmation || false,
      confirmedBy: row.confirmed_by || null,
      // Agreement tracking
      agreementSigned: row.agreement_signed || false,
      agreementSignedAt: row.agreement_signed_at || null,
      agreementSignedBy: row.agreement_signed_by || null,
      // Enhanced audit trail
      agreementSignedMethod: row.agreement_signed_method || null,
      agreementIpAddress: row.agreement_ip_address || null,
      agreementUserAgent: row.agreement_user_agent || null,
      agreementPdfGenerated: row.agreement_pdf_generated || false,
      agreementPdfGeneratedAt: row.agreement_pdf_generated_at || null,
      agreementEmailOpened: row.agreement_email_opened || false,
      agreementEmailOpenedAt: row.agreement_email_opened_at || null,
      agreementViewed: row.agreement_viewed || false,
      agreementViewedAt: row.agreement_viewed_at || null,
      auditTrail: row.audit_trail || []
    };
  } catch (error) {
    console.error('Error getting booking by ID', error instanceof Error ? error : new Error(String(error)), { bookingId: id });
    return null;
  } finally {
    client.release();
  }
}

// Track agreement email interactions
export async function trackAgreementEmailInteraction(
  bookingId: number,
  action: 'email_sent' | 'email_opened' | 'agreement_viewed' | 'pdf_generated',
  additionalDetails?: Record<string, any>
): Promise<void> {
  const client = await getPool().connect();
  try {
    const timestamp = new Date();
    
    // Update relevant tracking fields
    switch (action) {
      case 'email_sent':
        await client.query(
          'UPDATE bookings SET email_sent = true, email_sent_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [timestamp, bookingId]
        );
        break;
      case 'email_opened':
        await client.query(
          'UPDATE bookings SET agreement_email_opened = true, agreement_email_opened_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [timestamp, bookingId]
        );
        break;
      case 'agreement_viewed':
        await client.query(
          'UPDATE bookings SET agreement_viewed = true, agreement_viewed_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [timestamp, bookingId]
        );
        break;
      case 'pdf_generated':
        await client.query(
          'UPDATE bookings SET agreement_pdf_generated = true, agreement_pdf_generated_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [timestamp, bookingId]
        );
        break;
    }

    // Add audit trail entry
    await addAuditTrailEntry(bookingId, {
      action: action,
      actor: 'customer',
      actorDetails: 'email_interaction',
      details: additionalDetails
    });

    console.log('Tracked agreement email interaction', { bookingId, action });
  } catch (error) {
    console.error('Error tracking email interaction', error instanceof Error ? error : new Error(String(error)), { bookingId });
    throw error;
  } finally {
    client.release();
  }
}

// Automatically update confirmed bookings to completed after their end date
export async function updateExpiredBookings(): Promise<void> {
  const client = await getPool().connect();
  try {
    // Update confirmed bookings where the end date has passed
    const result = await client.query(`
      UPDATE bookings 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
      WHERE status = 'confirmed' 
      AND end_date IS NOT NULL 
      AND end_date < CURRENT_TIMESTAMP
    `);
    
    if (result.rowCount && result.rowCount > 0) {
      console.log('Auto-completed expired bookings', { transitionsCompleted: result.rowCount });
    }
  } catch (error) {
    console.error('Error updating expired bookings', error instanceof Error ? error : new Error(String(error)));
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
    console.error('Error deleting booking', error instanceof Error ? error : new Error(String(error)), { bookingId: id });
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
    console.error('Error updating booking', error instanceof Error ? error : new Error(String(error)), { bookingId: id });
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
    let sqlQuery = `SELECT 
      id, booking_ref, customer_name, customer_email, customer_phone, customer_address,
      castle_id, castle_name, date, payment_method, total_price, deposit, status, notes,
      created_at, updated_at
    FROM bookings WHERE 1=1`;
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
    console.error('Error querying bookings with filters', error instanceof Error ? error : new Error(String(error)), { query });
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
    console.error('Error fetching booking stats', error instanceof Error ? error : new Error(String(error)), { query });
    throw error;
  } finally {
    client.release();
  }
}