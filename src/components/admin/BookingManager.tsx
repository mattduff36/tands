'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  XCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  castle: string;
  location: string;
  address: string;
  totalPrice: number;
  deposit: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingManagerProps {
  onBookingSelect?: (booking: Booking) => void;
  selectedDate?: Date;
}

export default function BookingManager({ onBookingSelect, selectedDate }: BookingManagerProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showNewBookingForm, setShowNewBookingForm] = useState(false);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockBookings: Booking[] = [
      {
        id: '1',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.johnson@email.com',
        customerPhone: '+44 7123 456789',
        date: '2024-01-25',
        startTime: '10:00',
        endTime: '16:00',
        castle: 'Princess Castle',
        location: 'Hyde Park',
        address: 'Hyde Park, London W2 2UH',
        totalPrice: 250,
        deposit: 50,
        status: 'confirmed',
        notes: 'Birthday party for 6-year-old. Need setup by 9:30 AM.',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z'
      },
      {
        id: '2',
        customerName: 'Mike Williams',
        customerEmail: 'mike.williams@email.com',
        customerPhone: '+44 7234 567890',
        date: '2024-01-26',
        startTime: '09:00',
        endTime: '17:00',
        castle: 'Superhero Obstacle Course',
        location: 'Regent\'s Park',
        address: 'Regent\'s Park, London NW1 4NU',
        totalPrice: 350,
        deposit: 70,
        status: 'pending',
        notes: 'Corporate team building event.',
        createdAt: '2024-01-16T14:30:00Z',
        updatedAt: '2024-01-16T14:30:00Z'
      },
      {
        id: '3',
        customerName: 'Emma Davis',
        customerEmail: 'emma.davis@email.com',
        customerPhone: '+44 7345 678901',
        date: '2024-01-28',
        startTime: '11:00',
        endTime: '15:00',
        castle: 'Jungle Adventure',
        location: 'Richmond Park',
        address: 'Richmond Park, Richmond, London TW10 5HS',
        totalPrice: 200,
        deposit: 40,
        status: 'confirmed',
        createdAt: '2024-01-17T11:15:00Z',
        updatedAt: '2024-01-17T11:15:00Z'
      },
      {
        id: '4',
        customerName: 'James Wilson',
        customerEmail: 'james.wilson@email.com',
        customerPhone: '+44 7456 789012',
        date: '2024-01-30',
        startTime: '12:00',
        endTime: '18:00',
        castle: 'Medieval Castle',
        location: 'Greenwich Park',
        address: 'Greenwich Park, London SE10 8QY',
        totalPrice: 300,
        deposit: 60,
        status: 'cancelled',
        notes: 'Customer cancelled due to weather concerns.',
        createdAt: '2024-01-18T16:20:00Z',
        updatedAt: '2024-01-20T10:00:00Z'
      }
    ];

    setBookings(mockBookings);
    setFilteredBookings(mockBookings);
    setIsLoading(false);
  }, []);

  // Filter bookings based on search and status
  useEffect(() => {
    let filtered = bookings.filter(booking => {
      const matchesSearch = 
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.castle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // If selectedDate is provided, filter by that date
    if (selectedDate) {
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(booking => booking.date === selectedDateString);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, selectedDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    onBookingSelect?.(booking);
  };

  const handleDeleteBooking = (bookingId: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    }
  };

  const handleSaveBooking = (bookingData: Partial<Booking>) => {
    if (editingBooking) {
      // Update existing booking
      setBookings(prev => prev.map(b => 
        b.id === editingBooking.id 
          ? { ...b, ...bookingData, updatedAt: new Date().toISOString() }
          : b
      ));
    } else {
      // Create new booking
      const newBooking: Booking = {
        id: Date.now().toString(),
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        date: '',
        startTime: '',
        endTime: '',
        castle: '',
        location: '',
        address: '',
        totalPrice: 0,
        deposit: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...bookingData
      } as Booking;
      
      setBookings(prev => [...prev, newBooking]);
    }
    
    setEditingBooking(null);
    setShowNewBookingForm(false);
  };

  const BookingForm = ({ booking, onSave, onCancel }: {
    booking?: Booking;
    onSave: (data: Partial<Booking>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState<Partial<Booking>>(booking || {});

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>{booking ? 'Edit Booking' : 'New Booking'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail || ''}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone || ''}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime || ''}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime || ''}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  required
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status || 'pending'} onValueChange={(value) => setFormData({...formData, status: value as Booking['status']})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="castle">Bouncy Castle</Label>
                <Select value={formData.castle || ''} onValueChange={(value) => setFormData({...formData, castle: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select castle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Princess Castle">Princess Castle</SelectItem>
                    <SelectItem value="Superhero Obstacle Course">Superhero Obstacle Course</SelectItem>
                    <SelectItem value="Jungle Adventure">Jungle Adventure</SelectItem>
                    <SelectItem value="Medieval Castle">Medieval Castle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Full Address</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalPrice">Total Price (£)</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalPrice || ''}
                  onChange={(e) => setFormData({...formData, totalPrice: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="deposit">Deposit (£)</Label>
                <Input
                  id="deposit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deposit || ''}
                  onChange={(e) => setFormData({...formData, deposit: parseFloat(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" className="w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Booking
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  if (showNewBookingForm || editingBooking) {
    return (
      <BookingForm
        booking={editingBooking || undefined}
        onSave={handleSaveBooking}
        onCancel={() => {
          setEditingBooking(null);
          setShowNewBookingForm(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Booking Management</h2>
          <p className="text-gray-600">
            {selectedDate ? `Bookings for ${selectedDate.toLocaleDateString()}` : 'All bookings'}
          </p>
        </div>
        <Button onClick={() => setShowNewBookingForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{booking.customerName}</h3>
                        <Badge className={`flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="capitalize">{booking.status}</span>
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">£{booking.totalPrice}</p>
                        <p className="text-sm text-gray-500">Deposit: £{booking.deposit}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-gray-600">
                          <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="break-all">{booking.customerEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{booking.customerPhone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{new Date(booking.date).toLocaleDateString()} • {booking.startTime} - {booking.endTime}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-gray-600">
                          <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{booking.castle}</span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{booking.location}</span>
                        </div>
                        <div className="text-gray-500 break-words">
                          <span>{booking.address}</span>
                        </div>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {booking.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row sm:flex-col gap-2 ml-0 sm:ml-4 mt-4 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBooking(booking)}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="w-4 h-4 sm:mr-0 mr-2" />
                      <span className="sm:hidden">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBookingSelect?.(booking)}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="w-4 h-4 sm:mr-0 mr-2" />
                      <span className="sm:hidden">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-0 mr-2" />
                      <span className="sm:hidden">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No bookings found</p>
              <Button onClick={() => setShowNewBookingForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Booking
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}