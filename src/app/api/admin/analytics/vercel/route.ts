import { NextRequest, NextResponse } from 'next/server';

// Vercel API configuration
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const VERCEL_ACCESS_TOKEN = process.env.VERCEL_ACCESS_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

// Helper function to get date range for Vercel API
function getFromDate(timeRange: string): string {
  const now = new Date();
  let daysAgo: number;
  
  switch (timeRange) {
    case '7d': daysAgo = 7; break;
    case '30d': daysAgo = 30; break;
    case '90d': daysAgo = 90; break;
    default: daysAgo = 30;
  }
  
  const fromDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return fromDate.toISOString();
}

// NOTE: Vercel does not provide a public API to fetch Web Analytics data
// This function demonstrates what the integration would look like if it existed
async function fetchVercelAnalytics(timeRange: string) {
  // Vercel Web Analytics is dashboard-only - no public API exists
  throw new Error('Vercel Web Analytics API is not publicly available. Data can only be viewed in the Vercel dashboard at https://vercel.com/dashboard');
}

// Transform Vercel API data to our format
function transformVercelData(vercelData: any, timeRange: string) {
  // Process the raw Vercel analytics data
  const events = vercelData.events || [];
  
  // Calculate basic metrics
  const totalPageViews = events.length;
  const uniqueVisitors = new Set(events.map((e: any) => e.visitor_id || e.client_id)).size;
  
  // Group events by date
  const dailyViews = events.reduce((acc: any, event: any) => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  
  // Group by page
  const pageViews = events.reduce((acc: any, event: any) => {
    const path = event.url ? new URL(event.url).pathname : event.path || '/';
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {});
  
  // Get top pages
  const topPages = Object.entries(pageViews)
    .map(([path, views]: [string, any]) => ({
      path,
      views,
      percentage: ((views / totalPageViews) * 100)
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  
  // Group by device type (if available)
  const devices = events.reduce((acc: any, event: any) => {
    const device = event.device_type || (event.user_agent?.includes('Mobile') ? 'mobile' : 'desktop');
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});
  
  // Group by country (if available)
  const countries = events.reduce((acc: any, event: any) => {
    const country = event.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});
  
  // Group by referrer (if available)
  const referrers = events.reduce((acc: any, event: any) => {
    const referrer = event.referrer || 'Direct';
    acc[referrer] = (acc[referrer] || 0) + 1;
    return acc;
  }, {});
  
  return {
    pageViews: {
      total: totalPageViews,
      trend: 0, // Would need historical data to calculate trend
      data: Object.entries(dailyViews).map(([date, views]) => ({ date, views }))
    },
    uniqueVisitors: {
      total: uniqueVisitors,
      trend: 0,
      data: [] // Would need to group unique visitors by date
    },
    topPages,
    devices: {
      mobile: { count: devices.mobile || 0, percentage: ((devices.mobile || 0) / totalPageViews) * 100 },
      desktop: { count: devices.desktop || 0, percentage: ((devices.desktop || 0) / totalPageViews) * 100 },
      tablet: { count: devices.tablet || 0, percentage: ((devices.tablet || 0) / totalPageViews) * 100 }
    },
    countries: Object.entries(countries)
      .map(([country, views]: [string, any]) => ({
        country,
        code: country.slice(0, 2).toUpperCase(),
        views,
        percentage: ((views / totalPageViews) * 100)
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5),
    referrers: Object.entries(referrers)
      .map(([source, views]: [string, any]) => ({
        source,
        views,
        percentage: ((views / totalPageViews) * 100)
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5),
    performance: {
      avgPageLoadTime: 0, // Not available in basic Web Analytics
      bounceRate: 0, // Would need session data
      avgSessionDuration: 0 // Would need session data
    }
  };
}

// Demo/Mock data for analytics display since Vercel doesn't provide public API access
const generateDemoAnalyticsData = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    pageViews: {
      total: 1247,
      trend: 15.3,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 80) + 20
      }))
    },
    uniqueVisitors: {
      total: 892,
      trend: 12.8,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visitors: Math.floor(Math.random() * 50) + 15
      }))
    },
    topPages: [
      { path: '/', views: 487, percentage: 39.1 },
      { path: '/castles', views: 324, percentage: 26.0 },
      { path: '/booking', views: 186, percentage: 14.9 },
      { path: '/about', views: 142, percentage: 11.4 },
      { path: '/contact', views: 108, percentage: 8.7 }
    ],
    devices: {
      mobile: { count: 748, percentage: 60.0 },
      desktop: { count: 374, percentage: 30.0 },
      tablet: { count: 125, percentage: 10.0 }
    },
    countries: [
      { country: 'United Kingdom', code: 'GB', views: 1059, percentage: 85.0 },
      { country: 'United States', code: 'US', views: 87, percentage: 7.0 },
      { country: 'Canada', code: 'CA', views: 50, percentage: 4.0 },
      { country: 'Australia', code: 'AU', views: 37, percentage: 3.0 },
      { country: 'Ireland', code: 'IE', views: 14, percentage: 1.0 }
    ],
    referrers: [
      { source: 'Direct', views: 623, percentage: 50.0 },
      { source: 'Google', views: 374, percentage: 30.0 },
      { source: 'Facebook', views: 125, percentage: 10.0 },
      { source: 'Local Directory', views: 87, percentage: 7.0 },
      { source: 'Other', views: 38, percentage: 3.0 }
    ],
    performance: {
      avgPageLoadTime: 1.2,
      bounceRate: 28.5,
      avgSessionDuration: 156.3
    }
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    
    // Vercel Web Analytics doesn't provide a public API
    // Using demo data that represents what your real analytics might look like
    const analyticsData = generateDemoAnalyticsData();
    const dataSource = 'demo';
    
    console.info('📊 Displaying demo analytics data. Vercel Web Analytics can only be viewed at https://vercel.com/dashboard');
    
    return NextResponse.json({
      success: true,
      data: analyticsData,
      timeRange,
      dataSource,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}