/**
 * Structured logging utility for Taylors & Smiths Bouncy Castle Hire
 * Provides robust, production-ready logging with multiple levels and categories
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  category?: string;
  metadata?: Record<string, any>;
  error?: Error;
  correlationId?: string;
}

class StructuredLogger {
  private minLogLevel: LogLevel;
  private isDevelopment: boolean;
  private correlationId?: string;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.minLogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLogLevel;
  }

  private formatMessage(level: string, message: string, category?: string): string {
    const timestamp = new Date().toISOString();
    const categoryStr = category ? `[${category}]` : '';
    return `${timestamp} [${level}]${categoryStr} ${message}`;
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    category?: string, 
    metadata?: Record<string, any>, 
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      category,
      metadata,
      error,
      correlationId: this.correlationId,
    };
  }

  private outputLog(entry: LogEntry) {
    const formattedMessage = this.formatMessage(entry.level, entry.message, entry.category);
    
    switch (entry.level) {
      case 'DEBUG':
        if (this.shouldLog(LogLevel.DEBUG)) {
          console.debug(formattedMessage, entry.metadata);
        }
        break;
      case 'INFO':
        if (this.shouldLog(LogLevel.INFO)) {
          console.log(formattedMessage, entry.metadata);
        }
        break;
      case 'WARN':
        if (this.shouldLog(LogLevel.WARN)) {
          console.warn(formattedMessage, entry.metadata);
        }
        break;
      case 'ERROR':
        if (this.shouldLog(LogLevel.ERROR)) {
          console.error(formattedMessage, { ...entry.metadata, error: entry.error });
        }
        break;
    }

    // In production, you could send to external logging service here
    if (!this.isDevelopment && entry.level === 'ERROR') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    }
  }

  setCorrelationId(id: string) {
    this.correlationId = id;
  }

  clearCorrelationId() {
    this.correlationId = undefined;
  }

  debug(message: string, metadata?: Record<string, any>, category?: string) {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, category, metadata);
    this.outputLog(entry);
  }

  info(message: string, metadata?: Record<string, any>, category?: string) {
    const entry = this.createLogEntry(LogLevel.INFO, message, category, metadata);
    this.outputLog(entry);
  }

  warn(message: string, metadata?: Record<string, any>, category?: string) {
    const entry = this.createLogEntry(LogLevel.WARN, message, category, metadata);
    this.outputLog(entry);
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, any>, category?: string) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const entry = this.createLogEntry(LogLevel.ERROR, message, category, metadata, errorObj);
    this.outputLog(entry);
  }

  // Specialized logging methods for different contexts
  database(operation: string, duration: number, metadata?: Record<string, any>) {
    this.debug(`Database operation: ${operation} completed in ${duration}ms`, 
      { ...metadata, duration, operation }, 'DATABASE');
  }

  api(method: string, path: string, statusCode: number, duration: number, metadata?: Record<string, any>) {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = `${method} ${path} - ${statusCode} (${duration}ms)`;
    
    if (level === LogLevel.WARN) {
      this.warn(message, { ...metadata, method, path, statusCode, duration }, 'API');
    } else {
      this.info(message, { ...metadata, method, path, statusCode, duration }, 'API');
    }
  }

  business(event: string, actor: string, metadata?: Record<string, any>) {
    this.info(`Business event: ${event}`, { ...metadata, actor }, 'BUSINESS');
  }

  audit(action: string, actor: string, resource: string, metadata?: Record<string, any>) {
    this.info(`Audit: ${actor} performed ${action} on ${resource}`, 
      { ...metadata, action, actor, resource }, 'AUDIT');
  }

  performance(operation: string, duration: number, metadata?: Record<string, any>) {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
    const message = `Performance: ${operation} took ${duration}ms`;
    
    if (level === LogLevel.WARN) {
      this.warn(message, { ...metadata, operation, duration }, 'PERFORMANCE');
    } else {
      this.debug(message, { ...metadata, operation, duration }, 'PERFORMANCE');
    }
  }
}

// Export singleton instance
export const logger = new StructuredLogger();

// For backward compatibility
export const log = logger;