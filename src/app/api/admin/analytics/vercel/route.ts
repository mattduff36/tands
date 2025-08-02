import { NextRequest, NextResponse } from 'next/server';

// Mock data for development - replace with actual Vercel API calls when ready
const generateMockAnalyticsData = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    pageViews: {
      total: 2847,
      trend: 12.5,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 150) + 50
      }))
    },
    uniqueVisitors: {
      total: 1923,
      trend: 8.2,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visitors: Math.floor(Math.random() * 80) + 30
      }))
    },
    topPages: [
      { path: '/', views: 1247, percentage: 43.8 },
      { path: '/castles', views: 892, percentage: 31.3 },
      { path: '/about', views: 324, percentage: 11.4 },
      { path: '/contact', views: 298, percentage: 10.5 },
      { path: '/booking', views: 86, percentage: 3.0 }
    ],
    devices: {
      mobile: { count: 1624, percentage: 57.1 },
      desktop: { count: 1085, percentage: 38.1 },
      tablet: { count: 138, percentage: 4.8 }
    },
    countries: [
      { country: 'United Kingdom', code: 'GB', views: 2456, percentage: 86.3 },
      { country: 'United States', code: 'US', views: 198, percentage: 7.0 },
      { country: 'Canada', code: 'CA', views: 89, percentage: 3.1 },
      { country: 'Australia', code: 'AU', views: 67, percentage: 2.4 },
      { country: 'Germany', code: 'DE', views: 37, percentage: 1.3 }
    ],
    referrers: [
      { source: 'Direct', views: 1423, percentage: 50.0 },
      { source: 'Google', views: 854, percentage: 30.0 },
      { source: 'Facebook', views: 284, percentage: 10.0 },
      { source: 'Twitter', views: 142, percentage: 5.0 },
      { source: 'Other', views: 144, percentage: 5.0 }
    ],
    performance: {
      avgPageLoadTime: 1.24,
      bounceRate: 34.2,
      avgSessionDuration: 142.5
    }
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    
    // TODO: Replace with actual Vercel Analytics API calls
    // For now, using mock data for demonstration
    const analyticsData = generateMockAnalyticsData();
    
    return NextResponse.json({
      success: true,
      data: analyticsData,
      timeRange,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching Vercel analytics:', error);
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

// Example of how to integrate with actual Vercel Analytics API
// You'll need to add your Vercel team ID and access token to environment variables
/*
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const VERCEL_ACCESS_TOKEN = process.env.VERCEL_ACCESS_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

async function fetchVercelAnalytics(timeRange: string) {
  const response = await fetch(
    `https://api.vercel.com/v1/analytics/events?teamId=${VERCEL_TEAM_ID}&projectId=${VERCEL_PROJECT_ID}&from=${getFromDate(timeRange)}`,
    {
      headers: {
        'Authorization': `Bearer ${VERCEL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Vercel API error: ${response.statusText}`);
  }
  
  return response.json();
}
*/