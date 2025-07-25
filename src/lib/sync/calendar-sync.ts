import { getCalendarService, BookingEventData } from '@/lib/calendar/google-calendar';
import { calendar_v3 } from 'googleapis';

// Types for sync operations
export interface BookingRecord {
  id: string;
  calendarEventId?: string;
  customerName: string;
  contactDetails: {
    email?: string;
    phone?: string;
  };
  location: string;
  notes?: string;
  duration: {
    start: string;
    end: string;
  };
  cost?: number;
  paymentMethod?: 'cash' | 'card';
  bouncyCastleType?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  lastSynced?: string;
  syncStatus: 'synced' | 'pending_sync' | 'sync_failed' | 'conflict';
  createdAt: string;
  updatedAt: string;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  direction: 'to_calendar' | 'from_calendar' | 'bidirectional';
  bookingId: string;
  calendarEventId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  attempts: number;
  lastAttempt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface SyncConflict {
  bookingId: string;
  calendarEventId: string;
  conflictType: 'time_mismatch' | 'details_mismatch' | 'both_modified';
  localData: BookingRecord;
  calendarData: calendar_v3.Schema$Event;
  detectedAt: string;
  resolved: boolean;
  resolution?: 'use_local' | 'use_calendar' | 'manual';
}

export class CalendarSyncService {
  private calendarService = getCalendarService();
  private syncOperations: Map<string, SyncOperation> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();

  // Sync a booking to Google Calendar
  async syncBookingToCalendar(booking: BookingRecord): Promise<{ success: boolean; calendarEventId?: string; error?: string }> {
    try {
      const bookingData: BookingEventData = {
        customerName: booking.customerName,
        contactDetails: booking.contactDetails,
        location: booking.location,
        notes: booking.notes,
        duration: booking.duration,
        cost: booking.cost,
        paymentMethod: booking.paymentMethod,
        bouncyCastleType: booking.bouncyCastleType
      };

      let calendarEventId: string;

      if (booking.calendarEventId) {
        // Update existing calendar event
        await this.calendarService.updateBookingEvent(booking.calendarEventId, bookingData);
        calendarEventId = booking.calendarEventId;
        console.log(`✅ Updated calendar event ${calendarEventId} for booking ${booking.id}`);
      } else {
        // Create new calendar event
        calendarEventId = await this.calendarService.createBookingEvent(bookingData);
        console.log(`✅ Created calendar event ${calendarEventId} for booking ${booking.id}`);
      }

      // Update booking record with calendar event ID and sync status
      await this.updateBookingSyncStatus(booking.id, {
        calendarEventId,
        syncStatus: 'synced',
        lastSynced: new Date().toISOString()
      });

      return { success: true, calendarEventId };
    } catch (error) {
      console.error(`❌ Failed to sync booking ${booking.id} to calendar:`, error);
      
      await this.updateBookingSyncStatus(booking.id, {
        syncStatus: 'sync_failed',
        lastSynced: new Date().toISOString()
      });

      return { success: false, error: (error as Error).message };
    }
  }

