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
  ChevronDown,
  AlertCircle
} from 'lucide-react';

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  complete: number;
  revenue: number;
}

interface ReportData {
  stats: BookingStats;
  averageBookingValue: number;
  revenueGrowth: number;
  bookingGrowth: number;
}

export default function AdminReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('all');

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

  // Fetch report data from API
  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { dateFrom, dateTo } = getDateRange();
      
      const response = await fetch(`/api/admin/reports/stats?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      const stats: BookingStats = await response.json();
      
      // Calculate derived metrics
      const averageBookingValue = stats.confirmed > 0 ? Math.round(stats.revenue / stats.confirmed) : 0;
      
      // For now, we'll set growth to 0 since we don't have historical comparison data
      // This can be enhanced later when we have more historical data
      const revenueGrowth = 0;
      const bookingGrowth = 0;
      
      setReportData({
        stats,
        averageBookingValue,
        revenueGrowth,
        bookingGrowth
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
  };

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-2 text-gray-600">
              Track your business performance and insights
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reports</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchReportData}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <Button onClick={handleExport} disabled={isLoading || !reportData}>
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
      ) : reportData ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">£{reportData.stats.revenue.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      {reportData.revenueGrowth >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${reportData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.revenueGrowth >= 0 ? '+' : ''}{reportData.revenueGrowth}%
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs previous period</span>
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
                    <p className="text-2xl font-bold text-gray-900">{reportData.stats.total}</p>
                    <div className="flex items-center mt-2">
                      {reportData.bookingGrowth >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${reportData.bookingGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.bookingGrowth >= 0 ? '+' : ''}{reportData.bookingGrowth}%
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs previous period</span>
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
                    <p className="text-2xl font-bold text-gray-900">£{reportData.averageBookingValue}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-500">Based on confirmed bookings</span>
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
                    <p className="text-sm font-medium text-gray-600">Confirmed Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.stats.confirmed}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-500">
                        {reportData.stats.total > 0 ? Math.round((reportData.stats.confirmed / reportData.stats.total) * 100) : 0}% of total
                      </span>
                    </div>
                  </div>
                  <MapPin className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Booking Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Confirmed', count: reportData.stats.confirmed, color: 'bg-green-600', percentage: reportData.stats.total > 0 ? (reportData.stats.confirmed / reportData.stats.total) * 100 : 0 },
                    { label: 'Pending', count: reportData.stats.pending, color: 'bg-yellow-600', percentage: reportData.stats.total > 0 ? (reportData.stats.pending / reportData.stats.total) * 100 : 0 },
                    { label: 'Complete', count: reportData.stats.complete, color: 'bg-blue-600', percentage: reportData.stats.total > 0 ? (reportData.stats.complete / reportData.stats.total) * 100 : 0 }
                  ].map((status) => (
                    <div key={status.label} className="flex items-center space-x-4">
                      <div className="w-24 text-sm font-medium text-gray-600">{status.label}</div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`${status.color} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${status.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-sm font-medium text-right">
                        {status.count} ({Math.round(status.percentage)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                    <span className="text-lg font-bold text-gray-900">£{reportData.stats.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Confirmed Bookings</span>
                    <span className="text-lg font-bold text-gray-900">{reportData.stats.confirmed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Average Value</span>
                    <span className="text-lg font-bold text-gray-900">£{reportData.averageBookingValue}</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Revenue per confirmed booking</span>
                      <span className="text-sm text-gray-500">
                        £{reportData.stats.confirmed > 0 ? Math.round(reportData.stats.revenue / reportData.stats.confirmed) : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Empty State for Additional Data */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">More Analytics Coming Soon</h3>
                <p className="text-gray-600">
                  Popular castles, location analytics, and detailed trends will be available as we collect more data.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-600">
                  No booking data found for the selected time period. Reports will appear once bookings are created.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}