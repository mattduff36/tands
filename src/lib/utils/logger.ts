/**
 * Simple logging utility for Taylors & Smiths Bouncy Castle Hire
 * Replaces console.log statements with proper logging infrastructure
 */

class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  static info(message: string, meta?: Record<string, any>) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, meta || '');
    }
    // In production, send to logging service
  }

  static warn(message: string, meta?: Record<string, any>) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, meta || '');
    }
    // In production, send to logging service
  }

  static error(message: string, error?: Error, meta?: Record<string, any>) {
    console.error(`[ERROR] ${message}`, { error, ...meta });
    // In production, send to error tracking service
  }

  static debug(message: string, meta?: Record<string, any>) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  }

  // Specific categories for structured logging
  static audit(message: string, actor: string, meta?: Record<string, any>) {
    this.info(`[AUDIT] ${message} by ${actor}`, meta);
  }

  static business(message: string, meta?: Record<string, any>) {
    this.info(`[BUSINESS] ${message}`, meta);
  }

  static database(operation: string, durationMs: number, meta?: Record<string, any>) {
    this.debug(`[DB] ${operation} took ${durationMs.toFixed(2)}ms`, meta);
  }
}

// Export simple logger
export const log = Logger;