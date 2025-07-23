// Retry utility for Google API calls with exponential backoff
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export class RetryHelper {
  private static defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    retryableStatusCodes: [429, 500, 502, 503, 504]
  };

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error = new Error('Unknown error');
    let attempt = 0;
    const startTime = Date.now();

    for (attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ Operation succeeded on attempt ${attempt}/${opts.maxAttempts}`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        const isRetryable = this.isRetryableError(error as Error, opts.retryableStatusCodes);
        const isLastAttempt = attempt === opts.maxAttempts;
        
        console.error(`❌ Attempt ${attempt}/${opts.maxAttempts} failed:`, {
          error: lastError.message,
          retryable: isRetryable,
          isLastAttempt
        });

        // Don't retry if error is not retryable or this is the last attempt
        if (!isRetryable || isLastAttempt) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
          opts.maxDelay
        );

        console.log(`⏳ Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // All attempts failed
    const totalTime = Date.now() - startTime;
    console.error(`🚫 All ${opts.maxAttempts} attempts failed after ${totalTime}ms`);
    
    throw new Error(
      `Operation failed after ${opts.maxAttempts} attempts. Last error: ${lastError.message}`
    );
  }

  static async withRetryResult<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let attempts = 0;

    try {
      const result = await this.withRetry(operation, options);
      return {
        success: true,
        data: result,
        attempts: attempts + 1,
        totalTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        attempts: options.maxAttempts || this.defaultOptions.maxAttempts,
        totalTime: Date.now() - startTime
      };
    }
  }

  private static isRetryableError(error: Error, retryableStatusCodes: number[]): boolean {
    // Check for Google API specific errors
    const googleApiError = error as any;
    
    // Rate limiting (quota exceeded)
    if (googleApiError.code === 429 || 
        googleApiError.message?.includes('Quota exceeded') ||
        googleApiError.message?.includes('Rate Limit Exceeded')) {
      return true;
    }

    // Server errors
    if (retryableStatusCodes.includes(googleApiError.code)) {
      return true;
    }

    // Network/connection errors
    if (error.message?.includes('ECONNRESET') ||
        error.message?.includes('ENOTFOUND') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('timeout')) {
      return true;
    }

    // Google API temporary errors
    if (error.message?.includes('Backend Error') ||
        error.message?.includes('Internal error') ||
        error.message?.includes('Service temporarily unavailable')) {
      return true;
    }

    return false;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Rate limiting utility
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxRequests: number = 100, timeWindowSeconds: number = 100) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowSeconds * 1000;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Remove requests older than time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest) + 100; // Add small buffer
      
      if (waitTime > 0) {
        console.log(`⏳ Rate limit reached. Waiting ${waitTime}ms...`);
        await RetryHelper['sleep'](waitTime);
      }
    }
    
    this.requests.push(now);
  }
}

// Circuit breaker pattern for API resilience
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly successThreshold: number = 2
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker transitioning to HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN - operation not allowed');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.failures = 0;
        this.state = 'CLOSED';
        console.log('✅ Circuit breaker reset to CLOSED');
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        console.error('🚨 Circuit breaker OPEN - too many failures');
      }

      throw error;
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
    console.log('🔄 Circuit breaker manually reset');
  }
}