/**
 * Performance monitoring system for database operations
 * Tracks query performance, resource usage, and provides alerts
 */

import { RetryHelper } from '@/lib/utils/retry-helper';

// Performance metric types
export interface QueryMetrics {
  operationType: 'create' | 'read' | 'update' | 'delete' | 'query';
  duration: number;
  timestamp: string;
  success: boolean;
  recordCount?: number;
  error?: string;
  queryHash?: string;
}

export interface PerformanceStats {
  averageQueryTime: number;
  totalQueries: number;
  successRate: number;
  errorRate: number;
  slowQueries: QueryMetrics[];
  errorQueries: QueryMetrics[];
  peakHours: { hour: number; queryCount: number }[];
  resourceUsage: {
    memoryUsage: number;
    cpuUsage?: number;
    activeConnections?: number;
  };
}

export interface AlertConfig {
  slowQueryThreshold: number; // milliseconds
  errorRateThreshold: number; // percentage
  enableSlowQueryAlerts: boolean;
  enableErrorRateAlerts: boolean;
  alertCallback?: (alert: PerformanceAlert) => void;
}

export interface PerformanceAlert {
  type: 'slow_query' | 'high_error_rate' | 'resource_usage';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  metrics: any;
}

// Default configuration
const DEFAULT_CONFIG: AlertConfig = {
  slowQueryThreshold: 1000, // 1 second
  errorRateThreshold: 5, // 5%
  enableSlowQueryAlerts: true,
  enableErrorRateAlerts: true
};

/**
 * Performance Monitor class for database operations
 */
