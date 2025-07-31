/**
 * Structured logging utility for Taylors & Smiths Bouncy Castle Hire
 * Replaces console.log statements with proper logging infrastructure
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private static instance: Logger;
  private isDevelopment = process.env.NODE_ENV === 'development';
  private currentLevel = LogLevel.INFO;

  private constructor() {
    // Set log level based on environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG':
        this.currentLevel = LogLevel.DEBUG;
        break;
      case 'INFO':
        this.currentLevel = LogLevel.INFO;
        break;
      case 'WARN':
        this.currentLevel = LogLevel.WARN;
        break;
      case 'ERROR':
        this.currentLevel = LogLevel.ERROR;
        break;
      case 'SILENT':
        this.currentLevel = LogLevel.SILENT;
        break;
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(level: string, message: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (meta && Object.keys(meta).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(meta)}`;
    }
    
    return `${prefix} ${message}`;
  }

  private createLogEntry(level: string, message: string, meta?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    if (this.isDevelopment) {
      console.log(this.formatMessage('DEBUG', message, meta));
    }
    
    // In production, you could send to logging service here
    // e.g., await this.sendToLoggingService(this.createLogEntry('DEBUG', message, meta));
  }

  info(message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    if (this.isDevelopment) {
      console.log(this.formatMessage('INFO', message, meta));
    }
    
    // In production, you could send to logging service here
    // e.g., await this.sendToLoggingService(this.createLogEntry('INFO', message, meta));
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    if (this.isDevelopment) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
    
    // In production, you could send to logging service here
    // e.g., await this.sendToLoggingService(this.createLogEntry('WARN', message, meta));
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const logEntry = this.createLogEntry('ERROR', message, meta, error);
    
    // Always log errors to console in development
    if (this.isDevelopment) {
      console.error(this.formatMessage('ERROR', message, meta));
      if (error) {
        console.error('Error details:', error);
      }
    }
    
    // In production, always send errors to logging service
    // await this.sendToLoggingService(logEntry);
  }

  // Performance logging helpers
  performance(message: string, duration: number, meta?: Record<string, any>): void {
    this.info(message, { 
      ...meta, 
      duration: `${duration.toFixed(2)}ms`,
      type: 'performance' 
    });
  }

  // Database operation logging
  database(operation: string, duration: number, meta?: Record<string, any>): void {
    this.debug(`Database ${operation}`, {
      ...meta,
      duration: `${duration.toFixed(2)}ms`,
      type: 'database'
    });
  }

  // Business logic logging  
  business(event: string, meta?: Record<string, any>): void {
    this.info(`Business event: ${event}`, {
      ...meta,
      type: 'business'
    });
  }

  // Audit trail logging
  audit(action: string, actor: string, meta?: Record<string, any>): void {
    this.info(`Audit: ${action}`, {
      ...meta,
      actor,
      type: 'audit'
    });
  }

  // User action logging
  userAction(action: string, userId: string, meta?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      ...meta,
      userId,
      type: 'user_action'
    });
  }

  // Private method to send logs to external service (implement later)
  private async sendToLoggingService(logEntry: LogEntry): Promise<void> {
    // This would integrate with services like:
    // - Vercel Analytics
    // - Sentry
    // - LogRocket
    // - Custom logging endpoint
    
    // For now, just store the interface
    return Promise.resolve();
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions for easier migration from console.log
export const log = {
  debug: (message: string, meta?: Record<string, any>) => logger.debug(message, meta),
  info: (message: string, meta?: Record<string, any>) => logger.info(message, meta),
  warn: (message: string, meta?: Record<string, any>) => logger.warn(message, meta),
  error: (message: string, error?: Error, meta?: Record<string, any>) => logger.error(message, error, meta),
  performance: (message: string, duration: number, meta?: Record<string, any>) => logger.performance(message, duration, meta),
  database: (operation: string, duration: number, meta?: Record<string, any>) => logger.database(operation, duration, meta),
  business: (event: string, meta?: Record<string, any>) => logger.business(event, meta),
  audit: (action: string, actor: string, meta?: Record<string, any>) => logger.audit(action, actor, meta),
  userAction: (action: string, userId: string, meta?: Record<string, any>) => logger.userAction(action, userId, meta),
};