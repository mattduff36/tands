'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download, 
  Calendar,
  Users,
  PoundSterling,
  MapPin,
  ChevronDown
} from 'lucide-react';

interface ReportData {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  popularCastle: string;
  popularLocation: string;
  monthlyRevenue: number[];
  monthlyBookings: number[];
  revenueGrowth: number;
  bookingGrowth: number;
}

export default function AdminReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  // Mock report data
  useEffect(() => {
    const mockData: ReportData = {
      totalRevenue: 15420,
      totalBookings: 56,
      averageBookingValue: 275,
      popularCastle: 'Princess Castle',
      popularLocation: 'Hyde Park',
      monthlyRevenue: [8500, 12300, 15420],
      monthlyBookings: [32, 45, 56],
      revenueGrowth: 25.4,
      bookingGrowth: 24.4
    };

    setTimeout(() => {
      setReportData(mockData);
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const recentMonths = months.slice(Math.max(0, currentMonth - 2), currentMonth + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">
            Track your business performance and insights
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div className="relative">
            <Button variant="outline" className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              This Month
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">£{reportData?.totalRevenue.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600 font-medium">
                        +{reportData?.revenueGrowth}%
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <PoundSterling className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData?.totalBookings}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600 font-medium">
                        +{reportData?.bookingGrowth}%
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Avg. Booking Value</p>
                    <p className="text-2xl font-bold text-gray-900">£{reportData?.averageBookingValue}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600 font-medium">+2.1%</span>
                      <span className="text-sm text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Popular Location</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData?.popularLocation}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-500">35% of all bookings</span>
                    </div>
                  </div>
                  <MapPin className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMonths.map((month, index) => {
                    const revenue = reportData?.monthlyRevenue[index] || 0;
                    const maxRevenue = Math.max(...(reportData?.monthlyRevenue || [1]));
                    const percentage = (revenue / maxRevenue) * 100;
                    
                    return (
                      <div key={month} className="flex items-center space-x-4">
                        <div className="w-12 text-sm font-medium text-gray-600">{month}</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-20 text-sm font-medium text-right">
                          £{revenue.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Bookings Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Monthly Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMonths.map((month, index) => {
                    const bookings = reportData?.monthlyBookings[index] || 0;
                    const maxBookings = Math.max(...(reportData?.monthlyBookings || [1]));
                    const percentage = (bookings / maxBookings) * 100;
                    
                    return (
                      <div key={month} className="flex items-center space-x-4">
                        <div className="w-12 text-sm font-medium text-gray-600">{month}</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-green-600 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-20 text-sm font-medium text-right">
                          {bookings} bookings
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Castles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Princess Castle', bookings: 18, percentage: 32 },
                    { name: 'Superhero Obstacle', bookings: 14, percentage: 25 },
                    { name: 'Jungle Adventure', bookings: 12, percentage: 21 },
                    { name: 'Medieval Castle', bookings: 8, percentage: 14 },
                    { name: 'Pirate Ship', bookings: 4, percentage: 7 }
                  ].map((castle) => (
                    <div key={castle.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{castle.name}</span>
                          <span className="text-sm text-gray-500">{castle.bookings} bookings</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${castle.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Hyde Park', bookings: 16, percentage: 35 },
                    { name: 'Regent\'s Park', bookings: 12, percentage: 26 },
                    { name: 'Richmond Park', bookings: 10, percentage: 22 },
                    { name: 'Hampstead Heath', bookings: 6, percentage: 13 },
                    { name: 'Greenwich Park', bookings: 2, percentage: 4 }
                  ].map((location) => (
                    <div key={location.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{location.name}</span>
                          <span className="text-sm text-gray-500">{location.bookings} bookings</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${location.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}