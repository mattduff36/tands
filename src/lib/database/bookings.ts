/**
 * Database operations for bouncy castle booking management
 * Mock implementation for development - can be replaced with real database
 */

import { 
  Booking, 
  BookingQuery, 
  BookingQueryResult, 
  CreateBookingRequest, 
  UpdateBookingRequest,
  BookingValidationResult,
  ConflictCheckRequest,
  ConflictCheckResult,
  BookingStats,
  ReportingQuery,
  AuditLog,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  BookingConflict
} from '@/lib/types/booking';
import { castles } from '@/lib/castle-data';

// Mock database storage (in memory for development)
let mockBookings: Booking[] = [];
let mockAuditLogs: AuditLog[] = [];
let idCounter = 1;

// Initialize with some sample data for development
const initializeSampleData = () => {
  if (mockBookings.length > 0) return;

  const sampleBookings: Booking[] = [
    {
      id: '1',
      status: 'confirmed',
      createdAt: '2024-07-15T10:30:00Z',
      updatedAt: '2024-07-15T14:20:00Z',
      customer: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '07123456789'
      },
      deliveryAddress: {
        street: '123 Oak Avenue',
        city: 'Manchester',
        postcode: 'M1 2AB',
        country: 'UK',
        deliveryNotes: 'Blue front door, side gate access'
      },
      castle: {
        id: '1',
        name: 'Fairy Tale Castle',
        type: 'Standard',
        dimensions: '15ft x 12ft',
        ageRange: '3-8 years',
        capacity: 8,
        price: 80
      },
      timeSlot: {
        date: '2024-07-28',
        startTime: '10:00',
        endTime: '16:00',
        duration: 360
      },
      payment: {
        method: 'cash',
        status: 'paid',
        totalAmount: 80,
        paidAmount: 80,
        currency: 'GBP',
        paymentDate: '2024-07-28T10:00:00Z'
      },
      customerNotes: 'Birthday party for 6-year-old Emma',
      adminNotes: 'Regular customer, no issues',
      calendarEventId: 'calendar_event_1',
      calendarSyncStatus: 'synced'
    },
    {
      id: '2',
      status: 'pending',
      createdAt: '2024-07-20T16:45:00Z',
      updatedAt: '2024-07-20T16:45:00Z',
      customer: {
        name: 'Michael Brown',
        email: 'mike.brown@email.com',
        phone: '07987654321'
      },
      deliveryAddress: {
        street: '456 High Street',
        city: 'Liverpool',
        postcode: 'L1 3CD',
        country: 'UK'
      },
      castle: {
        id: '2',
        name: 'Pirate Ship Adventure',
        type: 'Themed',
        dimensions: '16ft x 14ft',
        ageRange: '4-10 years',
        capacity: 10,
        price: 100
      },
      timeSlot: {
        date: '2024-08-05',
        startTime: '11:00',
        endTime: '17:00',
        duration: 360
      },
      payment: {
        method: 'card',
        status: 'pending',
        totalAmount: 100,
        paidAmount: 0,
        currency: 'GBP'
      },
      customerNotes: 'School summer fair event'
    }
  ];

  mockBookings = sampleBookings;
  idCounter = sampleBookings.length + 1;
};

// Initialize sample data
initializeSampleData();

/**
 * Generate unique ID for new bookings
 */
const generateId = (): string => {
  return (idCounter++).toString();
};

/**
 * Create audit log entry
 */
const createAuditLog = (
  bookingId: string,
  action: AuditLog['action'],
  userId?: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  notes?: string
): void => {
  const auditLog: AuditLog = {
    id: generateId(),
    bookingId,
    action,
    userId,
    timestamp: new Date().toISOString(),
    oldValues,
    newValues,
    notes
  };
  
  mockAuditLogs.push(auditLog);
};

/**
 * Validate booking data
 */
