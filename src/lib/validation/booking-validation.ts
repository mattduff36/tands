import { z } from 'zod';

// Booking validation schema
export const BookingSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  customerEmail: z.string().email('Please enter a valid email address'),
  customerPhone: z.string().min(10, 'Please enter a valid phone number'),
  date: z.string().refine(date => {
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  }, 'Booking date cannot be in the past'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time'),
  castle: z.string().min(1, 'Please select a bouncy castle'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  address: z.string().min(10, 'Please enter a complete address'),
  totalPrice: z.number().int('Price must be a whole number').min(0, 'Total price must be positive'),
  deposit: z.number().int('Deposit must be a whole number').min(0, 'Deposit must be positive'),
  status: z.enum(['pending', 'confirmed', 'completed', 'expired']),
  notes: z.string().optional()
}).refine(data => {
  // Validate that end time is after start time
  const startTime = new Date(`1970-01-01T${data.startTime}:00`);
  const endTime = new Date(`1970-01-01T${data.endTime}:00`);
  return endTime > startTime;
}, {
  message: 'End time must be after start time',
  path: ['endTime']
}).refine(data => {
  // Validate minimum booking duration (2 hours)
  const startTime = new Date(`1970-01-01T${data.startTime}:00`);
  const endTime = new Date(`1970-01-01T${data.endTime}:00`);
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  return durationHours >= 2;
}, {
  message: 'Minimum booking duration is 2 hours',
  path: ['endTime']
}).refine(data => {
  // Validate maximum booking duration (12 hours)
  const startTime = new Date(`1970-01-01T${data.startTime}:00`);
  const endTime = new Date(`1970-01-01T${data.endTime}:00`);
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  return durationHours <= 12;
}, {
  message: 'Maximum booking duration is 12 hours',
  path: ['endTime']
}).refine(data => {
  // Validate deposit is not more than total price
  return data.deposit <= data.totalPrice;
}, {
  message: 'Deposit cannot exceed total price',
  path: ['deposit']
});

export type BookingData = z.infer<typeof BookingSchema>;

export interface ExistingBooking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  castle: string;
  status: 'pending' | 'confirmed' | 'completed' | 'expired';
}

export interface ConflictDetails {
  type: 'time_overlap' | 'same_castle' | 'location_conflict' | 'maintenance';
  conflictingBooking: ExistingBooking;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  conflicts: ConflictDetails[];
  warnings: string[];
  errors: Record<string, string>;
}

export class BookingValidator {
  private existingBookings: ExistingBooking[] = [];

  constructor(bookings: ExistingBooking[] = []) {
    this.existingBookings = bookings;
  }

  updateExistingBookings(bookings: ExistingBooking[]) {
    this.existingBookings = bookings;
  }

  /**
   * Validates a booking and checks for conflicts
   */
  validateBooking(bookingData: Partial<BookingData>, excludeBookingId?: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      conflicts: [],
      warnings: [],
      errors: {}
    };

    // Schema validation
    try {
      const validation = BookingSchema.parse(bookingData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        result.isValid = false;
        error.issues.forEach((err) => {
          const fieldName = err.path.join('.');
          result.errors[fieldName] = err.message;
        });
      }
    }

    // If basic validation failed, return early
    if (!result.isValid) {
      return result;
    }

    // Check for conflicts with existing bookings
    const conflicts = this.checkConflicts(bookingData as BookingData, excludeBookingId);
    result.conflicts = conflicts;

    // Add warnings for potential issues
    const warnings = this.checkWarnings(bookingData as BookingData);
    result.warnings = warnings;

    // Determine overall validity
    const hasCriticalConflicts = conflicts.some(conflict => 
      conflict.type === 'time_overlap' || conflict.type === 'same_castle'
    );
    
    if (hasCriticalConflicts) {
      result.isValid = false;
    }

