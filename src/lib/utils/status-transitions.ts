/**
 * Status Transitions Utility
 * Handles automatic booking status transitions based on calendar events and current time
 */

import { getCalendarService } from '@/lib/calendar/google-calendar';
import { getBookingsByStatus, updateBookingStatus } from '@/lib/database/bookings';
import { BookingStatus } from '@/lib/types/booking';

export interface StatusTransitionResult {
  bookingId: number;
  bookingRef: string;
  previousStatus: BookingStatus;
  newStatus: BookingStatus;
  reason: string;
  transitionedAt: Date;
}

export interface StatusTransitionSummary {
  totalChecked: number;
  transitionsCompleted: number;
  transitions: StatusTransitionResult[];
  errors: Array<{
    bookingId: number;
    error: string;
  }>;
}

/**
 * Check if a booking should transition from confirmed to completed
 * based on calendar event end time vs current time
 */
export async function checkBookingForCompletion(booking: {
  id: number;
  bookingRef: string;
  status: BookingStatus;
  date: string;
  endDate?: Date;
}): Promise<StatusTransitionResult | null> {
  try {
    // Only check confirmed bookings
    if (booking.status !== 'confirmed') {
      return null;
    }

    const now = new Date();
    
    // Method 1: If booking has endDate, use it directly
    if (booking.endDate) {
      const endTime = new Date(booking.endDate);
      if (now > endTime) {
        return {
          bookingId: booking.id,
          bookingRef: booking.bookingRef,
          previousStatus: 'confirmed',
          newStatus: 'completed',
          reason: `Event ended at ${endTime.toISOString()}`,
          transitionedAt: now
        };
      }
      return null;
    }

    // Method 2: For database bookings, we rely on endDate or fallback to estimated end time
    // (Calendar event lookup removed as database bookings don't have calendarEventId)

    // Method 3: Fallback - assume booking ends at 5 PM on booking date
    const bookingDate = new Date(booking.date);
    const assumedEndTime = new Date(bookingDate);
    assumedEndTime.setHours(17, 0, 0, 0); // 5 PM
    
    if (now > assumedEndTime) {
      return {
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        previousStatus: 'confirmed',
        newStatus: 'completed',
        reason: `Assumed event ended at ${assumedEndTime.toISOString()} (default 5 PM)`,
        transitionedAt: now
      };
    }

    return null;
  } catch (error) {
    console.error(`Error checking booking ${booking.id} for completion:`, error);
    throw error;
  }
}

/**
 * Check all confirmed bookings and transition to completed if their events have ended
 */
export async function processAutomaticStatusTransitions(): Promise<StatusTransitionSummary> {
  const summary: StatusTransitionSummary = {
    totalChecked: 0,
    transitionsCompleted: 0,
    transitions: [],
    errors: []
  };

  try {
    // Get all confirmed bookings
    const confirmedBookings = await getBookingsByStatus('confirmed');
    summary.totalChecked = confirmedBookings.length;

    console.log(`Checking ${confirmedBookings.length} confirmed bookings for status transitions...`);

    // Process each booking
    for (const booking of confirmedBookings) {
      try {
        const transition = await checkBookingForCompletion(booking);
        
        if (transition) {
          // Update booking status in database
          await updateBookingStatus(booking.id, 'completed');
          
          summary.transitions.push(transition);
          summary.transitionsCompleted++;
          
          console.log(`✅ Transitioned booking ${booking.bookingRef} from confirmed to completed`);
        }
      } catch (error: any) {
        console.error(`❌ Error processing booking ${booking.id}:`, error);
        summary.errors.push({
          bookingId: booking.id,
          error: error.message || 'Unknown error'
        });
      }
    }

    console.log(`Status transition check completed. ${summary.transitionsCompleted}/${summary.totalChecked} bookings transitioned.`);
    
    return summary;
  } catch (error) {
    console.error('Error during automatic status transitions:', error);
    throw error;
  }
}

/**
 * Check if a specific time range has passed (utility function)
 */
export function hasTimeRangePassed(startTime: string | Date, endTime: string | Date, referenceTime?: Date): boolean {
  const now = referenceTime || new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return now > end;
}

/**
 * Get upcoming bookings that will need status transitions soon
 * Useful for scheduling or preview purposes
 */
