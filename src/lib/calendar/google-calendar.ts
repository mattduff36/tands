import { google, calendar_v3 } from 'googleapis';
import { JWT } from 'google-auth-library';
import { RetryHelper, RateLimiter, CircuitBreaker } from '@/lib/utils/retry-helper';

// Types
export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  allDay?: boolean;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  colorId?: string;
  transparency?: 'opaque' | 'transparent';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
}

export interface BookingEventData {
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
}

export interface CalendarSettings {
  primaryCalendarId: string;
  timeZone: string;
  defaultEventColor?: string;
  businessHours?: {
    start: string;
    end: string;
  };
}

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar;
  private auth: JWT;
  private settings: CalendarSettings;
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.auth = this.initializeAuth();
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    this.settings = this.getCalendarSettings();
    this.rateLimiter = new RateLimiter(100, 100); // 100 requests per 100 seconds
    this.circuitBreaker = new CircuitBreaker(5, 60000, 2); // 5 failures, 1min recovery, 2 successes to close
  }

  private initializeAuth(): JWT {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const projectId = process.env.GOOGLE_PROJECT_ID;

    if (!serviceAccountEmail || !privateKey || !projectId) {
      throw new Error('Missing Google service account credentials in environment variables');
    }

    return new JWT({
      email: serviceAccountEmail,
      key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    });
  }

  private getCalendarSettings(): CalendarSettings {
    return {
      primaryCalendarId: process.env.PRIMARY_CALENDAR_ID || 'primary',
      timeZone: 'Europe/London', // UK timezone for TSB Bouncy Castle
      defaultEventColor: '2', // Green for available, red for booked
      businessHours: {
        start: '09:00',
        end: '18:00'
      }
    };
  }

  // Private helper method for API calls with retry logic
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryOptions?: { maxAttempts?: number; baseDelay?: number }
  ): Promise<T> {
    await this.rateLimiter.waitIfNeeded();
    
    return await this.circuitBreaker.execute(async () => {
      return await RetryHelper.withRetry(operation, {
        maxAttempts: retryOptions?.maxAttempts || 3,
        baseDelay: retryOptions?.baseDelay || 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504]
      });
    });
  }

  // Event Creation and Management

  async createBookingEvent(bookingData: BookingEventData): Promise<string> {
    try {
      const event: calendar_v3.Schema$Event = this.buildCalendarEvent(bookingData);
      
      const response = await this.executeWithRetry(
        () => this.calendar.events.insert({
          calendarId: this.settings.primaryCalendarId,
          requestBody: event,
          sendUpdates: 'all'
        }),
        'createBookingEvent'
      );

      if (!response.data.id) {
        throw new Error('Failed to create calendar event - no ID returned');
      }

      console.log(`Created booking event: ${response.data.id} for ${bookingData.customerName}`);
      return response.data.id;
    } catch (error) {
      console.error('Error creating booking event:', error);
      throw new Error(`Failed to create calendar event: ${(error as Error).message}`);
    }
  }

  async updateBookingEvent(eventId: string, bookingData: BookingEventData): Promise<void> {
    try {
      const event: calendar_v3.Schema$Event = this.buildCalendarEvent(bookingData);
      
      await this.executeWithRetry(
        () => this.calendar.events.update({
          calendarId: this.settings.primaryCalendarId,
          eventId,
          requestBody: event,
          sendUpdates: 'all'
        }),
        'updateBookingEvent'
      );

      console.log(`Updated booking event: ${eventId} for ${bookingData.customerName}`);
    } catch (error) {
      console.error('Error updating booking event:', error);
      throw new Error(`Failed to update calendar event: ${(error as Error).message}`);
    }
  }

  async deleteBookingEvent(eventId: string): Promise<void> {
    try {
      await this.executeWithRetry(
        () => this.calendar.events.delete({
          calendarId: this.settings.primaryCalendarId,
          eventId,
          sendUpdates: 'all'
        }),
        'deleteBookingEvent'
      );

      console.log(`Deleted booking event: ${eventId}`);
    } catch (error) {
      console.error('Error deleting booking event:', error);
      throw new Error(`Failed to delete calendar event: ${(error as Error).message}`);
    }
  }

  // Event Retrieval and Querying

  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event | null> {
    try {
      const response = await this.calendar.events.get({
        calendarId: this.settings.primaryCalendarId,
        eventId
      });

      return response.data;
    } catch (error) {
      if ((error as any).code === 404) {
        return null;
      }
      console.error('Error getting event:', error);
      throw new Error(`Failed to get calendar event: ${(error as Error).message}`);
    }
  }

  async getEventsInRange(startDate: Date, endDate: Date): Promise<calendar_v3.Schema$Event[]> {
    try {
      const response = await this.executeWithRetry(
        () => this.calendar.events.list({
          calendarId: this.settings.primaryCalendarId,
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          orderBy: 'startTime',
          singleEvents: true,
          maxResults: 2500
        }),
        'getEventsInRange'
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Error getting events in range:', error);
      throw new Error(`Failed to get calendar events: ${(error as Error).message}`);
    }
  }

  async getEventsForMonth(year: number, month: number): Promise<calendar_v3.Schema$Event[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    return this.getEventsInRange(startDate, endDate);
  }

  async getEventsForDay(date: Date): Promise<calendar_v3.Schema$Event[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return this.getEventsInRange(startDate, endDate);
  }

  // Availability Checking

  async checkAvailability(startDate: Date, endDate: Date): Promise<boolean> {
    try {
      const events = await this.getEventsInRange(startDate, endDate);
      
      // Check if any events overlap with the requested time
      return events.length === 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error(`Failed to check availability: ${(error as Error).message}`);
    }
  }

  async getAvailableTimeSlots(date: Date, duration: number = 4): Promise<Array<{start: Date, end: Date}>> {
    try {
      const events = await this.getEventsForDay(date);
      const slots: Array<{start: Date, end: Date}> = [];
      
      const businessStart = new Date(date);
      const [startHour, startMinute] = this.settings.businessHours!.start.split(':').map(Number);
      businessStart.setHours(startHour, startMinute, 0, 0);
      
      const businessEnd = new Date(date);
      const [endHour, endMinute] = this.settings.businessHours!.end.split(':').map(Number);
      businessEnd.setHours(endHour, endMinute, 0, 0);
      
      // Sort events by start time
      const sortedEvents = events
        .filter(event => event.start?.dateTime || event.start?.date)
        .sort((a, b) => {
          const aStart = new Date(a.start?.dateTime || a.start?.date || '');
          const bStart = new Date(b.start?.dateTime || b.start?.date || '');
          return aStart.getTime() - bStart.getTime();
        });

      let currentTime = businessStart;
      
      for (const event of sortedEvents) {
        const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
        const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');
        
        // Check if there's a slot between current time and event start
        const slotEnd = new Date(currentTime.getTime() + duration * 60 * 60 * 1000);
        if (slotEnd <= eventStart) {
          slots.push({ start: new Date(currentTime), end: slotEnd });
        }
        
        currentTime = new Date(Math.max(currentTime.getTime(), eventEnd.getTime()));
      }
      
      // Check for final slot until business end
      const finalSlotEnd = new Date(currentTime.getTime() + duration * 60 * 60 * 1000);
      if (finalSlotEnd <= businessEnd) {
        slots.push({ start: new Date(currentTime), end: finalSlotEnd });
      }
      
      return slots;
    } catch (error) {
      console.error('Error getting available time slots:', error);
      throw new Error(`Failed to get available time slots: ${(error as Error).message}`);
    }
  }

  // Maintenance and Blocking

  async createMaintenanceBlock(
    startDate: Date, 
    endDate: Date, 
    reason: string = 'Maintenance'
  ): Promise<string> {
    const maintenanceEvent: calendar_v3.Schema$Event = {
      summary: `🔧 Bouncy Castle Maintenance - ${reason}`,
      description: `Bouncy castle unavailable for bookings.\nReason: ${reason}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: this.settings.timeZone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: this.settings.timeZone
      },
      colorId: '11', // Red color for maintenance
      transparency: 'opaque',
      visibility: 'public'
    };

    try {
      const response = await this.calendar.events.insert({
        calendarId: this.settings.primaryCalendarId,
        requestBody: maintenanceEvent
      });

      if (!response.data.id) {
        throw new Error('Failed to create maintenance block');
      }

      console.log(`Created maintenance block: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      console.error('Error creating maintenance block:', error);
      throw new Error(`Failed to create maintenance block: ${(error as Error).message}`);
    }
  }

  // Helper Methods

  private buildCalendarEvent(bookingData: BookingEventData): calendar_v3.Schema$Event {
    const { customerName, contactDetails, location, notes, duration, cost, paymentMethod, bouncyCastleType } = bookingData;
    
    let description = `🏰 Bouncy Castle Booking\n\n`;
    description += `Customer: ${customerName}\n`;
    if (contactDetails.email) description += `Email: ${contactDetails.email}\n`;
    if (contactDetails.phone) description += `Phone: ${contactDetails.phone}\n`;
    description += `Location: ${location}\n`;
    if (bouncyCastleType) description += `Castle Type: ${bouncyCastleType}\n`;
    if (cost) description += `Cost: £${cost}\n`;
    if (paymentMethod) description += `Payment: ${paymentMethod === 'card' ? 'Card (on delivery)' : 'Cash'}\n`;
    if (notes) description += `\nNotes: ${notes}\n`;

    const attendees: calendar_v3.Schema$EventAttendee[] = [];
    if (contactDetails.email) {
      attendees.push({
        email: contactDetails.email,
        displayName: customerName,
        responseStatus: 'needsAction'
      });
    }

    return {
      summary: `🏰 ${customerName} - ${bouncyCastleType || 'Bouncy Castle'}`,
      description,
      location,
      start: {
        dateTime: duration.start,
        timeZone: this.settings.timeZone
      },
      end: {
        dateTime: duration.end,
        timeZone: this.settings.timeZone
      },
      attendees,
      colorId: '10', // Green color for bookings
      transparency: 'opaque',
      visibility: 'public',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'popup', minutes: 60 }       // 1 hour before
        ]
      }
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.executeWithRetry(
        () => this.calendar.calendarList.list(),
        'testConnection',
        { maxAttempts: 2, baseDelay: 500 } // Faster for connection tests
      );
      console.log('✅ Google Calendar connection successful');
      return true;
    } catch (error) {
      console.error('❌ Google Calendar connection failed:', error);
      return false;
    }
  
  }

  // Error handling and monitoring
  getServiceStatus(): {
    circuitBreakerState: string;
    rateLimitStatus: string;
    lastConnectionTest?: Date;
  } {
    return {
      circuitBreakerState: this.circuitBreaker.getState(),
      rateLimitStatus: `Active rate limiting: 100 requests per 100 seconds`,
      lastConnectionTest: new Date()
    };
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    console.log('🔄 Calendar service circuit breaker manually reset');
  }
}

