'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Filter, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  CalendarIcon,
  Loader2,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileCheck,
  FileWarning,
  Check,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { BookingDetailsModal } from '@/components/admin/BookingDetailsModal';
import { BookingFormModal, BookingFormData, Castle } from '@/components/admin/BookingFormModal';


interface Booking {
  id: number;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  castleId: number;
  castleName: string;
  date: string;
  paymentMethod: string;
  totalPrice: number;
  deposit: number;
  status: 'pending' | 'confirmed' | 'completed' | 'expired';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  source: 'database' | 'calendar';
  
  // Duration fields
  startDate?: string;
  endDate?: string;
  eventDuration?: number;
  
  // Agreement information
  agreementSigned?: boolean;
  agreementSignedAt?: string;
  agreementSignedBy?: string;
  agreementSignedMethod?: 'email' | 'manual' | 'physical' | 'admin_override';
}

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



export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilters, setStatusFilters] = useState({
    pending: true,
    confirmed: true,
    completed: true,
    expired: false
  });

  const [timeRange, setTimeRange] = useState('all');

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    additionalCostsAmount: 0,
    saveAsConfirmed: false
  });

  // Calendar-specific state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // Debug: Track events array changes
  useEffect(() => {
    console.log('Events array changed. New length:', events.length);
    console.log('New event IDs:', events.map(e => e.id));
  }, [events]);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch castles from fleet
  const fetchCastles = async () => {
    try {
      const response = await fetch('/api/admin/fleet');
      if (response.ok) {
        const castleData = await response.json();
        // The fleet API returns castles directly as an array, not wrapped in a 'castles' property
        setCastles(Array.isArray(castleData) ? castleData : []);
      }
    } catch (error) {
      console.error('Error fetching castles:', error);
    }
  };

  // Calculate date range based on timeRange
  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'all':
        // For all time, use a very old start date
        startDate.setFullYear(2020);
        break;
      case 'week':
        // For week, look back 7 days but also include future bookings
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        // For month, look back 30 days but also include future bookings
        startDate.setDate(now.getDate() - 30);
        break;
      case 'quarter':
        // For quarter, look back 90 days but also include future bookings
        startDate.setDate(now.getDate() - 90);
        break;
      case 'year':
        // For year, look back 365 days but also include future bookings
        startDate.setDate(now.getDate() - 365);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    // Set end date to a far future date to include all future bookings
    const endDate = new Date();
    endDate.setFullYear(now.getFullYear() + 2); // Include bookings up to 2 years in the future
    
    return {
      dateFrom: startDate.toISOString().split('T')[0],
      dateTo: endDate.toISOString().split('T')[0]
    };
  };

  // Fetch bookings from API
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const { dateFrom, dateTo } = getDateRange();
      const response = await fetch(`/api/admin/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        toast.error('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Error loading bookings');
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar-specific functions
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
          console.log('Setting events array with length:', eventsData.events.length);
          console.log('Event IDs being set:', eventsData.events.map((e: any) => e.id));
          setEvents(eventsData.events);
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

  const refreshCalendar = async () => {
    setIsRefreshing(true);
    await fetchCalendarData();
  };

  useEffect(() => {
    fetchBookings();
    fetchCastles();
    fetchCalendarData();
  }, [currentDate, timeRange]);

  // Filter database bookings only - calendar events are now kept separate  
  const createFilteredBookingsList = useCallback(() => {
    console.log('createFilteredBookingsList called at:', new Date().toISOString());
    console.log('Current bookings length:', bookings.length);

    // Filter database bookings based on status and search
    const databaseBookings = bookings
      .filter(booking => {
        // Apply status filter based on selected statuses
        if (!statusFilters[booking.status as keyof typeof statusFilters]) return false;
        
        return true;
      })
      .map(booking => ({
        ...booking,
        source: 'database' as const
      }));

    // Calendar events are now handled separately - no longer mixed with database bookings


    console.log('Database bookings filtered:', databaseBookings.length);

    return databaseBookings;
  }, [bookings, statusFilters]);

  const filteredBookings = createFilteredBookingsList();

  // Get status badge using consistent colors across database and calendar
  const getStatusBadge = (status: string, booking?: any) => {
    switch (status) {
      case 'pending':
        return <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'confirmed':
        // Show different shades of green based on agreement status
        if (booking?.agreementSigned) {
          return <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200 hover:bg-green-100"><CheckCircle className="w-3 h-3" /> Confirmed</Badge>;
        } else {
          return <Badge className="flex items-center gap-1 bg-green-50 text-green-700 border-green-100 hover:bg-green-50"><CheckCircle className="w-3 h-3" /> Confirmed</Badge>;
        }
      case 'completed':
      case 'complete': // Handle legacy 'complete' status
        return <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'expired':
        return <Badge className="flex items-center gap-1 bg-gray-600 text-gray-100 border-gray-500 hover:bg-gray-600"><X className="w-3 h-3" /> Expired</Badge>;
      default:
        return <Badge className="flex items-center gap-1 bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100"><AlertCircle className="w-3 h-3" /> {status}</Badge>;
    }
  };

  // Get agreement status badge for confirmed bookings with consistent colors
  const getAgreementBadge = (booking: any) => {
    // Only show agreement status for confirmed bookings
    if (booking.status !== 'confirmed') {
      return null;
    }

    if (booking.agreementSigned) {
      return (
        <Badge className="flex items-center gap-1 bg-black text-white border-black hover:bg-black">
          <FileCheck className="w-3 h-3" />
          Agreement Signed
        </Badge>
      );
    } else {
      return (
        <Badge className="flex items-center gap-1 bg-white text-black border-black hover:bg-white">
          <FileWarning className="w-3 h-3" />
          Awaiting Signature
        </Badge>
      );
    }
  };

  // Confirm booking (legacy function)
  const handleConfirmBooking = async (bookingId: number) => {
    // Show confirmation popup for legacy approval workflow
    if (!confirm('📋 Confirm Booking\n\nThis will:\n✅ Confirm the booking immediately\n📅 Add it to the calendar\n\nNote: For new bookings, consider using "Approve & Send Agreement" for better customer experience.\n\nProceed with confirmation?')) {
      return;
    }


    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/confirm`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Booking confirmed and added to calendar!');
        await fetchBookings(); // Refresh the list
        setShowDetailsModal(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to confirm booking');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Error confirming booking');
    } finally {
  
    }
  };

  // Resend hire agreement email
  const handleResendAgreement = async (bookingId: string) => {
    if (!confirm('📧 Resend Hire Agreement\n\nThis will send the hire agreement email to the customer again.\n\nProceed?')) {
      return;
    }


    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/send-agreement`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Hire agreement email resent successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to resend agreement');
      }
    } catch (error) {
      console.error('Error resending agreement:', error);
      toast.error('Error resending hire agreement');
    } finally {
  
    }
  };



  // Delete booking
  const handleDeleteBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }


    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Booking deleted successfully');
        await fetchBookings();
        setShowDetailsModal(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Error deleting booking');
    } finally {
  
    }
  };

  // Delete calendar event
  const handleDeleteCalendarEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this calendar event? This action cannot be undone.')) {
      return;
    }


    try {
      const response = await fetch(`/api/admin/calendar/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Calendar event deleted successfully');
        await fetchCalendarData();
        setShowDetailsModal(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete calendar event');
      }
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      toast.error('Error deleting calendar event');
    } finally {
  
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper to convert Booking to CalendarEvent
  function bookingToCalendarEvent(booking: Booking): CalendarEvent {
    // Agreement status not shown in calendar events
    
    const description = `Booking Ref: ${booking.bookingRef}
Customer: ${booking.customerName}
Email: ${booking.customerEmail}
Phone: ${booking.customerPhone}
Castle: ${booking.castleName}
Duration: ${booking.eventDuration || 8} hours
Special Requests: ${booking.notes || '[none]'}
Total: £${booking.totalPrice}
Status: ${booking.status}`;

    return {
      id: `db_${booking.id}`, // Prefix to identify database bookings
      summary: `🏰 ${booking.customerName} - ${booking.castleName}`,
      description: description,
      location: booking.customerAddress,
      start: { date: booking.date },
      end: { date: booking.date },
      attendees: [
        { email: booking.customerEmail, displayName: booking.customerName, responseStatus: 'accepted' }
      ],
      status: booking.status
    };
  }

  // Handle approve and send agreement
  const handleApproveAndSendAgreement = async (bookingId: number) => {
    // Show confirmation popup for approval workflow
    if (!confirm('📋 Approve & Send Agreement\n\nThis will:\n✅ Confirm the booking immediately\n📧 Send hire agreement email to customer\n\nThe customer will receive an automated email with a link to sign the agreement digitally.\n\nProceed with approval?')) {
      return;
    }


    try {
      // First, confirm the booking
      const confirmResponse = await fetch(`/api/admin/bookings/${bookingId}/confirm`, {
        method: 'POST',
      });

      if (confirmResponse.ok) {
        // Then send agreement email
        const emailResponse = await fetch(`/api/admin/bookings/${bookingId}/send-agreement`, {
          method: 'POST',
        });

        if (emailResponse.ok) {
          toast.success('Booking approved and agreement email sent to customer!');
        } else {
          const emailError = await emailResponse.json();
          toast.warning(`Booking approved but email failed: ${emailError.error || 'Unknown email error'}`);
        }
        
        await fetchBookings(); // Refresh the list
        setShowDetailsModal(false);
      } else {
        const error = await confirmResponse.json();
        toast.error(error.error || 'Failed to approve booking');
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      toast.error('Error approving booking');
    } finally {
  
    }
  };

  // Handle edit and send agreement
  const handleEditAndSendAgreement = async (bookingId: number) => {
    // Find the booking in the main bookings array (not filtered)
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Parse the booking data into form format
    const bookingDate = new Date(booking.date);
    const dateString = bookingDate.toISOString().split('T')[0] || '';
    
    // Find castle by name to get the correct ID - use more robust matching
    let castle = castles.find(c => c.name === booking.castleName);
    
    // If not found by exact name, try partial matching
    if (!castle) {
      castle = castles.find(c => 
        c.name.toLowerCase().includes(booking.castleName.toLowerCase()) ||
        booking.castleName.toLowerCase().includes(c.name.toLowerCase())
      );
    }

    // Set up the booking form with existing data
    setBookingForm({
      castle: castle?.id.toString() || '',
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      address: booking.customerAddress,
      singleDate: dateString,
      multipleDate: false,
      startDate: '',
      endDate: '',
      eventDuration: booking.notes?.includes('(Overnight)') ? 24 : 8,
      additionalCosts: false,
      additionalCostsDescription: '',
      additionalCostsAmount: 0
    });
    
    setIsEditing(true);
    setShowDetailsModal(false);
    setShowBookingModal(true);
    
    // Note: The agreement email will be sent automatically after successful edit
    toast.info('Edit the booking details. Agreement email will be sent automatically after saving.');
  };

  // Handle expire booking
  const handleExpireBooking = async (bookingId: number) => {
    if (!confirm('⚠️ Expire Booking\n\nThis will:\n❌ Mark the booking as EXPIRED\n🚫 Remove it from active bookings\n💭 The booking cannot be recovered\n\nThis is typically used for bookings that are no longer needed or have been cancelled.\n\nAre you sure you want to expire this booking?')) {
      return;
    }


    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'expired' }),
      });

      if (response.ok) {
        toast.success('Booking expired successfully');
        await fetchBookings();
        setShowDetailsModal(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to expire booking');
      }
    } catch (error) {
      console.error('Error expiring booking:', error);
      toast.error('Error expiring booking');
    } finally {
  
    }
  };

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
  };

  // Handle edit booking
  const handleEditBooking = (event: CalendarEvent) => {
    // Find the booking by ID (remove db_ prefix if present)
    const bookingId = event.id.startsWith('db_') ? event.id.replace('db_', '') : event.id;
    const booking = bookings.find(b => b.id.toString() === bookingId);
    if (!booking) return;

    // Parse the booking data into form format
    const bookingDate = new Date(booking.date);
    
    // Find castle by name to get the correct ID - use more robust matching
    let castle = castles.find(c => c.name === booking.castleName);
    
    // If exact match not found, try partial matching
    if (!castle) {
      castle = castles.find(c => 
        c.name.toLowerCase().includes(booking.castleName.toLowerCase()) ||
        booking.castleName.toLowerCase().includes(c.name.toLowerCase())
      );
    }
    
    // If still not found, try to extract castle name from notes (like Calendar tab does)
    if (!castle && booking.notes) {
      const castleMatch = booking.notes.match(/Castle:\s*([^(\n]+)/);
      if (castleMatch && castleMatch[1]) {
        const extractedCastleName = castleMatch[1].trim();
        castle = castles.find(c => c.name === extractedCastleName);
      }
    }
    
    // Debug logging to help identify the issue
    console.log('Booking castle name:', booking.castleName);
    console.log('Available castles:', castles.map(c => c.name));
    console.log('Found castle:', castle);
    
    setBookingForm({
      castle: castle?.id.toString() || '',
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      address: booking.customerAddress,
      singleDate: bookingDate.toISOString().split('T')[0] || '',
      multipleDate: false,
      startDate: '',
      endDate: '',
      eventDuration: booking.notes?.includes('(Overnight)') ? 24 : 8,
      additionalCosts: false,
      additionalCostsDescription: '',
      additionalCostsAmount: 0
    });
    

    setIsEditing(true);
    setShowDetailsModal(false);
    setShowBookingModal(true);
  };

  // Handle form changes
  const handleFormChange = (field: keyof BookingFormData, value: string | boolean | number) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate total cost
  const calculateTotalCost = (basePrice: number, daysDiff: number, is24Hours: boolean) => {
    // Ensure all inputs are valid numbers
    const validBasePrice = isNaN(basePrice) ? 0 : basePrice;
    const validDaysDiff = isNaN(daysDiff) ? 1 : Math.max(1, daysDiff);
    
    const totalBasePrice = validBasePrice * validDaysDiff;
    const overnightCharge = is24Hours ? 20 : 0;
    const additionalCosts = bookingForm.additionalCosts ? (isNaN(bookingForm.additionalCostsAmount) ? 0 : bookingForm.additionalCostsAmount) : 0;

    const total = totalBasePrice + overnightCharge + additionalCosts;
    
    // Return 0 if the result is NaN, otherwise return the calculated total
    return isNaN(total) ? 0 : total;
  };

  // Wrapper function for BookingFormModal that calculates total cost without parameters
  const calculateTotalCostForModal = () => {
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
        numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        // Ensure numberOfDays is at least 1
        numberOfDays = Math.max(1, numberOfDays);
      }
    }
    
    return calculateTotalCost(basePrice, numberOfDays, bookingForm.eventDuration === 24);
  };

  // Reset booking form to initial state
  const resetBookingForm = () => {
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
  };

  // Handle booking form submit
  const handleBookingSubmit = async () => {
    console.log('=== HANDLE BOOKING SUBMIT CALLED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Is editing:', isEditing);
    console.log('Selected event:', selectedEvent);

    if (isEditing) {
      setIsSubmitting(true);
      try {
        // Calculate total cost
        const totalCost = calculateTotalCost(castles.find(c => c.id.toString() === bookingForm.castle)?.price || 0, 1, bookingForm.eventDuration === 24);
        
        // Get selected castle details
        const selectedCastle = castles.find(c => c.id.toString() === bookingForm.castle);
        if (!selectedCastle) {
          toast.error('Please select a valid castle');
          return;
        }

        // Determine booking date
        const bookingDate = bookingForm.multipleDate ? bookingForm.startDate : bookingForm.singleDate;
        if (!bookingDate) {
          toast.error('Please select a date');
          return;
        }

        if (selectedEvent) { // selectedEvent is set by handleEditBooking
          if (selectedEvent.id.startsWith('db_')) {
            // Update database booking
            const bookingId = selectedEvent.id.replace('db_', '');
            
            // Prepare database booking update data
            const bookingData = {
              customerName: bookingForm.customerName,
              customerPhone: bookingForm.customerPhone,
              customerAddress: bookingForm.address,
              castleId: selectedCastle.id,
              castleName: selectedCastle.name,
              date: bookingDate,
              totalPrice: totalCost,
              deposit: Math.floor(totalCost * 0.25), // 25% deposit
              eventDuration: bookingForm.eventDuration,
              notes: bookingForm.eventDuration === 24 ? '(Overnight)' : ''
            };

            const response = await fetch(`/api/admin/bookings/${bookingId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(bookingData),
            });

            if (response.ok) {
              toast.success('Booking updated successfully!');
              await fetchBookings(); // Refresh the bookings list
              setShowBookingModal(false);
              setIsEditing(false);
              setSelectedEvent(null);
            } else {
              const error = await response.json();
              toast.error(error.error || 'Failed to update booking');
            }
          } else { // It's a calendar event
            // Update calendar event
            const calendarEventId = selectedEvent.id;
            
            // Prepare calendar event update data
            const bookingData = {
              customerName: bookingForm.customerName,
              contactDetails: {
                phone: bookingForm.customerPhone
              },
              location: bookingForm.address,
              notes: `Castle: ${selectedCastle.name}${bookingForm.eventDuration === 24 ? ' (Overnight)' : ''}`,
              duration: {
                start: `${bookingDate}T10:00:00`,
                end: `${bookingDate}T18:00:00`
              },
              cost: totalCost,
              bouncyCastleType: selectedCastle.name
            };

            const response = await fetch(`/api/admin/calendar/events/${calendarEventId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(bookingData),
            });

            if (response.ok) {
              toast.success('Calendar event updated successfully!');
              await fetchBookings(); // Refresh the bookings list
              setShowBookingModal(false);
              setIsEditing(false);
              setSelectedEvent(null);
            } else {
              const error = await response.json();
              toast.error(error.error || 'Failed to update calendar event');
            }
          }
        } else { // isEditing is true, but selectedEvent is null (should not happen if handleEditBooking is called)
          toast.error('No event selected for editing.');
        }
      } catch (error) {
        console.error('Error updating booking:', error);
        toast.error('Failed to update booking');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log('Creating new booking...');
      
      // Validate required fields
      if (!bookingForm.customerName || !bookingForm.customerPhone || !bookingForm.customerEmail || !bookingForm.address || !bookingForm.castle) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Check date requirements based on booking type
      if (bookingForm.multipleDate) {
        if (!bookingForm.startDate || !bookingForm.endDate) {
          toast.error('Please select both start and end dates for multiple day bookings');
          return;
        }
      } else {
        if (!bookingForm.singleDate) {
          toast.error('Please select a date for single day bookings');
          return;
        }
      }

      // Determine start and end dates
      let startDate, endDate;
      if (bookingForm.multipleDate) {
        startDate = new Date(bookingForm.startDate);
        endDate = new Date(bookingForm.endDate);
      } else {
        startDate = new Date(bookingForm.singleDate);
        endDate = new Date(bookingForm.singleDate);
      }

      // For single day bookings, set proper start and end times
      if (!bookingForm.multipleDate) {
        // Set start time to 9:00 AM and end time to 5:00 PM for single day bookings
        startDate.setHours(9, 0, 0, 0);
        endDate.setHours(17, 0, 0, 0);
      }
      
      // Calculate total cost
      const selectedCastle = castles.find(c => c.id.toString() === bookingForm.castle);
      if (!selectedCastle) {
        toast.error('Invalid castle type');
        return;
      }

      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalCost = calculateTotalCost(selectedCastle.price, daysDiff, bookingForm.eventDuration === 24);

      // Handle confirmed booking creation
      if (bookingForm.saveAsConfirmed) {
        // Show confirmation popup for manual confirmation workflow
        if (!confirm('⚠️ Manual Confirmation Required\n\nThis booking will be marked as CONFIRMED and the customer will need to sign the hire agreement manually/physically.\n\nThe customer will NOT receive an automated email with the agreement link.\n\nAre you sure you want to proceed with manual confirmation?')) {
          setIsSubmitting(false);
          return;
        }

        try {
          console.log('Creating confirmed booking directly...');
          
          // Create confirmed booking in database
          const databaseBookingData = {
            customerName: bookingForm.customerName,
            customerEmail: bookingForm.customerEmail,
            customerPhone: bookingForm.customerPhone,
            address: bookingForm.address,
            castleType: selectedCastle.name,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalCost: totalCost,
            status: 'confirmed',
            calendarEventId: `manual-${Date.now()}`, // Temporary ID for manual confirmations
            notes: bookingForm.additionalCosts ? bookingForm.additionalCostsDescription : ''
          };

          const dbResponse = await fetch('/api/admin/bookings/create-confirmed', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(databaseBookingData),
          });

          if (dbResponse.ok) {
            const dbResult = await dbResponse.json();
            toast.success('Confirmed booking created successfully! Customer will sign agreement manually.');
            
            // Update booking tracking fields
            await fetch(`/api/admin/bookings/${dbResult.booking.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                manual_confirmation: true,
                confirmed_by: 'Admin (Manual)' 
              }),
            });

            await fetchBookings(); // Refresh the list
            setShowBookingModal(false);
            
            // Reset form
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
              additionalCostsAmount: 0,
              saveAsConfirmed: false
            });
          } else {
            const error = await dbResponse.json();
            toast.error(error.error || 'Failed to create confirmed booking');
          }
        } catch (error) {
          console.error('Error creating confirmed booking:', error);
          toast.error('Error creating confirmed booking');
        } finally {
          setIsSubmitting(false);
        }
        return; // Exit early for confirmed booking flow
      }

      // Prepare booking data for calendar event
      const bookingData = {
        customerName: bookingForm.customerName,
        contactDetails: {
          email: bookingForm.customerEmail,
          phone: bookingForm.customerPhone
        },
        location: bookingForm.address,
        notes: `Castle: ${selectedCastle.name}${bookingForm.eventDuration === 24 ? ' (Overnight)' : ''}`,
        duration: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        cost: totalCost,
        bouncyCastleType: selectedCastle.name,
        // Include duration and status for consistent display
        eventDuration: bookingForm.eventDuration,
        status: 'confirmed'
      };

      console.log('Sending booking data to API:', JSON.stringify(bookingData, null, 2));

      try {
        // Step 1: Create Google Calendar event
        const response = await fetch('/api/admin/calendar/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        });

        const result = await response.json();
        console.log('API response:', result);

        if (!response.ok) {
          throw new Error(result.message || 'Failed to create calendar event');
        }

        const { eventId } = result;

        const databaseBookingData = {
          customerName: bookingForm.customerName,
          customerEmail: bookingForm.customerEmail,
          customerPhone: bookingForm.customerPhone,
          address: bookingForm.address,
          castleType: selectedCastle.name,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalCost: totalCost,
          status: 'confirmed',
          calendarEventId: eventId,
          notes: bookingForm.additionalCostsDescription || ''
        };

        const dbResponse = await fetch('/api/admin/bookings/create-confirmed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(databaseBookingData),
        });

        const dbResult = await dbResponse.json();

        if (!dbResponse.ok) {
          throw new Error(dbResult.message || 'Failed to create database booking');
        }

        // Step 3: Refresh both calendar and database data
        await fetchCalendarData();
        await fetchBookings();

        toast.success('Booking created successfully!');
        setShowBookingModal(false);
        resetBookingForm();
      } catch (error) {
        console.error('Error creating booking:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Failed to create booking: ${errorMessage}`);
      }
    }
  };

  // Get counts for each status
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const totalCount = bookings.length;

  // Calendar-specific helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
      case 'complete': // Handle legacy 'complete' status
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-600 text-gray-100 border-gray-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to determine event status based on end date and visual indicators
  const getEventStatus = (event: CalendarEvent) => {
    // Check if event is a maintenance event (🔧 symbol)
    if (event.summary?.includes('🔧')) {
      return 'unavailable';
    }
    
    // Check if event is already marked as completed (gray color or ✅ symbol)
    if (event.colorId === '11' || event.summary?.includes('✅')) {
      return 'completed';
    }
    
    // Check if event has ended
    const eventEndDate = event.end?.dateTime ? new Date(event.end.dateTime) : 
                        event.end?.date ? new Date(event.end.date) : null;
    const isComplete = eventEndDate && eventEndDate < new Date();
    return isComplete ? 'completed' : 'confirmed';
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

  // Calendar event handlers
  const handleViewDetails = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  // Helper function to extract customer name from calendar event summary
  const extractCustomerNameFromSummary = (summary: string): string => {
    if (!summary) return '';
    
    // Try to match the pattern: 🏰 CustomerName - CastleType
    const match = summary.match(/🏰\s(.+?)\s-/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Fallback: remove emoji and take everything before the first " - "
    const cleaned = summary.replace('🏰 ', '').trim();
    const parts = cleaned.split(' - ');
    return parts[0].trim();
  };

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
    
    // Extract email from description
    const emailMatch = event.description?.match(/Email: (.+?)(?:\s|$)/);
    const email = emailMatch?.[1] || '';
    
    // Find castle by name (check both capture groups from the regex)
    const castleName = castleMatch?.[1] || castleMatch?.[2] || '';
    const castle = castles.find(c => c.name === castleName);
    
    // Check if it's multi-day
    const isMultiDay = eventStart.toDateString() !== eventEnd.toDateString();
    
    setBookingForm({
      castle: castle?.id.toString() || '',
      customerName: extractCustomerNameFromSummary(event.summary || ''),
      customerEmail: email,
      customerPhone: phone,
      address: event.location || '',
      singleDate: isMultiDay ? '' : (eventStart.toISOString().split('T')[0] || ''),
      multipleDate: isMultiDay,
      startDate: isMultiDay ? (eventStart.toISOString().split('T')[0] || '') : '',
      endDate: isMultiDay ? (eventEnd.toISOString().split('T')[0] || '') : '',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Bookings
          </h1>
          <p className="mt-2 text-gray-600">
            Manage pending and confirmed bookings
          </p>
        </div>
        <div className="flex flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={refreshCalendar}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => {
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
            New Booking
          </Button>
        </div>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-end gap-4">
            <div className="flex flex-row gap-4 w-full sm:w-auto">
              <Select>
                <SelectTrigger className="flex-1 sm:flex-none sm:w-48">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <SelectValue placeholder="Filter by Date" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 space-y-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">Select Date Range:</div>
                    {[
                      { key: 'all', label: 'All Time' },
                      { key: 'week', label: 'Past Week' },
                      { key: 'month', label: 'Past Month' },
                      { key: 'quarter', label: 'Past Quarter' },
                      { key: 'year', label: 'Past Year' }
                    ].map(({ key, label }) => (
                      <div 
                        key={key}
                        className="cursor-pointer hover:bg-gray-50 px-2 py-1.5 text-sm rounded flex items-center justify-between" 
                        onClick={() => handleTimeRangeChange(key)}
                      >
                        <span>{label}</span>
                        {timeRange === key && <Check className="w-4 h-4 text-green-600" />}
                      </div>
                    ))}
                  </div>
                </SelectContent>
              </Select>
              <div className="relative">
                <Select>
                  <SelectTrigger className="flex-1 sm:flex-none sm:w-48">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue placeholder="Filter by Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 space-y-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">Select Statuses:</div>
                      {[
                        { key: 'pending', label: 'Pending', icon: Clock },
                        { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
                        { key: 'completed', label: 'Completed', icon: CheckCircle },
                        { key: 'expired', label: 'Expired', icon: X }
                      ].map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`status-${key}`}
                            checked={statusFilters[key as keyof typeof statusFilters]}
                            onCheckedChange={(checked) =>
                              setStatusFilters(prev => ({
                                ...prev,
                                [key]: checked
                              }))
                            }
                          />
                          <Label
                            htmlFor={`status-${key}`}
                            className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading bookings...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {!Object.values(statusFilters).every(Boolean) 
                  ? 'Try adjusting your filter criteria.' 
                  : 'Customer bookings will appear here once submitted.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto space-y-4">
              {filteredBookings.slice(0, 6).map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer gap-3 transition-colors"
                  onClick={() => {
                    // Since filteredBookings only contains database bookings, always convert to calendar event format
                    handleViewDetails(bookingToCalendarEvent(booking));
                  }}
                >
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                      <h3 className="font-medium">{booking.customerName}</h3>
                      <div className="flex gap-2">
                        {getStatusBadge(booking.status, booking)}
                        {getAgreementBadge(booking)}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-sm text-gray-600">
                      <div>
                        <strong>Castle:</strong> {booking.castleName}
                      </div>
                      <div>
                        <strong>Date:</strong> {formatDate(booking.date)}
                      </div>
                      <div>
                        <strong>Duration:</strong> {booking.eventDuration ? `${booking.eventDuration} hours` : '8 hours'}
                      </div>
                      <div>
                        <strong>Total:</strong> £{booking.totalPrice}
                      </div>
                      <div>
                        <strong>Booking Ref:</strong> {booking.bookingRef}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredBookings.length > 6 && (
                <div className="text-center py-4 text-sm text-gray-500">
                  Showing 6 of {filteredBookings.length} bookings. Scroll to see more.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>





      {/* Calendar Section - Copied from Calendar Tab */}
      <div className="space-y-6">
        {/* Calendar Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CalendarIcon className="w-6 h-6 mr-2" />
            Calendar
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your bookings and schedule
          </p>
        </div>

        

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
                                  const eventStatus = getEventStatus(event);
                                  if (eventStatus === 'completed') return 'bg-blue-500'; // Blue for completed events
                                  
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
                                      {event.summary?.includes('🏰') 
                                        ? extractCustomerNameFromSummary(event.summary)
                                        : event.summary?.replace('🔧 ', '')
                                      }
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
                        <div 
                          key={event.id} 
                          className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleViewDetails(event)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm line-clamp-2">
                              {event.summary?.includes('🏰') 
                                ? extractCustomerNameFromSummary(event.summary)
                                : event.summary
                              }
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(getEventStatus(event))}`}>
                              {getEventStatus(event)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            {(() => {
                              // Check if this is a maintenance event
                              if (event.summary?.includes('🔧')) {
                                const castleName = event.summary?.split(' - ')[1] || 'Unknown Castle';
                                
                                return (
                                  <>
                                    <p><strong>Castle:</strong> {castleName}</p>
                                    <p><strong>Date:</strong> {formatMaintenanceDateRange(event)}</p>
                                  </>
                                );
                              }
                              
                              // Regular booking event logic
                              const description = event.description || '';
                              const castleName = event.summary?.split(' - ')[1] || 'Unknown Castle';
                              const total = description.match(/Total: £(\d+)/)?.[1] || '0';
                              const bookingRef = description.match(/Booking Ref: (TS\d{3})/)?.[1] || 'N/A';
                              
                              // Enhanced duration detection with price validation (same logic as modal)
                              const durationMatch = description.match(/Duration: (\d+) hours/);
                              const explicitDuration = durationMatch ? parseInt(durationMatch[1]) : null;
                              
                              // Check for overnight indicators
                              const hasOvernightIndicator = description.includes('24 hours') || 
                                                          description.includes('Overnight') || 
                                                          description.includes('(Overnight)');
                              
                              // Price-based validation 
                              const totalCost = parseInt(total);
                              const possibleBasePrice = totalCost - 20;
                              const isPriceConsistentWithOvernight = totalCost > 100 && 
                                (possibleBasePrice % 10 === 0 || possibleBasePrice % 20 === 0) && 
                                possibleBasePrice >= 60;
                              
                              // Determine duration with validation
                              let duration;
                              if (hasOvernightIndicator || isPriceConsistentWithOvernight) {
                                duration = '24';
                              } else if (explicitDuration && (explicitDuration === 8 || explicitDuration === 24)) {
                                // Override explicit duration if price contradicts
                                if (explicitDuration === 8 && isPriceConsistentWithOvernight) {
                                  duration = '24'; // Trust the price
                                } else {
                                  duration = explicitDuration.toString();
                                }
                              } else {
                                duration = '8'; // Default fallback
                              }
                              
                              return (
                                <>
                                  <p><strong>Castle:</strong> {castleName}</p>
                                  <p><strong>Date:</strong> {formatEventDate(event)}</p>
                                  <p><strong>Duration:</strong> {duration} hours</p>
                                  <p><strong>Total:</strong> £{total}</p>
                                  <p><strong>Booking Ref:</strong> {bookingRef}</p>
                                </>
                              );
                            })()}
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

        {/* Calendar Booking Modal */}
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
            calculateTotalCost={calculateTotalCostForModal}
            showConfirmationToggle={!isEditing} // Show toggle for new bookings only
          />
        )}

        {/* Calendar Booking Details Modal */}
        {showDetailsModal && selectedEvent && (
          <BookingDetailsModal
            open={showDetailsModal}
            event={selectedEvent}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedEvent(null);
            }}
            onEdit={selectedEvent.id.startsWith('db_') ? handleEditBooking : handleEditEvent}
            onDelete={selectedEvent.id.startsWith('db_') ? () => {
              // Find the booking by ID for database bookings
              const bookingId = selectedEvent.id.replace('db_', '');
              const booking = bookings.find(b => b.id.toString() === bookingId);
              if (booking) {
                handleDeleteBooking(booking.id);
              }
            } : () => handleDeleteCalendarEvent(selectedEvent.id)}
            onApprove={selectedEvent.id.startsWith('db_') ? () => {
              // Find the booking by ID for database bookings
              const bookingId = selectedEvent.id.replace('db_', '');
              const booking = bookings.find(b => b.id.toString() === bookingId);
              if (booking && booking.status === 'pending') {
                handleConfirmBooking(booking.id);
              }
            } : undefined}
            onApproveAndSendAgreement={selectedEvent.id.startsWith('db_') ? (eventId: string) => {
              const bookingId = eventId.replace('db_', '');
              const booking = bookings.find(b => b.id.toString() === bookingId);
              if (booking && booking.status === 'pending') {
                handleApproveAndSendAgreement(booking.id);
              }
            } : undefined}
            onEditAndSendAgreement={selectedEvent.id.startsWith('db_') ? (event: any) => {
              const bookingId = event.id.replace('db_', '');
              const booking = bookings.find(b => b.id.toString() === bookingId);
              if (booking && booking.status === 'pending') {
                handleEditAndSendAgreement(booking.id);
              }
            } : undefined}
            onExpireBooking={selectedEvent.id.startsWith('db_') ? (eventId: string) => {
              const bookingId = eventId.replace('db_', '');
              const booking = bookings.find(b => b.id.toString() === bookingId);
              if (booking && booking.status === 'pending') {
                handleExpireBooking(booking.id);
              }
            } : undefined}
            onResendAgreement={selectedEvent.id.startsWith('db_') ? (bookingRef: string) => {
              // Extract numeric booking ID from the event ID (e.g., 'db_5' -> '5')
              const bookingId = selectedEvent.id.replace('db_', '');
              handleResendAgreement(bookingId);
            } : undefined}
            onManualSign={selectedEvent.id.startsWith('db_') ? (bookingRef: string) => {
              window.open(`/hire-agreement?bookingRef=${bookingRef}`, '_blank');
            } : undefined}
            formatEventDate={formatEventDate}
            formatEventTime={formatEventTime}
            getStatusColor={getStatusColor}
          />
        )}
      </div>
    </div>
  );
}