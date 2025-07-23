'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  AlertCircle, 
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  availableDays: number;
  upcomingBookings: number;
}

interface UpcomingBooking {
  id: string;
  customerName: string;
  date: string;
  location: string;
  castle: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    todayBookings: 0,
    weekBookings: 0,
    monthBookings: 0,
    availableDays: 0,
    upcomingBookings: 0
  });
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // For now, use mock data. In real implementation, these would be API calls
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Mock dashboard stats
      setStats({
        totalBookings: 156,
        todayBookings: 3,
        weekBookings: 12,
        monthBookings: 34,
        availableDays: 28,
        upcomingBookings: 8
      });

      // Mock upcoming bookings
      setUpcomingBookings([
        {
          id: '1',
          customerName: 'Sarah Johnson',
          date: '2024-01-25',
          location: 'Hyde Park',
          castle: 'Princess Castle',
          status: 'confirmed'
        },
        {
          id: '2',
          customerName: 'Mike Williams',
          date: '2024-01-26',
          location: 'Regent\'s Park',
          castle: 'Superhero Obstacle',
          status: 'pending'
        },
        {
          id: '3',
          customerName: 'Emma Davis',
          date: '2024-01-28',
          location: 'Richmond Park',
          castle: 'Jungle Adventure',
          status: 'confirmed'
        }
      ]);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {session?.user?.name || 'Admin'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => router.push('/admin/bookings')}>
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayBookings > 0 ? '+2 from yesterday' : 'No bookings today'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekBookings}</div>
            <p className="text-xs text-muted-foreground">
              +4 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthBookings}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Days</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableDays}</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h4 className="font-medium text-sm sm:text-base truncate">{booking.customerName}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center self-start ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1 capitalize">{booking.status}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{booking.castle}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.date).toLocaleDateString()} • <span className="truncate">{booking.location}</span>
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/admin/bookings')}
                  >
                    View All Bookings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming bookings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button 
                className="h-14 sm:h-16 flex-col space-y-1 sm:space-y-2 text-xs sm:text-sm"
                onClick={() => router.push('/admin/bookings')}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs">New Booking</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-14 sm:h-16 flex-col space-y-1 sm:space-y-2 text-xs sm:text-sm"
                onClick={() => router.push('/admin/calendar')}
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs">Calendar</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-14 sm:h-16 flex-col space-y-1 sm:space-y-2 text-xs sm:text-sm"
                onClick={() => router.push('/admin/bookings')}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs">Bookings</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-14 sm:h-16 flex-col space-y-1 sm:space-y-2 text-xs sm:text-sm"
                onClick={() => router.push('/admin/reports')}
              >
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs">Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}