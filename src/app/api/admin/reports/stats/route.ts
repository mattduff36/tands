import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getBookingStats } from '@/lib/database/bookings';
import { ReportingQuery } from '@/lib/types/booking';
import { RetryHelper } from '@/lib/utils/retry-helper';
import { getPool } from '@/lib/database/connection';
import { getCalendarService } from '@/lib/calendar/google-calendar';

/**
 * GET /api/admin/reports/stats
 * Get booking statistics for reporting
 */
export async function GET(request: NextRequest) {
  // Check if this is a debug request
  const searchParams = request.nextUrl.searchParams;
  const debug = searchParams.get('debug');
  
  if (debug === 'true') {
    try {
      const client = await getPool().connect();
      try {
        const result = await client.query('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10');
        return NextResponse.json({ bookings: result.rows });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Error in debug endpoint:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Original GET logic continues here...
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const castleIds = searchParams.get('castleIds')?.split(',').filter(Boolean);
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean);
    const groupBy = searchParams.get('groupBy') as 'day' | 'week' | 'month' | null;

    // Validate required parameters
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'dateFrom and dateTo are required' },
        { status: 400 }
      );
    }

    // Get database statistics
    const query: ReportingQuery = {
      dateFrom,
      dateTo,
      castleIds: castleIds?.length ? castleIds : undefined,
      statuses: statuses?.length ? statuses as any : undefined,
      groupBy: groupBy || 'week'
    };

    const dbStats = await RetryHelper.withRetry(
      () => getBookingStats(query),
      {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000
      }
    );

    // Get calendar statistics
    let calendarStats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      revenue: 0
    };

    try {
      const calendarService = getCalendarService();
      
      // Get events for the date range
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      
      const calendarEvents = await calendarService.getBookingEventsInRange(startDate, endDate);
      
      // Filter and count calendar events that represent confirmed bookings
      const confirmedBookings = calendarEvents.filter(event => {
        return event.description && 
               event.summary && 
               (event.description.includes('🏰 Bouncy Castle Booking') || 
                event.description.includes('Booking Ref:')) &&
               (event.summary.includes(' - ') || event.summary.includes('🏰'));
      });

      // Calculate revenue from confirmed calendar bookings
      let totalRevenue = 0;
      for (const event of confirmedBookings) {
        const description = event.description || '';
        const costMatch = description.match(/Cost: £([^\n]+)/);
        const totalMatch = description.match(/Total: £([^\n]+)/);
        
        if (costMatch) {
          totalRevenue += parseInt(costMatch[1] || '0');
        } else if (totalMatch) {
          totalRevenue += parseInt(totalMatch[1] || '0');
        }
      }

      calendarStats = {
        total: confirmedBookings.length,
        pending: 0, // Calendar events are always confirmed
        confirmed: confirmedBookings.length,
        completed: 0,
        revenue: totalRevenue
      };
    } catch (calendarError) {
      console.error('Error fetching calendar events for reports:', calendarError);
      // Don't fail the entire request if calendar fails
    }

    // Combine database and calendar statistics
    const combinedStats = {
      total: dbStats.total + calendarStats.total,
      pending: dbStats.pending + calendarStats.pending,
      confirmed: dbStats.confirmed + calendarStats.confirmed,
      completed: dbStats.completed + calendarStats.completed,
      revenue: dbStats.revenue + calendarStats.revenue
    };

    return NextResponse.json(combinedStats);

  } catch (error: any) {
    console.error('Error in GET /api/admin/reports/stats:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/reports/stats
 * Get booking statistics for reporting (with request body)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { dateFrom, dateTo, castleIds, statuses, groupBy } = body;

    // Validate required parameters
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'dateFrom and dateTo are required' },
        { status: 400 }
      );
    }

    const query: ReportingQuery = {
      dateFrom,
      dateTo,
      castleIds: castleIds?.length ? castleIds : undefined,
      statuses: statuses?.length ? statuses : undefined,
      groupBy: groupBy || 'week'
    };

    // Get statistics with retry logic
    const stats = await RetryHelper.withRetry(
      () => getBookingStats(query),
      {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000
      }
    );

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('Error in POST /api/admin/reports/stats:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}