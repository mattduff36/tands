# Taylors & Smiths Bouncy Castle Hire - Improvements & Optimizations PRD

## Executive Summary

This document outlines comprehensive improvements and optimizations for the Taylors & Smiths Bouncy Castle Hire website to enhance performance, maintainability, security, and developer experience without changing the visual appearance.

## Current State Analysis

### Technology Stack
- **Framework**: Next.js 14.2.30 with App Router
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: PostgreSQL, Node.js API Routes
- **Auth**: NextAuth.js with Google OAuth
- **External Services**: Google Calendar API, Nodemailer, Vercel deployment

### Key Issues Identified

## 1. Performance Optimizations

### 1.1 Database Query Optimization
**Priority**: High  
**Impact**: Major performance improvement

**Current Issues:**
- Multiple `SELECT *` queries loading unnecessary data
- N+1 query patterns in bookings/calendar sync
- Missing database indexes
- Inefficient WHERE clauses

**Proposed Solutions:**
```sql
-- Replace SELECT * with specific columns
SELECT id, customer_name, date, status FROM bookings 
WHERE status IN ('pending', 'confirmed') 
ORDER BY date DESC;

-- Add database indexes
CREATE INDEX idx_bookings_status_date ON bookings(status, date);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_castles_maintenance_status ON castles(maintenance_status);
```

**Implementation:**
- Audit all database queries and replace `SELECT *` with specific columns
- Add appropriate indexes for frequently queried fields
- Implement query result caching for static data (castles)
- Use connection pooling optimizations

### 1.2 API Response Caching
**Priority**: High  
**Impact**: Reduced server load and faster response times

**Current Issues:**
- No caching on frequently accessed endpoints
- Repeated API calls for static data (castles, settings)

**Proposed Solutions:**
```typescript
// Implement Next.js caching
export async function GET() {
  const castles = await getCastles();
  return NextResponse.json(castles, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
}

// React Query for client-side caching
const { data: castles, isLoading } = useQuery({
  queryKey: ['castles'],
  queryFn: fetchCastles,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 1.3 Code Splitting & Bundle Optimization
**Priority**: Medium  
**Impact**: Faster initial page loads

**Current Issues:**
- No dynamic imports or code splitting
- Large bundle sizes for admin panel
- Missing optimization configurations

**Proposed Solutions:**
```typescript
// Dynamic imports for heavy components
const BookingFormModal = dynamic(() => import('@/components/admin/BookingFormModal'), {
  ssr: false,
  loading: () => <Skeleton className="h-96" />
});