export const validateBooking = async (booking: CreateBookingRequest | UpdateBookingRequest): Promise<BookingValidationResult> => {
  const errors: { field: string; message: string }[] = [];
  const warnings: { field: string; message: string }[] = [];

  // Validate customer information
  if (!booking.customer?.name?.trim()) {
    errors.push({ field: 'customer.name', message: 'Customer name is required' });
  }
  if (!booking.customer?.email?.trim()) {
    errors.push({ field: 'customer.email', message: 'Customer email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.customer.email)) {
    errors.push({ field: 'customer.email', message: 'Invalid email format' });
  }
  if (!booking.customer?.phone?.trim()) {
    errors.push({ field: 'customer.phone', message: 'Customer phone is required' });
  }

  // Validate delivery address
  if (!booking.deliveryAddress?.street?.trim()) {
    errors.push({ field: 'deliveryAddress.street', message: 'Delivery address is required' });
  }
  if (!booking.deliveryAddress?.city?.trim()) {
    errors.push({ field: 'deliveryAddress.city', message: 'City is required' });
  }
  if (!booking.deliveryAddress?.postcode?.trim()) {
    errors.push({ field: 'deliveryAddress.postcode', message: 'Postcode is required' });
  }

  // Validate castle selection
  if (!booking.castleId) {
    errors.push({ field: 'castleId', message: 'Castle selection is required' });
  } else {
    const castle = castles.find(c => c.id.toString() === booking.castleId);
    if (!castle) {
      errors.push({ field: 'castleId', message: 'Invalid castle selection' });
    }
  }

  // Validate time slot
  if (!booking.timeSlot?.date) {
    errors.push({ field: 'timeSlot.date', message: 'Booking date is required' });
  } else {
    const bookingDate = new Date(booking.timeSlot.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      errors.push({ field: 'timeSlot.date', message: 'Booking date cannot be in the past' });
    }
  }

  if (!booking.timeSlot?.startTime) {
    errors.push({ field: 'timeSlot.startTime', message: 'Start time is required' });
  }
  if (!booking.timeSlot?.endTime) {
    errors.push({ field: 'timeSlot.endTime', message: 'End time is required' });
  }

  // Validate time logic
  if (booking.timeSlot?.startTime && booking.timeSlot?.endTime) {
    const start = new Date(`2000-01-01T${booking.timeSlot.startTime}:00`);
    const end = new Date(`2000-01-01T${booking.timeSlot.endTime}:00`);
    
    if (end <= start) {
      errors.push({ field: 'timeSlot.endTime', message: 'End time must be after start time' });
    }
    
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    if (duration < 60) {
      warnings.push({ field: 'timeSlot', message: 'Booking duration is less than 1 hour' });
    }
    if (duration > 720) {
      warnings.push({ field: 'timeSlot', message: 'Booking duration is more than 12 hours' });
    }
  }

  // Validate payment method
  if (!booking.paymentMethod) {
    errors.push({ field: 'paymentMethod', message: 'Payment method is required' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Check for booking conflicts
 */
export const checkBookingConflicts = async (request: ConflictCheckRequest): Promise<ConflictCheckResult> => {
  const conflicts: BookingConflict[] = [];
  
  const { castleId, timeSlot, excludeBookingId } = request;
  
  // Find bookings for the same castle on the same date
  const existingBookings = mockBookings.filter(booking => 
    booking.id !== excludeBookingId &&
    booking.castle.id === castleId &&
    booking.timeSlot.date === timeSlot.date &&
    booking.status !== 'cancelled'
  );
  
  for (const existingBooking of existingBookings) {
    const existingStart = new Date(`2000-01-01T${existingBooking.timeSlot.startTime}:00`);
    const existingEnd = new Date(`2000-01-01T${existingBooking.timeSlot.endTime}:00`);
    const newStart = new Date(`2000-01-01T${timeSlot.startTime}:00`);
    const newEnd = new Date(`2000-01-01T${timeSlot.endTime}:00`);
    
    // Check for time overlap
    if (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    ) {
      conflicts.push({
        type: 'time_overlap',
        conflictingBookingId: existingBooking.id,
        message: `Time overlap with existing booking for ${existingBooking.customer.name}`,
        severity: 'error'
      });
    }
  }
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    suggestions: conflicts.length > 0 ? [
      'Try selecting a different time slot',
      'Choose a different date',
      'Contact customer to discuss alternative options'
    ] : undefined
  };
};

/**
 * Create a new booking
 */
export const createBooking = async (request: CreateBookingRequest, userId?: string): Promise<Booking> => {
  // Validate the booking request
  const validation = await validateBooking(request);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }
  
  // Calculate duration for conflict check
  const conflictStartTime = new Date(`2000-01-01T${request.timeSlot.startTime}:00`);
  const conflictEndTime = new Date(`2000-01-01T${request.timeSlot.endTime}:00`);
  const conflictDuration = (conflictEndTime.getTime() - conflictStartTime.getTime()) / (1000 * 60);
  
  // Check for conflicts
  const conflictCheck = await checkBookingConflicts({
    castleId: request.castleId,
    timeSlot: {
      ...request.timeSlot,
      duration: conflictDuration
    }
  });
  
  if (conflictCheck.hasConflicts) {
    throw new Error(`Booking conflicts detected: ${conflictCheck.conflicts.map(c => c.message).join(', ')}`);
  }
  
  // Find castle details
  const castle = castles.find(c => c.id.toString() === request.castleId);
  if (!castle) {
    throw new Error('Castle not found');
  }
  
  // Calculate duration
  const startTime = new Date(`2000-01-01T${request.timeSlot.startTime}:00`);
  const endTime = new Date(`2000-01-01T${request.timeSlot.endTime}:00`);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  const now = new Date().toISOString();
  const bookingId = generateId();
  
  const booking: Booking = {
    id: bookingId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    customer: request.customer,
    deliveryAddress: request.deliveryAddress,
    castle: {
      id: castle.id.toString(),
      name: castle.name,
      type: castle.theme || 'Standard',
      dimensions: castle.size || 'Standard size',
      ageRange: 'All ages',
      capacity: 8,
      price: castle.price
    },
    timeSlot: {
      date: request.timeSlot.date,
      startTime: request.timeSlot.startTime,
      endTime: request.timeSlot.endTime,
      duration
    },
    additionalServices: request.additionalServices,
    payment: {
      method: request.paymentMethod,
      status: 'pending',
      totalAmount: castle.price,
      paidAmount: 0,
      currency: 'GBP'
    },
    customerNotes: request.customerNotes,
    adminNotes: request.adminNotes,
    createdBy: userId
  };
  
  mockBookings.push(booking);
  
  // Create audit log
  createAuditLog(bookingId, 'create', userId, undefined, booking, 'Booking created');
  
  return booking;
};

/**
 * Get booking by ID
 */
export const getBookingById = async (id: string): Promise<Booking | null> => {
  return mockBookings.find(booking => booking.id === id) || null;
};

/**
 * Update an existing booking
 */
export const updateBooking = async (request: UpdateBookingRequest, userId?: string): Promise<Booking> => {
  const existingBooking = await getBookingById(request.id);
  if (!existingBooking) {
    throw new Error('Booking not found');
  }
  
  // Validate the update request
  const validation = await validateBooking(request);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }
  
  // Check for conflicts if time slot is being changed
  if (request.timeSlot && request.castleId) {
    // Calculate duration for conflict check
    const updateStartTime = new Date(`2000-01-01T${request.timeSlot.startTime}:00`);
    const updateEndTime = new Date(`2000-01-01T${request.timeSlot.endTime}:00`);
    const updateDuration = (updateEndTime.getTime() - updateStartTime.getTime()) / (1000 * 60);
    
    const conflictCheck = await checkBookingConflicts({
      castleId: request.castleId,
      timeSlot: {
        ...request.timeSlot,
        duration: updateDuration
      },
      excludeBookingId: request.id
    });
    
    if (conflictCheck.hasConflicts) {
      throw new Error(`Booking conflicts detected: ${conflictCheck.conflicts.map(c => c.message).join(', ')}`);
    }
  }
  
  const oldValues = { ...existingBooking };
  
  // Update fields
  const updatedBooking: Booking = {
    ...existingBooking,
    updatedAt: new Date().toISOString(),
    updatedBy: userId
  };
  
  // Update specific fields if provided
  if (request.customer) updatedBooking.customer = request.customer;
  if (request.deliveryAddress) updatedBooking.deliveryAddress = request.deliveryAddress;
  if (request.status) updatedBooking.status = request.status;
  if (request.customerNotes !== undefined) updatedBooking.customerNotes = request.customerNotes;
  if (request.adminNotes !== undefined) updatedBooking.adminNotes = request.adminNotes;
  if (request.internalNotes !== undefined) updatedBooking.internalNotes = request.internalNotes;
  if (request.paymentStatus) updatedBooking.payment.status = request.paymentStatus;
  if (request.paidAmount !== undefined) updatedBooking.payment.paidAmount = request.paidAmount;
  
  // Update castle if changed
  if (request.castleId && request.castleId !== existingBooking.castle.id) {
    const castle = castles.find(c => c.id.toString() === request.castleId);
    if (!castle) {
      throw new Error('Castle not found');
    }
    
    updatedBooking.castle = {
      id: castle.id.toString(),
      name: castle.name,
      type: castle.theme || 'Standard',
      dimensions: castle.size || 'Standard size',
      ageRange: 'All ages',
      capacity: 8,
      price: castle.price
    };
    
    // Update total amount if castle price changed
    updatedBooking.payment.totalAmount = castle.price;
  }
  
  // Update time slot if provided
  if (request.timeSlot) {
    const startTime = new Date(`2000-01-01T${request.timeSlot.startTime}:00`);
    const endTime = new Date(`2000-01-01T${request.timeSlot.endTime}:00`);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    updatedBooking.timeSlot = {
      date: request.timeSlot.date,
      startTime: request.timeSlot.startTime,
      endTime: request.timeSlot.endTime,
      duration
    };
  }
  
  // Update additional services
  if (request.additionalServices !== undefined) {
    updatedBooking.additionalServices = request.additionalServices;
  }
  
  // Replace booking in array
  const index = mockBookings.findIndex(b => b.id === request.id);
  mockBookings[index] = updatedBooking;
  
  // Create audit log
  createAuditLog(request.id, 'update', userId, oldValues, updatedBooking, 'Booking updated');
  
  return updatedBooking;
};

/**
 * Delete a booking
 */
export const deleteBooking = async (id: string, userId?: string): Promise<boolean> => {
  const booking = await getBookingById(id);
  if (!booking) {
    return false;
  }
  
  mockBookings = mockBookings.filter(b => b.id !== id);
  
  // Create audit log
  createAuditLog(id, 'delete', userId, booking, undefined, 'Booking deleted');
  
  return true;
};

/**
 * Query bookings with filtering, sorting, and pagination
 */
export const queryBookings = async (query: BookingQuery = {}): Promise<BookingQueryResult> => {
  let filteredBookings = [...mockBookings];
  
  // Apply filters
  if (query.status) {
    const statuses = Array.isArray(query.status) ? query.status : [query.status];
    filteredBookings = filteredBookings.filter(b => statuses.includes(b.status));
  }
  
  if (query.dateFrom) {
    filteredBookings = filteredBookings.filter(b => b.timeSlot.date >= query.dateFrom!);
  }
  
  if (query.dateTo) {
    filteredBookings = filteredBookings.filter(b => b.timeSlot.date <= query.dateTo!);
  }
  
  if (query.castleId) {
    filteredBookings = filteredBookings.filter(b => b.castle.id === query.castleId);
  }
  
  if (query.paymentStatus) {
    filteredBookings = filteredBookings.filter(b => b.payment.status === query.paymentStatus);
  }
  
  if (query.searchTerm) {
    const searchLower = query.searchTerm.toLowerCase();
    filteredBookings = filteredBookings.filter(b => 
      b.customer.name.toLowerCase().includes(searchLower) ||
      b.customer.email.toLowerCase().includes(searchLower) ||
      b.customerNotes?.toLowerCase().includes(searchLower) ||
      b.adminNotes?.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply sorting
  const sortBy = query.sortBy || 'date';
  const sortOrder = query.sortOrder || 'asc';
  
  filteredBookings.sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.timeSlot.date);
        bValue = new Date(b.timeSlot.date);
        break;
      case 'created':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'updated':
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
        break;
      case 'customer':
        aValue = a.customer.name.toLowerCase();
        bValue = b.customer.name.toLowerCase();
        break;
      case 'amount':
        aValue = a.payment.totalAmount;
        bValue = b.payment.totalAmount;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Apply pagination
  const page = query.page || 1;
  const limit = query.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
  const total = filteredBookings.length;
  const totalPages = Math.ceil(total / limit);
  
  return {
    bookings: paginatedBookings,
    total,
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1
  };
};

/**
 * Get booking statistics for reporting
 */
export const getBookingStats = async (query: ReportingQuery): Promise<BookingStats> => {
  let filteredBookings = mockBookings.filter(b => {
    const bookingDate = b.timeSlot.date;
    return bookingDate >= query.dateFrom && bookingDate <= query.dateTo;
  });
  
  if (query.castleIds) {
    filteredBookings = filteredBookings.filter(b => query.castleIds!.includes(b.castle.id));
  }
  
  if (query.statuses) {
    filteredBookings = filteredBookings.filter(b => query.statuses!.includes(b.status));
  }
  
  const totalBookings = filteredBookings.length;
  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed').length;
  const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled').length;
  const totalRevenue = filteredBookings
    .filter(b => b.payment.status === 'paid')
    .reduce((sum, b) => sum + b.payment.paidAmount, 0);
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  
  // Popular castles
  const castleCounts = new Map<string, { name: string; count: number }>();
  filteredBookings.forEach(b => {
    const existing = castleCounts.get(b.castle.id) || { name: b.castle.name, count: 0 };
    castleCounts.set(b.castle.id, { ...existing, count: existing.count + 1 });
  });
  
  const popularCastles = Array.from(castleCounts.entries())
    .map(([id, data]) => ({
      castleId: id,
      castleName: data.name,
      bookingCount: data.count
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);
  
  // Busy periods
  const dateCounts = new Map<string, number>();
  filteredBookings.forEach(b => {
    const date = b.timeSlot.date;
    dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
  });
  
  const busyPeriods = Array.from(dateCounts.entries())
    .map(([date, count]) => ({ date, bookingCount: count }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 10);
  
  return {
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    totalRevenue,
    averageBookingValue,
    popularCastles,
    busyPeriods
  };
};

/**
 * Get audit logs for a booking
 */
export const getBookingAuditLogs = async (bookingId: string): Promise<AuditLog[]> => {
  return mockAuditLogs
    .filter(log => log.bookingId === bookingId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

/**
 * Clear all mock data (for testing purposes)
 */
export const clearMockData = (): void => {
  mockBookings = [];
  mockAuditLogs = [];
  idCounter = 1;
};

/**
 * Reset mock data to initial sample data (for testing purposes)
 */
export const resetMockData = (): void => {
  clearMockData();
  initializeSampleData();
};

/**
 * Export mock data for debugging purposes
 */
export const getMockData = () => ({
  bookings: mockBookings,
  auditLogs: mockAuditLogs
});