'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Download, Database, FileText, AlertCircle, FileOutput } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [bookingRef, setBookingRef] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleExportBookingData = async () => {
    if (!bookingRef.trim()) {
      toast.error('Please enter a booking reference');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/bookings/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingRef: bookingRef.trim().toUpperCase()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export booking data');
      }

      const result = await response.json();
      
      if (result.success) {
        // Create and trigger download
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `booking-${bookingRef.trim().toUpperCase()}-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Booking data exported successfully for ${bookingRef.trim().toUpperCase()}`);
        setBookingRef(''); // Clear the input
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export booking data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGeneratePDFReport = async () => {
    if (!bookingRef.trim()) {
      toast.error('Please enter a booking reference');
      return;
    }

    setIsGeneratingReport(true);
    try {
      const response = await fetch('/api/admin/bookings/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingRef: bookingRef.trim().toUpperCase()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF report');
      }

      // Get the PDF blob and trigger download
      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `booking-${bookingRef.trim().toUpperCase()}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`PDF report generated successfully for ${bookingRef.trim().toUpperCase()}`);
      setBookingRef(''); // Clear the input
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate PDF report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleExportBookingData();
    }
  };

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

      {/* Booking Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Booking Data Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Legal Data Export</h4>
                <p className="text-sm text-blue-700">
                  Export all stored data for a specific booking including agreement signatures, audit trails, 
                  and customer information. Use this for legal compliance, dispute resolution, or administrative purposes.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bookingRef">Booking Reference</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="bookingRef"
                  type="text"
                  placeholder="e.g., TS001, TS002..."
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={isExporting || isGeneratingReport}
                />
                <Button 
                  onClick={handleExportBookingData}
                  disabled={isExporting || isGeneratingReport || !bookingRef.trim()}
                  variant="outline"
                  className="px-4"
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export JSON
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleGeneratePDFReport}
                  disabled={isExporting || isGeneratingReport || !bookingRef.trim()}
                  className="px-4"
                >
                  {isGeneratingReport ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileOutput className="w-4 h-4 mr-2" />
                      Generate PDF
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-3">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Export Options:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="font-medium text-gray-900 mb-1">📄 JSON Export</div>
                    <div className="text-xs text-gray-600">Raw data format for technical analysis and integration</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="font-medium text-gray-900 mb-1">📊 PDF Report</div>
                    <div className="text-xs text-gray-600">Professional, human-readable report for review and documentation</div>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Both formats include:</h5>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Complete booking details and customer information</li>
                  <li>Agreement signing data with IP address and timestamps</li>
                  <li>Full audit trail of all booking modifications</li>
                  <li>Email tracking and interaction history</li>
                  <li>Legal compliance metadata for court evidence</li>
                  <li>Digital signature verification data</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <h4 className="text-lg font-medium text-gray-900 mb-2">More Settings Coming Soon</h4>
            <p className="text-gray-600 text-sm">
              Additional configuration options will be added here as the system grows.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}