import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Google Analytics 4 configuration
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const GA4_CLIENT_EMAIL = process.env.GA4_CLIENT_EMAIL;
const GA4_PRIVATE_KEY = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Initialize the Analytics Data API client
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: GA4_CLIENT_EMAIL,
    private_key: GA4_PRIVATE_KEY,
  },
});

export interface AnalyticsData {
  pageViews: {
    total: number;
    trend: number;
    data: Array<{ date: string; views: number }>;
  };
  uniqueVisitors: {
    total: number;
    trend: number;
    data: Array<{ date: string; visitors: number }>;
  };
  topPages: Array<{
    path: string;
    views: number;
    percentage: number;
  }>;
  devices: {
    mobile: { count: number; percentage: number };
    desktop: { count: number; percentage: number };
    tablet: { count: number; percentage: number };
  };
  countries: Array<{
    country: string;
    code: string;
    views: number;
    percentage: number;
  }>;
  referrers: Array<{
    source: string;
    views: number;
    percentage: number;
  }>;
  performance: {
    avgPageLoadTime: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
}

// Helper function to get date range for GA4 API
function getDateRange(timeRange: string): { startDate: string; endDate: string } {
  const endDate = new Date();
  let startDate: Date;
  
  switch (timeRange) {
    case '7d': 
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d': 
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d': 
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default: 
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

// Fetch page views data
async function fetchPageViews(startDate: string, endDate: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'screenPageViews' }],
  });
  
  return response.rows?.map(row => ({
    date: row.dimensionValues?.[0]?.value || '',
    views: parseInt(row.metricValues?.[0]?.value || '0')
  })) || [];
}

// Fetch unique visitors data
async function fetchUniqueVisitors(startDate: string, endDate: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'totalUsers' }],
  });
  
  return response.rows?.map(row => ({
    date: row.dimensionValues?.[0]?.value || '',
    visitors: parseInt(row.metricValues?.[0]?.value || '0')
  })) || [];
}

// Fetch top pages data
async function fetchTopPages(startDate: string, endDate: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });
  
  const totalViews = response.rows?.reduce((sum, row) => 
    sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 0;
  
  return response.rows?.map(row => {
    const views = parseInt(row.metricValues?.[0]?.value || '0');
    return {
      path: row.dimensionValues?.[0]?.value || '',
      views,
      percentage: totalViews > 0 ? (views / totalViews) * 100 : 0
    };
  }) || [];
}

// Fetch device data
async function fetchDevices(startDate: string, endDate: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'screenPageViews' }],
  });
  
  const totalViews = response.rows?.reduce((sum, row) => 
    sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 0;
  
  const devices = { mobile: 0, desktop: 0, tablet: 0 };
  
  response.rows?.forEach(row => {
    const device = row.dimensionValues?.[0]?.value?.toLowerCase() || '';
    const views = parseInt(row.metricValues?.[0]?.value || '0');
    
    if (device.includes('mobile')) devices.mobile = views;
    else if (device.includes('desktop')) devices.desktop = views;
    else if (device.includes('tablet')) devices.tablet = views;
  });
  
  return {
    mobile: { 
      count: devices.mobile, 
      percentage: totalViews > 0 ? (devices.mobile / totalViews) * 100 : 0 
    },
    desktop: { 
      count: devices.desktop, 
      percentage: totalViews > 0 ? (devices.desktop / totalViews) * 100 : 0 
    },
    tablet: { 
      count: devices.tablet, 
      percentage: totalViews > 0 ? (devices.tablet / totalViews) * 100 : 0 
    }
  };
}

// Fetch countries data
async function fetchCountries(startDate: string, endDate: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'country' }, { name: 'countryId' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });
  
  const totalViews = response.rows?.reduce((sum, row) => 
    sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 0;
  
  return response.rows?.map(row => {
    const views = parseInt(row.metricValues?.[0]?.value || '0');
    return {
      country: row.dimensionValues?.[0]?.value || '',
      code: row.dimensionValues?.[1]?.value || '',
      views,
      percentage: totalViews > 0 ? (views / totalViews) * 100 : 0
    };
  }) || [];
}

// Fetch referrers data
async function fetchReferrers(startDate: string, endDate: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'firstUserSource' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });
  
  const totalViews = response.rows?.reduce((sum, row) => 
    sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 0;
  
  return response.rows?.map(row => {
    const views = parseInt(row.metricValues?.[0]?.value || '0');
    return {
      source: row.dimensionValues?.[0]?.value || 'Direct',
      views,
      percentage: totalViews > 0 ? (views / totalViews) * 100 : 0
    };
  }) || [];
}

// Fetch performance data
async function fetchPerformance(startDate: string, endDate: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' }
    ],
  });
  
  const bounceRate = parseFloat(response.rows?.[0]?.metricValues?.[0]?.value || '0') * 100;
  const avgSessionDuration = parseFloat(response.rows?.[0]?.metricValues?.[1]?.value || '0');
  
  return {
    avgPageLoadTime: 0, // Not available in GA4 standard reports
    bounceRate,
    avgSessionDuration
  };
}

// Main function to fetch all analytics data
export async function fetchGoogleAnalyticsData(timeRange: string = '30d'): Promise<AnalyticsData> {
  if (!GA4_PROPERTY_ID || !GA4_CLIENT_EMAIL || !GA4_PRIVATE_KEY) {
    throw new Error('Google Analytics 4 credentials not configured');
  }
  
  const { startDate, endDate } = getDateRange(timeRange);
  
  try {
    const [
      pageViewsData,
      uniqueVisitorsData,
      topPagesData,
      devicesData,
      countriesData,
      referrersData,
      performanceData
    ] = await Promise.all([
      fetchPageViews(startDate, endDate),
      fetchUniqueVisitors(startDate, endDate),
      fetchTopPages(startDate, endDate),
      fetchDevices(startDate, endDate),
      fetchCountries(startDate, endDate),
      fetchReferrers(startDate, endDate),
      fetchPerformance(startDate, endDate)
    ]);
    
    const totalPageViews = pageViewsData.reduce((sum, day) => sum + day.views, 0);
    const totalUniqueVisitors = uniqueVisitorsData.reduce((sum, day) => sum + day.visitors, 0);
    
    return {
      pageViews: {
        total: totalPageViews,
        trend: 0, // Would need historical comparison data
        data: pageViewsData
      },
      uniqueVisitors: {
        total: totalUniqueVisitors,
        trend: 0, // Would need historical comparison data
        data: uniqueVisitorsData
      },
      topPages: topPagesData,
      devices: devicesData,
      countries: countriesData,
      referrers: referrersData,
      performance: performanceData
    };
  } catch (error) {
    console.error('Error fetching Google Analytics data:', error);
    throw error;
  }
}