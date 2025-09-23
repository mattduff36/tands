"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  RefreshCw,
  Castle,
  ExternalLink,
  X,
  Home,
} from "lucide-react";

interface DashboardStats {
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  totalRevenue: number;
  availableCastles: number;
  maintenanceCastles: number;
  calendarStatus: "connected" | "disconnected" | "error";
}

interface RecentBooking {
  id: string;
  customerName: string;
  castleName: string;
  date: string;
  status: "confirmed" | "pending" | "complete";
  source: "database" | "calendar";
  totalPrice?: number;
}

interface CastleStatus {
  id: number;
  name: string;
  maintenanceStatus: "available" | "maintenance" | "unavailable";
  maintenanceNotes?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    weekBookings: 0,
    monthBookings: 0,
    totalRevenue: 0,
    availableCastles: 0,
    maintenanceCastles: 0,
    calendarStatus: "disconnected",
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [castleStatus, setCastleStatus] = useState<CastleStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch user info and dashboard data
  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/admin/auth?action=status");
      const data = await response.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  // Fetch dashboard data using the same patterns as other admin tabs
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch bookings (same as bookings tab)
      const bookingsResponse = await fetch("/api/admin/bookings");
      const bookingsData = await bookingsResponse.json();
      const allBookings = bookingsData.bookings || [];

      // Get recent bookings (first 5, excluding expired)
      const recent = allBookings
        .filter((booking: any) => booking.status !== "expired")
        .slice(0, 5)
        .map((booking: any) => ({
          id: booking.id,
          customerName: booking.customerName,
          castleName: booking.castleName,
          date: booking.date,
          status: booking.status,
          source: booking.source,
          totalPrice: booking.totalPrice,
        }));
      setRecentBookings(recent);

      // Calculate booking stats
      const today = new Date().toISOString().split("T")[0];
      const todayBookings = allBookings.filter(
        (b: any) => b.date === today,
      ).length;
      const weekBookings = allBookings.length; // Total for now
      const monthBookings = allBookings.length; // Total for now
      const totalRevenue = allBookings.reduce(
        (sum: number, b: any) => sum + (b.totalPrice || 0),
        0,
      );

      // Fetch fleet status (same as fleet tab)
      const fleetResponse = await fetch("/api/admin/fleet");
      const castles = await fleetResponse.json();

      const availableCastles = castles.filter(
        (castle: any) => castle.maintenanceStatus === "available",
      ).length;
      const maintenanceCastles = castles.filter(
        (castle: any) => castle.maintenanceStatus === "maintenance",
      ).length;

      setCastleStatus(
        castles.map((castle: any) => ({
          id: castle.id,
          name: castle.name,
          maintenanceStatus: castle.maintenanceStatus,
          maintenanceNotes: castle.maintenanceNotes,
        })),
      );

      // Check calendar status (same as calendar tab)
      let calendarStatus: "connected" | "disconnected" | "error" =
        "disconnected";
      try {
        const calendarResponse = await fetch("/api/admin/calendar");
        const calendarData = await calendarResponse.json();
        calendarStatus =
          calendarData.status === "connected" ? "connected" : "disconnected";
      } catch (error) {
        calendarStatus = "error";
      }

      setStats({
        todayBookings,
        weekBookings,
        monthBookings,
        totalRevenue,
        availableCastles,
        maintenanceCastles,
        calendarStatus,
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      case "confirmed":
        return (
          <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
            <CheckCircle className="w-3 h-3" /> Confirmed
          </Badge>
        );
      case "completed":
      case "complete": // Handle legacy status
        return (
          <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
            <CheckCircle className="w-3 h-3" /> Completed
          </Badge>
        );
      case "expired":
        return (
          <Badge className="flex items-center gap-1 bg-gray-600 text-gray-100 border-gray-500 hover:bg-gray-600">
            <X className="w-3 h-3" /> Expired
          </Badge>
        );
      default:
        return (
          <Badge className="flex items-center gap-1 bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100">
            <AlertCircle className="w-3 h-3" /> {status}
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "complete":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getMaintenanceColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-green-600 bg-green-100";
      case "maintenance":
        return "text-orange-600 bg-orange-100";
      case "unavailable":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Home className="w-6 h-6 mr-2" />
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.username || "Admin"}
          </p>
        </div>
        <div>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status */}
      {/* Desktop version - full width cards */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  stats.calendarStatus === "connected"
                    ? "bg-green-600"
                    : stats.calendarStatus === "error"
                      ? "bg-red-600"
                      : "bg-yellow-600"
                }`}
              ></div>
              <span className="text-sm font-medium">
                Google Calendar:{" "}
                {stats.calendarStatus === "connected" ? (
                  <span className="text-green-600 font-bold">Connected</span>
                ) : stats.calendarStatus === "error" ? (
                  <span className="text-red-600 font-bold">Error</span>
                ) : (
                  <span className="text-yellow-600 font-bold">
                    Disconnected
                  </span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-sm font-medium">
                Database:{" "}
                <span className="text-green-600 font-bold">Connected</span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm text-gray-500">
                {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              className="h-16 flex-col space-y-2 text-sm bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => router.push("/admin/bookings")}
            >
              <Calendar className="w-5 h-5" />
              <span>Bookings</span>
            </Button>
            <Button
              className="h-16 flex-col space-y-2 text-sm bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => router.push("/admin/fleet")}
            >
              <Castle className="w-5 h-5" />
              <span>Fleet</span>
            </Button>
            <Button
              className="h-16 flex-col space-y-2 text-sm bg-purple-500 hover:bg-purple-600 text-white"
              onClick={() => router.push("/admin/reports")}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Reports</span>
            </Button>
            <Button
              className="h-16 flex-col space-y-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-700"
              onClick={() => router.push("/admin/settings")}
            >
              <AlertCircle className="w-5 h-5" />
              <span>Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Bookings</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/bookings")}
              >
                View All
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h4 className="font-medium text-sm sm:text-base truncate">
                          {booking.customerName}
                        </h4>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {booking.castleName}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {new Date(booking.date).toLocaleDateString()}
                        </p>
                        {booking.totalPrice && (
                          <p className="text-xs font-medium text-green-600">
                            {formatCurrency(booking.totalPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent bookings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fleet Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fleet Status</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/fleet")}
              >
                Manage Fleet
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : castleStatus.length > 0 ? (
              <div className="space-y-3">
                {castleStatus.map((castle) => (
                  <div
                    key={castle.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{castle.name}</h4>
                      {castle.maintenanceNotes && (
                        <p className="text-xs text-gray-500 truncate">
                          {castle.maintenanceNotes}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getMaintenanceColor(castle.maintenanceStatus)}`}
                    >
                      {castle.maintenanceStatus === "available"
                        ? "Available"
                        : castle.maintenanceStatus === "maintenance"
                          ? "Maintenance"
                          : "Unavailable"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Castle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No castles found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
