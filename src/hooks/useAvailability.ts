'use client';

import { useQuery } from '@tanstack/react-query';

// Type definitions for availability data
interface AvailabilityResponse {
  date: string;
  available: boolean;
  reason?: string;
  availableCastles: string[];
  bookedCastles: string[];
  timeSlots: {
    startTime: string;
    endTime: string;
    available: boolean;
    castle?: string;
  }[];
}

interface AvailabilityRangeResponse {
  range: {
    start: string;
    end: string;
  };
  availability: {
    date: string;
    status: 'available' | 'partially_booked' | 'fully_booked' | 'unavailable' | 'maintenance';
    availableSlots: number;
    totalSlots: number;
  }[];
}

// Fetch availability for a specific date
async function fetchAvailabilityForDate(date: string, castle?: string): Promise<AvailabilityResponse> {
  const params = new URLSearchParams({ date });
  if (castle) params.set('castle', castle);
  
  const response = await fetch(`/api/availability?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch availability: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Fetch availability for a date range
async function fetchAvailabilityRange(
  startDate: string, 
  endDate: string, 
  castle?: string,
  format?: string
): Promise<AvailabilityRangeResponse> {
  const params = new URLSearchParams({ 
    start: startDate, 
    end: endDate,
    format: format || 'summary'
  });
  if (castle) params.set('castle', castle);
  
  const response = await fetch(`/api/availability?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch availability range: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Hook for single date availability
export function useAvailability(date: string, castle?: string) {
  return useQuery({
    queryKey: ['availability', date, castle],
    queryFn: () => fetchAvailabilityForDate(date, castle),
    // Cache for 2 minutes since availability can change with bookings
    staleTime: 1000 * 60 * 2, // 2 minutes
    // Keep in cache for 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!date, // Only run if date is provided
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when reconnecting
    retry: 2,
  });
}

// Hook for date range availability
export function useAvailabilityRange(
  startDate: string, 
  endDate: string, 
  castle?: string,
  format?: string
) {
  return useQuery({
    queryKey: ['availability-range', startDate, endDate, castle, format],
    queryFn: () => fetchAvailabilityRange(startDate, endDate, castle, format),
    // Cache for 3 minutes for range queries
    staleTime: 1000 * 60 * 3, // 3 minutes
    // Keep in cache for 10 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!(startDate && endDate), // Only run if both dates provided
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });
}

// Hook for getting next 30 days availability (default query)
export function useDefaultAvailability(castle?: string) {
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  
  const startDate = today.toISOString().split('T')[0];
  const endDate = thirtyDaysLater.toISOString().split('T')[0];
  
  return useAvailabilityRange(startDate, endDate, castle, 'summary');
}