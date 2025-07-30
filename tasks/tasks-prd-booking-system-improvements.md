# Tasks: Booking System Improvements

Based on PRD: `prd-booking-system-improvements.md`

## Relevant Files

- `src/api/admin/bookings/route.ts` - Main admin bookings API route updated to only return database bookings (calendar separation completed)
- `src/api/admin/bookings/confirm/route.ts` - Booking confirmation endpoint requiring workflow improvements
- `src/api/admin/calendar/events/route.ts` - Calendar events API that needs separation from bookings
- `src/components/admin/BookingDetailsModal.tsx` - Admin modal requiring new approve/edit/delete buttons
- `src/components/admin/BookingFormModal.tsx` - Booking form modal needing "Save as Confirmed" option
- `src/lib/database/bookings.ts` - Core booking database operations requiring reference format fixes
- `src/lib/calendar/google-calendar.ts` - Calendar integration needing synchronization improvements
- `src/lib/email/` - New directory for email service implementation
- `src/lib/email/smtp-service.ts` - Google SMTP service for agreement emails
- `src/lib/email/templates.ts` - Email templates for agreement and confirmation emails
- `src/lib/utils/status-transitions.ts` - New utility for automatic status management
- `src/api/admin/sync/route.ts` - Enhanced sync endpoint for calendar/database integrity
- `src/api/cron/update-booking-status/route.ts` - New scheduled job for automatic status transitions

### Notes

- Focus on backend logic fixes first as they are foundational to other improvements
- Email integration requires Google SMTP setup and environment configuration
- Status transitions will need either cron jobs or API-based scheduling
- Preserve existing UI styling while adding minimal necessary functionality

## Tasks

- [x] 1.0 Fix Core Backend Logic and Data Separation
  - [x] 1.1 Update admin bookings API route to only return database bookings (not calendar events) - FR-001, FR-017
  - [x] 1.2 Implement consistent TS001, TS002 booking reference format across all booking creation - FR-002
  - [x] 1.3 Simplify duplicate prevention logic in booking creation process - FR-003
  - [x] 1.4 Add automatic database sequence fixing when booking reference conflicts occur - FR-004
  - [x] 1.5 Update booking status transitions to follow pending → confirmed → completed flow - FR-005
  - [x] 1.6 Add database fields for email tracking (email_sent, email_sent_at, manual_confirmation, confirmed_by) - FR-021

- [x] 2.0 Implement Admin Workflow Enhancements
  - [x] 2.1 Add "Approve & Send Agreement" button to pending bookings in BookingDetailsModal - FR-009
  - [x] 2.2 Add "Edit & Send Agreement" functionality for pending bookings - FR-010
  - [x] 2.3 Add "Delete/Expire" functionality for pending bookings - FR-011
  - [x] 2.4 Add "Save as Confirmed" toggle option in BookingFormModal for manual bookings - FR-012
  - [x] 2.5 Implement confirmation popup for manual confirmations with "Customer will sign agreement manually/physically" message - FR-013
  - [x] 2.6 Update booking status badges and indicators using existing design system - FR-015
  - [x] 2.7 Add agreement signing audit trail tracking (who, when, how) - FR-016

- [ ] 3.0 Set Up Email Automation System
  - [ ] 3.1 Configure Google SMTP settings in environment variables - FR-006
  - [ ] 3.2 Create email service module with sendAgreementEmail and sendConfirmationEmail functions - FR-006, FR-007
  - [ ] 3.3 Design and implement email templates with T&S branding including booking details and agreement links - FR-007
  - [ ] 3.4 Add email logging system to track all sending attempts and results - FR-008
  - [ ] 3.5 Integrate email sending into booking approval workflow - FR-006
  - [ ] 3.6 Add error handling and retry logic for failed email deliveries - FR-008
  - [ ] 3.7 Update booking confirmation endpoint to trigger agreement emails automatically - FR-006

- [ ] 4.0 Build Automatic Status Transition System
  - [ ] 4.1 Create utility function to check calendar events against current date/time - FR-014, FR-015
  - [ ] 4.2 Implement automatic transition from "confirmed" to "completed" when events end - FR-014
  - [ ] 4.3 Create scheduled job/cron endpoint for periodic status updates - FR-015
  - [ ] 4.4 Add database queries to efficiently find bookings requiring status updates - FR-015
  - [ ] 4.5 Implement status update logging for debugging and audit purposes - FR-016
  - [ ] 4.6 Test automatic status transitions with various booking scenarios - FR-014, FR-015

- [ ] 5.0 Enhance Calendar/Database Synchronization
  - [ ] 5.1 Update calendar events API to only show calendar events (not database bookings) - FR-018
  - [ ] 5.2 Ensure confirmed database bookings automatically create corresponding calendar events - FR-019, FR-021
  - [ ] 5.3 Prevent calendar events from appearing as "DB" bookings in admin interface - FR-020
  - [ ] 5.4 Handle calendar event deletion by marking corresponding database booking as expired - FR-022
  - [ ] 5.5 Handle database booking deletion by removing corresponding calendar event - FR-023
  - [ ] 5.6 Add data integrity checks to ensure confirmed bookings exist in both systems - FR-021
  - [ ] 5.7 Update sync endpoint to handle bidirectional synchronization properly - FR-019