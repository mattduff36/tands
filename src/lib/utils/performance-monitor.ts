/**
 * Performance monitoring utility for measuring async operations
 * Tracks timing, memory usage, and provides performance insights
 */

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  memoryUsage?: NodeJS.MemoryUsage;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  operation: string;
  totalCalls: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastCalled: Date;
  totalDuration: number;
  percentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private maxMetricsPerOperation = 1000; // Prevent memory leaks

  /**
   * Start timing an operation
   */
  startTimer(operation: string, metadata?: Record<string, any>) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        const endMemory = process.memoryUsage();
        
        this.recordMetric({
          operation,
          duration,
          timestamp: new Date(),
          memoryUsage: {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            external: endMemory.external - startMemory.external,
            arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
          },
          metadata
        });
        
        return duration;
      }
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric) {
    if (!this.metrics.has(metric.operation)) {
      this.metrics.set(metric.operation, []);
    }
    
    const operationMetrics = this.metrics.get(metric.operation)!;
    operationMetrics.push(metric);
    
    // Prevent memory leaks by keeping only recent metrics
    if (operationMetrics.length > this.maxMetricsPerOperation) {
      operationMetrics.shift();
    }
  }

  /**
   * Get performance report for a specific operation
   */
  getReport(operation: string): PerformanceReport | null {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    return {
      operation,
      totalCalls: metrics.length,
      averageDuration: totalDuration / metrics.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      lastCalled: metrics[metrics.length - 1].timestamp,
      totalDuration,
      percentiles: {
        p50: this.getPercentile(durations, 50),
        p95: this.getPercentile(durations, 95),
        p99: this.getPercentile(durations, 99),
      }
    };
  }

  /**
   * Get all performance reports
   */
  getAllReports(): PerformanceReport[] {
    const reports: PerformanceReport[] = [];
    
    for (const operation of this.metrics.keys()) {
      const report = this.getReport(operation);
      if (report) {
        reports.push(report);
      }
    }
    
    return reports.sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * Get performance summary with recommendations
   */
  getSummary() {
    const reports = this.getAllReports();
    const recommendations: string[] = [];
    
    // Analyze performance and generate recommendations
    reports.forEach(report => {
      if (report.averageDuration > 5000) {
        recommendations.push(`${report.operation}: Average duration ${report.averageDuration.toFixed(2)}ms is very slow (>5s)`);
      } else if (report.averageDuration > 1000) {
        recommendations.push(`${report.operation}: Average duration ${report.averageDuration.toFixed(2)}ms could be optimized (>1s)`);
      }
      
      if (report.percentiles.p95 > report.averageDuration * 2) {
        recommendations.push(`${report.operation}: High variance in performance (P95: ${report.percentiles.p95.toFixed(2)}ms)`);
      }
    });

    return {
      timestamp: new Date().toISOString(),
      totalOperations: reports.length,
      totalCalls: reports.reduce((sum, r) => sum + r.totalCalls, 0),
      reports: reports.slice(0, 10), // Top 10 by call count
      recommendations: recommendations.length > 0 ? recommendations : ['All operations performing within acceptable limits'],
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * Measure an async operation
   */
  async measure<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const timer = this.startTimer(operation, metadata);
    try {
      const result = await fn();
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper function for measuring database operations
export async function measureDatabaseOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return performanceMonitor.measure(`db:${operation}`, fn, metadata);
}

// Helper function for measuring API operations
export async function measureApiOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return performanceMonitor.measure(`api:${operation}`, fn, metadata);
}