export class PerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private config: AlertConfig;
  private maxMetricsHistory = 10000; // Keep last 10k metrics
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTimer();
  }

  /**
   * Track a database operation
   */
  async trackOperation<T>(
    operationType: QueryMetrics['operationType'],
    operation: () => Promise<T>,
    context?: { queryHash?: string; expectedRecordCount?: number }
  ): Promise<T> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      // Determine record count if result is array-like
      let recordCount: number | undefined;
      if (result && typeof result === 'object') {
        if (Array.isArray(result)) {
          recordCount = result.length;
        } else if ('bookings' in result && Array.isArray((result as any).bookings)) {
          recordCount = (result as any).bookings.length;
        } else if ('total' in result) {
          recordCount = (result as any).total;
        }
      }

      // Record successful operation
      const metric: QueryMetrics = {
        operationType,
        duration,
        timestamp,
        success: true,
        recordCount,
        queryHash: context?.queryHash
      };

      this.addMetric(metric);
      this.checkForAlerts(metric);

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Record failed operation
      const metric: QueryMetrics = {
        operationType,
        duration,
        timestamp,
        success: false,
        error: error.message,
        queryHash: context?.queryHash
      };

      this.addMetric(metric);
      this.checkForAlerts(metric);

      throw error;
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  getPerformanceStats(timeRange?: { from: Date; to: Date }): PerformanceStats {
    let relevantMetrics = this.metrics;
    
    // Filter by time range if provided
    if (timeRange) {
      relevantMetrics = this.metrics.filter(metric => {
        const metricTime = new Date(metric.timestamp);
        return metricTime >= timeRange.from && metricTime <= timeRange.to;
      });
    }

    if (relevantMetrics.length === 0) {
      return {
        averageQueryTime: 0,
        totalQueries: 0,
        successRate: 100,
        errorRate: 0,
        slowQueries: [],
        errorQueries: [],
        peakHours: [],
        resourceUsage: {
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
        }
      };
    }

    // Calculate basic stats
    const totalQueries = relevantMetrics.length;
    const successfulQueries = relevantMetrics.filter(m => m.success).length;
    const successRate = (successfulQueries / totalQueries) * 100;
    const errorRate = 100 - successRate;

    // Calculate average query time
    const totalDuration = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageQueryTime = totalDuration / totalQueries;

    // Find slow queries
    const slowQueries = relevantMetrics
      .filter(m => m.duration > this.config.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10); // Top 10 slowest

    // Find error queries
    const errorQueries = relevantMetrics
      .filter(m => !m.success)
      .slice(-10); // Last 10 errors

    // Calculate peak hours
    const hourlyStats = new Map<number, number>();
    relevantMetrics.forEach(metric => {
      const hour = new Date(metric.timestamp).getHours();
      hourlyStats.set(hour, (hourlyStats.get(hour) || 0) + 1);
    });

    const peakHours = Array.from(hourlyStats.entries())
      .map(([hour, queryCount]) => ({ hour, queryCount }))
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 5); // Top 5 busiest hours

    // Get current resource usage
    const memoryUsage = process.memoryUsage();
    const resourceUsage = {
      memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
      cpuUsage: this.getCpuUsage()
    };

    return {
      averageQueryTime,
      totalQueries,
      successRate,
      errorRate,
      slowQueries,
      errorQueries,
      peakHours,
      resourceUsage
    };
  }

  /**
   * Get metrics for a specific operation type
   */
  getOperationStats(operationType: QueryMetrics['operationType']): Partial<PerformanceStats> {
    const operationMetrics = this.metrics.filter(m => m.operationType === operationType);
    
    if (operationMetrics.length === 0) {
      return { totalQueries: 0, successRate: 100, errorRate: 0, averageQueryTime: 0 };
    }

    const totalQueries = operationMetrics.length;
    const successfulQueries = operationMetrics.filter(m => m.success).length;
    const successRate = (successfulQueries / totalQueries) * 100;
    const errorRate = 100 - successRate;
    const averageQueryTime = operationMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;

    return {
      totalQueries,
      successRate,
      errorRate,
      averageQueryTime
    };
  }

  /**
   * Get recent performance alerts
   */
  getRecentAlerts(limit: number = 50): PerformanceAlert[] {
    // In a real implementation, you'd store alerts in a persistent store
    // For now, we'll generate alerts based on current metrics
    const alerts: PerformanceAlert[] = [];
    const recentMetrics = this.metrics.slice(-100); // Check last 100 operations

    // Check for slow queries
    const slowQueries = recentMetrics.filter(m => m.duration > this.config.slowQueryThreshold);
    slowQueries.forEach(metric => {
      alerts.push({
        type: 'slow_query',
        severity: metric.duration > this.config.slowQueryThreshold * 2 ? 'critical' : 'warning',
        message: `Slow query detected: ${metric.operationType} took ${metric.duration}ms`,
        timestamp: metric.timestamp,
        metrics: metric
      });
    });

    // Check error rate over last 20 operations
    const last20 = recentMetrics.slice(-20);
    if (last20.length >= 10) {
      const errorRate = (last20.filter(m => !m.success).length / last20.length) * 100;
      if (errorRate > this.config.errorRateThreshold) {
        alerts.push({
          type: 'high_error_rate',
          severity: errorRate > this.config.errorRateThreshold * 2 ? 'critical' : 'warning',
          message: `High error rate detected: ${errorRate.toFixed(1)}% over last 20 operations`,
          timestamp: new Date().toISOString(),
          metrics: { errorRate, sampleSize: last20.length }
        });
      }
    }

    return alerts.slice(-limit);
  }

  /**
   * Generate performance report
   */
  generateReport(timeRange?: { from: Date; to: Date }): {
    summary: PerformanceStats;
    operationBreakdown: Record<string, Partial<PerformanceStats>>;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const summary = this.getPerformanceStats(timeRange);
    
    const operationBreakdown = {
      create: this.getOperationStats('create'),
      read: this.getOperationStats('read'),
      update: this.getOperationStats('update'),
      delete: this.getOperationStats('delete'),
      query: this.getOperationStats('query')
    };

    const alerts = this.getRecentAlerts();
    const recommendations = this.generateRecommendations(summary, operationBreakdown);

    return {
      summary,
      operationBreakdown,
      alerts,
      recommendations
    };
  }

  /**
   * Clear all metrics (useful for testing or memory management)
   */
  clearMetrics(): void {
    this.metrics = [];
    console.log('📊 Performance metrics cleared');
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'operationType', 'duration', 'success', 'recordCount', 'error'];
      const csvRows = [headers.join(',')];
      
      this.metrics.forEach(metric => {
        const row = [
          metric.timestamp,
          metric.operationType,
          metric.duration.toString(),
          metric.success.toString(),
          (metric.recordCount || '').toString(),
          (metric.error || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    } else {
      return JSON.stringify(this.metrics, null, 2);
    }
  }

  /**
   * Shutdown the monitor (cleanup resources)
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    console.log('📊 Performance monitor shutdown');
  }

  /**
   * Add a metric to the collection
   */
  private addMetric(metric: QueryMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics to prevent memory issues
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-Math.floor(this.maxMetricsHistory * 0.8));
    }
  }

  /**
   * Check for performance alerts
   */
  private checkForAlerts(metric: QueryMetrics): void {
    // Check for slow query alert
    if (this.config.enableSlowQueryAlerts && metric.duration > this.config.slowQueryThreshold) {
      const alert: PerformanceAlert = {
        type: 'slow_query',
        severity: metric.duration > this.config.slowQueryThreshold * 2 ? 'critical' : 'warning',
        message: `Slow query detected: ${metric.operationType} took ${metric.duration}ms`,
        timestamp: metric.timestamp,
        metrics: metric
      };

      if (this.config.alertCallback) {
        this.config.alertCallback(alert);
      }

      console.warn(`⚠️ ${alert.message}`);
    }

    // Check error rate (based on last 20 operations)
    if (this.config.enableErrorRateAlerts && this.metrics.length >= 10) {
      const recent = this.metrics.slice(-20);
      const errorRate = (recent.filter(m => !m.success).length / recent.length) * 100;
      
      if (errorRate > this.config.errorRateThreshold) {
        const alert: PerformanceAlert = {
          type: 'high_error_rate',
          severity: errorRate > this.config.errorRateThreshold * 2 ? 'critical' : 'warning',
          message: `High error rate: ${errorRate.toFixed(1)}% over last ${recent.length} operations`,
          timestamp: new Date().toISOString(),
          metrics: { errorRate, sampleSize: recent.length }
        };

        if (this.config.alertCallback) {
          this.config.alertCallback(alert);
        }

        console.warn(`⚠️ ${alert.message}`);
      }
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    summary: PerformanceStats, 
    operationBreakdown: Record<string, Partial<PerformanceStats>>
  ): string[] {
    const recommendations: string[] = [];

    // Check average query time
    if (summary.averageQueryTime > 500) {
      recommendations.push('Consider optimizing queries - average query time is high');
    }

    // Check error rate
    if (summary.errorRate > 2) {
      recommendations.push('Investigate error causes - error rate is above acceptable threshold');
    }

    // Check slow queries
    if (summary.slowQueries.length > 5) {
      recommendations.push('Multiple slow queries detected - consider adding database indexes or query optimization');
    }

    // Check memory usage
    if (summary.resourceUsage.memoryUsage > 100) {
      recommendations.push('High memory usage detected - consider optimizing data structures or implementing pagination');
    }

    // Check operation-specific issues
    Object.entries(operationBreakdown).forEach(([operation, stats]) => {
      if (stats.averageQueryTime && stats.averageQueryTime > 1000) {
        recommendations.push(`${operation} operations are particularly slow - focus optimization efforts here`);
      }
    });

    return recommendations;
  }

  /**
   * Get CPU usage percentage (simplified)
   */
  private getCpuUsage(): number {
    const usage = process.cpuUsage();
    return (usage.user + usage.system) / 1000000; // Convert to seconds
  }

  /**
   * Start cleanup timer to manage memory
   */
  private startCleanupTimer(): void {
    // Clean up old metrics every hour
    this.cleanupInterval = setInterval(() => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const initialCount = this.metrics.length;
      
      this.metrics = this.metrics.filter(metric => {
        return new Date(metric.timestamp).getTime() > oneHourAgo;
      });

      const cleaned = initialCount - this.metrics.length;
      if (cleaned > 0) {
        console.log(`📊 Cleaned up ${cleaned} old performance metrics`);
      }
    }, 60 * 60 * 1000); // Every hour
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Wrapper function to easily track database operations
 */
export async function trackDbOperation<T>(
  operationType: QueryMetrics['operationType'],
  operation: () => Promise<T>,
  context?: { queryHash?: string; expectedRecordCount?: number }
): Promise<T> {
  return await performanceMonitor.trackOperation(operationType, operation, context);
}

/**
 * Get current performance statistics
 */
export function getPerformanceStats(timeRange?: { from: Date; to: Date }): PerformanceStats {
  return performanceMonitor.getPerformanceStats(timeRange);
}

/**
 * Generate and log a performance report
 */
export function logPerformanceReport(): void {
  const report = performanceMonitor.generateReport();
  
  console.log('📊 Performance Report:', {
    summary: {
      totalQueries: report.summary.totalQueries,
      averageQueryTime: `${report.summary.averageQueryTime.toFixed(2)}ms`,
      successRate: `${report.summary.successRate.toFixed(1)}%`,
      errorRate: `${report.summary.errorRate.toFixed(1)}%`
    },
    alerts: report.alerts.length,
    recommendations: report.recommendations.length
  });

  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:', report.recommendations);
  }
}