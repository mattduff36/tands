import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";

import { getPoolStats } from "@/lib/database/connection";
import { performanceMonitor } from "@/lib/utils/performance-monitor";

export const dynamic = "force-dynamic";

// GET /api/admin/performance - Get database performance metrics
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    if (!allowedUsers.includes(session.user?.username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get database pool statistics
    const poolStats = getPoolStats();

    // Calculate pool utilization percentage
    const utilization =
      poolStats.maxConnections > 0
        ? ((poolStats.totalCount - poolStats.idleCount) /
            poolStats.maxConnections) *
          100
        : 0;

    // Determine pool health status
    let healthStatus = "healthy";
    if (utilization > 80) {
      healthStatus = "warning";
    }
    if (utilization > 95 || poolStats.waitingCount > 0) {
      healthStatus = "critical";
    }

    // Get performance monitoring data
    const performanceSummary = performanceMonitor.getSummary();

    const performanceData = {
      timestamp: new Date().toISOString(),
      database: {
        pool: {
          ...poolStats,
          utilization: Math.round(utilization * 100) / 100, // Round to 2 decimal places
          healthStatus,
        },
        recommendations: generateRecommendations(poolStats, utilization),
      },
      performance: {
        monitoring: performanceSummary,
        optimizations: {
          caching: {
            serverSide: "Implemented - /api/castles cached for 30min",
            clientSide:
              "Implemented - React Query with optimized cache durations",
          },
          database: {
            indexes:
              "Implemented - idx_bookings_status_date, idx_bookings_customer_email, idx_castles_maintenance_status",
            queries: "Optimized - Replaced SELECT * with specific columns",
            connectionPool: "Optimized - Production-ready pool settings",
          },
        },
      },
      system: {
        nodeEnv: process.env.NODE_ENV,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };

    // Set short cache since this is performance data
    const response = NextResponse.json(performanceData);
    response.headers.set("Cache-Control", "private, no-cache, must-revalidate");

    return response;
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance metrics" },
      { status: 500 },
    );
  }
}

// Generate recommendations based on pool statistics
function generateRecommendations(
  poolStats: any,
  utilization: number,
): string[] {
  const recommendations: string[] = [];

  if (utilization > 80) {
    recommendations.push(
      "High database connection utilization detected. Consider optimizing queries or increasing pool size.",
    );
  }

  if (poolStats.waitingCount > 0) {
    recommendations.push(
      `${poolStats.waitingCount} queries waiting for connections. Consider increasing max pool size.`,
    );
  }

  if (
    poolStats.idleCount === 0 &&
    poolStats.totalCount === poolStats.maxConnections
  ) {
    recommendations.push(
      "All connections in use. Pool may be under-sized for current load.",
    );
  }

  if (poolStats.idleCount > poolStats.maxConnections * 0.7) {
    recommendations.push(
      "Many idle connections. Consider reducing min pool size to save resources.",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Database connection pool is operating optimally.");
  }

  return recommendations;
}