// Singleton instance
let calendarService: GoogleCalendarService | null = null;

export function getCalendarService(): GoogleCalendarService {
  if (!calendarService) {
    calendarService = new GoogleCalendarService();
  }
  return calendarService;
}

// Export convenience functions
export async function createBooking(bookingData: BookingEventData): Promise<string> {
  const service = getCalendarService();
  return service.createBookingEvent(bookingData);
}

export async function updateBooking(eventId: string, bookingData: BookingEventData): Promise<void> {
  const service = getCalendarService();
  return service.updateBookingEvent(eventId, bookingData);
}

export async function deleteBooking(eventId: string): Promise<void> {
  const service = getCalendarService();
  return service.deleteBookingEvent(eventId);
}

export async function checkDateAvailability(startDate: Date, endDate: Date): Promise<boolean> {
  const service = getCalendarService();
  return service.checkAvailability(startDate, endDate);
}

export async function getMonthBookings(year: number, month: number): Promise<calendar_v3.Schema$Event[]> {
  const service = getCalendarService();
  return service.getEventsForMonth(year, month);
}

export async function createMaintenancePeriod(
  startDate: Date, 
  endDate: Date, 
  reason?: string
): Promise<string> {
  const service = getCalendarService();
  return service.createMaintenanceBlock(startDate, endDate, reason);
}