  // Sync a calendar event back to booking record
  async syncCalendarEventToBooking(
    calendarEvent: calendar_v3.Schema$Event, 
    bookingId?: string
  ): Promise<{ success: boolean; booking?: BookingRecord; error?: string }> {
    try {
      if (!calendarEvent.id) {
        throw new Error('Calendar event missing ID');
      }

      // Extract booking data from calendar event
      const booking = this.parseCalendarEventToBooking(calendarEvent, bookingId);
      
      if (bookingId) {
        // Update existing booking
        await this.updateBookingFromCalendar(bookingId, booking);
        console.log(`✅ Updated booking ${bookingId} from calendar event ${calendarEvent.id}`);
      } else {
        // Create new booking from calendar event
        const newBooking = await this.createBookingFromCalendar(booking);
        console.log(`✅ Created booking ${newBooking.id} from calendar event ${calendarEvent.id}`);
        booking.id = newBooking.id;
      }

      return { success: true, booking };
    } catch (error) {
      console.error(`❌ Failed to sync calendar event ${calendarEvent.id} to booking:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Bidirectional sync - compare and resolve differences
  async performBidirectionalSync(booking: BookingRecord): Promise<{ success: boolean; conflicts?: SyncConflict; error?: string }> {
    try {
      if (!booking.calendarEventId) {
        // No calendar event exists, sync to calendar
        const result = await this.syncBookingToCalendar(booking);
        return { success: result.success, error: result.error };
      }

      // Get current calendar event
      const calendarEvent = await this.calendarService.getEvent(booking.calendarEventId);
      
      if (!calendarEvent) {
        // Calendar event was deleted, mark booking as needs re-sync
        await this.updateBookingSyncStatus(booking.id, {
          calendarEventId: undefined,
          syncStatus: 'pending_sync'
        });
        
        // Recreate calendar event
        const result = await this.syncBookingToCalendar(booking);
        return { success: result.success, error: result.error };
      }

      // Check for conflicts
      const conflict = this.detectConflicts(booking, calendarEvent);
      
      if (conflict) {
        // Store conflict for manual resolution
        this.conflicts.set(booking.id, conflict);
        
        await this.updateBookingSyncStatus(booking.id, {
          syncStatus: 'conflict'
        });
        
        return { success: false, conflicts: conflict };
      }

      // No conflicts, ensure both are in sync
      const lastBookingUpdate = new Date(booking.updatedAt);
      const lastCalendarUpdate = new Date(calendarEvent.updated || '');

      if (lastBookingUpdate > lastCalendarUpdate) {
        // Booking is newer, sync to calendar
        const result = await this.syncBookingToCalendar(booking);
        return { success: result.success, error: result.error };
      } else if (lastCalendarUpdate > lastBookingUpdate) {
        // Calendar is newer, sync to booking
        const result = await this.syncCalendarEventToBooking(calendarEvent, booking.id);
        return { success: result.success, error: result.error };
      } else {
        // Both are up to date
        await this.updateBookingSyncStatus(booking.id, {
          syncStatus: 'synced',
          lastSynced: new Date().toISOString()
        });
        return { success: true };
      }
    } catch (error) {
      console.error(`❌ Failed bidirectional sync for booking ${booking.id}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Delete calendar event when booking is cancelled/deleted
  async deleteCalendarEvent(booking: BookingRecord): Promise<{ success: boolean; error?: string }> {
    try {
      if (!booking.calendarEventId) {
        return { success: true }; // Nothing to delete
      }

      await this.calendarService.deleteBookingEvent(booking.calendarEventId);
      
      await this.updateBookingSyncStatus(booking.id, {
        calendarEventId: undefined,
        syncStatus: 'synced',
        lastSynced: new Date().toISOString()
      });

      console.log(`✅ Deleted calendar event ${booking.calendarEventId} for booking ${booking.id}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to delete calendar event for booking ${booking.id}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Resolve sync conflicts
  async resolveConflict(
    bookingId: string, 
    resolution: 'use_local' | 'use_calendar' | 'manual',
    manualData?: Partial<BookingRecord>
  ): Promise<{ success: boolean; error?: string }> {
    const conflict = this.conflicts.get(bookingId);
    if (!conflict) {
      return { success: false, error: 'Conflict not found' };
    }

    try {
      switch (resolution) {
        case 'use_local':
          await this.syncBookingToCalendar(conflict.localData);
          break;
        
        case 'use_calendar':
          await this.syncCalendarEventToBooking(conflict.calendarData, bookingId);
          break;
        
        case 'manual':
          if (manualData) {
            const mergedBooking = { ...conflict.localData, ...manualData };
            await this.syncBookingToCalendar(mergedBooking);
          }
          break;
      }

      // Mark conflict as resolved
      conflict.resolved = true;
      conflict.resolution = resolution;
      this.conflicts.set(bookingId, conflict);

      console.log(`✅ Resolved conflict for booking ${bookingId} using ${resolution}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to resolve conflict for booking ${bookingId}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Get sync status and conflicts
  getSyncStatus(): {
    pendingOperations: SyncOperation[];
    conflicts: SyncConflict[];
    stats: {
      totalSyncOperations: number;
      successfulSyncs: number;
      failedSyncs: number;
      activeConflicts: number;
    };
  } {
    const operations = Array.from(this.syncOperations.values());
    const conflicts = Array.from(this.conflicts.values());

    return {
      pendingOperations: operations.filter(op => op.status === 'pending' || op.status === 'in_progress'),
      conflicts: conflicts.filter(c => !c.resolved),
      stats: {
        totalSyncOperations: operations.length,
        successfulSyncs: operations.filter(op => op.status === 'completed').length,
        failedSyncs: operations.filter(op => op.status === 'failed').length,
        activeConflicts: conflicts.filter(c => !c.resolved).length
      }
    };
  }

  // Helper methods
  private detectConflicts(booking: BookingRecord, calendarEvent: calendar_v3.Schema$Event): SyncConflict | null {
    const conflicts: string[] = [];

    // Check time conflicts
    const bookingStart = new Date(booking.duration.start);
    const bookingEnd = new Date(booking.duration.end);
    const calendarStart = new Date(calendarEvent.start?.dateTime || '');
    const calendarEnd = new Date(calendarEvent.end?.dateTime || '');

    if (bookingStart.getTime() !== calendarStart.getTime() || bookingEnd.getTime() !== calendarEnd.getTime()) {
      conflicts.push('time_mismatch');
    }

    // Check details conflicts
    const extractedName = this.extractCustomerNameFromSummary(calendarEvent.summary || '');
    if (booking.customerName !== extractedName || booking.location !== calendarEvent.location) {
      conflicts.push('details_mismatch');
    }

    if (conflicts.length === 0) {
      return null;
    }

    return {
      bookingId: booking.id,
      calendarEventId: calendarEvent.id!,
      conflictType: conflicts.length > 1 ? 'both_modified' : conflicts[0] as any,
      localData: booking,
      calendarData: calendarEvent,
      detectedAt: new Date().toISOString(),
      resolved: false
    };
  }

  private parseCalendarEventToBooking(calendarEvent: calendar_v3.Schema$Event, bookingId?: string): BookingRecord {
    const customerName = this.extractCustomerNameFromSummary(calendarEvent.summary || 'Unknown Customer');
    
    return {
      id: bookingId || `cal-${calendarEvent.id}`,
      calendarEventId: calendarEvent.id || undefined,
      customerName,
      contactDetails: {
        email: calendarEvent.attendees?.[0]?.email || undefined,
        phone: this.extractPhoneFromDescription(calendarEvent.description || '')
      },
      location: calendarEvent.location || '',
      notes: this.extractNotesFromDescription(calendarEvent.description || ''),
      duration: {
        start: calendarEvent.start?.dateTime || '',
        end: calendarEvent.end?.dateTime || ''
      },
      cost: this.extractCostFromDescription(calendarEvent.description || ''),
      paymentMethod: this.extractPaymentMethodFromDescription(calendarEvent.description || ''),
      bouncyCastleType: this.extractCastleTypeFromDescription(calendarEvent.description || ''),
      status: 'confirmed',
      syncStatus: 'synced',
      lastSynced: new Date().toISOString(),
      createdAt: calendarEvent.created || new Date().toISOString(),
      updatedAt: calendarEvent.updated || new Date().toISOString()
    };
  }

  private extractCustomerNameFromSummary(summary: string): string {
    const match = summary.match(/🏰\s(.+?)\s-/);
    return match ? match[1] : summary.replace('🏰 ', '').split(' - ')[0];
  }

  private extractPhoneFromDescription(description: string): string | undefined {
    const match = description.match(/Phone:\s(.+)/);
    return match ? match[1].trim() : undefined;
  }

  private extractNotesFromDescription(description: string): string | undefined {
    const match = description.match(/Notes:\s([\s\S]*?)$/m);
    return match ? match[1].trim() : undefined;
  }

  private extractCostFromDescription(description: string): number | undefined {
    const match = description.match(/Cost:\s£(\d+(?:\.\d{2})?)/);
    return match ? parseFloat(match[1]) : undefined;
  }

  private extractPaymentMethodFromDescription(description: string): 'cash' | 'card' | undefined {
    if (description.includes('Payment: Cash')) return 'cash';
    if (description.includes('Payment: Card')) return 'card';
    return undefined;
  }

  private extractCastleTypeFromDescription(description: string): string | undefined {
    const match = description.match(/Castle Type:\s(.+)/);
    return match ? match[1].trim() : undefined;
  }

  // These would integrate with your actual database
  private async updateBookingSyncStatus(bookingId: string, updates: Partial<BookingRecord>): Promise<void> {
    // In a real implementation, this would update the database
    console.log(`Updating booking ${bookingId}:`, updates);
  }

  private async updateBookingFromCalendar(bookingId: string, bookingData: BookingRecord): Promise<void> {
    // In a real implementation, this would update the database
    console.log(`Updating booking ${bookingId} from calendar:`, bookingData);
  }

  private async createBookingFromCalendar(bookingData: BookingRecord): Promise<BookingRecord> {
    // In a real implementation, this would create a new booking in the database
    const newBooking = { ...bookingData, id: `booking-${Date.now()}` };
    console.log(`Creating booking from calendar:`, newBooking);
    return newBooking;
  }
}

// Singleton instance
let syncService: CalendarSyncService | null = null;

export function getSyncService(): CalendarSyncService {
  if (!syncService) {
    syncService = new CalendarSyncService();
  }
  return syncService;
}