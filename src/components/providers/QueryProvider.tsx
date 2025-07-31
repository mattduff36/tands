'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // Create a QueryClient instance with optimized defaults
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 30 minutes by default
        staleTime: 1000 * 60 * 30, // 30 minutes
        // Keep unused data in cache for 1 hour
        gcTime: 1000 * 60 * 60, // 1 hour (formerly cacheTime)
        // Retry failed requests 2 times
        retry: 2,
        // Refetch on window focus for better UX
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect for static data
        refetchOnReconnect: false,
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}