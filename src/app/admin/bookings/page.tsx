'use client';

import { useState, useEffect } from 'react';
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
  Loader2,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { BookingDetailsModal, CalendarEvent } from '@/components/admin/BookingDetailsModal';
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

interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
}

interface BookingFormData {
  castle: string;
  customerName: string;
  customerPhone: string;
  address: string;
  singleDate: string;
  multipleDate: boolean;
  startDate: string;
  endDate: string;
  overnight: boolean;
  additionalCosts: boolean;
  additionalCostsDescription: string;
  additionalCostsAmount: number;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [castles, setCastles] = useState<Castle[]>([]);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    castle: '',
    customerName: '',
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

  useEffect(() => {
    fetchBookings();
    fetchCastles();
  }, []);

  // Filter bookings based on status and search term
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filter === 'all' || booking.status === filter;
    const matchesSearch = searchTerm === '' || 
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.castleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingRef.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

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
      id: booking.id.toString(),
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
    // Find the booking by ID
    const booking = bookings.find(b => b.id.toString() === event.id);
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
    
    setSelectedBooking(booking);
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
    
    if (isEditing && selectedBooking) {
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
        if (selectedBooking.source === 'calendar') {
          // Update calendar event
          const calendarEventId = selectedBooking.id.toString().replace('cal-', '');
          
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
            setSelectedBooking(null);
          } else {
            const error = await response.json();
            toast.error(error.error || 'Failed to update calendar event');
          }
        } else {
          // Update database booking
          const updateData = {
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

          const response = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          });

          if (response.ok) {
            toast.success('Booking updated successfully!');
            await fetchBookings(); // Refresh the bookings list
            setShowBookingModal(false);
            setIsEditing(false);
            setSelectedBooking(null);
          } else {
            const error = await response.json();
            toast.error(error.error || 'Failed to update booking');
          }
        }
      } catch (error) {
        console.error('Error updating booking:', error);
        toast.error('Error updating booking');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // This would be for creating new bookings, but we're not using it in the Bookings tab
      toast.info('Create booking functionality coming soon!');
      setShowBookingModal(false);
    }
  };

  // Get counts for each status
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const totalCount = bookings.length;

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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
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
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Bookings ({filteredBookings.length})
          </CardTitle>
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
                        setSelectedBooking(booking);
                        setShowDetailsModal(true);
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

      {/* Booking Details Modal */}
      <BookingDetailsModal
        open={showDetailsModal && !!selectedBooking}
        event={selectedBooking ? bookingToCalendarEvent(selectedBooking) : null}
        onClose={() => setShowDetailsModal(false)}
        onApprove={selectedBooking?.status === 'pending' ? () => handleConfirmBooking(selectedBooking.id) : undefined}
        onEdit={selectedBooking && selectedBooking.status !== 'cancelled' ? () => handleEditBooking(bookingToCalendarEvent(selectedBooking)) : undefined}
        onDelete={selectedBooking ? () => handleDeleteBooking(selectedBooking.id) : undefined}
        formatEventDate={(event) => formatDate(event.start.date)}
        formatEventTime={() => ''}
        getStatusColor={(status) => {
          switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
          }
        }}
      />

      {/* Booking Form Modal */}
      <BookingFormModal
        open={showBookingModal}
        isEditing={isEditing}
        castles={castles}
        bookingForm={bookingForm}
        isSubmitting={isSubmitting}
        onClose={() => setShowBookingModal(false)}
        onSubmit={handleBookingSubmit}
        onFormChange={handleFormChange}
        calculateTotalCost={calculateTotalCost}
      />
    </div>
  );
}