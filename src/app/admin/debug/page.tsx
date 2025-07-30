'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Calendar, 
  RefreshCw, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Bug
} from 'lucide-react';
import { toast } from 'sonner';

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
  status: 'pending' | 'confirmed' | 'complete' | 'expired';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  agreementSigned?: boolean;
  agreementSignedAt?: string;
  agreementSignedBy?: string;
}

interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
  maintenanceStatus: string;
  maintenanceNotes?: string;
  maintenanceStartDate?: string;
  maintenanceEndDate?: string;
  createdAt: string;
  updatedAt: string;
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

interface RawData {
  schema: any;
  bookings: any[];
  castles: any[];
  timestamp: string;
}

export default function DebugPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [castles, setCastles] = useState<Castle[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDebugData = async () => {
    setIsLoading(true);
    try {
      // Fetch bookings
      const bookingsResponse = await fetch('/api/admin/bookings');
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.bookings || []);
      }

      // Fetch castles
      const castlesResponse = await fetch('/api/admin/fleet');
      if (castlesResponse.ok) {
        const castlesData = await castlesResponse.json();
        setCastles(castlesData.castles || []);
      }

      // Fetch calendar events
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const eventsResponse = await fetch(`/api/admin/calendar/events?year=${year}&month=${month}`);
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setCalendarEvents(eventsData.events || []);
      }

      // Fetch raw debug data
      const rawDataResponse = await fetch('/api/admin/debug');
      if (rawDataResponse.ok) {
        const rawDataResult = await rawDataResponse.json();
        setRawData(rawDataResult.data);
      }

    } catch (error) {
      console.error('Error fetching debug data:', error);
      toast.error('Failed to fetch debug data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDebugData();
    toast.success('Debug data refreshed');
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Confirmed</Badge>;
             case 'completed':
         return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Expired</Badge>;
      default:
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading debug data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Debug Dashboard</h1>
              <p className="text-gray-600">Database contents and system status for troubleshooting</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
                             <Button 
                 onClick={async () => {
                   if (!confirm('⚠️ WARNING: This will update the database with your manual changes.\n\nThis is a powerful but dangerous operation. Make sure you have backed up your data and know exactly what you are doing.\n\nAre you sure you want to proceed?')) {
                     return;
                   }
                   
                   try {
                     const response = await fetch('/api/admin/update-database', { 
                       method: 'POST',
                       headers: {
                         'Content-Type': 'application/json',
                       },
                       body: JSON.stringify({ rawData })
                     });
                     const result = await response.json();
                     if (result.success) {
                       toast.success(result.message);
                       fetchDebugData(); // Refresh the data
                     } else {
                       toast.error(result.error || 'Failed to update database');
                     }
                   } catch (error) {
                     toast.error('Failed to update database');
                   }
                 }}
                 variant="destructive"
                 className="flex items-center gap-2"
               >
                 <AlertCircle className="w-4 h-4" />
                 Update Database
               </Button>
               
               <Button 
                 onClick={async () => {
                   if (!confirm('🔧 This will fix database sequence issues that prevent new bookings from being created.\n\nThis is safe to run and will resolve ID conflicts.\n\nAre you sure you want to proceed?')) {
                     return;
                   }
                   
                   try {
                     const response = await fetch('/api/admin/fix-sequence', { 
                       method: 'POST'
                     });
                     const result = await response.json();
                     if (result.success) {
                       toast.success(result.message);
                       fetchDebugData(); // Refresh the data
                     } else {
                       toast.error(result.error || 'Failed to fix sequences');
                     }
                   } catch (error) {
                     toast.error('Failed to fix sequences');
                   }
                 }}
                 variant="outline"
                 className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700"
               >
                 <Bug className="w-4 h-4" />
                 Fix Sequences
               </Button>
                               <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/calendar/check-completed-events', { method: 'POST' });
                      const result = await response.json();
                      if (result.success) {
                        toast.success(result.message);
                        fetchDebugData(); // Refresh the data
                      } else {
                        toast.error(result.error || 'Failed to check completed events');
                      }
                    } catch (error) {
                      toast.error('Failed to check completed events');
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Check Completed Events
                </Button>
            </div>
          </div>
        </div>

        {/* Debug Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Bookings ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="castles" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Castles ({castles.length})
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar Events ({calendarEvents.length})
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Raw Data
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No bookings found in database</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">Booking Details</h3>
                              <div className="space-y-1 text-sm">
                                <p><strong>ID:</strong> {booking.id}</p>
                                <p><strong>Ref:</strong> {booking.bookingRef}</p>
                                <p><strong>Status:</strong> {getStatusBadge(booking.status)}</p>
                                <p><strong>Date:</strong> {formatDate(booking.date)}</p>
                                <p><strong>Castle:</strong> {booking.castleName}</p>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">Customer Info</h3>
                              <div className="space-y-1 text-sm">
                                <p><strong>Name:</strong> {booking.customerName}</p>
                                <p><strong>Email:</strong> {booking.customerEmail}</p>
                                <p><strong>Phone:</strong> {booking.customerPhone}</p>
                                <p><strong>Address:</strong> {booking.customerAddress}</p>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">Payment & Agreement</h3>
                              <div className="space-y-1 text-sm">
                                <p><strong>Total:</strong> £{booking.totalPrice}</p>
                                <p><strong>Deposit:</strong> £{booking.deposit}</p>
                                <p><strong>Method:</strong> {booking.paymentMethod}</p>
                                <p><strong>Agreement Signed:</strong> {booking.agreementSigned ? 'Yes' : 'No'}</p>
                                {booking.agreementSignedAt && (
                                  <p><strong>Signed At:</strong> {formatDate(booking.agreementSignedAt)}</p>
                                )}
                                {booking.agreementSignedBy && (
                                  <p><strong>Signed By:</strong> {booking.agreementSignedBy}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p><strong>Created:</strong> {formatDate(booking.createdAt)}</p>
                                <p><strong>Updated:</strong> {formatDate(booking.updatedAt)}</p>
                              </div>
                              <div>
                                {booking.notes && (
                                  <p><strong>Notes:</strong> {booking.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Castles Tab */}
          <TabsContent value="castles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Database Castles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {castles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No castles found in database</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {castles.map((castle) => (
                      <Card key={castle.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900">{castle.name}</h3>
                            <div className="space-y-1 text-sm">
                              <p><strong>Theme:</strong> {castle.theme}</p>
                              <p><strong>Size:</strong> {castle.size}</p>
                              <p><strong>Price:</strong> £{castle.price}</p>
                              <p><strong>Status:</strong> 
                                <Badge variant={castle.maintenanceStatus === 'available' ? 'default' : 'destructive'} className="ml-2">
                                  {castle.maintenanceStatus}
                                </Badge>
                              </p>
                              {castle.maintenanceNotes && (
                                <p><strong>Maintenance Notes:</strong> {castle.maintenanceNotes}</p>
                              )}
                              {castle.maintenanceStartDate && (
                                <p><strong>Maintenance Start:</strong> {formatDate(castle.maintenanceStartDate)}</p>
                              )}
                              {castle.maintenanceEndDate && (
                                <p><strong>Maintenance End:</strong> {formatDate(castle.maintenanceEndDate)}</p>
                              )}
                            </div>
                            <div className="pt-2 border-t text-xs text-gray-500">
                              <p><strong>Created:</strong> {formatDate(castle.createdAt)}</p>
                              <p><strong>Updated:</strong> {formatDate(castle.updatedAt)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Events Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Google Calendar Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calendarEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No calendar events found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {calendarEvents.map((event) => (
                      <Card key={event.id} className="border-l-4 border-l-purple-500">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">Event Details</h3>
                              <div className="space-y-1 text-sm">
                                <p><strong>ID:</strong> {event.id}</p>
                                <p><strong>Summary:</strong> {event.summary}</p>
                                <p><strong>Status:</strong> {event.status || 'N/A'}</p>
                                <p><strong>Location:</strong> {event.location || 'N/A'}</p>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">Timing</h3>
                              <div className="space-y-1 text-sm">
                                <p><strong>Start:</strong> {event.start.dateTime ? formatDate(event.start.dateTime) : event.start.date}</p>
                                <p><strong>End:</strong> {event.end.dateTime ? formatDate(event.end.dateTime) : event.end.date}</p>
                                {event.attendees && event.attendees.length > 0 && (
                                  <div>
                                    <p><strong>Attendees:</strong></p>
                                    <ul className="ml-4">
                                      {event.attendees.map((attendee, index) => (
                                        <li key={index}>
                                          {attendee.displayName || attendee.email} ({attendee.responseStatus || 'N/A'})
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {event.description && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                              <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded overflow-x-auto">
                                {event.description}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
                         </Card>
           </TabsContent>

           {/* Raw Data Tab */}
           <TabsContent value="raw" className="space-y-4">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Bug className="w-5 h-5" />
                   Raw Database Data
                 </CardTitle>
               </CardHeader>
                               <CardContent>
                  {!rawData ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bug className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No raw data available</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Warning Section */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <h3 className="text-sm font-medium text-red-800 mb-2">
                              ⚠️ Use with Caution
                            </h3>
                            <div className="text-sm text-red-700 space-y-1">
                              <p>• This section allows direct database editing</p>
                              <p>• Changes are applied immediately when you click "Update Database"</p>
                              <p>• Always backup your data before making changes</p>
                              <p>• Invalid JSON will be ignored</p>
                              <p>• Use this feature only for emergency fixes</p>
                            </div>
                          </div>
                        </div>
                      </div>
                                           {/* Database Schema */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Database Schema (Editable)</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <textarea
                            className="w-full h-64 text-sm text-gray-700 bg-white border border-gray-300 rounded p-2 font-mono"
                            value={JSON.stringify(rawData.schema, null, 2)}
                            onChange={(e) => {
                              try {
                                const newSchema = JSON.parse(e.target.value);
                                setRawData((prev: RawData | null) => prev ? ({ ...prev, schema: newSchema }) : null);
                              } catch (error) {
                                // Invalid JSON, ignore
                              }
                            }}
                            placeholder="Edit schema data here..."
                          />
                        </div>
                      </div>

                                           {/* Raw Bookings Data */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Raw Bookings Data (Editable)</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <textarea
                            className="w-full h-64 text-sm text-gray-700 bg-white border border-gray-300 rounded p-2 font-mono"
                            value={JSON.stringify(rawData.bookings, null, 2)}
                            onChange={(e) => {
                              try {
                                const newBookings = JSON.parse(e.target.value);
                                setRawData((prev: RawData | null) => prev ? ({ ...prev, bookings: newBookings }) : null);
                              } catch (error) {
                                // Invalid JSON, ignore
                              }
                            }}
                            placeholder="Edit bookings data here..."
                          />
                        </div>
                      </div>

                      {/* Raw Castles Data */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Raw Castles Data (Editable)</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <textarea
                            className="w-full h-64 text-sm text-gray-700 bg-white border border-gray-300 rounded p-2 font-mono"
                            value={JSON.stringify(rawData.castles, null, 2)}
                            onChange={(e) => {
                              try {
                                const newCastles = JSON.parse(e.target.value);
                                setRawData((prev: RawData | null) => prev ? ({ ...prev, castles: newCastles }) : null);
                              } catch (error) {
                                // Invalid JSON, ignore
                              }
                            }}
                            placeholder="Edit castles data here..."
                          />
                        </div>
                      </div>

                     {/* Timestamp */}
                     <div className="text-sm text-gray-500">
                       <p><strong>Data fetched at:</strong> {rawData.timestamp}</p>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </div>
     </div>
   );
 } 