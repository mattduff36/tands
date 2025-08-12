export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'expired';

/**
 * TypeScript type definitions for bouncy castle booking system
 */

// Booking status enumeration - follows pending → confirmed → completed flow
export type BookingStatus = 
  | 'pending'           // Initial booking request received
  | 'confirmed'         // Booking confirmed with customer, agreement signed
  | 'completed'         // Event finished successfully
  | 'expired';          // Booking expired/cancelled

// Payment status enumeration
export type PaymentStatus = 
  | 'pending'           // No payment received
  | 'partial'           // Partial payment (deposit)
  | 'paid'              // Full payment received
  | 'refunded'          // Payment refunded
  | 'failed';           // Payment attempt failed

// Payment method enumeration
export type PaymentMethod = 
  | 'cash'              // Cash on delivery
  | 'card'              // Card payment on delivery
  | 'bank_transfer'     // Bank transfer
  | 'online'            // Online payment
  | 'other';            // Other payment method

// Castle availability status
export type AvailabilityStatus = 
  | 'available'         // Castle available for booking
  | 'partially_booked'  // Some slots booked
  | 'fully_booked'      // All slots booked
  | 'unavailable'       // Castle unavailable (admin set)
  | 'maintenance';      // Under maintenance

// Contact information interface
export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  alternativePhone?: string;
}

// Address information interface
export interface Address {
  street: string;
  city: string;
  postcode: string;
  county?: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  deliveryNotes?: string;
}

// Castle information interface
export interface CastleInfo {
  id: string;
  name: string;
  type: string;
  dimensions: string;
  ageRange: string;
  capacity: number;
  price: number;
  description?: string;
}

// Booking time slot interface
export interface TimeSlot {
  date: string;          // ISO date string (YYYY-MM-DD)
  startTime: string;     // Time in HH:mm format
  endTime: string;       // Time in HH:mm format
  duration: number;      // Duration in minutes
}

// Additional services interface
export interface AdditionalServices {
  generator?: boolean;
  insurance?: boolean;
  setup?: boolean;
  cleanup?: boolean;
  extraTime?: number;    // Additional time in minutes
  notes?: string;
}

// Payment information interface
export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  depositAmount?: number;
  currency: string;
  paymentDate?: string;  // ISO datetime string
  refundAmount?: number;
  refundDate?: string;   // ISO datetime string
  transactionId?: string;
  paymentNotes?: string;
}

// Main booking interface
export interface Booking {
  id: string;
  
  // Basic booking information
  status: BookingStatus;
  createdAt: string;     // ISO datetime string
  updatedAt: string;     // ISO datetime string
  
  // Customer information
  customer: ContactInfo;
  deliveryAddress: Address;
  
  // Booking details
  castle: CastleInfo;
  timeSlot: TimeSlot;
  additionalServices?: AdditionalServices;
  
  // Payment information
  payment: PaymentInfo;
  
  // Administrative fields
  adminNotes?: string;
  customerNotes?: string;
  internalNotes?: string;
  
  // Google Calendar integration
  calendarEventId?: string;
  calendarSyncStatus?: 'synced' | 'pending' | 'failed';
  calendarSyncError?: string;
  calendarLastSyncAt?: string;  // ISO datetime string
  
  // Audit fields
  createdBy?: string;    // Admin user ID who created
  updatedBy?: string;    // Admin user ID who last updated
  
  // Cancellation information
  cancellationReason?: string;
  cancellationDate?: string;  // ISO datetime string
  cancellationFee?: number;
  
  // Agreement information
  agreementSigned?: boolean;
  agreementSignedAt?: string;  // ISO datetime string
  agreementSignedBy?: string;
  agreementSignedMethod?: 'email' | 'manual' | 'physical' | 'admin_override';
}

