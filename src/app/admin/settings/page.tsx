"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, FileText } from "lucide-react";

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

      {/* Future Settings Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Additional Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Settings className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              More Settings Coming Soon
            </h4>
            <p className="text-gray-600 text-sm">
              Additional configuration options will be added here as the system
              grows.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
