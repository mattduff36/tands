'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  customer: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock calendar events
  useEffect(() => {
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Princess Castle Booking',
        date: '2024-01-25',
        time: '10:00 AM',
        location: 'Hyde Park',
        customer: 'Sarah Johnson',
        status: 'confirmed'
      },
      {
        id: '2',
        title: 'Superhero Obstacle Booking',
        date: '2024-01-26',
        time: '2:00 PM',
        location: 'Regent\'s Park',
        customer: 'Mike Williams',
        status: 'pending'
      },
      {
        id: '3',
        title: 'Jungle Adventure Booking',
        date: '2024-01-28',
        time: '11:00 AM',
        location: 'Richmond Park',
        customer: 'Emma Davis',
        status: 'confirmed'
      }
    ];

    setTimeout(() => {
      setEvents(mockEvents);
      setIsLoading(false);
    }, 1000);
  }, []);

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
        <div className="mt-4 sm:mt-0">
          <Button>
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
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Calendar View Coming Soon</p>
                  <p className="text-sm">Full calendar integration will be available in a future update</p>
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
                  {events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>{new Date(event.date).toLocaleDateString()} at {event.time}</p>
                        <p>{event.location}</p>
                        <p>Customer: {event.customer}</p>
                      </div>
                      <div className="mt-3">
                        <Button variant="outline" size="sm" className="w-full">
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
    </div>
  );
}