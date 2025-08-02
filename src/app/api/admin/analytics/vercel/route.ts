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

// Fetch analytics data from Vercel API
async function fetchVercelAnalytics(timeRange: string) {
  if (!VERCEL_ACCESS_TOKEN || !VERCEL_TEAM_ID || !VERCEL_PROJECT_ID) {
    throw new Error('Missing Vercel API configuration. Please check your environment variables.');
  }

  const from = getFromDate(timeRange);
  const to = new Date().toISOString();
  
  // Fetch Web Analytics events
  const response = await fetch(
    `https://api.vercel.com/v1/analytics/events?teamId=${VERCEL_TEAM_ID}&projectId=${VERCEL_PROJECT_ID}&from=${from}&to=${to}`,
    {
      headers: {
        'Authorization': `Bearer ${VERCEL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
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

// Fallback mock data for when API fails or no data available
const generateFallbackData = () => {
  return {
    pageViews: { total: 0, trend: 0, data: [] },
    uniqueVisitors: { total: 0, trend: 0, data: [] },
    topPages: [],
    devices: { mobile: { count: 0, percentage: 0 }, desktop: { count: 0, percentage: 0 }, tablet: { count: 0, percentage: 0 } },
    countries: [],
    referrers: [],
    performance: { avgPageLoadTime: 0, bounceRate: 0, avgSessionDuration: 0 }
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    
    let analyticsData;
    let dataSource = 'live';
    
    try {
      // Try to fetch real data from Vercel API
      const vercelData = await fetchVercelAnalytics(timeRange);
      analyticsData = transformVercelData(vercelData, timeRange);
    } catch (apiError) {
      console.warn('Failed to fetch Vercel analytics, using fallback data:', apiError);
      analyticsData = generateFallbackData();
      dataSource = 'fallback';
    }
    
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