// Route-based code splitting for admin pages
const AdminReports = dynamic(() => import('./reports/page'), {
  ssr: false
});
```

**Next.js Configuration Updates:**
```javascript
// next.config.js enhancements
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
    optimizePackageImports: ['lucide-react', '@radix-ui'],
  },
  images: {
    domains: ['d98nzplymhizhheh.public.blob.vercel-storage.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

### 1.4 React Performance Optimizations
**Priority**: Medium  
**Impact**: Smoother user interactions

**Current Issues:**
- Multiple useState hooks causing unnecessary re-renders
- Missing memoization for expensive calculations
- Inefficient array operations in render functions

**Proposed Solutions:**
```typescript
// Consolidate related state
const [bookingState, setBookingState] = useReducer(bookingReducer, initialState);

// Memoize expensive calculations
const filteredBookings = useMemo(() => {
  return bookings.filter(booking => 
    statusFilters[booking.status] && 
    booking.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [bookings, statusFilters, searchTerm]);

// Memoize components
const BookingListItem = memo(({ booking, onEdit, onDelete }) => {
  // Component implementation
});
```

## 2. Code Quality Improvements

### 2.1 Logging Infrastructure
**Priority**: High  
**Impact**: Better debugging and monitoring

**Current Issues:**
- 100+ console.log statements in production code
- No structured logging
- Missing error tracking

**Proposed Solutions:**
```typescript
// Structured logging utility
class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  
  static info(message: string, meta?: Record<string, any>) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, meta);
    }
    // Send to logging service in production
  }
  
  static error(message: string, error?: Error, meta?: Record<string, any>) {
    console.error(`[ERROR] ${message}`, { error, ...meta });
    // Send to error tracking service
  }
}

// Usage
Logger.info('Booking created successfully', { bookingId, customerEmail });
Logger.error('Database query failed', error, { query, params });
```

### 2.2 Error Handling Standardization
**Priority**: Medium  
**Impact**: More reliable error handling

**Current Issues:**
- Inconsistent error handling patterns
- Verbose error messages exposing system details
- Missing error boundaries

**Proposed Solutions:**
```typescript
// Standardized API error handling
class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Error boundary component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 2.3 Environment Variable Management
**Priority**: Low  
**Impact**: Better configuration management

**Current Issues:**
- Inconsistent environment variable patterns
- Missing validation for required variables

**Proposed Solutions:**
```typescript
// Environment configuration with validation
const config = {
  database: {
    url: process.env.DATABASE_URL!,
  },
  email: {
    host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
    enabled: process.env.EMAIL_ENABLED === 'true',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
};

// Validation at startup
function validateConfig() {
  const required = ['DATABASE_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

## 3. Security Enhancements

### 3.1 Input Validation & Sanitization
**Priority**: High  
**Impact**: Improved security posture

**Current Issues:**
- Missing input validation on API routes
- No SQL injection protection beyond parameterized queries

**Proposed Solutions:**
```typescript
// Zod validation schemas
const CreateBookingSchema = z.object({
  customerName: z.string().min(2).max(100).regex(/^[a-zA-Z\s]+$/),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(/^[\d\s\-\+\(\)]+$/),
  date: z.string().datetime(),
  castleId: z.number().int().positive(),
});

// API route with validation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CreateBookingSchema.parse(body);
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    throw error;
  }
}
```

### 3.2 Rate Limiting
**Priority**: Medium  
**Impact**: Protection against abuse

**Proposed Solutions:**
```typescript
// Rate limiting middleware
const rateLimiter = new Map();

export function withRateLimit(handler: Function, limit = 100, window = 60000) {
  return async (req: Request) => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowStart = now - window;
    
    // Clean old entries
    const requests = rateLimiter.get(ip)?.filter((time: number) => time > windowStart) || [];
    
    if (requests.length >= limit) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    
    requests.push(now);
    rateLimiter.set(ip, requests);
    
    return handler(req);
  };
}
```

## 4. Developer Experience Improvements

### 4.1 TypeScript Configuration Updates
**Priority**: Low  
**Impact**: Better development experience

**Proposed Solutions:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true
  }
}
```

### 4.2 Testing Infrastructure
**Priority**: Medium  
**Impact**: More reliable code

**Proposed Solutions:**
```typescript
// Unit test setup with Vitest
import { describe, it, expect } from 'vitest';
import { createBooking } from '@/lib/database/bookings';

describe('Booking Creation', () => {
  it('should create a booking with valid data', async () => {
    const bookingData = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      date: new Date().toISOString(),
      castleId: 1,
    };
    
    const result = await createBooking(bookingData);
    expect(result).toHaveProperty('id');
    expect(result.customerName).toBe(bookingData.customerName);
  });
});
```

## 5. Monitoring & Analytics

### 5.1 Performance Monitoring
**Priority**: Medium  
**Impact**: Better visibility into performance

**Proposed Solutions:**
```typescript
// Performance monitoring utility
class PerformanceMonitor {
  static async measureAsync<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      Logger.info(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      Logger.error(`Performance: ${name} failed`, error, { duration: `${duration.toFixed(2)}ms` });
      throw error;
    }
  }
}

// Usage
const bookings = await PerformanceMonitor.measureAsync(
  'fetch-bookings',
  () => getBookingsByStatus(['pending', 'confirmed'])
);
```

## Implementation Roadmap

### Phase 1: Critical Performance (Week 1-2)
1. Database query optimization
2. Remove production console.log statements
3. Implement basic caching
4. Add essential indexes

### Phase 2: Code Quality (Week 3-4)
1. Standardize error handling
2. Implement structured logging
3. Add input validation
4. React performance optimizations

### Phase 3: Security & Reliability (Week 5-6)
1. Rate limiting implementation
2. Error boundaries
3. Environment variable validation
4. Basic monitoring

### Phase 4: Developer Experience (Week 7-8)
1. Code splitting implementation
2. TypeScript configuration updates
3. Testing infrastructure
4. Bundle optimization

## Success Metrics

- **Performance**: 30% reduction in Time to Interactive (TTI)
- **Database**: 50% reduction in query response times
- **Bundle Size**: 25% reduction in initial bundle size
- **Error Rate**: 90% reduction in unhandled errors
- **Developer Productivity**: 40% faster build times

## Risk Assessment

**Low Risk:**
- Logging improvements
- TypeScript configuration updates
- Environment variable validation

**Medium Risk:**
- Database query modifications (require thorough testing)
- React component refactoring
- Caching implementation

**High Risk:**
- Major architectural changes (not recommended in scope)

## Conclusion

These improvements will significantly enhance the application's performance, maintainability, and reliability while maintaining the existing visual design. The phased approach ensures minimal disruption to current functionality while delivering measurable improvements.

## Next Steps

1. Review and approve this PRD
2. Create detailed implementation tickets for Phase 1
3. Set up development environment for testing changes
4. Begin implementation with database optimizations

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Review Date**: To be scheduled