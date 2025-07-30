# Product Requirements Document: Booking System Improvements

## Introduction/Overview

This PRD outlines comprehensive improvements to the T&S Bouncy Castle Hire booking system to address current pain points and streamline the admin workflow. The goal is to fix core backend logic, resolve calendar/database synchronization issues, and add minimal but necessary UI improvements while preserving the existing interface that the client likes.

The current system has several issues including calendar events appearing incorrectly in bookings lists, inconsistent booking reference formats, complex duplicate prevention logic, and reliability issues with the agreement signing process. This improvement will create a more robust, efficient system with better admin workflow management.

## Goals

1. **Fix Core Backend Logic**: Resolve booking flow and status management issues
2. **Improve Calendar Integration**: Fix synchronization problems between calendar and database
3. **Streamline Admin Workflow**: Add efficient booking review and management processes  
4. **Automate Agreement Process**: Implement email automation for agreement delivery
5. **Enhance Status Management**: Implement automatic status transitions based on calendar events
6. **Maintain UI Consistency**: Preserve existing interface while adding necessary functionality

## User Stories

**As an admin, I want to:**
- Review pending bookings with clear approve/edit/delete actions so I can efficiently manage incoming requests
- Send agreement emails automatically after approval so customers receive them immediately
- Create manual bookings with option to skip agreement process so I can handle phone/in-person bookings
- See only database bookings in the bookings list so I'm not confused by calendar events
- Have bookings automatically transition to completed status so I don't need to manually update them

**As a customer, I want to:**
- Receive agreement emails promptly after my booking is approved so I can complete the process quickly
- Have my booking properly confirmed in both the database and calendar so there are no scheduling conflicts

**As a system administrator, I want to:**
- Have consistent booking references across all systems so tracking is reliable
- Have reliable calendar/database synchronization so data integrity is maintained
- Have automatic status transitions so the system stays current without manual intervention

## Functional Requirements

### Backend Logic Improvements

1. **FR-001**: The system must separate calendar events from database bookings in admin views
2. **FR-002**: The system must use consistent TS001, TS002 format for all booking references
3. **FR-003**: The system must implement simplified duplicate prevention logic
4. **FR-004**: The system must automatically fix database sequence issues when they occur
5. **FR-005**: The system must implement reliable booking status transitions (pending → confirmed → completed)

### Agreement Email Automation

6. **FR-006**: The system must automatically send agreement emails via Google SMTP when admin approves a booking
7. **FR-007**: The system must include booking details, agreement link, and customer information in automated emails
8. **FR-008**: The system must log all email sending attempts and results for debugging

### Admin Workflow Enhancements

9. **FR-009**: The system must add "Approve & Send Agreement" button to pending bookings
10. **FR-010**: The system must add "Edit & Send Agreement" functionality for pending bookings
11. **FR-011**: The system must add "Delete/Expire" functionality for pending bookings
12. **FR-012**: The system must add "Save as Confirmed" option for manual bookings with confirmation popup
13. **FR-013**: The system must require admin confirmation popup for manual confirmation stating "Customer will sign agreement manually/physically"

### Status Management

14. **FR-014**: The system must automatically transition bookings from "confirmed" to "completed" when calendar events end
15. **FR-015**: The system must update booking status based on current date/time compared to event end time
16. **FR-016**: The system must maintain agreement signing audit trail (who, when, how)

### Calendar Integration Fixes

17. **FR-017**: The system must only show database bookings in the admin bookings list
18. **FR-018**: The system must only show calendar events in the calendar view
19. **FR-019**: The system must maintain proper synchronization between confirmed database bookings and calendar events
20. **FR-020**: The system must prevent calendar events from appearing as "DB" bookings

### Data Integrity

21. **FR-021**: The system must ensure all confirmed bookings exist in both database and calendar
22. **FR-022**: The system must handle calendar event deletion by marking corresponding database booking as expired
23. **FR-023**: The system must handle database booking deletion by removing corresponding calendar event

## Non-Goals (Out of Scope)

- Complete UI redesign (preserve existing layout and styling)
- Changes to customer-facing booking form
- Integration with external payment systems
- Advanced reporting features
- Multi-language support
- Mobile app development
- Real-time notifications beyond email

