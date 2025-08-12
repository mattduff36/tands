# Bouncy Castle Hire Website - Complete Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Booking System](#booking-system)
7. [Payment System](#payment-system)
8. [Admin Panel](#admin-panel)
9. [API Endpoints](#api-endpoints)
10. [Components Architecture](#components-architecture)
11. [Key Processes & Workflows](#key-processes--workflows)
12. [Stripe Integration](#stripe-integration)
13. [Calendar Integration](#calendar-integration)
14. [Email System](#email-system)
15. [UI/UX Patterns](#uiux-patterns)
16. [Development Guidelines](#development-guidelines)
17. [Deployment & Environment](#deployment--environment)
18. [Common Issues & Solutions](#common-issues--solutions)

---

## Project Overview

### Business Model
- **Service**: Bouncy castle hire/rental business
- **Target Market**: Families, event organizers, party planners
- **Key Features**: Online booking, payment processing, admin management, agreement signing

### Core Functionality
1. **Customer Journey**: Browse castles → Book → Pay deposit/full → Sign agreement → Delivery
2. **Admin Management**: Booking oversight, payment tracking, status updates, calendar management
3. **Payment Options**: Cash on delivery (deposit) or online payment (full amount)

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI + Radix UI
- **State Management**: React useState/useEffect (no external state management)
- **Forms**: Native form handling with validation

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Native SQL queries (no ORM)
- **Authentication**: NextAuth.js

### Third-Party Services
- **Payments**: Stripe
- **Calendar**: Google Calendar API
- **Email**: (Email system implementation details)
- **Hosting**: Vercel
- **Database Hosting**: (Database provider details)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Git Hooks**: Husky
- **Code Quality**: Prettier (implied)

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin panel pages
│   │   └── bookings/            # Admin booking management
│   │       └── page.tsx         # Main admin bookings interface
│   ├── api/                     # API routes
│   │   ├── admin/               # Admin-only endpoints
│   │   │   └── bookings/        # Admin booking operations
│   │   │       ├── route.ts     # GET /api/admin/bookings
│   │   │       └── [id]/        # Individual booking operations
│   │   │           └── update-payment/
│   │   │               └── route.ts  # POST /api/admin/bookings/[id]/update-payment
│   │   ├── bookings/            # Public booking endpoints
│   │   │   └── [bookingRef]/    # Booking reference operations
│   │   │       ├── route.ts     # GET booking by reference
│   │   │       └── update-payment-method/
│   │   │           └── route.ts # POST update payment method
│   │   ├── castles/             # Castle data endpoints
│   │   │   └── route.ts         # GET /api/castles
│   │   └── payments/            # Payment processing
│   │       ├── create-payment-intent/
│   │       │   └── route.ts     # POST create Stripe payment intent
│   │       └── webhook/
│   │           └── route.ts     # POST Stripe webhook handler
│   ├── hire-agreement/          # Customer agreement signing
│   │   └── page.tsx            # Agreement page with payment
│   └── globals.css             # Global styles
├── components/                  # Reusable components
│   ├── admin/                  # Admin-specific components
│   │   ├── BookingDetailsModal.tsx
│   │   ├── BookingFormModal.tsx
│   │   └── BookingManager.tsx
│   ├── payment/                # Payment components
│   │   ├── StripeCheckoutForm.tsx
│   │   └── StripePaymentForm.tsx
│   ├── sections/               # Page sections
│   │   └── BookingForm.tsx     # Main customer booking form
│   └── ui/                     # Base UI components (Shadcn)
├── lib/                        # Utility libraries
│   ├── auth/                   # Authentication configuration
│   │   └── nextauth.config.ts  # NextAuth setup
│   ├── calendar/               # Google Calendar integration
│   │   └── google-calendar.ts  # Calendar API wrapper
│   ├── database/               # Database operations
│   │   ├── connection.ts       # PostgreSQL connection pool
│   │   ├── bookings.ts         # Booking database operations
│   │   └── castles.ts          # Castle data operations
│   ├── types/                  # TypeScript type definitions
│   │   └── booking.ts          # Booking-related types
│   ├── utils/                  # Utility functions
│   │   └── performance-monitor.ts # Database performance monitoring
│   ├── validation/             # Data validation
│   │   └── booking-validation.ts
│   └── stripe.ts               # Stripe configuration
└── docs/                       # Documentation
    ├── booking-system-overview.md
    └── booking-system-overview-revised.md
```

---

## Database Schema

### Core Tables

#### `bookings` Table
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  booking_ref VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_address TEXT NOT NULL,
  castle_id INTEGER NOT NULL,
  castle_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  event_duration INTEGER DEFAULT 8, -- hours
  payment_method VARCHAR(50) NOT NULL, -- 'cash', 'online', 'card', 'other'
  total_price DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'expired'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Agreement tracking
  agreement_signed BOOLEAN DEFAULT FALSE,
  agreement_signed_at TIMESTAMP WITH TIME ZONE,
  agreement_signed_by VARCHAR(255),
  agreement_signed_method VARCHAR(20), -- 'email', 'manual', 'physical', 'admin_override'
  agreement_ip_address INET,
  agreement_user_agent TEXT,
  agreement_pdf_generated BOOLEAN DEFAULT FALSE,
  agreement_pdf_generated_at TIMESTAMP WITH TIME ZONE,
  agreement_email_opened BOOLEAN DEFAULT FALSE,
  agreement_email_opened_at TIMESTAMP WITH TIME ZONE,
  agreement_viewed BOOLEAN DEFAULT FALSE,
  agreement_viewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Email automation tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  manual_confirmation BOOLEAN DEFAULT FALSE,
  confirmed_by VARCHAR(255),
  
  -- Payment tracking (Stripe integration)
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'deposit_paid', 'paid_full'
  payment_intent_id VARCHAR(255), -- Stripe payment intent ID
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_amount INTEGER, -- Amount in pence
  payment_type VARCHAR(20), -- 'deposit', 'full'
  payment_failure_reason TEXT,
  admin_payment_comment TEXT,
  
  -- Google Calendar integration
  calendar_event_id VARCHAR(255),
  calendar_sync_status VARCHAR(20), -- 'synced', 'pending', 'failed'
  calendar_sync_error TEXT,
  calendar_last_sync_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit trail
  audit_trail JSONB, -- Stores array of audit entries
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  
  -- Cancellation tracking
  cancellation_reason TEXT,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_fee DECIMAL(10,2)
);

-- Indexes for performance
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_bookings_castle_id ON bookings(castle_id);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_bookings_payment_intent_id ON bookings(payment_intent_id);
CREATE INDEX idx_bookings_calendar_event_id ON bookings(calendar_event_id);
```

#### `castles` Table (Implied structure)
```sql
CREATE TABLE castles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  dimensions VARCHAR(100),
  age_range VARCHAR(50),
  capacity INTEGER,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Key Database Operations

#### Booking Queries
- **Get by Status**: `getBookingsByStatus(status?: string)`
- **Get by Payment Intent**: `getBookingByPaymentIntent(paymentIntentId: string)`
- **Update Payment Status**: `updateBookingPaymentStatus(bookingRef, paymentData)`
- **Update Payment Method**: `updateBookingPaymentMethod(id, paymentMethod)`

---

## Authentication & Authorization

### NextAuth Configuration
- **File**: `src/lib/auth/nextauth.config.ts`
- **Provider**: Email-based authentication (implied)
- **Session Management**: JWT tokens

### Admin Access Control
- **Admin Emails**: Stored in environment variable `ADMIN_EMAILS` (comma-separated)
- **Authorization Check**: Used in admin API routes
```typescript
const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
if (!adminEmails.includes(session.user.email)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Protected Routes
- `/admin/*` - Requires admin authentication
- `/api/admin/*` - Admin-only API endpoints

---

## Booking System

### Booking Statuses
1. **pending** - Initial booking request received
2. **confirmed** - Booking confirmed with customer, agreement signed
3. **completed** - Event finished successfully
4. **expired** - Booking expired/cancelled

### Booking Flow
1. **Customer Request**: Customer fills booking form (`/components/sections/BookingForm.tsx`)
2. **Booking Creation**: POST to `/api/booking` creates pending booking
3. **Admin Review**: Admin views in admin panel (`/admin/bookings`)
4. **Confirmation**: Admin confirms booking (status: pending → confirmed)
5. **Agreement**: Customer signs hire agreement (`/hire-agreement`)
6. **Payment**: Customer pays deposit/full amount via Stripe
7. **Completion**: After event, status updated to completed

### Booking Reference Generation
- **Format**: Alphanumeric string (e.g., "TS012")
- **Uniqueness**: Enforced by database constraint
- **Usage**: Used in URLs and customer communications

---

## Payment System

### Payment Methods
1. **Cash on Delivery**: 
   - Customer pays deposit online
   - Remaining balance paid in cash on delivery
   - Payment Type: 'deposit'

2. **Online Payment**: 
   - Customer pays full amount online
   - No cash required on delivery
   - Payment Type: 'full'

### Payment Statuses
- **pending** - No payment received
- **deposit_paid** - Partial payment (deposit) received
- **paid_full** - Full payment received

### Payment Flow
1. **Payment Intent Creation**: POST `/api/payments/create-payment-intent`
2. **Stripe Processing**: Customer completes payment via Stripe Elements
3. **Webhook Handling**: Stripe webhook updates booking status
4. **Status Tracking**: Payment status persisted in database

### Stripe Integration Details
- **Payment Intents**: Used for secure payment processing
- **Webhooks**: Handle payment success/failure events
- **Metadata**: Booking reference stored in Stripe metadata
- **Currency**: GBP (British Pounds)
- **Amount Format**: Stored in pence (multiply by 100)

---

## Admin Panel

### Admin Bookings Interface (`/admin/bookings`)

#### Key Features
1. **Booking List**: Displays all bookings with filtering
2. **Status Management**: Update booking statuses
3. **Payment Tracking**: Circular payment status buttons
4. **Agreement Monitoring**: Track agreement signing status

#### Payment Status UI
- **Circular Buttons**: Large, clickable £ symbol buttons
- **Color Coding**:
  - Green: Paid Full
  - Yellow: Deposit Paid
  - Gray: No Payment
- **Position**: Right side of booking rows (mobile-friendly)

#### Status Filters
```typescript
const statusFilters = {
  pending: true,
  confirmed: true,
  completed: true,
  expired: true
};
```

#### Booking Actions
- **View Details**: Modal with full booking information
- **Update Payment**: Modal for changing payment status
- **Confirm Booking**: Change status from pending to confirmed
- **Send Agreement**: Trigger agreement email to customer

### Admin API Endpoints
- `GET /api/admin/bookings` - Fetch all bookings with filters
- `POST /api/admin/bookings/[id]/update-payment` - Update payment status

---

## API Endpoints

### Public Endpoints

#### Bookings
- `POST /api/booking` - Create new booking
- `GET /api/bookings/[bookingRef]` - Get booking by reference
- `POST /api/bookings/[bookingRef]/update-payment-method` - Update payment method

#### Castles
- `GET /api/castles` - Get available castles

#### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/webhook` - Handle Stripe webhooks

#### Address Autocomplete
- `GET /api/addresses/autocomplete?q=...` - UK address suggestions (getAddress.io preferred; OS Places fallback; Geoapify fallback)
- `POST /api/addresses/resolve` - Normalize selected address and provide coordinates (getAddress.io preferred)

### Admin Endpoints
- `GET /api/admin/bookings` - Get all bookings (admin only)
- `POST /api/admin/bookings/[id]/update-payment` - Update payment status (admin only)

### API Response Patterns
```typescript
// Success Response
{
  success: true,
  data: {...},
  message?: string
}

// Error Response
{
  error: string,
  details?: string
}
```

---

## Components Architecture

### Component Hierarchy

#### Admin Components
- **BookingManager**: Main admin interface container
- **BookingDetailsModal**: Detailed booking view
- **BookingFormModal**: Edit booking form

#### Payment Components
- **StripePaymentForm**: Main payment interface
  - Props: `bookingRef`, `customerName`, `customerEmail`, `depositAmount`, `paymentType`
  - Handles both deposit and full payments
- **StripeCheckoutForm**: Stripe Elements integration

#### Form Components
- **BookingForm**: Customer booking request form
  - Payment method selection (button-style)
  - Castle selection
  - Date/time selection
  - Customer information

### UI Patterns

#### Payment Method Selection
```tsx
// Button-style selection (used in BookingForm and hire-agreement)
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <button
    className={`p-3 rounded-md border-2 transition-all duration-200 text-sm font-medium ${
      paymentMethod === "cash"
        ? "border-green-500 bg-green-50 text-green-700"
        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
    }`}
  >
    Cash on Delivery
  </button>
  <button
    className={`p-3 rounded-md border-2 transition-all duration-200 text-sm font-medium ${
      paymentMethod === "online"
        ? "border-blue-500 bg-blue-50 text-blue-700"
        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
    }`}
  >
    Online Payment
  </button>
</div>
```

#### Payment Status Buttons
```tsx
// Circular payment status button (admin panel)
<button
  className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors ${buttonClass}`}
  onClick={(e) => {
    e.stopPropagation();
    handlePaymentBadgeClick(booking);
  }}
  title={tooltipText}
>
  <PoundSterling className="w-5 h-5" />
</button>
```

---

## Key Processes & Workflows

### Customer Booking Process
1. **Browse Castles**: Customer views available castles
2. **Select Castle**: Choose castle and date
3. **Fill Form**: Provide contact details and preferences
4. **Choose Payment Method**: Cash on delivery vs Online payment
5. **Submit Request**: Creates pending booking
6. **Admin Confirmation**: Admin reviews and confirms
7. **Agreement Signing**: Customer receives agreement link
8. **Payment Processing**: Customer pays via Stripe
9. **Booking Confirmed**: System updates status

### Admin Workflow
1. **Review Requests**: Check pending bookings
2. **Validate Details**: Verify availability and details
3. **Confirm Booking**: Change status to confirmed
4. **Monitor Payments**: Track payment status
5. **Send Agreements**: Trigger agreement emails
6. **Track Completion**: Monitor agreement signing
7. **Post-Event**: Update to completed status

### Payment Processing Workflow
1. **Payment Intent**: Create Stripe payment intent
2. **Customer Payment**: Process via Stripe Elements
3. **Webhook Receipt**: Stripe notifies of payment status
4. **Database Update**: Update booking payment status
5. **Status Reflection**: UI shows updated payment status

---

## Stripe Integration

### Configuration
- **File**: `src/lib/stripe.ts`
- **API Version**: '2025-07-30.basil'
- **Currency**: GBP
- **Payment Methods**: Card payments via Elements

### Payment Intent Creation
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount, // in pence
  currency: 'gbp',
  description: `${paymentType === 'full' ? 'Full payment' : 'Deposit payment'} for booking ${bookingRef}`,
  metadata: {
    bookingRef,
    customerName,
    customerEmail,
    type: paymentType || 'deposit',
  },
  receipt_email: customerEmail,
  automatic_payment_methods: {
    enabled: true,
  },
});
```

### Webhook Handling
- **Endpoint**: `/api/payments/webhook`
- **Events**: `payment_intent.succeeded`, `payment_intent.payment_failed`
- **Security**: Stripe signature verification
- **Actions**: Update booking payment status in database

### Payment Status Mapping
```typescript
// Database payment_status values
'pending' | 'deposit_paid' | 'paid_full'

// Stripe payment statuses
'succeeded' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled'
```

---

## Calendar Integration

### Google Calendar API
- **File**: `src/lib/calendar/google-calendar.ts`
- **Purpose**: Sync bookings with Google Calendar
- **Features**: Create, update, delete calendar events

### Calendar Fields in Database
- `calendar_event_id`: Google Calendar event ID
- `calendar_sync_status`: 'synced' | 'pending' | 'failed'
- `calendar_sync_error`: Error details if sync fails
- `calendar_last_sync_at`: Last sync timestamp

---

## Email System

### Email Automation
- **Agreement Emails**: Sent when booking confirmed
- **Tracking Fields**: 
  - `email_sent`: Boolean flag
  - `email_sent_at`: Timestamp
  - `agreement_email_opened`: Track email opens
  - `agreement_viewed`: Track agreement page views

---

## UI/UX Patterns

### Design System
- **Framework**: Tailwind CSS
- **Components**: Shadcn UI + Radix UI
- **Colors**: 
  - Green: Cash payments, success states
  - Blue: Online payments, primary actions
  - Gray: Neutral states, pending status
  - Red: Errors, failures

### Responsive Design
- **Mobile-First**: Tailwind mobile-first approach
- **Breakpoints**: `sm:`, `md:`, `lg:` classes
- **Grid Layouts**: `grid-cols-1 sm:grid-cols-2`

### Interactive Elements
- **Hover States**: Consistent hover effects
- **Transitions**: `transition-all duration-200`
- **Focus States**: Accessible focus indicators
- **Loading States**: Spinner animations

---

## Development Guidelines

### Code Style
- **Language**: TypeScript for all code
- **Functions**: Use `function` keyword for pure functions
- **Components**: Functional components with TypeScript interfaces
- **Naming**: Descriptive variable names with auxiliary verbs
- **File Structure**: Exported component, subcomponents, helpers, static content, types

### TypeScript Usage
- **Interfaces**: Prefer interfaces over types
- **Enums**: Avoid enums, use maps instead
- **Strict Mode**: Enable strict TypeScript checking

### Component Patterns
- **Server Components**: Prefer React Server Components (RSC)
- **Client Components**: Minimize 'use client', use only for Web API access
- **State Management**: useState/useEffect for local state
- **Error Handling**: Comprehensive try-catch blocks

### Database Patterns
- **Connection Pooling**: Use connection pool for PostgreSQL
- **Performance Monitoring**: Wrapper functions for query timing
- **Error Handling**: Proper error logging and user feedback
- **Transactions**: Use transactions for multi-table operations

---

## Deployment & Environment

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Calendar
GOOGLE_CALENDAR_API_KEY=...
GOOGLE_CALENDAR_ID=...
 
# Address Autocomplete (Geoapify)
GEOAPIFY_API_KEY=...

# Address Autocomplete (getAddress.io - preferred)
GETADDRESS_API_KEY=...

# Address Autocomplete (Ordnance Survey Places - fallback)
OS_PLACES_API_KEY=...
```

### Deployment Platform
- **Platform**: Vercel
- **Build Command**: `npm run build`
- **Framework**: Next.js (auto-detected)
- **Node Version**: Latest LTS

---

## Common Issues & Solutions

### Payment Status Persistence
**Issue**: Payment status changes don't persist after page refresh
**Cause**: Database query missing payment_status fields
**Solution**: Include payment fields in SELECT query and result mapping

### Payment Method Update 404
**Issue**: 404 error when updating payment method
**Cause**: API searching only 'pending' bookings
**Solution**: Search all booking statuses, not just pending

### TypeScript Type Mismatches
**Issue**: Payment status type conflicts
**Cause**: Interface definitions not matching database schema
**Solution**: Align interface types with actual database values

### Mobile Layout Issues
**Issue**: Payment buttons appearing at bottom on mobile
**Cause**: `flex-col` on mobile breaking layout
**Solution**: Use consistent `flex` layout with `items-start`

### Stripe Payment UI Confusion
**Issue**: Always showing "deposit" text even for full payments
**Cause**: Hardcoded UI text not respecting paymentType prop
**Solution**: Conditional text based on paymentType parameter

---

## File-Specific Implementation Details

### `/src/app/admin/bookings/page.tsx`
- **Purpose**: Main admin interface for booking management
- **Key Functions**:
  - `getPaymentButton()`: Renders circular payment status buttons
  - `handlePaymentBadgeClick()`: Opens payment edit modal
  - `mapPaymentStatusToAdminUI()`: Maps database values to UI values
- **State Management**: Local state for bookings, filters, modals
- **Payment Status Flow**: Database → API → State → UI

### `/src/components/payment/StripePaymentForm.tsx`
- **Purpose**: Stripe payment interface component
- **Props**: `bookingRef`, `customerName`, `customerEmail`, `depositAmount`, `paymentType`
- **Payment Types**: 'deposit' | 'full'
- **UI Adaptation**: Changes title and description based on paymentType

### `/src/lib/database/bookings.ts`
- **Purpose**: Database operations for bookings
- **Key Functions**:
  - `getBookingsByStatus()`: Main query function with payment fields
  - `updateBookingPaymentMethod()`: Update payment method
  - `updateBookingPaymentStatus()`: Update payment status via Stripe
- **Performance**: Wrapped with performance monitoring

### `/src/app/hire-agreement/page.tsx`
- **Purpose**: Customer agreement signing and payment
- **Payment Method Selection**: Button-style matching booking form
- **Payment Integration**: Conditional Stripe form based on payment method
- **Agreement Tracking**: Database fields for audit trail

---

## Future Development Considerations

### Scalability
- **Database**: Consider read replicas for heavy admin usage
- **Caching**: Implement Redis for session management
- **CDN**: Use CDN for static assets and images

### Features
- **SMS Notifications**: Customer booking confirmations
- **Advanced Calendar**: Multi-calendar support
- **Reporting**: Analytics dashboard for admin
- **Customer Portal**: Account management for repeat customers

### Security
- **Rate Limiting**: Implement API rate limiting
- **Input Validation**: Enhanced server-side validation
- **Audit Logging**: Comprehensive audit trail
- **GDPR Compliance**: Data retention and deletion policies

---

This documentation provides a comprehensive overview of the bouncy castle hire website. It should serve as a complete reference for understanding the codebase structure, implementation patterns, and business logic without needing to re-explore the code.
