'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Booking {
  id: string;
  bookingRef: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  location: string;
  castle: string;
  duration: string;
  totalCost: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  createdAt: string;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Mock bookings data
  useEffect(() => {
    const mockBookings: Booking[] = [
      {
        id: '1',
        bookingRef: 'TS-001',
        customerName: 'Sarah Johnson',
        email: 'sarah@email.com',
        phone: '+44 7123 456789',
        date: '2024-01-25',
        time: '10:00 AM',
        location: 'Hyde Park, London',
        castle: 'Princess Castle',
        duration: '4 hours',
        totalCost: 250,
        status: 'confirmed',
        paymentStatus: 'paid',
        createdAt: '2024-01-20'
      },
      {
        id: '2',
        bookingRef: 'TS-002',
        customerName: 'Mike Williams',
        email: 'mike@email.com',
        phone: '+44 7987 654321',
        date: '2024-01-26',
        time: '2:00 PM',
        location: 'Regent\'s Park, London',
        castle: 'Superhero Obstacle',
        duration: '6 hours',
        totalCost: 350,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: '2024-01-22'
      },
      {
        id: '3',
        bookingRef: 'TS-003',
        customerName: 'Emma Davis',
        email: 'emma@email.com',
        phone: '+44 7456 123789',
        date: '2024-01-28',
        time: '11:00 AM',
        location: 'Richmond Park, London',
        castle: 'Jungle Adventure',
        duration: '5 hours',
        totalCost: 300,
        status: 'confirmed',
        paymentStatus: 'paid',
        createdAt: '2024-01-23'
      },
      {
        id: '4',
        bookingRef: 'TS-004',
        customerName: 'James Wilson',
        email: 'james@email.com',
        phone: '+44 7789 456123',
        date: '2024-01-30',
        time: '1:00 PM',
        location: 'Hampstead Heath, London',
        castle: 'Medieval Castle',
        duration: '4 hours',
        totalCost: 275,
        status: 'cancelled',
        paymentStatus: 'overdue',
        createdAt: '2024-01-18'
      }
    ];

    setTimeout(() => {
      setBookings(mockBookings);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-2 text-gray-600">
            Manage customer bookings and reservations
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <CardTitle>All Bookings</CardTitle>
            <div className="flex space-x-2">
              <div className="flex space-x-1">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'confirmed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('confirmed')}
                >
                  Confirmed
                </Button>
                <Button
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={filter === 'cancelled' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('cancelled')}
                >
                  Cancelled
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-lg">{booking.customerName}</h4>
                        <Badge variant="outline" className={getStatusColor(booking.status)}>
                          <div className="flex items-center">
                            {getStatusIcon(booking.status)}
                            <span className="ml-1 capitalize">{booking.status}</span>
                          </div>
                        </Badge>
                        <Badge variant="secondary" className={getPaymentStatusColor(booking.paymentStatus)}>
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p><strong>Ref:</strong> {booking.bookingRef}</p>
                        <p><strong>Castle:</strong> {booking.castle}</p>
                        <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()} at {booking.time}</p>
                        <p><strong>Duration:</strong> {booking.duration}</p>
                        <p><strong>Location:</strong> {booking.location}</p>
                        <p><strong>Cost:</strong> £{booking.totalCost}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No bookings found</p>
              <p className="text-sm">No bookings match your current filter</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}