"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, FileText, AlertTriangle, Bug } from "lucide-react";
import Link from "next/link";

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
          <div className="space-y-6">
            {/* Debug Page Access - DANGEROUS */}
            <div className="border-2 border-red-500 bg-red-50 p-6 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-red-900 mb-2">
                    ⚠️ DANGER ZONE - DEVELOPERS ONLY ⚠️
                  </h4>
                  <div className="bg-red-100 border border-red-300 p-4 rounded-md mb-4">
                    <p className="text-red-800 font-semibold mb-2">
                      🚨 CRITICAL WARNING 🚨
                    </p>
                    <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                      <li>
                        <strong>DO NOT USE</strong> unless you are a site
                        developer
                      </li>
                      <li>
                        <strong>
                          MODIFICATIONS CAN BREAK THE ENTIRE WEBSITE
                        </strong>
                      </li>
                      <li>
                        <strong>CAN CORRUPT CUSTOMER DATA</strong>
                      </li>
                      <li>
                        <strong>NO UNDO FUNCTIONALITY</strong> - changes are
                        permanent
                      </li>
                      <li>
                        <strong>USE ONLY FOR DEBUGGING CRITICAL ERRORS</strong>
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/admin/debug" className="flex-1">
                      <Button
                        variant="destructive"
                        className="w-full bg-red-600 hover:bg-red-700 border-2 border-red-800 font-bold text-white shadow-lg"
                      >
                        <Bug className="w-4 h-4 mr-2" />
                        🚨 DEBUG PAGE - DEVELOPERS ONLY 🚨
                      </Button>
                    </Link>
                  </div>
                  <p className="text-red-600 text-xs mt-3 font-medium">
                    ⚠️ By clicking this link, you acknowledge that you
                    understand the risks and are a qualified developer capable
                    of debugging system issues.
                  </p>
                </div>
              </div>
            </div>

            {/* Future Settings Placeholder */}
            <div className="text-center py-8 border-t border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Settings className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                More Settings Coming Soon
              </h4>
              <p className="text-gray-600 text-sm">
                Additional configuration options will be added here as the
                system grows.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
