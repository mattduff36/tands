'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Clock } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            Settings
          </h1>
          <p className="mt-2 text-gray-600">
            Admin settings and configuration options
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-center">
            <Clock className="w-6 h-6 mr-2" />
            Settings Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Settings Page Under Development
            </h3>
            <p className="text-gray-600 mb-4">
              We're working on bringing you comprehensive admin settings and configuration options.
            </p>
            <p className="text-sm text-gray-500">
              In the meantime, all fleet and maintenance management features are available in the Fleet tab.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}