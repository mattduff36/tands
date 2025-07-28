'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  CalendarIcon,
  Loader2,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw
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
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  source: 'database' | 'calendar';
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
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
    overnight: false,
    additionalCosts: false,
    additionalCostsDescription: '',
    additionalCostsAmount: 0
  });

  // Calendar-specific state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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

  // Fetch bookings from API
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/bookings');
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
        // Fetch events for current month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const eventsResponse = await fetch(`/api/admin/calendar/events?year=${year}&month=${month}`);
        const eventsData = await eventsResponse.json();
        
        if (eventsData.events) {
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
  }, [currentDate]);

  // Create a combined list of bookings and calendar events
  const createCombinedBookingsList = useCallback(() => {
    const databaseBookings = bookings.filter(booking => {
      const matchesStatus = filter === 'all' || booking.status === filter;
      const matchesSearch = searchTerm === '' || 
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.castleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.bookingRef.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });

    // For confirmed bookings, also include calendar events
    let calendarBookings: any[] = [];
    if (filter === 'all' || filter === 'confirmed') {
      // Create a Set to track unique event IDs for more robust deduplication
      const seenEventIds = new Set<string>();
      
      calendarBookings = events
        .filter(event => {
          // Skip if we've already seen this event ID
          if (seenEventIds.has(event.id)) {
            return false;
          }
          seenEventIds.add(event.id);
          
          // Only include events that look like confirmed bookings (not maintenance events)
          const isBookingEvent = event.summary?.includes('🏰') || 
            (event.summary && !event.summary.includes('🔧'));
          
          const matchesSearch = searchTerm === '' || 
            event.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.attendees?.[0]?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.attendees?.[0]?.email?.toLowerCase().includes(searchTerm.toLowerCase());
          
          return isBookingEvent && matchesSearch;
        })
        .map(event => {
          // Calculate total cost for calendar events
          const castleName = event.summary?.split(' - ')[1] || 'Unknown Castle';
          const castle = castles.find(c => c.name === castleName);
          const basePrice = Math.floor(castle?.price || 0);
          
          // Calculate number of days
          let numberOfDays = 1;
          if (event.start?.date && event.end?.date) {
            const startDate = new Date(event.start.date);
            const endDate = new Date(event.end.date);
            const timeDiff = endDate.getTime() - startDate.getTime();
            numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
          }
          
          const totalBasePrice = basePrice * numberOfDays;
          const overnightCharge = event.description?.includes('(Overnight)') ? 20 : 0;
          
          return {
            id: event.id,
            bookingRef: `CAL-${event.id}`,
            customerName: event.summary?.replace('🏰 ', '').split(' - ')[0] || 'Unknown',
            customerEmail: event.attendees?.[0]?.email || '',
            customerPhone: '',
            customerAddress: event.location || '',
            castleId: castle?.id || 0,
            castleName: castleName,
            date: event.start?.date || event.start?.dateTime?.split('T')[0] || '',
            paymentMethod: '',
            totalPrice: totalBasePrice + overnightCharge,
            deposit: 0,
            status: 'confirmed' as const,
            notes: event.description || '',
            createdAt: '',
            updatedAt: '',
            source: 'calendar' as const,
            calendarEvent: event // Store the original calendar event
          };
        });
    }

    // Debug logging to help identify duplicates
    console.log('Calendar events processed:', calendarBookings.length);
    console.log('Database bookings:', databaseBookings.length);
    console.log('Total combined bookings:', databaseBookings.length + calendarBookings.length);

    return [...databaseBookings, ...calendarBookings];
  }, [bookings, events, castles, filter, searchTerm]);

  const filteredBookings = createCombinedBookingsList();

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Confirm booking
  const handleConfirmBooking = async (bookingId: number) => {
    setIsProcessing(true);
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
      setIsProcessing(false);
    }
  };

  // Update booking status
  const handleUpdateStatus = async (bookingId: number, status: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Booking ${status}!`);
        await fetchBookings();
        setShowDetailsModal(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Error updating booking');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete booking
  const handleDeleteBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    setIsProcessing(true);
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
      setIsProcessing(false);
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
    return {
      id: `db_${booking.id}`, // Prefix to identify database bookings
      summary: booking.customerName + ' - ' + booking.castleName,
      description: booking.notes || '',
      location: booking.customerAddress,
      start: { date: booking.date },
      end: { date: booking.date },
      attendees: [
        { email: booking.customerEmail, displayName: booking.customerName, responseStatus: 'accepted' }
      ],
      colorId: undefined,
      status: booking.status
    };
  }

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
      if (castleMatch) {
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
      singleDate: bookingDate.toISOString().split('T')[0],
      multipleDate: false,
      startDate: '',
      endDate: '',
      overnight: booking.notes?.includes('(Overnight)') || false,
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
  const calculateTotalCost = () => {
    const selectedCastle = castles.find(c => c.id.toString() === bookingForm.castle);
    const basePrice = Math.floor(selectedCastle?.price || 0);

    // Calculate number of days
    let numberOfDays = 1;
    if (bookingForm.multipleDate && bookingForm.startDate && bookingForm.endDate) {
      const startDate = new Date(bookingForm.startDate);
      const endDate = new Date(bookingForm.endDate);
      const timeDiff = endDate.getTime() - startDate.getTime();
      numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
    }

    const totalBasePrice = basePrice * numberOfDays;
    const overnightCharge = bookingForm.overnight ? 20 : 0;
    const additionalCosts = bookingForm.additionalCosts ? bookingForm.additionalCostsAmount : 0;

    return totalBasePrice + overnightCharge + additionalCosts;
  };

  // Handle booking form submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && selectedEvent) {
      setIsSubmitting(true);
      try {
        // Calculate total cost
        const totalCost = calculateTotalCost();
        
        // Get selected castle details
        const selectedCastle = castles.find(c => c.id.toString() === bookingForm.castle);
        if (!selectedCastle) {
          toast.error('Please select a valid castle');
          return;
        }

        // Determine the date to use
        let bookingDate = bookingForm.singleDate;
        if (bookingForm.multipleDate && bookingForm.startDate && bookingForm.endDate) {
          bookingDate = bookingForm.startDate; // Use start date for multi-day bookings
        }

        // Check if this is a calendar event or database booking
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
            deposit: Math.floor(totalCost * 0.3), // 30% deposit
            notes: bookingForm.overnight ? '(Overnight)' : ''
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
        } else {
          // Update calendar event
          const calendarEventId = selectedEvent.id;
          
          // Prepare calendar event update data
          const bookingData = {
            customerName: bookingForm.customerName,
            contactDetails: {
              phone: bookingForm.customerPhone
            },
            location: bookingForm.address,
            notes: `Castle: ${selectedCastle.name}${bookingForm.overnight ? ' (Overnight)' : ''}`,
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
      } catch (error) {
        console.error('Error updating booking:', error);
        toast.error('Error updating booking');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Create new booking
      setIsSubmitting(true);
      try {
        // Validate form
        if (!bookingForm.castle || !bookingForm.customerName || !bookingForm.customerPhone || !bookingForm.address) {
          toast.error('Please fill in all required fields');
          return;
        }

        // Determine dates
        let startDateTime, endDateTime;
        if (bookingForm.multipleDate) {
          if (!bookingForm.startDate || !bookingForm.endDate) {
            toast.error('Please select both start and end dates');
            return;
          }
          startDateTime = `${bookingForm.startDate}T10:00:00`;
          endDateTime = `${bookingForm.endDate}T18:00:00`;
        } else {
          if (!bookingForm.singleDate) {
            toast.error('Please select a date');
            return;
          }
          startDateTime = `${bookingForm.singleDate}T10:00:00`;
          endDateTime = `${bookingForm.singleDate}T18:00:00`;
        }

        // Calculate total cost
        const totalCost = calculateTotalCost();
        
        // Get selected castle details
        const selectedCastle = castles.find(c => c.id.toString() === bookingForm.castle);
        if (!selectedCastle) {
          toast.error('Please select a valid castle');
          return;
        }

        // Create booking data for calendar
        const bookingData = {
          customerName: bookingForm.customerName,
          contactDetails: {
            email: bookingForm.customerEmail,
            phone: bookingForm.customerPhone
          },
          location: bookingForm.address,
          notes: `Castle: ${selectedCastle.name}${bookingForm.overnight ? ' (Overnight)' : ''}`,
          duration: {
            start: startDateTime,
            end: endDateTime
          },
          cost: totalCost,
          bouncyCastleType: selectedCastle.name
        };

        // Create calendar event
        const response = await fetch('/api/admin/calendar/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        });

        if (response.ok) {
          toast.success('Booking created successfully and added to calendar!');
          // Only refresh calendar data since the new booking is only in Google Calendar
          await fetchCalendarData(); // Refresh calendar data
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
            overnight: false,
            additionalCosts: false,
            additionalCostsDescription: '',
            additionalCostsAmount: 0
          });
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to create booking');
        }
      } catch (error) {
        console.error('Error creating booking:', error);
        toast.error('Error creating booking');
      } finally {
        setIsSubmitting(false);
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
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
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

  // Calendar event handlers
  const handleViewDetails = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    // Parse event data back into form format
    const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
    const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');
    
    // Extract castle info from event notes/description
    const castleMatch = event.description?.match(/Castle Type: (.+?)(?:\s|$)/);
    const isOvernight = event.description?.includes('(Overnight)') || false;
    
    // Extract phone number from description
    const phoneMatch = event.description?.match(/Phone: (.+?)(?:\s|$)/);
    const phone = phoneMatch?.[1] || '';
    
    // Find castle by name
    const castle = castles.find(c => c.name === castleMatch?.[1]);
    
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
      overnight: isOvernight,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            Manage pending and confirmed bookings
          </p>
        </div>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                         <CardTitle>
               {filter === 'all' ? 'All Bookings' : 
                filter === 'pending' ? 'Pending Bookings' :
                filter === 'confirmed' ? 'Confirmed Bookings' :
                filter === 'cancelled' ? 'Cancelled Bookings' : 'Bookings'} ({filteredBookings.length})
             </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 sm:w-64">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                                 <SelectContent>
                   <SelectItem value="all">All Bookings</SelectItem>
                   <SelectItem value="pending">Pending</SelectItem>
                   <SelectItem value="confirmed">Confirmed</SelectItem>
                   <SelectItem value="cancelled">Cancelled</SelectItem>
                 </SelectContent>
              </Select>
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
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Customer bookings will appear here once submitted.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-medium">{booking.bookingRef}</h3>
                      {getStatusBadge(booking.status)}
                      <Badge variant={booking.source === 'database' ? 'default' : 'secondary'}>
                        {booking.source === 'database' ? 'DB' : 'Calendar'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>
                        <strong>Customer:</strong> {booking.customerName}
                      </div>
                      <div>
                        <strong>Castle:</strong> {booking.castleName}
                      </div>
                      <div>
                        <strong>Date:</strong> {formatDate(booking.date)}
                      </div>
                      <div>
                        <strong>Total:</strong> £{booking.totalPrice}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                                         <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         if (booking.source === 'calendar' && booking.calendarEvent) {
                           // For calendar events, use the original event
                           handleViewDetails(booking.calendarEvent);
                         } else {
                           // For database bookings, convert to calendar event format
                           handleViewDetails(bookingToCalendarEvent(booking));
                         }
                       }}
                     >
                       <Eye className="h-4 w-4 mr-1" />
                       View
                     </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>





      {/* Calendar Section - Copied from Calendar Tab */}
      <div className="space-y-6">
        {/* Calendar Header */}
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
                overnight: false,
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
                                
                                // Get event color based on type
                                const getEventColor = () => {
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
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(event.status || 'confirmed')}`}>
                              {event.status || 'confirmed'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>{formatEventDate(event)} • {formatEventTime(event)}</p>
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
            calculateTotalCost={calculateTotalCost}
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
            } : handleDeleteEvent}
            onApprove={selectedEvent.id.startsWith('db_') ? () => {
              // Find the booking by ID for database bookings
              const bookingId = selectedEvent.id.replace('db_', '');
              const booking = bookings.find(b => b.id.toString() === bookingId);
              if (booking && booking.status === 'pending') {
                handleConfirmBooking(booking.id);
              }
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