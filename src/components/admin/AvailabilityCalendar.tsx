'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays,
  ChevronLeft, 
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

interface BookingEvent {
  id: string;
  title: string;
  date: Date;
  status: 'available' | 'booked' | 'unavailable' | 'maintenance';
  customerName?: string;
  location?: string;
  castle?: string;
  notes?: string;
  timeSlot?: string;
}

interface AvailabilityCalendarProps {
  onDateSelect?: (date: Date) => void;
  onEventSelect?: (event: BookingEvent) => void;
  className?: string;
}

export default function AvailabilityCalendar({
  onDateSelect,
  onEventSelect,
  className = ''
}: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<BookingEvent[]>([]);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockEvents: BookingEvent[] = [
      {
        id: '1',
        title: 'Princess Castle Booking',
        date: new Date(2024, 0, 15),
        status: 'booked',
        customerName: 'Sarah Johnson',
        location: 'Hyde Park',
        castle: 'Princess Castle',
        timeSlot: '10:00 AM - 4:00 PM'
      },
      {
        id: '2',
        title: 'Equipment Maintenance',
        date: new Date(2024, 0, 16),
        status: 'maintenance',
        notes: 'Routine inspection and cleaning'
      },
      {
        id: '3',
        title: 'Superhero Obstacle Booking',
        date: new Date(2024, 0, 20),
        status: 'booked',
        customerName: 'Mike Williams',
        location: 'Regent\'s Park',
        castle: 'Superhero Obstacle',
        timeSlot: '9:00 AM - 5:00 PM'
      },
      {
        id: '4',
        title: 'Weather Unavailable',
        date: new Date(2024, 0, 25),
        status: 'unavailable',
        notes: 'Severe weather forecast'
      }
    ];

    // Generate more mock data for the current month
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(today.getFullYear(), today.getMonth(), day);
      const existingEvent = mockEvents.find(event => 
        event.date.toDateString() === date.toDateString()
      );
      
      if (!existingEvent && Math.random() > 0.7) {
        mockEvents.push({
          id: `mock-${day}`,
          title: 'Available',
          date: date,
          status: 'available'
        });
      }
    }

    setEvents(mockEvents);
    setIsLoading(false);
  }, [currentMonth]);

  const getEventsForDate = (date: Date): BookingEvent[] => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getDateStatus = (date: Date): 'available' | 'booked' | 'unavailable' | 'maintenance' | 'empty' => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return 'empty';
    
    const hasBooked = dayEvents.some(e => e.status === 'booked');
    const hasUnavailable = dayEvents.some(e => e.status === 'unavailable');
    const hasMaintenance = dayEvents.some(e => e.status === 'maintenance');
    
    if (hasMaintenance) return 'maintenance';
    if (hasUnavailable) return 'unavailable';
    if (hasBooked) return 'booked';
    return 'available';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booked':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-3 h-3" />;
      case 'booked':
        return <CalendarDays className="w-3 h-3" />;
      case 'unavailable':
        return <X className="w-3 h-3" />;
      case 'maintenance':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = getEventsForDate(date);
    setSelectedEvents(dayEvents);
    onDateSelect?.(date);
  };

  const handleEventClick = (event: BookingEvent) => {
    onEventSelect?.(event);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // Custom day content for the calendar
  const dayContent = (date: Date) => {
    const status = getDateStatus(date);
    const dayEvents = getEventsForDate(date);
    
    return (
      <div className="relative w-full h-full p-0.5 sm:p-1">
        <div className="text-xs sm:text-sm font-medium">{date.getDate()}</div>
        {dayEvents.length > 0 && (
          <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
            {/* Show 1 event on mobile, 2 on desktop */}
            <div className="sm:hidden">
              {dayEvents.slice(0, 1).map((event, index) => (
                <div
                  key={event.id}
                  className={`px-0.5 py-0.5 rounded text-xs flex items-center gap-0.5 ${getStatusColor(event.status)}`}
                >
                  <span className="truncate max-w-[40px]">
                    {event.status === 'booked' && event.customerName
                      ? event.customerName.split(' ')[0]
                      : event.status.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {dayEvents.length > 1 && (
                <div className="text-xs text-gray-500">
                  +{dayEvents.length - 1}
                </div>
              )}
            </div>
            <div className="hidden sm:flex sm:flex-wrap sm:gap-1">
              {dayEvents.slice(0, 2).map((event, index) => (
                <div
                  key={event.id}
                  className={`px-1 py-0.5 rounded text-xs flex items-center gap-1 ${getStatusColor(event.status)}`}
                >
                  {getStatusIcon(event.status)}
                  <span className="truncate max-w-[60px]">
                    {event.status === 'booked' && event.customerName
                      ? event.customerName.split(' ')[0]
                      : event.status}
                  </span>
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{dayEvents.length - 2} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 md:space-y-6 ${className}`}>
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <h2 className="text-lg md:text-xl font-semibold">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-1 mt-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="ml-1 sm:hidden">Prev</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
              <span className="mr-1 sm:hidden">Next</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            <span className="sm:inline">Add Booking</span>
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-lg">
        <span className="text-xs md:text-sm font-medium">Status:</span>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-600" />
          <span className="text-xs md:text-sm">Available</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3 text-blue-600" />
          <span className="text-xs md:text-sm">Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <X className="w-3 h-3 text-red-600" />
          <span className="text-xs md:text-sm">Unavailable</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-yellow-600" />
          <span className="text-xs md:text-sm">Maintenance</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="calendar-grid">
                  {/* Custom calendar implementation would go here */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }, (_, index) => {
                      const today = new Date();
                      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                      const startOfWeek = new Date(startOfMonth);
                      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                      
                      const cellDate = new Date(startOfWeek);
                      cellDate.setDate(cellDate.getDate() + index);
                      
                      const isCurrentMonth = cellDate.getMonth() === currentMonth.getMonth();
                      const isSelected = selectedDate.toDateString() === cellDate.toDateString();
                      const isToday = today.toDateString() === cellDate.toDateString();
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleDateClick(cellDate)}
                          className={`
                            h-16 sm:h-20 md:h-24 p-1 border rounded-lg text-left hover:bg-gray-50 transition-colors
                            ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                            ${isSelected ? 'ring-2 ring-blue-500' : ''}
                            ${isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}
                          `}
                        >
                          {dayContent(cellDate)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(event.status)}>
                              {getStatusIcon(event.status)}
                              <span className="ml-1 capitalize">{event.status}</span>
                            </Badge>
                          </div>
                          {event.customerName && (
                            <p className="font-medium">{event.customerName}</p>
                          )}
                          {event.castle && (
                            <p className="text-sm text-gray-600">{event.castle}</p>
                          )}
                          {event.location && (
                            <p className="text-sm text-gray-500">{event.location}</p>
                          )}
                          {event.timeSlot && (
                            <p className="text-sm text-gray-500">{event.timeSlot}</p>
                          )}
                          {event.notes && (
                            <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarDays className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No events scheduled</p>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}