// Database query interfaces
export interface BookingQuery {
  // Filtering options
  status?: BookingStatus | BookingStatus[];
  dateFrom?: string;     // ISO date string
  dateTo?: string;       // ISO date string
  castleId?: string;
  customerId?: string;
  paymentStatus?: PaymentStatus;
  
  // Search options
  searchTerm?: string;   // Search in customer name, email, or notes
  
  // Sorting options
  sortBy?: 'date' | 'created' | 'updated' | 'customer' | 'amount';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

export interface BookingQueryResult {
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Booking creation and update interfaces
export interface CreateBookingRequest {
  // Customer information
  customer: ContactInfo;
  deliveryAddress: Address;
  
  // Booking details
  castleId: string;
  timeSlot: Omit<TimeSlot, 'duration'>;  // Duration calculated automatically
  additionalServices?: AdditionalServices;
  
  // Payment information
  paymentMethod: PaymentMethod;
  
  // Notes
  customerNotes?: string;
  adminNotes?: string;
}

export interface UpdateBookingRequest extends Partial<CreateBookingRequest> {
  id: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  internalNotes?: string;
  adminNotes?: string;
}

// Booking validation interface
export interface BookingValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  warnings?: {
    field: string;
    message: string;
  }[];
}

// Booking conflict detection
export interface BookingConflict {
  type: 'time_overlap' | 'castle_unavailable' | 'double_booking';
  conflictingBookingId?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ConflictCheckRequest {
  castleId: string;
  timeSlot: TimeSlot;
  excludeBookingId?: string;  // Exclude specific booking from conflict check
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: BookingConflict[];
  suggestions?: string[];
}

// Historical reporting interfaces
export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  completeBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  popularCastles: {
    castleId: string;
    castleName: string;
    bookingCount: number;
  }[];
  busyPeriods: {
    date: string;
    bookingCount: number;
  }[];
}

export interface ReportingQuery {
  dateFrom: string;      // ISO date string
  dateTo: string;        // ISO date string
  castleIds?: string[];  // Filter by specific castles
  statuses?: BookingStatus[];  // Filter by booking statuses
  groupBy?: 'day' | 'week' | 'month';
}

// Database schema interfaces for implementation
export interface DatabaseSchema {
  bookings: {
    tableName: 'bookings';
    primaryKey: 'id';
    indexes: {
      statusIndex: ['status'];
      dateIndex: ['date'];
      customerEmailIndex: ['customer_email'];
      castleIdIndex: ['castle_id'];
      createdAtIndex: ['created_at'];
      calendarEventIndex: ['calendar_event_id'];
    };
  };
  
  customers: {
    tableName: 'customers';
    primaryKey: 'id';
    indexes: {
      emailIndex: ['email'];
      phoneIndex: ['phone'];
    };
  };
  
  castles: {
    tableName: 'castles';
    primaryKey: 'id';
    indexes: {
      nameIndex: ['name'];
      typeIndex: ['type'];
    };
  };
  
  payments: {
    tableName: 'payments';
    primaryKey: 'id';
    indexes: {
      bookingIdIndex: ['booking_id'];
      statusIndex: ['status'];
      transactionIdIndex: ['transaction_id'];
    };
  };
  
  audit_logs: {
    tableName: 'audit_logs';
    primaryKey: 'id';
    indexes: {
      bookingIdIndex: ['booking_id'];
      userIdIndex: ['user_id'];
      timestampIndex: ['timestamp'];
    };
  };
}

// Audit log interface for tracking changes
export interface AuditLog {
  id: string;
  bookingId: string;
  action: 'create' | 'update' | 'delete' | 'status_change';
  userId?: string;       // Admin user who made the change
  timestamp: string;     // ISO datetime string
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

// Export default types for easy importing
export type {
  Booking as DefaultBooking,
  BookingQuery as DefaultBookingQuery,
  BookingQueryResult as DefaultBookingQueryResult,
  CreateBookingRequest as DefaultCreateBookingRequest,
  UpdateBookingRequest as DefaultUpdateBookingRequest,
};