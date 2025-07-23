"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar as CalendarIconLucide,
  BarChart3,
  Download,
  RefreshCw,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  BookingStats,
  ReportingQuery,
  Booking,
  BookingQuery,
  BookingQueryResult
} from '@/lib/types/booking';

interface DateRange {
  from: Date;
  to: Date;
}

interface ReportingDashboardProps {
  className?: string;
}

export function ReportingDashboard({ className }: ReportingDashboardProps) {
  // State for date range selection
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    to: new Date() // Today
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // State for filters
  const [selectedCastles, setSelectedCastles] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week');
  
  // State for data
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Available filter options
  const availableCastles = [
    { id: '1', name: 'The Classic Fun' },
    { id: '2', name: 'Princess Palace' },
    { id: '3', name: 'Jungle Adventure' },
    { id: '4', name: 'Superhero Base' },
    { id: '5', name: 'Party Time Bouncer' },
    { id: '6', name: 'Under The Sea' }
  ];
  
  const availableStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No Show' }
  ];

  // Fetch statistics data
  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const query: ReportingQuery = {
        dateFrom: dateRange.from.toISOString().split('T')[0],
        dateTo: dateRange.to.toISOString().split('T')[0],
        castleIds: selectedCastles.length > 0 ? selectedCastles : undefined,
        statuses: selectedStatuses.length > 0 ? selectedStatuses as any : undefined,
        groupBy
      };
      
      const response = await fetch('/api/admin/reports/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics. Please try again.');
      toast.error('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recent bookings for detailed view
  const fetchRecentBookings = async () => {
    try {
      const query: BookingQuery = {
        dateFrom: dateRange.from.toISOString().split('T')[0],
        dateTo: dateRange.to.toISOString().split('T')[0],
        sortBy: 'created',
        sortOrder: 'desc',
        limit: 10
      };
      
      const response = await fetch('/api/admin/bookings?' + new URLSearchParams({
        dateFrom: query.dateFrom!,
        dateTo: query.dateTo!,
        sortBy: query.sortBy!,
        sortOrder: query.sortOrder!,
        limit: query.limit!.toString()
      }));
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent bookings');
      }
      
      const data: BookingQueryResult = await response.json();
      setRecentBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };

  // Load data when component mounts or filters change
  useEffect(() => {
    fetchStats();
    fetchRecentBookings();
  }, [dateRange, selectedCastles, selectedStatuses, groupBy]);

  // Handle date range selection
  const handleDateRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({ from: range.from, to: range.to });
      setDatePickerOpen(false);
    }
  };

  // Export data functionality
  const handleExport = async () => {
    try {
      const query = {
        dateFrom: dateRange.from.toISOString().split('T')[0],
        dateTo: dateRange.to.toISOString().split('T')[0],
        castleIds: selectedCastles.length > 0 ? selectedCastles : undefined,
        statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      };
      
      const response = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-report-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export report');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Reports</h2>
          <p className="text-gray-600">Analytics and insights for your bouncy castle business</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              fetchStats();
              fetchRecentBookings();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Picker */}
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={handleDateRangeSelect}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Castle Filter */}
            <div>
              <Label htmlFor="castles">Castles</Label>
              <Select onValueChange={(value) => {
                if (value === 'all') {
                  setSelectedCastles([]);
                } else {
                  setSelectedCastles([value]);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All castles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All castles</SelectItem>
                  {availableCastles.map(castle => (
                    <SelectItem key={castle.id} value={castle.id}>
                      {castle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="statuses">Status</Label>
              <Select onValueChange={(value) => {
                if (value === 'all') {
                  setSelectedStatuses([]);
                } else {
                  setSelectedStatuses([value]);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {availableStatuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Group By */}
            <div>
              <Label htmlFor="groupBy">Group By</Label>
              <Select value={groupBy} onValueChange={(value: 'day' | 'week' | 'month') => setGroupBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-800">
              <TrendingDown className="h-5 w-5 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Statistics Cards */}
      {!isLoading && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Bookings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <CalendarIconLucide className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.confirmedBookings} confirmed
                </p>
              </CardContent>
            </Card>

            {/* Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(stats.averageBookingValue)}
                </p>
              </CardContent>
            </Card>

            {/* Confirmed Bookings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalBookings > 0 ? 
                    Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.confirmedBookings} of {stats.totalBookings}
                </p>
              </CardContent>
            </Card>

            {/* Cancellation Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalBookings > 0 ? 
                    Math.round((stats.cancelledBookings / stats.totalBookings) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.cancelledBookings} cancelled
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Popular Castles */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Castles</CardTitle>
              <CardDescription>Most booked castles in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.popularCastles.map((castle, index) => (
                  <div key={castle.castleId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-600">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{castle.castleName}</div>
                        <div className="text-sm text-gray-600">{castle.bookingCount} bookings</div>
                      </div>
                    </div>
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      {Math.round((castle.bookingCount / stats.totalBookings) * 100)}%
                    </Badge>
                  </div>
                ))}
                
                {stats.popularCastles.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No data available for selected period</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Busy Periods */}
          <Card>
            <CardHeader>
              <CardTitle>Busiest Days</CardTitle>
              <CardDescription>Highest booking volume days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.busyPeriods.slice(0, 5).map((period, index) => (
                  <div key={period.date} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-600">#{index + 1}</div>
                      <div>
                        <div className="font-medium">
                          {new Date(period.date).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-600">{period.bookingCount} bookings</div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {period.bookingCount} bookings
                    </Badge>
                  </div>
                ))}
                
                {stats.busyPeriods.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No data available for selected period</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest bookings in selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="font-medium">{booking.customer.name}</div>
                    <Badge variant={
                      booking.status === 'confirmed' ? 'default' :
                      booking.status === 'pending' ? 'secondary' :
                      booking.status === 'cancelled' ? 'destructive' :
                      'outline'
                    }>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {booking.castle.name} • {booking.timeSlot.date} • {formatCurrency(booking.payment.totalAmount)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Created: {new Date(booking.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            
            {recentBookings.length === 0 && (
              <p className="text-gray-500 text-center py-8">No bookings found for selected period</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReportingDashboard;