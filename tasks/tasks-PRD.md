## Relevant Files

- `docs/google-cloud-setup.md` - Step-by-step guide for Google Cloud Console configuration
- `.env.local.example` - Environment variables template for Google OAuth and API credentials
- `scripts/setup-env.js` - Interactive script to configure environment variables
- `src/lib/auth/google-auth.ts` - Google OAuth authentication utilities and session management
- `src/lib/auth/nextauth.config.ts` - NextAuth configuration with Google OAuth and admin restriction
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler
- `src/lib/auth/middleware.ts` - Authentication middleware for protecting admin routes
- `middleware.ts` - Global Next.js middleware configuration
- `src/lib/auth/session-manager.ts` - Session management and token refresh functionality
- `src/app/api/admin/auth/route.ts` - Admin authentication API endpoints for session management
- `src/app/admin/page.tsx` - Main admin dashboard page component
- `src/app/admin/layout.tsx` - Admin layout with authentication wrapper
- `src/components/admin/Dashboard.tsx` - Main dashboard component showing availability calendar
- `src/components/admin/BookingManager.tsx` - Component for managing bookings (add/edit/cancel)
- `src/components/admin/AvailabilityCalendar.tsx` - Calendar component showing bouncy castle availability
- `src/lib/auth/google-auth.ts` - Google OAuth authentication utilities
- `src/lib/calendar/google-calendar.ts` - Google Calendar API integration
- `src/lib/database/bookings.ts` - Database operations for booking management
- `src/lib/types/booking.ts` - TypeScript types for booking data
- `src/app/api/admin/auth/route.ts` - API route for admin authentication
- `src/app/api/admin/bookings/route.ts` - API routes for booking CRUD operations
- `src/app/api/admin/calendar/route.ts` - API routes for calendar integration
- `src/app/api/availability/route.ts` - Public API for customer-facing availability

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Set up Google OAuth Authentication System
  - [x] 1.1 Configure Google Cloud Console project and OAuth 2.0 credentials
  - [x] 1.2 Set up environment variables for Google OAuth client ID and secret
  - [x] 1.3 Create authentication utilities in `src/lib/auth/google-auth.ts`
  - [x] 1.4 Implement OAuth flow with restricted access to specified admin emails
  - [x] 1.5 Create authentication middleware to protect admin routes
  - [x] 1.6 Set up session management and token refresh functionality
  - [x] 1.7 Create admin authentication API route in `src/app/api/admin/auth/route.ts`

- [ ] 2.0 Implement Google Calendar API Integration
  - [ ] 2.1 Enable Google Calendar API in Google Cloud Console
  - [ ] 2.2 Set up service account credentials for calendar access
  - [ ] 2.3 Create Google Calendar utilities in `src/lib/calendar/google-calendar.ts`
  - [ ] 2.4 Implement functions to read events from primary calendar
  - [ ] 2.5 Implement functions to create, update, and delete calendar events
  - [ ] 2.6 Create calendar sync API routes in `src/app/api/admin/calendar/route.ts`
  - [ ] 2.7 Add error handling and retry logic for API calls
  - [ ] 2.8 Implement real-time sync between booking changes and calendar

- [ ] 3.0 Create Admin Dashboard and Booking Management Interface
  - [ ] 3.1 Create admin layout component in `src/app/admin/layout.tsx` with auth wrapper
  - [ ] 3.2 Build main admin dashboard page in `src/app/admin/page.tsx`
  - [ ] 3.3 Create availability calendar component in `src/components/admin/AvailabilityCalendar.tsx`
  - [ ] 3.4 Implement booking management component in `src/components/admin/BookingManager.tsx`
  - [ ] 3.5 Add booking forms for create, edit, and cancel operations
  - [ ] 3.6 Implement status indicators (Available, Booked Out, Unavailable/Maintenance)
  - [ ] 3.7 Add comprehensive booking detail fields (Customer, Contact, Location, etc.)
  - [ ] 3.8 Implement double-booking prevention with validation
  - [ ] 3.9 Create booking API routes in `src/app/api/admin/bookings/route.ts`
  - [ ] 3.10 Make dashboard responsive for desktop and mobile use

- [ ] 4.0 Develop Customer-Facing Availability Integration
  - [ ] 4.1 Create public availability API endpoint in `src/app/api/availability/route.ts`
  - [ ] 4.2 Update existing customer booking page to fetch real-time availability
  - [ ] 4.3 Implement automatic greying out of booked and unavailable dates
  - [ ] 4.4 Ensure real-time synchronization between admin changes and customer view
  - [ ] 4.5 Add loading states and error handling for availability data
  - [ ] 4.6 Test integration with existing booking flow

- [ ] 5.0 Implement Data Storage and Historical Reporting
  - [ ] 5.1 Design database schema for booking data in `src/lib/types/booking.ts`
  - [ ] 5.2 Create database operations in `src/lib/database/bookings.ts`
  - [ ] 5.3 Implement CRUD operations for booking management
  - [ ] 5.4 Add data validation and sanitization
  - [ ] 5.5 Create historical booking data retrieval functions
  - [ ] 5.6 Build reporting interface within admin dashboard
  - [ ] 5.7 Implement data backup and recovery procedures
  - [ ] 5.8 Add performance monitoring for database operations