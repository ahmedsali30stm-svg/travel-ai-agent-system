import { config } from '../config/index.js';
import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'CircuitBreaker' });

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private options: CircuitBreakerOptions;

  constructor(options?: Partial<CircuitBreakerOptions>) {
    this.options = {
      failureThreshold: options?.failureThreshold || 5,
      resetTimeout: options?.resetTimeout || 60000, // 1 minute
      monitoringPeriod: options?.monitoringPeriod || 10000, // 10 seconds
    };
  }

  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        logger.info('Circuit breaker transitioning to HALF_OPEN');
      } else {
        if (fallback) {
          logger.info('Circuit breaker OPEN, using fallback');
          return fallback();
        }
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        logger.info('Request failed, using fallback');
        return fallback();
      }
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      logger.info('Circuit breaker CLOSED');
    }
    this.successCount++;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.warn({
        failureCount: this.failureCount,
        threshold: this.options.failureThreshold,
      }, 'Circuit breaker OPEN');
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    logger.info('Circuit breaker reset');
  }
}

export class RetryStrategy {
  private maxRetries: number;
  private delay: number;
  private backoff: number;

  constructor(options?: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
  }) {
    this.maxRetries = options?.maxRetries || 3;
    this.delay = options?.delay || 1000;
    this.backoff = options?.backoff || 2;
  }

  async execute<T>(
    fn: () => Promise<T>,
    shouldRetry?: (error: Error) => boolean
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.maxRetries) {
          const shouldRetryFn = shouldRetry || (() => true);
          if (shouldRetryFn(lastError)) {
            const delay = this.delay * Math.pow(this.backoff, attempt);
            logger.debug({
              attempt: attempt + 1,
              maxRetries: this.maxRetries,
              delay,
            }, 'Retrying after delay');
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw lastError;
          }
        }
      }
    }
    
    throw lastError;
  }
}

export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<boolean> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  async wait(): Promise<void> {
    while (!(await this.acquire())) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  getStats() {
    const now = Date.now();
    const activeRequests = this.requests.filter(
      time => now - time < this.windowMs
    ).length;
    
    return {
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      activeRequests,
      available: this.maxRequests - activeRequests,
    };
  }
}
