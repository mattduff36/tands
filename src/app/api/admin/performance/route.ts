import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { performanceMonitor, getPerformanceStats, logPerformanceReport } from '@/lib/database/performance-monitor';

/**
 * GET /api/admin/performance
 * Get performance statistics and monitoring data
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

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const format = searchParams.get('format') || 'json';

    // Parse time range if provided
    let timeRange: { from: Date; to: Date } | undefined;
    if (fromDate && toDate) {
      timeRange = {
        from: new Date(fromDate),
        to: new Date(toDate)
      };
    }

    switch (reportType) {
      case 'summary':
        const stats = getPerformanceStats(timeRange);
        return NextResponse.json({
          success: true,
          data: stats,
          timeRange
        });

      case 'full':
        const fullReport = performanceMonitor.generateReport(timeRange);
        return NextResponse.json({
          success: true,
          data: fullReport,
          timeRange
        });

      case 'alerts':
        const alerts = performanceMonitor.getRecentAlerts(50);
        return NextResponse.json({
          success: true,
          data: alerts,
          total: alerts.length
        });

      case 'export':
        const exportFormat = format as 'json' | 'csv';
        const exportData = performanceMonitor.exportMetrics(exportFormat);
        
        if (exportFormat === 'csv') {
          return new NextResponse(exportData, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="performance_metrics.csv"'
            }
          });
        } else {
          return NextResponse.json({
            success: true,
            data: JSON.parse(exportData)
          });
        }

      case 'operations':
        const operationStats = {
          create: performanceMonitor.getOperationStats('create'),
          read: performanceMonitor.getOperationStats('read'),
          update: performanceMonitor.getOperationStats('update'),
          delete: performanceMonitor.getOperationStats('delete'),
          query: performanceMonitor.getOperationStats('query')
        };
        
        return NextResponse.json({
          success: true,
          data: operationStats
        });

      default:
        return NextResponse.json(
          { error: 'Invalid report type. Use: summary, full, alerts, export, or operations' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Error in GET /api/admin/performance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get performance data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/performance
 * Performance monitoring actions (clear metrics, generate reports, etc.)
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

    const body = await request.json();
    const { action, options = {} } = body;

    switch (action) {
      case 'clear_metrics':
        performanceMonitor.clearMetrics();
        return NextResponse.json({
          success: true,
          message: 'Performance metrics cleared'
        });

      case 'log_report':
        logPerformanceReport();
        return NextResponse.json({
          success: true,
          message: 'Performance report logged to console'
        });

      case 'generate_report':
        const timeRange = options.timeRange ? {
          from: new Date(options.timeRange.from),
          to: new Date(options.timeRange.to)
        } : undefined;
        
        const report = performanceMonitor.generateReport(timeRange);
        
        return NextResponse.json({
          success: true,
          message: 'Performance report generated',
          data: report
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: clear_metrics, log_report, or generate_report' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Error in POST /api/admin/performance:', error);
    return NextResponse.json(
      { 
        error: 'Performance action failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}