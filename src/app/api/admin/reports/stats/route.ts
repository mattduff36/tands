import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getBookingStats } from '@/lib/database/bookings';
import { ReportingQuery } from '@/lib/types/booking';
import { RetryHelper } from '@/lib/utils/retry-helper';

/**
 * GET /api/admin/reports/stats
 * Get booking statistics for reporting
 */
export async function GET(request: NextRequest) {
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

    const query: ReportingQuery = {
      dateFrom,
      dateTo,
      castleIds: castleIds?.length ? castleIds : undefined,
      statuses: statuses?.length ? statuses as any : undefined,
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