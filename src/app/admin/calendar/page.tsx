'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Eye, RefreshCw, AlertCircle, X, Edit2, Trash2 } from 'lucide-react';
import { BookingValidator, ExistingBooking, ValidationResult } from '@/lib/validation/booking-validation';
import { BookingDetailsModal } from '@/components/admin/BookingDetailsModal';
import { BookingFormModal, BookingFormData, Castle } from '@/components/admin/BookingFormModal';

interface CalendarEvent {
  id: string;
  summary: string;
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

interface CalendarStatus {
  status: 'connected' | 'disconnected' | 'error';
  message: string;
  eventsThisMonth?: number;
  lastUpdated?: string;
}



export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [castles, setCastles] = useState<Castle[]>([]);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    castle: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    singleDate: '',
    multipleDate: false,
    startDate: '',
    endDate: '',
    eventDuration: 8, // Default to 8 hours
    additionalCosts: false,
    additionalCostsDescription: '',
    additionalCostsAmount: 0
  });

  // Fetch castles from fleet
  const fetchCastles = async () => {
    try {
      const response = await fetch('/api/admin/fleet');
      if (response.ok) {
        const castleData = await response.json();
        setCastles(castleData);
      }
    } catch (error) {
      console.error('Error fetching castles:', error);
    }
  };

  // Fetch calendar status and events
  const fetchCalendarData = async () => {
    try {
      setIsLoading(true);
      
      // Check calendar connection status
      const statusResponse = await fetch('/api/admin/calendar');
      const statusData = await statusResponse.json();
      setCalendarStatus(statusData);

      if (statusData.status === 'connected') {
        // Calculate date range that includes adjacent month dates visible in calendar
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday (may be previous month)
        
        // End date should be 6 weeks from start to cover all possible calendar days
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (6 * 7) - 1);
        
        // Format dates for API call
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log(`Fetching calendar events from ${startDateStr} to ${endDateStr}`);
        
        const eventsResponse = await fetch(`/api/admin/calendar/events?startDate=${startDateStr}&endDate=${endDateStr}`);
        const eventsData = await eventsResponse.json();
        
        if (eventsData.events) {
          setEvents(processCalendarEvents(eventsData.events)); // Process events here
        }
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setCalendarStatus({
        status: 'error',
        message: 'Failed to connect to calendar API'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Refresh calendar data
  const refreshCalendar = async () => {
    setIsRefreshing(true);
    await fetchCalendarData();
  };

  // Convert CalendarEvent to ExistingBooking for validation
  const convertToExistingBooking = (event: CalendarEvent): ExistingBooking => {
    // Extract castle name from description or summary
    const castleName = extractCastleFromEvent(event);
    
    // Extract date and time from event
    const startDate = event.start.dateTime || event.start.date;
    const endDate = event.end.dateTime || event.end.date;
    
    let date, startTime, endTime;
    
    if (startDate?.includes('T')) {
      // DateTime format
      date = startDate.split('T')[0];
      startTime = startDate.split('T')[1].substring(0, 5);
      endTime = endDate?.split('T')[1].substring(0, 5) || '18:00';
    } else {
      // All-day event format
      date = startDate || '';
      startTime = '09:00';
      endTime = '18:00';
    }

    // Determine status based on event properties
    let status: 'pending' | 'confirmed' | 'completed' | 'expired' = 'confirmed';
    
    // Check if event is completed (gray color or has ✅ in summary)
    if (event.colorId === '11' || event.summary?.includes('✅')) {
      status = 'completed';
    }
    
    // Check if event has ended
    const now = new Date();
    const eventEndDate = endDate || startDate;
    if (eventEndDate) {
      const eventEnd = new Date(eventEndDate);
      if (eventEnd < now) {
        status = 'completed';
      }
    }

    return {
      id: event.id,
      date,
      startTime,
      endTime,
      castle: castleName,
      status
    };
  };

  // Process calendar events to detect completed status
  const processCalendarEvents = (events: CalendarEvent[]): CalendarEvent[] => {
    const now = new Date();
    
    return events.map(event => {
      // Check if event is already marked as completed
      if (event.colorId === '11' || event.summary?.includes('✅')) {
        return { ...event, status: 'completed' };
      }
      
      // Check if event has ended
      const eventEndDate = event.end?.dateTime || event.end?.date || event.start?.dateTime || event.start?.date;
      if (eventEndDate) {
        const eventEnd = new Date(eventEndDate);
        if (eventEnd < now) {
          return { ...event, status: 'completed' };
        }
      }
      
      // Default to confirmed
      return { ...event, status: event.status || 'confirmed' };
    });
  };

  // Extract castle name from event description or summary
  const extractCastleFromEvent = (event: CalendarEvent): string => {
    const description = event.description || '';
    const summary = event.summary || '';
    
    // Look for "Castle: " pattern in description
    const castleMatch = description.match(/Castle:\s*([^(\n]+)/);
    if (castleMatch) {
              return castleMatch[1]?.trim() || '';
    }
    
    // Fallback to summary if no castle found in description
    return summary;
  };

  // Check for booking conflicts
  const checkBookingConflicts = (bookingData: any, excludeEventId?: string): ValidationResult => {
    // Convert calendar events to ExistingBookings format
    const existingBookings = events
      .filter(event => event.id !== excludeEventId)
      .map(convertToExistingBooking);

    // Create validator with existing bookings
    const validator = new BookingValidator(existingBookings);

         // Convert booking form data to validation format
     const validationData = {
       customerName: bookingData.customerName,
       customerEmail: `${bookingData.customerName.toLowerCase().replace(/\s+/g, '.')}@temp.com`, // Temp email for validation
       customerPhone: bookingData.contactDetails?.phone || '',
       date: bookingData.duration.start.split('T')[0],
       startTime: bookingData.duration.start.split('T')[1].substring(0, 5),
       endTime: bookingData.duration.end.split('T')[1].substring(0, 5),
       castle: bookingData.bouncyCastleType,
       location: bookingData.location || 'TBD',
       address: bookingData.location || '',
       totalPrice: bookingData.cost,
       deposit: Math.floor(bookingData.cost * 0.3), // 30% deposit
       status: 'pending' as const,
       notes: bookingData.notes
     };

    return validator.validateBooking(validationData, excludeEventId);
  };

  // Handle booking form submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!bookingForm.castle || !bookingForm.customerName || !bookingForm.customerPhone || !bookingForm.address) {
        alert('Please fill in all required fields');
        return;
      }

      // Determine dates
      let startDateTime, endDateTime;
      if (bookingForm.multipleDate) {
        if (!bookingForm.startDate || !bookingForm.endDate) {
          alert('Please select both start and end dates');
          return;
        }
                 startDateTime = `${bookingForm.startDate}T10:00:00`;
         endDateTime = `${bookingForm.endDate}T18:00:00`;
       } else {
         if (!bookingForm.singleDate) {
           alert('Please select a date');
           return;
         }
         startDateTime = `${bookingForm.singleDate}T10:00:00`;
         endDateTime = `${bookingForm.singleDate}T18:00:00`;
      }

             // Calculate cost
      const selectedCastle = castles.find(c => c.id.toString() === bookingForm.castle);
      const basePrice = Math.floor(selectedCastle?.price || 0);
      
      // Calculate number of days
      let numberOfDays = 1;
      if (bookingForm.multipleDate && bookingForm.startDate && bookingForm.endDate) {
        const startDate = new Date(bookingForm.startDate);
        const endDate = new Date(bookingForm.endDate);
        
        // Check if dates are valid
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          const timeDiff = endDate.getTime() - startDate.getTime();
          numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
          // Ensure numberOfDays is at least 1
          numberOfDays = Math.max(1, numberOfDays);
        }
      }
      
      const totalBasePrice = basePrice * numberOfDays;
      const overnightCharge = bookingForm.eventDuration === 24 ? 20 : 0;
      const additionalCosts = bookingForm.additionalCosts ? (isNaN(bookingForm.additionalCostsAmount) ? 0 : bookingForm.additionalCostsAmount) : 0;
      const totalCost = totalBasePrice + overnightCharge + additionalCosts;

      // Create booking data
      const bookingData = {
        customerName: bookingForm.customerName,
        contactDetails: {
          phone: bookingForm.customerPhone
        },
        location: bookingForm.address,
        notes: `Castle: ${selectedCastle?.name}${bookingForm.eventDuration === 24 ? ' (Overnight)' : ''}${bookingForm.additionalCosts ? `\nAdditional Costs: ${bookingForm.additionalCostsDescription} - £${bookingForm.additionalCostsAmount}` : ''}`,
        duration: {
          start: startDateTime,
          end: endDateTime
        },
        cost: totalCost,
        bouncyCastleType: selectedCastle?.name,
        // Include duration for consistent display
        eventDuration: bookingForm.eventDuration,
        status: 'confirmed'
      };

      // Check for conflicts before submitting
      const excludeEventId = isEditing && selectedEvent ? selectedEvent.id : undefined;
      const validationResult = checkBookingConflicts(bookingData, excludeEventId);

      // Handle validation errors
      if (validationResult.errors && Object.keys(validationResult.errors).length > 0) {
        const errorMessages = Object.values(validationResult.errors).join('\n');
        alert(`Validation errors:\n${errorMessages}`);
        return;
      }

      // Handle critical conflicts (same castle booking)
      const criticalConflicts = validationResult.conflicts.filter(
        conflict => conflict.type === 'same_castle'
      );

      if (criticalConflicts.length > 0) {
        const conflictMessage = criticalConflicts
          .map(conflict => conflict.message)
          .join('\n');
        
        const userConfirmed = confirm(
          `BOOKING CONFLICT DETECTED:\n\n${conflictMessage}\n\nThis castle is already booked for the selected time. Would you like to see alternative times?`
        );
        
        if (!userConfirmed) {
          return;
        }
        
        // TODO: Show alternative time suggestions
        alert('Please select a different time or castle to avoid conflicts.');
        return;
      }

             // Skip warnings for admin bookings - only show critical conflicts

      // Submit to API
      const url = isEditing && selectedEvent 
        ? `/api/admin/calendar/events/${selectedEvent.id}`
        : '/api/admin/calendar/events';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} booking`);
      }

      // Success - refresh calendar and close modal
      await fetchCalendarData();
      setShowBookingModal(false);
      setIsEditing(false);
      setSelectedEvent(null);
      setBookingForm({
        castle: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        address: '',
        singleDate: '',
        multipleDate: false,
        startDate: '',
        endDate: '',
        eventDuration: 8, // Default to 8 hours
        additionalCosts: false,
        additionalCostsDescription: '',
        additionalCostsAmount: 0
      });

      alert(`Booking ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form field changes
  const handleFormChange = (field: keyof BookingFormData, value: string | boolean | number) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    const selectedCastle = castles.find(c => c.id.toString() === bookingForm.castle);
    const basePrice = Math.floor(selectedCastle?.price || 0);
    
    // Calculate number of days
    let numberOfDays = 1;
    if (bookingForm.multipleDate && bookingForm.startDate && bookingForm.endDate) {
      const startDate = new Date(bookingForm.startDate);
      const endDate = new Date(bookingForm.endDate);
      
      // Check if dates are valid
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const timeDiff = endDate.getTime() - startDate.getTime();
        numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
        // Ensure numberOfDays is at least 1
        numberOfDays = Math.max(1, numberOfDays);
      }
    }
    
    const totalBasePrice = basePrice * numberOfDays;
    const overnightCharge = bookingForm.eventDuration === 24 ? 20 : 0;
    const additionalCosts = bookingForm.additionalCosts ? (isNaN(bookingForm.additionalCostsAmount) ? 0 : bookingForm.additionalCostsAmount) : 0;
    
    const total = totalBasePrice + overnightCharge + additionalCosts;
    
    // Return 0 if the result is NaN, otherwise return the calculated total
    return isNaN(total) ? 0 : total;
  };

  // View event details
  const handleViewDetails = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  // Edit event
  const handleEditEvent = (event: CalendarEvent) => {
    // Parse event data back into form format
    const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
    const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');
    
    // Extract castle info from event notes/description
    const castleMatch = event.description?.match(/Castle Type: (.+?)(?:\s|$)|Castle: (.+?)(?:\n|$)/);
    // Try to extract duration from description first, then fallback to (Overnight) check
    const durationMatch = event.description?.match(/Duration: (\d+) hours/);
    const eventDuration = durationMatch ? parseInt(durationMatch[1]) : 
                         (event.description?.includes('(Overnight)') || event.description?.includes('24 hours') ? 24 : 8);
    
    // Extract phone number from description
    const phoneMatch = event.description?.match(/Phone: (.+?)(?:\s|$)/);
    const phone = phoneMatch?.[1] || '';
    
    // Find castle by name (check both capture groups from the regex)
    const castleName = castleMatch?.[1] || castleMatch?.[2] || '';
    const castle = castles.find(c => c.name === castleName);
    
    // Check if it's multi-day
    const isMultiDay = eventStart.toDateString() !== eventEnd.toDateString();
    
    setBookingForm({
      castle: castle?.id.toString() || '',
      customerName: event.summary?.replace('🏰 ', '') || '',
      customerEmail: event.attendees?.[0]?.email || '',
      customerPhone: phone,
      address: event.location || '',
      singleDate: isMultiDay ? '' : eventStart.toISOString().split('T')[0],
      multipleDate: isMultiDay,
      startDate: isMultiDay ? eventStart.toISOString().split('T')[0] : '',
      endDate: isMultiDay ? eventEnd.toISOString().split('T')[0] : '',
      eventDuration: eventDuration,
      additionalCosts: false,
      additionalCostsDescription: '',
      additionalCostsAmount: 0
    });
    
    setSelectedEvent(event);
    setIsEditing(true);
    setShowDetailsModal(false);
    setShowBookingModal(true);
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/calendar/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }

      await fetchCalendarData();
      setShowDetailsModal(false);
      alert('Booking deleted successfully!');
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking. Please try again.');
    }
  };

  useEffect(() => {
    fetchCalendarData();
    fetchCastles();
  }, [currentDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'complete':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-600 text-gray-100 border-gray-500';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Helper function to determine event status 
  const getEventStatus = (event: CalendarEvent) => {
    // Check if event is a maintenance event (🔧 symbol)
    if (event.summary?.includes('🔧')) {
      return 'unavailable';
    }
    
    // Return the original status or default to confirmed
    return event.status || 'confirmed';
  };

  // Format date range for maintenance events  
  const formatMaintenanceDateRange = (event: CalendarEvent) => {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    
    if (!start) return '';
    
    const startDate = new Date(start);
    const startFormatted = startDate.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    
    if (!end) return startFormatted;
    
    const endDate = new Date(end);
    // For all-day events, subtract one day from end date as Google Calendar adds 1 day
    if (event.start?.date && event.end?.date) {
      endDate.setDate(endDate.getDate() - 1);
    }
    
    const endFormatted = endDate.toLocaleDateString('en-GB', {
      weekday: 'short', 
      day: 'numeric',
      month: 'short'
    });
    
    // If same date, just show single date
    if (startDate.toDateString() === endDate.toDateString()) {
      return startFormatted;
    }
    
    return `${startFormatted} - ${endFormatted}`;
  };

  const formatEventTime = (event: CalendarEvent) => {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    
    if (!start) return 'No time specified';
    
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    
    if (event.start?.date) {
      // All-day event
      return 'All day';
    } else {
      // Timed event
      const timeStr = startDate.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      if (endDate) {
        const endTimeStr = endDate.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        return `${timeStr} - ${endTimeStr}`;
      }
      
      return timeStr;
    }
  };

  const formatEventDate = (event: CalendarEvent) => {
    const start = event.start?.dateTime || event.start?.date;
    if (!start) return '';
    
    const date = new Date(start);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar grid with event bars
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const today = new Date();
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + (week * 7) + day);
        
        // Find events that occur on this day
        const dayEvents = events.filter(event => {
          const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
          const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');
          const currentDayStart = new Date(currentDay);
          currentDayStart.setHours(0, 0, 0, 0);
          const currentDayEnd = new Date(currentDay);
          currentDayEnd.setHours(23, 59, 59, 999);
          
          // Check if event overlaps with this day
          return eventStart <= currentDayEnd && eventEnd >= currentDayStart;
        });
        
        const isCurrentMonth = currentDay.getMonth() === month;
        const isToday = currentDay.toDateString() === today.toDateString();
        
        weekDays.push({
          date: currentDay,
          day: currentDay.getDate(),
          isCurrentMonth,
          isToday,
          events: dayEvents
        });
      }
      days.push(weekDays);
      
      // Stop if we've passed the last day of the month and filled the week
      if (week > 0 && weekDays.every(d => d.date > lastDay)) {
        break;
      }
    }
    
    return days;
  };

  const calendarGrid = generateCalendarGrid();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="mt-2 text-gray-600">
            Manage your bookings and schedule
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button
            onClick={refreshCalendar}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
                     <Button onClick={() => {
             setIsEditing(false);
             setSelectedEvent(null);
             setBookingForm({
               castle: '',
               customerName: '',
               customerEmail: '',
               customerPhone: '',
               address: '',
               singleDate: '',
               multipleDate: false,
               startDate: '',
               endDate: '',
               eventDuration: 8, // Default to 8 hours
               additionalCosts: false,
               additionalCostsDescription: '',
               additionalCostsAmount: 0
             });
             setShowBookingModal(true);
           }}>
             <Plus className="w-4 h-4 mr-2" />
             Add Event
           </Button>
        </div>
      </div>

      {/* Calendar Status */}
      {calendarStatus && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              {calendarStatus.status === 'connected' ? (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">Google Calendar Connected</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Calendar Connection Issue</span>
                </div>
              )}
              {calendarStatus.eventsThisMonth !== undefined && (
                <span className="text-sm text-gray-500">
                  • {calendarStatus.eventsThisMonth} events this month
                </span>
              )}
            </div>
            {calendarStatus.status !== 'connected' && (
              <p className="text-sm text-gray-600 mt-2">{calendarStatus.message}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={previousMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : calendarStatus?.status === 'connected' ? (
                <div className="space-y-4">
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {calendarGrid.map((week, weekIndex) =>
                      week.map((day, dayIndex) => (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className={`
                            p-2 min-h-[80px] border border-gray-200 relative cursor-pointer hover:bg-gray-50
                            ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                            ${day.isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                          `}
                        >
                          <span className={`text-sm ${day.isToday ? 'font-bold text-blue-600' : ''}`}>
                            {day.day}
                          </span>
                          
                          {/* Event bars */}
                          <div className="mt-1 space-y-1">
                            {day.events.map((event, eventIndex) => {
                              const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
                              const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');
                              const isMultiDay = eventStart.toDateString() !== eventEnd.toDateString();
                              
                              // Determine if this is the start, middle, or end of a multi-day event
                              const isStart = eventStart.toDateString() === day.date.toDateString();
                              const isEnd = eventEnd.toDateString() === day.date.toDateString();
                              const isMiddle = !isStart && !isEnd && isMultiDay;
                              
                              // Get event color based on type and status
                              const getEventColor = () => {
                                // Check if event is completed
                                if (event.status === 'completed' || event.colorId === '11' || event.summary?.includes('✅')) {
                                  return 'bg-blue-500'; // Blue for completed events
                                }
                                
                                if (event.summary?.includes('🔧')) return 'bg-red-500'; // Maintenance
                                if (event.summary?.includes('🏰')) return 'bg-green-500'; // Booking
                                return 'bg-blue-500'; // Default
                              };
                              
                              return (
                                <div
                                  key={`${event.id}-${eventIndex}`}
                                  className={`
                                    h-4 rounded text-xs text-white font-medium px-1 flex items-center cursor-pointer hover:opacity-80
                                    ${getEventColor()}
                                    ${isStart ? 'rounded-l-md' : ''}
                                    ${isEnd ? 'rounded-r-md' : ''}
                                    ${isMiddle ? 'rounded-none' : ''}
                                    ${!isMultiDay ? 'rounded-md' : ''}
                                  `}
                                  title={`${event.summary} - ${formatEventTime(event)}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(event);
                                  }}
                                >
                                  <span className="truncate">
                                    {event.summary?.replace('🏰 ', '').replace('🔧 ', '')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Calendar Connection Required</p>
                  <p className="text-sm">Please configure Google Calendar integration</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-4">
                  {events
                    .filter(event => {
                      const eventDate = new Date(event.start?.dateTime || event.start?.date || '');
                      return eventDate >= new Date();
                    })
                    .sort((a, b) => {
                      const aDate = new Date(a.start?.dateTime || a.start?.date || '');
                      const bDate = new Date(b.start?.dateTime || b.start?.date || '');
                      return aDate.getTime() - bDate.getTime();
                    })
                    .slice(0, 10)
                    .map((event) => (
                      <div key={event.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm line-clamp-2">{event.summary}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(getEventStatus(event))}`}>
                            {getEventStatus(event)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>
                            {event.summary?.includes('🔧') 
                              ? formatMaintenanceDateRange(event)
                              : `${formatEventDate(event)} • ${formatEventTime(event)}`
                            }
                          </p>
                          {event.location && <p>📍 {event.location}</p>}
                          {event.attendees && event.attendees.length > 0 && (
                            <p>👤 {event.attendees[0].displayName || event.attendees[0].email}</p>
                          )}
                        </div>
                                                 <div className="mt-3">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="w-full"
                             onClick={() => handleViewDetails(event)}
                           >
                             <Eye className="w-3 h-3 mr-1" />
                             View Details
                           </Button>
                         </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming events</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingFormModal
          open={showBookingModal}
          isEditing={isEditing}
          castles={castles}
          bookingForm={bookingForm}
          isSubmitting={isSubmitting}
          onClose={() => {
            setShowBookingModal(false);
            setIsEditing(false);
            setSelectedEvent(null);
          }}
          onSubmit={handleBookingSubmit}
          onFormChange={handleFormChange}
          calculateTotalCost={calculateTotalCost}
        />
      )}

       {/* Booking Details Modal */}
       {showDetailsModal && selectedEvent && (
         <BookingDetailsModal
           open={showDetailsModal}
           event={selectedEvent}
           onClose={() => {
             setShowDetailsModal(false);
             setSelectedEvent(null);
           }}
           onEdit={handleEditEvent}
           onDelete={handleDeleteEvent}
           formatEventDate={formatEventDate}
           formatEventTime={formatEventTime}
           getStatusColor={getStatusColor}
         />
       )}
     </div>
   );
 }