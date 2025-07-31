'use client';

import { useQuery } from '@tanstack/react-query';

// Type definition for castle data
interface Castle {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  dimensions: string;
  capacity: string;
  suitableFor: string;
  // Add other castle properties as needed
}

// Fetch function for castles
async function fetchCastles(): Promise<Castle[]> {
  const response = await fetch('/api/castles');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch castles: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Custom hook for fetching castles with React Query
export function useCastles() {
  return useQuery({
    queryKey: ['castles'],
    queryFn: fetchCastles,
    // Cache for 30 minutes since castles data is very static
    staleTime: 1000 * 60 * 30, // 30 minutes
    // Keep in cache for 2 hours
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    // Don't refetch on window focus for static data
    refetchOnWindowFocus: false,
    // Don't refetch on reconnect
    refetchOnReconnect: false,
    // Retry failed requests
    retry: 3,
    // Add some jitter to avoid thundering herd
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Custom hook for fetching a specific castle by ID
export function useCastle(castleId: number) {
  return useQuery({
    queryKey: ['castle', castleId],
    queryFn: async (): Promise<Castle> => {
      const response = await fetch(`/api/castles/${castleId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch castle: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    // Cache for 1 hour since individual castle data is very static
    staleTime: 1000 * 60 * 60, // 1 hour
    // Keep in cache for 4 hours
    gcTime: 1000 * 60 * 60 * 4, // 4 hours
    enabled: !!castleId, // Only run query if castleId is provided
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 3,
  });
}