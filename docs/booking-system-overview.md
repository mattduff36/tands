# T&S Bouncy Castle Hire - Booking System Overview

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Data Models](#data-models)
3. [User Flows](#user-flows)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Calendar Integration](#calendar-integration)
7. [Admin Functions](#admin-functions)
8. [Issues and Inconsistencies](#issues-and-inconsistencies)

---

## System Architecture

### Overview
The T&S Bouncy Castle Hire booking system is a Next.js application with the following components:

- **Frontend**: Next.js App Router with React components
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with connection pooling
- **Calendar**: Google Calendar API integration
- **Authentication**: NextAuth.js with Google OAuth
- **UI**: Shadcn UI components with Tailwind CSS

### Key Technologies
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with `pg` library
- **Calendar**: Google Calendar API v3
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: React hooks (useState, useEffect)
- **Forms**: React Hook Form with validation

---

## Data Models

### Booking Interface
```typescript
interface Booking {
  id: number;
  bookingRef: string;           // Unique reference (e.g., TS001, TS002)
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  castleId: number;
  castleName: string;
  date: string;                 // ISO date string
  paymentMethod: string;        // 'cash' | 'card'
  totalPrice: number;           // In pence
  deposit: number;              // In pence
  status: 'pending' | 'confirmed' | 'completed' | 'expired';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  source: 'database' | 'calendar';
  
  // Agreement fields
  agreementSigned?: boolean;
  agreementSignedAt?: string;
  agreementSignedBy?: string;
}
```

### Castle Interface
```typescript
interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;                // In pence
  description: string;
  imageUrl: string;
  maintenanceStatus: 'available' | 'maintenance' | 'out_of_service';
  maintenanceNotes?: string;
  maintenanceStartDate?: string;
  maintenanceEndDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Calendar Event Interface
```typescript
interface CalendarEvent {
  id: string;                   // Google Calendar event ID
  summary: string;              // Event title
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  colorId?: string;
  status?: string;
}
```

---

## User Flows

### 1. Customer Booking Flow

#### Step 1: Customer Visits Website
- Customer visits `http://localhost:3000/booking`
- Views available castles with pricing
- Selects desired castle and date

#### Step 2: Booking Form Submission
- Customer fills out booking form with:
  - Personal details (name, email, phone, address)
  - Castle selection
  - Date selection
  - Payment method preference
- Form validation occurs client-side
- On submission, creates a **pending** booking in database

#### Step 3: Pending Booking Creation
```typescript
// API: POST /api/booking
{
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  address: string,
  castleType: string,
  date: string,
  paymentMethod: 'cash' | 'card'
}
```

**Database Action:**
- Generates unique booking reference (TS001, TS002, etc.)
- Calculates total price and deposit (30% of total)
- Creates booking with status = 'pending'
- Stores in `bookings` table

#### Step 4: Hire Agreement Process
- Customer receives email with hire agreement link
- Customer visits `/hire-agreement?bookingRef=TS001`
- Customer electronically signs agreement
- System calls confirmation API

#### Step 5: Agreement Confirmation
```typescript
// API: POST /api/bookings/[bookingRef]/confirm
{
  agreementSigned: true,
  agreementSignedAt: string
}
```

**System Actions:**
1. Updates booking status to 'confirmed'
2. Records agreement signing details
3. Creates Google Calendar event
4. Sends confirmation email to customer

### 2. Admin Booking Management Flow

#### Step 1: Admin Access
- Admin logs in via Google OAuth
- Accesses `/admin/bookings`

#### Step 2: View Bookings
- Admin sees combined list of:
  - Database bookings (pending, confirmed, completed)
  - Calendar events (converted to booking format)
- Filtering by status and search functionality

#### Step 3: Booking Actions
**For Database Bookings:**
- View details
- Confirm pending bookings
- Update status
- Edit booking details
- Delete bookings

**For Calendar Events:**
- View details
- Edit event details
- Delete events

#### Step 4: Manual Booking Creation
- Admin can create bookings directly
- Creates both database entry and calendar event
- Immediate confirmation status

### 3. Calendar Integration Flow

#### Step 1: Event Creation
- When booking is confirmed, creates Google Calendar event
- Event includes customer details, location, and booking reference
- Sets event time (9 AM - 5 PM by default)

#### Step 2: Event Management
- Admin can view calendar events in calendar view
- Events are color-coded (green for bookings, red for maintenance)
- Multi-day events supported

#### Step 3: Synchronization
- Calendar events and database bookings are synchronized
- Duplicate prevention logic prevents showing same booking twice

---

## API Endpoints

### Customer-Facing APIs

#### POST `/api/booking`
Creates a new pending booking
```typescript
Request:
{
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  address: string,
  castleType: string,
  date: string,
  paymentMethod: 'cash' | 'card'
}

Response:
{
  success: boolean,
  bookingRef: string,
  message: string
}
```

#### POST `/api/bookings/[bookingRef]/confirm`
Confirms a booking after agreement signing
```typescript
Request:
{
  agreementSigned: boolean,
  agreementSignedAt: string
}

Response:
{
  success: boolean,
  message: string,
  calendarEventId: string
}
```

#### GET `/api/castles`
Returns available castles
```typescript
Response:
{
  castles: Castle[]
}
```

#### GET `/api/availability`
Checks castle availability for a date
```typescript
Request:
{
  date: string,
  castleId?: number
}

Response:
{
  available: boolean,
  availableCastles: Castle[]
}
```

### Admin APIs

#### GET `/api/admin/bookings`
Returns all bookings for admin view
```typescript
Response:
{
  bookings: Booking[]
}
```

#### POST `/api/admin/bookings/[id]/confirm`
Confirms a pending booking
```typescript
Response:
{
  success: boolean,
  message: string
}
```

#### PUT `/api/admin/bookings/[id]`
Updates booking status or details
```typescript
Request:
{
  status?: string,
  customerName?: string,
  // ... other fields
}
```

#### DELETE `/api/admin/bookings/[id]`
Deletes a database booking

#### GET `/api/admin/calendar`
Returns calendar connection status
```typescript
Response:
{
  status: 'connected' | 'disconnected' | 'error',
  message: string,
  eventsThisMonth?: number
}
```

#### GET `/api/admin/calendar/events`
Returns calendar events for a month
```typescript
Request:
{
  year: number,
  month: number
}

Response:
{
  events: CalendarEvent[]
}
```

#### POST `/api/admin/calendar/events`
Creates a new calendar event
```typescript
Request:
{
  customerName: string,
  contactDetails: {
    email: string,
    phone: string
  },
  location: string,
  notes: string,
  duration: {
    start: string,
    end: string
  },
  cost: number,
  bouncyCastleType: string
}
```

#### PUT `/api/admin/calendar/events/[eventId]`
Updates a calendar event

#### DELETE `/api/admin/calendar/events/[eventId]`
Deletes a calendar event

---

## Database Schema

### Castles Table
```sql
CREATE TABLE castles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  theme VARCHAR(100) NOT NULL,
  size VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  maintenance_status VARCHAR(20) DEFAULT 'available',
  maintenance_notes TEXT,
  maintenance_start_date DATE,
  maintenance_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  booking_ref VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_address TEXT NOT NULL,
  castle_id INTEGER NOT NULL,
  castle_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  total_price INTEGER NOT NULL,
  deposit INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  agreement_signed BOOLEAN DEFAULT FALSE,
  agreement_signed_at TIMESTAMP WITH TIME ZONE,
  agreement_signed_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## Calendar Integration

### Google Calendar Service
The system uses Google Calendar API v3 for event management:

#### Event Creation
- Creates events with customer details
- Sets event time (9 AM - 5 PM default)
- Includes booking reference in description
- Adds customer as attendee

#### Event Format
```typescript
{
  summary: "🏰 Customer Name - Castle Name",
  description: "Booking Ref: TS001\nCost: £80\nPayment: Cash\nNotes: ...",
  location: "Customer Address",
  start: { dateTime: "2025-08-08T09:00:00Z" },
  end: { dateTime: "2025-08-08T17:00:00Z" },
  attendees: [{ email: "customer@email.com" }]
}
```

#### Synchronization Logic
- Database bookings and calendar events are kept in sync
- When booking is confirmed, calendar event is created
- When calendar event is deleted, database booking is marked as expired
- Duplicate prevention prevents showing same booking twice

---

## Admin Functions

### Booking Management
1. **View All Bookings**: Combined database and calendar events
2. **Filter by Status**: Pending, confirmed, completed
3. **Search**: By customer name, email, phone, address, booking ref
4. **Confirm Pending**: Updates status and creates calendar event
5. **Edit Bookings**: Update customer details, dates, castle
6. **Delete Bookings**: Remove from database and calendar

### Calendar Management
1. **View Calendar**: Monthly grid view with event bars
2. **Create Events**: Direct calendar event creation
3. **Edit Events**: Update event details
4. **Delete Events**: Remove from calendar
5. **Event Details**: View full event information

### Fleet Management
1. **View Castles**: List all available castles
2. **Maintenance Status**: Mark castles as available/maintenance/out of service
3. **Pricing**: Update castle prices
4. **Descriptions**: Update castle descriptions

### System Functions
1. **Debug Page**: Manual database operations
2. **Sequence Fix**: Fix database sequence issues
3. **Backup**: Database backup functionality
4. **Reports**: Booking reports and analytics

---

## Issues and Inconsistencies

### Current Problems

#### 1. Calendar Events in Bookings List
**Problem**: Calendar events are being converted to booking format and displayed in the admin bookings list, causing confusion.

**Impact**: 
- Calendar events appear with "DB" badge when they should be "Calendar"
- Users can't distinguish between database bookings and calendar events
- Delete functionality doesn't work properly for calendar events

**Root Cause**: The `createCombinedBookingsList` function converts calendar events to booking format and adds them to the bookings list.

#### 2. Booking Reference Generation
**Problem**: Calendar events get booking references like "CAL-1vtoodlc" which don't follow the TS001, TS002 pattern.

**Impact**: 
- Inconsistent booking reference format
- Confusion about booking source
- Difficult to track booking origins

#### 3. Duplicate Prevention Logic
**Problem**: The system tries to prevent duplicates but the logic is complex and error-prone.

**Impact**:
- Some bookings appear twice
- Some bookings disappear unexpectedly
- Difficult to debug booking display issues

#### 4. Status Synchronization
**Problem**: Database booking status and calendar event status can get out of sync.

**Impact**:
- Confirmed bookings might not appear in calendar
- Calendar events might not reflect database status
- Inconsistent state between systems

#### 5. Agreement Signing Process
**Problem**: The hire agreement signing process creates calendar events but the database booking status update might fail silently.

**Impact**:
- Calendar events created but database booking remains pending
- Inconsistent booking states
- Difficult to track agreement status

### Recommended Solutions

#### 1. Separate Calendar and Database Views
- Keep calendar events only in calendar view
- Keep database bookings only in bookings list
- Clear separation of concerns

#### 2. Consistent Booking References
- Use TS001, TS002 pattern for all bookings
- Generate references consistently across systems
- Clear reference format documentation

#### 3. Simplified Synchronization
- Single source of truth for booking data
- Clear rules for when calendar events are created
- Simplified duplicate prevention

#### 4. Better Error Handling
- Add logging to all critical operations
- Better error messages for failed operations
- Rollback mechanisms for failed operations

#### 5. Improved Admin Interface
- Clear distinction between database and calendar items
- Proper delete functionality for all item types
- Better status indicators

---

## System Dependencies

### External Services
- **Google Calendar API**: Event management
- **Google OAuth**: Admin authentication
- **PostgreSQL**: Database storage
- **Email Service**: Customer notifications

### Environment Variables
```env
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALENDAR_ID=...
ADMIN_EMAILS=admin@example.com,admin2@example.com
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### File Structure
```
src/
├── app/
│   ├── api/
│   │   ├── admin/          # Admin API endpoints
│   │   ├── booking/        # Customer booking API
│   │   └── bookings/       # Booking management API
│   ├── admin/              # Admin pages
│   ├── booking/            # Customer booking page
│   └── hire-agreement/     # Agreement signing page
├── components/
│   ├── admin/              # Admin components
│   ├── sections/           # Page sections
│   └── ui/                 # UI components
└── lib/
    ├── database/           # Database functions
    ├── calendar/           # Calendar integration
    └── auth/               # Authentication
```

---

## Performance Considerations

### Database Optimization
- Connection pooling for database connections
- Indexed queries for booking lookups
- Efficient status filtering

### Calendar API Optimization
- Batch calendar operations where possible
- Caching of calendar events
- Efficient event filtering

### Frontend Optimization
- React Server Components for static content
- Client components only where necessary
- Efficient state management

---

## Security Considerations

### Authentication
- Google OAuth for admin access
- Session-based authentication
- Admin email whitelist

### Data Protection
- Input validation on all forms
- SQL injection prevention
- XSS protection

### API Security
- Rate limiting on public APIs
- Input sanitization
- Error message sanitization

---

This document provides a comprehensive overview of the T&S Bouncy Castle Hire booking system. The system is functional but has several areas that could benefit from refactoring and improvement, particularly around the separation of calendar and database booking management. 