"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VercelAnalytics from "@/components/admin/VercelAnalytics";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Users,
  PoundSterling,
  MapPin,
  ChevronDown,
  AlertCircle,
  Building2,
  Trophy,
  Clock,
  Database,
  FileOutput,
} from "lucide-react";

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  complete: number;
  revenue: number;
  popularCastles?: Array<{
    castleId: string;
    castleName: string;
    bookingCount: number;
  }>;
}

interface ReportData {
  stats: BookingStats;
  averageBookingValue: number;
  revenueGrowth: number;
  bookingGrowth: number;
}

export default function AdminReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("all");
  const [bookingRef, setBookingRef] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Calculate date range based on timeRange
  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "all":
        // For all time, use a very old start date
        startDate.setFullYear(2020);
        break;
      case "week":
        // For week, look back 7 days but also include future bookings
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        // For month, look back 30 days but also include future bookings
        startDate.setDate(now.getDate() - 30);
        break;
      case "quarter":
        // For quarter, look back 90 days but also include future bookings
        startDate.setDate(now.getDate() - 90);
        break;
      case "year":
        // For year, look back 365 days but also include future bookings
        startDate.setDate(now.getDate() - 365);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Set end date to a far future date to include all future bookings
    const endDate = new Date();
    endDate.setFullYear(now.getFullYear() + 2); // Include bookings up to 2 years in the future

    return {
      dateFrom: startDate.toISOString().split("T")[0],
      dateTo: endDate.toISOString().split("T")[0],
    };
  };

  // Fetch report data from API
  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { dateFrom, dateTo } = getDateRange();

      const response = await fetch(
        `/api/admin/reports/stats?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const stats: BookingStats = await response.json();

      // Calculate derived metrics
      const averageBookingValue =
        stats.total > 0 ? Math.round(stats.revenue / stats.total) : 0;

      // For now, we'll set growth to 0 since we don't have historical comparison data
      // This can be enhanced later when we have more historical data
      const revenueGrowth = 0;
      const bookingGrowth = 0;

      setReportData({
        stats,
        averageBookingValue,
        revenueGrowth,
        bookingGrowth,
      });
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch report data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export functionality to be implemented");
    toast.info("Feature coming soon!");
  };

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
  };

  const handleExportBookingData = async () => {
    if (!bookingRef.trim()) {
      toast.error("Please enter a booking reference");
      return;
    }

    setIsExporting(true);
    try {
      console.log(
        `Exporting booking data for: ${bookingRef.trim().toUpperCase()}`,
      );

      const response = await fetch("/api/admin/bookings/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingRef: bookingRef.trim().toUpperCase(),
        }),
      });

      console.log(`Export response status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = "Failed to export booking data";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
          if (error.details) {
            console.error("Export error details:", error.details);
            errorMessage += ` (${error.details})`;
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Export result received:", !!result.success);

      if (result.success) {
        // Create and trigger download
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        console.log(`JSON export size: ${dataBlob.size} bytes`);

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `booking-${bookingRef.trim().toUpperCase()}-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
          `Booking data exported successfully for ${bookingRef.trim().toUpperCase()}`,
        );
        setBookingRef(""); // Clear the input
      } else {
        throw new Error("Export failed - no success flag in response");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to export booking data",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleGeneratePDFReport = async () => {
    if (!bookingRef.trim()) {
      toast.error("Please enter a booking reference");
      return;
    }

    setIsGeneratingReport(true);
    try {
      console.log(
        `Generating PDF report for booking: ${bookingRef.trim().toUpperCase()}`,
      );

      const response = await fetch("/api/admin/bookings/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingRef: bookingRef.trim().toUpperCase(),
        }),
      });

      console.log(`PDF generation response status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = "Failed to generate PDF report";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
          if (error.details) {
            console.error("PDF generation error details:", error.details);
            errorMessage += ` (${error.details})`;
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get("content-type");
      console.log(`Response content type: ${contentType}`);

      if (!contentType || !contentType.includes("application/pdf")) {
        throw new Error("Server did not return a PDF file");
      }

      // Get the PDF blob and trigger download
      const pdfBlob = await response.blob();
      console.log(`PDF blob size: ${pdfBlob.size} bytes`);

      if (pdfBlob.size === 0) {
        throw new Error("Generated PDF is empty");
      }

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `booking-${bookingRef.trim().toUpperCase()}-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        `PDF report generated successfully for ${bookingRef.trim().toUpperCase()}`,
      );
      setBookingRef(""); // Clear the input
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate PDF report",
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleExportBookingData();
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2" />
              Reports & Analytics
            </h1>
            <p className="mt-2 text-gray-600">
              Track your business performance and insights
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error Loading Reports
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchReportData}>Try Again</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2" />
            Reports & Analytics
          </h1>
          <p className="mt-2 text-gray-600">
            Track your business performance and insights
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <Button onClick={handleExport} disabled={isLoading || !reportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
      ) : reportData ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      £{reportData.stats.revenue.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-2">
                      {reportData.revenueGrowth >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                      )}
                      <span
                        className={`text-sm font-medium ${reportData.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {reportData.revenueGrowth >= 0 ? "+" : ""}
                        {reportData.revenueGrowth}%
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        vs previous period
                      </span>
                    </div>
                  </div>
                  <PoundSterling className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      Total Bookings
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.stats.total}
                    </p>
                    <div className="flex items-center mt-2">
                      {reportData.bookingGrowth >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                      )}
                      <span
                        className={`text-sm font-medium ${reportData.bookingGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {reportData.bookingGrowth >= 0 ? "+" : ""}
                        {reportData.bookingGrowth}%
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        vs previous period
                      </span>
                    </div>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      Avg. Booking Value
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      £{reportData.averageBookingValue}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-500">
                        Based on all active bookings
                      </span>
                    </div>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      Most Popular Castle
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.stats.popularCastles &&
                      reportData.stats.popularCastles.length > 0
                        ? reportData.stats.popularCastles[0].castleName
                        : "No Data"}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-500">
                        {reportData.stats.popularCastles &&
                        reportData.stats.popularCastles.length > 0
                          ? `${reportData.stats.popularCastles[0].bookingCount} bookings`
                          : "No bookings found"}
                      </span>
                    </div>
                  </div>
                  <Trophy className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
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
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Legal Data Export
                    </h4>
                    <p className="text-sm text-blue-700">
                      Export all stored data for a specific booking including
                      agreement signatures, audit trails, and customer
                      information. Use this for legal compliance, dispute
                      resolution, or administrative purposes.
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
                      disabled={
                        isExporting || isGeneratingReport || !bookingRef.trim()
                      }
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
                      disabled={
                        isExporting || isGeneratingReport || !bookingRef.trim()
                      }
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
                    <h5 className="font-medium text-gray-900 mb-2">
                      Export Options:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 border border-gray-200 rounded p-3">
                        <div className="font-medium text-gray-900 mb-1">
                          📄 JSON Export
                        </div>
                        <div className="text-xs text-gray-600">
                          Raw data format for technical analysis and integration
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="font-medium text-gray-900 mb-1">
                          📊 PDF Report
                        </div>
                        <div className="text-xs text-gray-600">
                          Professional, human-readable report for review and
                          documentation
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">
                      Both formats include:
                    </h5>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Complete booking details and customer information</li>
                      <li>
                        Agreement signing data with IP address and timestamps
                      </li>
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

          {/* Vercel Web Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Web Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VercelAnalytics timeRange={timeRange} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Data Available
                </h3>
                <p className="text-gray-600">
                  No booking data found for the selected time period. Reports
                  will appear once bookings are created.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
