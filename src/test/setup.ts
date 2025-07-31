/**
 * Vitest setup file
 * Configures testing environment and global mocks
 */

import '@testing-library/jest-dom';
import React, { useState, useEffect } from 'react';
import { beforeAll, vi } from 'vitest';

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    route: '/',
    asPath: '/',
    query: {},
  }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return React.createElement('img', { src, alt, ...props });
  },
}));

// Mock Next.js dynamic imports
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<any>) => {
    const Component = ({ ...props }) => {
      const [LoadedComponent, setLoadedComponent] = useState(null);
      
      useEffect(() => {
        fn().then(module => {
          setLoadedComponent(() => module.default || module);
        });
      }, []);
      
      if (!LoadedComponent) return React.createElement('div', null, 'Loading...');
      return React.createElement(LoadedComponent, props);
    };
    return Component;
  },
}));

// Mock environment variables
beforeAll(() => {
  process.env.NEXT_PUBLIC_ADMIN_EMAILS = 'admin@test.com';
  process.env.NEXTAUTH_SECRET = 'test-secret';
  process.env.DATABASE_URL = 'test://localhost/test';
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Uncomment to suppress console output in tests
  // log: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};