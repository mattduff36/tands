# TSB Bouncy Castle Hire - Setup & Access Guide

This guide will walk you through setting up and accessing the bouncy castle booking management system.

## 🚀 Quick Start

### 1. Environment Setup

First, ensure you have the required environment variables. Copy the example file:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual values:

```bash
# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Google Calendar API (Service Account)
GOOGLE_CALENDAR_CREDENTIALS=path/to/your/service-account-key.json
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com

# Admin Access Control
ALLOWED_ADMIN_EMAILS=your-email@gmail.com,another-admin@gmail.com
```

### 2. Google Cloud Setup

Run the automated setup script:

```bash
node scripts/setup-env.js
```

This will guide you through:
- Creating Google OAuth credentials
- Setting up Google Calendar API
- Configuring service account
- Setting up the calendar

### 3. Install Dependencies & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at **http://localhost:3000**

## 🌐 Accessing the System

### **Customer Interface**
- **URL**: `http://localhost:3000`
- **Features**: 
  - View available bouncy castles
  - Check real-time availability
  - Submit booking requests
  - See live date availability (greyed out dates are unavailable)

### **Admin Interface**
- **URL**: `http://localhost:3000/admin`
- **Authentication**: Google OAuth (restricted to allowed emails)
- **Features**:
  - Booking management dashboard
  - Google Calendar integration
  - Performance monitoring
  - Data backup/restore
  - Advanced reporting

### **API Endpoints**

#### Public APIs (No authentication required):
```bash
# Check availability for date range
GET /api/availability?dateFrom=2024-01-01&dateTo=2024-01-31

# Check specific booking conflicts
POST /api/availability
{
  "castleId": "castle-1",
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "16:00"
}
```

#### Admin APIs (Authentication required):
```bash
# Booking management
GET /api/admin/bookings
POST /api/admin/bookings
PUT /api/admin/bookings/[id]
DELETE /api/admin/bookings/[id]

# Calendar operations
GET /api/admin/calendar
POST /api/admin/calendar/events
PUT /api/admin/calendar/events/[eventId]
DELETE /api/admin/calendar/events/[eventId]

# Reporting
GET /api/admin/reports/stats
POST /api/admin/reports/export

# Backup management
GET /api/admin/backup
POST /api/admin/backup
DELETE /api/admin/backup?backupId=xxx

# Performance monitoring
GET /api/admin/performance
POST /api/admin/performance
```

## 🔧 Configuration Details

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google OAuth API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Google Calendar API Setup
1. Enable Google Calendar API in Google Cloud Console
2. Create a service account
3. Download the service account key JSON file
4. Share your Google Calendar with the service account email
5. Get the Calendar ID from Calendar settings

### Admin Access
- Only email addresses listed in `ALLOWED_ADMIN_EMAILS` can access admin features
- Admins must sign in with Google OAuth
- Session-based authentication with automatic token refresh

## 📱 Usage Flow

### For Customers:
1. Visit `http://localhost:3000`
2. Browse available bouncy castles
3. Select dates (unavailable dates are greyed out automatically)
4. Fill out booking form
5. Submit request (validates against real-time availability)

### For Admins:
1. Visit `http://localhost:3000/admin`
2. Sign in with Google (must be in allowed emails list)
3. Access admin dashboard with:
   - **Bookings**: View, create, edit, delete bookings
   - **Calendar**: Sync with Google Calendar, manage events
   - **Reports**: View statistics, export data
   - **Backup**: Create/restore data backups
   - **Performance**: Monitor system performance

## 🎯 Key Features Access

### Real-Time Availability
- Automatically updates every 30 seconds on customer pages
- Instantly reflects admin changes
- Visual feedback with date coloring
- Conflict prevention before booking submission

### Admin Dashboard
- Navigate to `/admin` after Google OAuth login
- Dashboard shows booking statistics and quick actions
- Access all management features through the sidebar

### Reporting System
- Access via `/admin/reports` or API endpoints
- Filter by date ranges, castle types, booking status
- Export data as CSV or JSON
- Visual charts and statistics

### Backup System
- Automated daily backups (configurable)
- Manual backup creation via admin interface
- Restore functionality with validation
- Data integrity checking

### Performance Monitoring
- Real-time performance metrics
- Slow query detection
- Resource usage monitoring
- Alert system for performance issues

## 🔍 Troubleshooting

### Common Issues:

1. **"Unauthorized" error in admin**
   - Check your email is in `ALLOWED_ADMIN_EMAILS`
   - Verify Google OAuth configuration
   - Clear browser cookies and re-login

2. **Calendar sync not working**
   - Verify service account has calendar access
   - Check Google Calendar API is enabled
   - Validate service account key file path

3. **Real-time updates not working**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Ensure JavaScript is enabled

4. **Environment variables not loading**
   - Ensure `.env.local` file exists
   - Restart the development server
   - Check for typos in variable names

## 🚦 Next Steps

1. **Set up Google services** using the automated script
2. **Configure environment variables** with your actual values
3. **Run the development server** with `npm run dev`
4. **Access the admin interface** at `http://localhost:3000/admin`
5. **Test the customer interface** at `http://localhost:3000`

Need help? Check the troubleshooting section above or review the detailed documentation files in the project.