    return result;
  }

  /**
   * Checks for booking conflicts
   */
  private checkConflicts(bookingData: BookingData, excludeBookingId?: string): ConflictDetails[] {
    const conflicts: ConflictDetails[] = [];

    // Filter out expired bookings and the booking being edited
    const activeBookings = this.existingBookings.filter(booking => 
      booking.status !== 'expired' && 
      booking.id !== excludeBookingId
    );

    for (const existingBooking of activeBookings) {
      // Skip if different date
      if (existingBooking.date !== bookingData.date) {
        continue;
      }

      // Check for time overlap
      if (this.hasTimeOverlap(bookingData, existingBooking)) {
        // Check if same castle (critical conflict)
        if (existingBooking.castle === bookingData.castle) {
          conflicts.push({
            type: 'same_castle',
            conflictingBooking: existingBooking,
            message: `${bookingData.castle} is already booked for ${existingBooking.startTime} - ${existingBooking.endTime} on this date`
          });
        } else {
          // Different castle but overlapping time (potential location conflict)
          conflicts.push({
            type: 'time_overlap',
            conflictingBooking: existingBooking,
            message: `Time overlap with existing booking: ${existingBooking.castle} (${existingBooking.startTime} - ${existingBooking.endTime})`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Checks for potential warnings
   */
  private checkWarnings(bookingData: BookingData): string[] {
    const warnings: string[] = [];

    // Check for early morning bookings
    const startHour = parseInt(bookingData.startTime.split(':')[0]);
    if (startHour < 8) {
      warnings.push('Early morning booking: Consider if setup time is adequate');
    }

    // Check for late evening bookings
    const endHour = parseInt(bookingData.endTime.split(':')[0]);
    if (endHour > 20) {
      warnings.push('Late evening booking: Consider noise restrictions and lighting');
    }

    // Check for weekend bookings
    const bookingDate = new Date(bookingData.date);
    const dayOfWeek = bookingDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      warnings.push('Weekend booking: Expect higher demand and potential delays');
    }

    // Check for short-notice bookings (less than 3 days)
    const today = new Date();
    const timeDiff = bookingDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (daysDiff < 3) {
      warnings.push('Short-notice booking: Confirm availability and setup logistics');
    }

    // Check for long duration bookings
    const startTime = new Date(`1970-01-01T${bookingData.startTime}:00`);
    const endTime = new Date(`1970-01-01T${bookingData.endTime}:00`);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 8) {
      warnings.push('Extended booking duration: Ensure adequate supervision and breaks');
    }

    // Check for low deposit ratio
    const depositRatio = bookingData.deposit / bookingData.totalPrice;
    if (depositRatio < 0.2) {
      warnings.push('Low deposit ratio: Consider requiring higher deposit for booking security');
    }

    return warnings;
  }

  /**
   * Checks if two bookings have overlapping time
   */
  private hasTimeOverlap(booking1: BookingData, booking2: ExistingBooking): boolean {
    const start1 = this.timeToMinutes(booking1.startTime);
    const end1 = this.timeToMinutes(booking1.endTime);
    const start2 = this.timeToMinutes(booking2.startTime);
    const end2 = this.timeToMinutes(booking2.endTime);

    // Add buffer time (30 minutes before and after for setup/cleanup)
    const buffer = 30;
    const bufferedStart1 = start1 - buffer;
    const bufferedEnd1 = end1 + buffer;

    return !(bufferedEnd1 <= start2 || bufferedStart1 >= end2);
  }

  /**
   * Converts time string (HH:MM) to minutes since midnight
   */
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get available time slots for a specific date and castle
   */
  getAvailableSlots(date: string, castle: string, duration: number = 4): string[] {
    const busySlots = this.existingBookings
      .filter(booking => 
        booking.date === date && 
        booking.castle === castle && 
        booking.status !== 'expired'
      )
      .map(booking => ({
        start: this.timeToMinutes(booking.startTime),
        end: this.timeToMinutes(booking.endTime)
      }));

    const availableSlots: string[] = [];
    const openHour = 8 * 60; // 8:00 AM
    const closeHour = 20 * 60; // 8:00 PM
    const durationMinutes = duration * 60;
    const buffer = 30; // 30 minute buffer

    for (let start = openHour; start + durationMinutes <= closeHour; start += 60) {
      const end = start + durationMinutes;
      
      // Check if this slot conflicts with any existing booking
      const hasConflict = busySlots.some(busy => {
        const bufferedStart = start - buffer;
        const bufferedEnd = end + buffer;
        return !(bufferedEnd <= busy.start || bufferedStart >= busy.end);
      });

      if (!hasConflict) {
        const startTime = this.minutesToTime(start);
        const endTime = this.minutesToTime(end);
        availableSlots.push(`${startTime} - ${endTime}`);
      }
    }

    return availableSlots;
  }

  /**
   * Converts minutes since midnight to time string (HH:MM)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Suggests alternative time slots if current selection has conflicts
   */
  suggestAlternativeSlots(bookingData: BookingData, excludeBookingId?: string): string[] {
    const startTime = new Date(`1970-01-01T${bookingData.startTime}:00`);
    const endTime = new Date(`1970-01-01T${bookingData.endTime}:00`);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    return this.getAvailableSlots(bookingData.date, bookingData.castle, duration);
  }
}

// Utility function to create validator instance with current bookings
export function createBookingValidator(existingBookings: ExistingBooking[]) {
  return new BookingValidator(existingBookings);
}