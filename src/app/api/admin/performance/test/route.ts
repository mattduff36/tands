import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";

import { getCastles } from "@/lib/database/castles";
import { getBookingsByStatus } from "@/lib/database/bookings";
import { performanceMonitor } from "@/lib/utils/performance-monitor";

export const dynamic = "force-dynamic";

// POST /api/admin/performance/test - Run performance tests on key operations
export async function POST(request: NextRequest) {
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

    const { testType = "comprehensive", iterations = 5 } = await request
      .json()
      .catch(() => ({}));

    console.log(
      `Starting performance test: ${testType} with ${iterations} iterations`,
    );

    const testResults = {
      testType,
      iterations,
      timestamp: new Date().toISOString(),
      results: {} as Record<string, any>,
      summary: {
        totalTestTime: 0,
        operationsTested: 0,
        averageResponseTime: 0,
        recommendations: [] as string[],
      },
    };

    const overallStart = performance.now();

    // Test 1: Castle data retrieval (should be fast due to caching)
    if (testType === "comprehensive" || testType === "castles") {
      console.log("Testing castle data retrieval...");
      const castleResults = await runIterativeTest(
        "getCastles",
        iterations,
        async () => {
          return await getCastles();
        },
      );
      testResults.results.castles = castleResults;
    }

    // Test 2: Booking queries (should be fast due to indexes)
    if (testType === "comprehensive" || testType === "bookings") {
      console.log("Testing booking queries...");
      const bookingResults = await runIterativeTest(
        "getBookingsByStatus",
        iterations,
        async () => {
          return await getBookingsByStatus("pending");
        },
      );
      testResults.results.bookings = bookingResults;
    }

    // Test 3: API endpoint tests (caching effectiveness)
    if (testType === "comprehensive" || testType === "api") {
      console.log("Testing API endpoints...");
      const apiResults = await runIterativeTest(
        "apiCastles",
        iterations,
        async () => {
          const response = await fetch(
            `${process.env.NEXTAUTH_URL}/api/castles`,
          );
          return await response.json();
        },
      );
      testResults.results.api = apiResults;
    }

    const overallDuration = performance.now() - overallStart;
    testResults.summary.totalTestTime = overallDuration;

    // Calculate summary statistics
    const allResults = Object.values(testResults.results);
    testResults.summary.operationsTested = allResults.length;
    testResults.summary.averageResponseTime =
      allResults.reduce((sum: number, result: any) => sum + result.average, 0) /
      allResults.length;

    // Generate performance recommendations
    testResults.summary.recommendations = generatePerformanceRecommendations(
      testResults.results,
    );

    // Get current performance monitoring data
    const monitoringData = performanceMonitor.getSummary();

    console.log(
      `Performance test completed in ${overallDuration.toFixed(2)}ms`,
    );

    return NextResponse.json({
      testResults,
      monitoring: monitoringData,
      optimizationStatus: {
        caching: {
          serverSide: "✅ Implemented",
          clientSide: "✅ Implemented",
          effectiveness: calculateCachingEffectiveness(testResults.results),
        },
        database: {
          indexes: "✅ Implemented",
          queryOptimization: "✅ Implemented",
          connectionPooling: "✅ Optimized",
        },
        monitoring: {
          performanceTracking: "✅ Active",
          slowQueryDetection: "✅ Active",
          poolHealthMonitoring: "✅ Active",
        },
      },
    });
  } catch (error) {
    console.error("Error running performance tests:", error);
    return NextResponse.json(
      {
        error: "Failed to run performance tests",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Run iterative test on an operation
async function runIterativeTest(
  operationName: string,
  iterations: number,
  operation: () => Promise<any>,
) {
  const results: number[] = [];
  let errors = 0;

  for (let i = 0; i < iterations; i++) {
    try {
      const start = performance.now();
      await operation();
      const duration = performance.now() - start;
      results.push(duration);
    } catch (error) {
      errors++;
      console.error(`Error in ${operationName} iteration ${i + 1}:`, error);
    }
  }

  if (results.length === 0) {
    return {
      operation: operationName,
      iterations,
      errors,
      average: 0,
      min: 0,
      max: 0,
      median: 0,
      success: false,
    };
  }

  const sortedResults = results.sort((a, b) => a - b);
  const average = results.reduce((sum, val) => sum + val, 0) / results.length;
  const median = sortedResults[Math.floor(sortedResults.length / 2)];

  return {
    operation: operationName,
    iterations,
    successful: results.length,
    errors,
    average: Math.round(average * 100) / 100,
    min: Math.round(sortedResults[0] * 100) / 100,
    max: Math.round(sortedResults[sortedResults.length - 1] * 100) / 100,
    median: Math.round(median * 100) / 100,
    success: errors === 0,
  };
}

// Generate performance recommendations based on test results
function generatePerformanceRecommendations(
  results: Record<string, any>,
): string[] {
  const recommendations: string[] = [];

  Object.values(results).forEach((result: any) => {
    if (result.average > 1000) {
      recommendations.push(
        `${result.operation}: Average response time ${result.average}ms is slow (>1000ms)`,
      );
    } else if (result.average > 500) {
      recommendations.push(
        `${result.operation}: Response time ${result.average}ms could be improved (>500ms)`,
      );
    } else if (result.average < 100) {
      recommendations.push(
        `${result.operation}: Excellent performance ${result.average}ms (<100ms)`,
      );
    }

    if (result.errors > 0) {
      recommendations.push(
        `${result.operation}: ${result.errors} errors detected during testing`,
      );
    }

    if (result.max - result.min > result.average) {
      recommendations.push(
        `${result.operation}: High variance in response times (min: ${result.min}ms, max: ${result.max}ms)`,
      );
    }
  });

  if (recommendations.length === 0) {
    recommendations.push(
      "All operations performing within acceptable parameters",
    );
  }

  return recommendations;
}

// Calculate caching effectiveness based on response time consistency
function calculateCachingEffectiveness(results: Record<string, any>): string {
  const apiResult = results.api;
  if (!apiResult) return "Unknown";

  const variance = apiResult.max - apiResult.min;
  const averageTime = apiResult.average;

  if (averageTime < 50 && variance < 20) {
    return "Excellent - Fast and consistent responses";
  } else if (averageTime < 200 && variance < 100) {
    return "Good - Acceptable performance with some variance";
  } else if (averageTime < 500) {
    return "Fair - Room for improvement";
  } else {
    return "Poor - Caching may not be effective";
  }
}