export async function getUpcomingStatusTransitions(hoursAhead: number = 24): Promise<Array<{
  bookingId: number;
  bookingRef: string;
  expectedTransitionTime: Date;
  timeUntilTransition: number; // minutes
}>> {
  try {
    const confirmedBookings = await getBookingsByStatus('confirmed');
    const now = new Date();
    const cutoffTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));

    const upcoming = [];

    for (const booking of confirmedBookings) {
      let eventEndTime: Date | null = null;

      // Determine event end time using same logic as checkBookingForCompletion
      if (booking.endDate) {
        eventEndTime = new Date(booking.endDate);
      }
      // Skip calendar event lookup for database bookings as they don't have calendarEventId

      // Fallback to assumed end time
      if (!eventEndTime) {
        const bookingDate = new Date(booking.date);
        eventEndTime = new Date(bookingDate);
        eventEndTime.setHours(17, 0, 0, 0); // 5 PM
      }

      // Check if this transition will happen within our time window
      if (eventEndTime > now && eventEndTime <= cutoffTime) {
        const timeUntilTransition = Math.round((eventEndTime.getTime() - now.getTime()) / (1000 * 60)); // minutes
        
        upcoming.push({
          bookingId: booking.id,
          bookingRef: booking.bookingRef,
          expectedTransitionTime: eventEndTime,
          timeUntilTransition
        });
      }
    }

    // Sort by transition time (soonest first)
    upcoming.sort((a, b) => a.expectedTransitionTime.getTime() - b.expectedTransitionTime.getTime());

    return upcoming;
  } catch (error) {
    console.error('Error getting upcoming status transitions:', error);
    throw error;
  }
}

/**
 * Force transition a booking to completed status with audit logging
 */
export async function forceCompleteBooking(
  bookingId: number, 
  reason: string, 
  adminUser?: string
): Promise<StatusTransitionResult> {
  try {
    const bookings = await getBookingsByStatus();
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    if (booking.status === 'completed') {
      throw new Error(`Booking ${booking.bookingRef} is already completed`);
    }

    await updateBookingStatus(bookingId, 'completed');

    const transitionResult: StatusTransitionResult = {
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      previousStatus: booking.status,
      newStatus: 'completed',
      reason: `Manual completion: ${reason}${adminUser ? ` (by ${adminUser})` : ''}`,
      transitionedAt: new Date()
    };

    console.log(`✅ Manually completed booking ${booking.bookingRef}: ${reason}`);
    
    return transitionResult;
  } catch (error) {
    console.error(`Error force completing booking ${bookingId}:`, error);
    throw error;
  }
}

/**
 * Comprehensive completion check for both database bookings and calendar events
 * This function can be called from a cron job or scheduled task
 */
export async function comprehensiveCompletionCheck(): Promise<{
  databaseCompleted: number;
  calendarCompleted: number;
  totalCompleted: number;
  errors: string[];
}> {
  const result = {
    databaseCompleted: 0,
    calendarCompleted: 0,
    totalCompleted: 0,
    errors: [] as string[]
  };

  try {
    console.log('🔄 Starting comprehensive completion check...');

    // Part 1: Check database bookings
    try {
      const dbSummary = await processAutomaticStatusTransitions();
      result.databaseCompleted = dbSummary.transitionsCompleted;
      
      if (dbSummary.errors.length > 0) {
        result.errors.push(...dbSummary.errors.map(err => `Database booking ${err.bookingId}: ${err.error}`));
      }
      
      console.log(`✅ Database completion check: ${result.databaseCompleted} bookings completed`);
    } catch (error) {
      const errorMsg = `Database completion check failed: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    // Part 2: Check calendar events
    try {
      const { getCalendarService } = await import('@/lib/calendar/google-calendar');
      const calendarService = getCalendarService();
      
      const calendarResult = await calendarService.checkAndMarkCompletedEvents();
      result.calendarCompleted = calendarResult.completed;
      
      if (calendarResult.errors.length > 0) {
        result.errors.push(...calendarResult.errors.map(err => `Calendar event ${err.eventId}: ${err.error}`));
      }
      
      console.log(`✅ Calendar completion check: ${result.calendarCompleted} events completed`);
    } catch (error) {
      const errorMsg = `Calendar completion check failed: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    result.totalCompleted = result.databaseCompleted + result.calendarCompleted;
    
    console.log(`🎉 Comprehensive completion check finished: ${result.totalCompleted} total items completed`);
    
    if (result.errors.length > 0) {
      console.error('⚠️ Errors during completion check:', result.errors);
    }

    return result;
  } catch (error) {
    console.error('💥 Comprehensive completion check failed:', error);
    throw error;
  }
}

/**
 * Scheduled task function for automatic completion checks
 * This can be called by a cron job or scheduled task
 */
export async function scheduledCompletionCheck(): Promise<void> {
  try {
    console.log('⏰ Running scheduled completion check...');
    
    const result = await comprehensiveCompletionCheck();
    
    // Log results for monitoring
    console.log('📊 Scheduled completion check results:', {
      timestamp: new Date().toISOString(),
      databaseCompleted: result.databaseCompleted,
      calendarCompleted: result.calendarCompleted,
      totalCompleted: result.totalCompleted,
      errorCount: result.errors.length
    });
    
    // In a production environment, you might want to send notifications
    // or log to a monitoring service when items are completed
    
  } catch (error) {
    console.error('💥 Scheduled completion check failed:', error);
    // In production, you might want to send alerts or notifications here
  }
}