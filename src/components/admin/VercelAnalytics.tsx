'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  Users, 
  Smartphone, 
  Monitor, 
  Tablet,
  Globe,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Zap,
  Clock,
  BarChart3
} from 'lucide-react';

interface AnalyticsData {
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

interface VercelAnalyticsProps {
  timeRange?: string;
}

export default function VercelAnalytics({ timeRange = '30d' }: VercelAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/analytics/vercel?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setAnalyticsData(result.data);
        // Show data source status
        if (result.dataSource === 'fallback') {
          console.warn('⚠️  Using fallback analytics data. Check your Vercel API configuration in .env.local');
        } else if (result.dataSource === 'live') {
          console.log('✅ Successfully loaded live Vercel analytics data');
        }
      } else {
        throw new Error(result.message || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Error fetching Vercel analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const TrendIcon = ({ trend }: { trend: number }) => {
    return trend >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const TrendText = ({ trend }: { trend: number }) => {
    const color = trend >= 0 ? 'text-green-600' : 'text-red-600';
    const sign = trend >= 0 ? '+' : '';
    return (
      <span className={`text-sm font-medium ${color}`}>
        {sign}{trend.toFixed(1)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Key Web Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.pageViews.total.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendIcon trend={analyticsData.pageViews.trend} />
                  <TrendText trend={analyticsData.pageViews.trend} />
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.uniqueVisitors.total.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendIcon trend={analyticsData.uniqueVisitors.trend} />
                  <TrendText trend={analyticsData.uniqueVisitors.trend} />
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Avg. Page Load</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.performance.avgPageLoadTime}s</p>
                <div className="flex items-center mt-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-500 ml-1">Fast loading</span>
                </div>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.performance.bounceRate}%</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">Good engagement</span>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="w-5 h-5 mr-2" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topPages.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{page.path}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${page.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-gray-900">{page.views.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{page.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              Device Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Mobile', data: analyticsData.devices.mobile, icon: Smartphone, color: 'bg-green-600' },
                { label: 'Desktop', data: analyticsData.devices.desktop, icon: Monitor, color: 'bg-blue-600' },
                { label: 'Tablet', data: analyticsData.devices.tablet, icon: Tablet, color: 'bg-purple-600' }
              ].map(({ label, data, icon: Icon, color }) => (
                <div key={label} className="flex items-center space-x-4">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-600">{label}</span>
                      <span className="text-sm font-medium text-gray-900">{data.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${color} h-2 rounded-full`}
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{data.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.countries.map((country) => (
                <div key={country.code} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <span className="text-lg mr-2">{country.code === 'GB' ? '🇬🇧' : country.code === 'US' ? '🇺🇸' : country.code === 'CA' ? '🇨🇦' : country.code === 'AU' ? '🇦🇺' : '🇩🇪'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{country.country}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-gray-900">{country.views.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{country.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Traffic Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {analyticsData.referrers.map((referrer) => (
              <div key={referrer.source} className="text-center">
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                    style={{ width: `${referrer.percentage}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">{referrer.source}</p>
                <p className="text-lg font-bold text-gray-900">{referrer.views.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{referrer.percentage}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}