## Design Considerations

### UI Changes (Minimal)
- Add action buttons to existing booking list items (Approve, Edit, Delete for pending bookings)
- Add dropdown or toggle for "Save as Confirmed" option in booking creation modal
- Improve status badges and indicators using existing design system
- Add confirmation popups using existing modal components
- Maintain current color scheme and layout structure

### Email Templates
- Use existing T&S branding and styling
- Include clear call-to-action buttons
- Provide booking summary and agreement link
- Include contact information for support

## Technical Considerations

### Backend Architecture
- Utilize existing PostgreSQL database and connection pooling
- Leverage current Google Calendar API integration
- Build on existing NextAuth.js authentication system
- Use current API route structure and patterns

### Email Integration
- Implement Google SMTP configuration
- Add email service module to existing lib structure
- Include email logging and error handling
- Use environment variables for SMTP configuration

### Database Changes
- Add email sending status fields to bookings table
- Add manual confirmation tracking fields
- Implement database triggers or scheduled jobs for status transitions
- Maintain existing table structure and relationships

### Dependencies
- Google SMTP API setup and configuration
- Email template system (can use React Email or similar)
- Scheduled job system for automatic status transitions
- Enhanced logging system for debugging

## Success Metrics

1. **Operational Efficiency**: Reduce admin time spent on booking management by 50%
2. **Data Consistency**: Achieve 100% synchronization between database and calendar bookings
3. **Process Reliability**: Eliminate booking reference format inconsistencies
4. **Automation Success**: 95% successful automatic email delivery rate
5. **Error Reduction**: Reduce booking-related support tickets by 70%
6. **Status Accuracy**: 100% automatic status transition accuracy for completed events

## Implementation Priority

### Phase 1: Backend Logic Fixes (High Priority)
- Fix calendar/database separation (FR-001, FR-017, FR-018, FR-020)
- Implement consistent booking references (FR-002)
- Fix duplicate prevention logic (FR-003)
- Implement automatic sequence fixing (FR-004)

### Phase 2: Admin Workflow (High Priority)  
- Add approve/edit/delete buttons for pending bookings (FR-009, FR-010, FR-011)
- Implement "Save as Confirmed" with popup confirmation (FR-012, FR-013)
- Improve status indicators and workflow (FR-005, FR-015, FR-016)

### Phase 3: Email Automation (Medium Priority)
- Set up Google SMTP integration (FR-006)
- Create email templates and sending logic (FR-007)
- Implement email logging (FR-008)

### Phase 4: Automatic Status Transitions (Medium Priority)
- Implement calendar-based status transitions (FR-014, FR-015)
- Add scheduled job for status updates
- Enhance data integrity checks (FR-021, FR-022, FR-023)

## Open Questions

1. **Email Template Design**: Should we create custom HTML email templates or use simple text emails initially?
2. **Scheduled Jobs**: Should automatic status transitions run via cron jobs, database triggers, or API-based scheduling?
3. **Error Handling**: What should happen if email sending fails? Should the booking approval be rolled back?
4. **Backup Strategy**: Should we implement additional backup mechanisms for the improved booking flow?
5. **Testing Strategy**: Do we need to set up staging environment for testing email automation?
6. **Performance Impact**: Will the additional database queries for status checking impact system performance?

## Technical Implementation Notes

### Email Service Setup
```typescript
// Example email service interface
interface EmailService {
  sendAgreementEmail(booking: Booking): Promise<EmailResult>;
  sendConfirmationEmail(booking: Booking): Promise<EmailResult>;
  logEmailAttempt(bookingId: number, type: string, result: EmailResult): Promise<void>;
}
```

### Status Transition Logic
```typescript
// Example automatic status transition
interface StatusTransition {
  checkCompletedBookings(): Promise<Booking[]>;
  updateBookingStatus(bookingId: number, newStatus: BookingStatus): Promise<void>;
  scheduleStatusCheck(): void;
}
```

### Database Schema Additions
```sql
-- Additional fields for bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS manual_confirmation BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_by VARCHAR(255);
```

This PRD provides a comprehensive roadmap for improving the booking system while maintaining the existing UI structure and addressing all identified pain points through systematic backend improvements and minimal necessary frontend enhancements.