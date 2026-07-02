import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'RateLimiter' });

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: any) => string;
  skip?: (req: any) => boolean;
  handler?: (req: any, res: any) => void;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private options: Required<RateLimiterOptions>;

  constructor(options: RateLimiterOptions) {
    this.options = {
      windowMs: options.windowMs,
      maxRequests: options.maxRequests,
      message: options.message || 'Too many requests, please try again later.',
      keyGenerator: options.keyGenerator || ((req: any) => req.ip || 'unknown'),
      skip: options.skip || (() => false),
      handler: options.handler || ((req: any, res: any) => {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: this.options.message,
          },
        });
      }),
    };

    // Cleanup expired records every minute
    setInterval(() => this.cleanup(), 60000);
  }

  middleware() {
    return (req: any, res: any, next: any) => {
      if (this.options.skip(req)) {
        return next();
      }

      const key = this.options.keyGenerator(req);
      const now = Date.now();

      let record = this.store.get(key);

      if (!record || now > record.resetTime) {
        record = {
          count: 0,
          resetTime: now + this.options.windowMs,
        };
      }

      record.count++;

      if (record.count > this.options.maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return this.options.handler(req, res);
      }

      this.store.set(key, record);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', this.options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.options.maxRequests - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

      next();
    };
  }

  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    let record = this.store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + this.options.windowMs,
      };
    }

    const allowed = record.count < this.options.maxRequests;
    const remaining = Math.max(0, this.options.maxRequests - record.count);

    if (allowed) {
      record.count++;
      this.store.set(key, record);
    }

    return {
      allowed,
      remaining,
      resetTime: record.resetTime,
    };
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  resetAll(): void {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  getStats(): {
    totalKeys: number;
    activeKeys: number;
  } {
    const now = Date.now();
    let activeKeys = 0;

    for (const record of this.store.values()) {
      if (now <= record.resetTime) {
        activeKeys++;
      }
    }

    return {
      totalKeys: this.store.size,
      activeKeys,
    };
  }
}

// Pre-configured rate limiters
export const apiLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many API requests, please try again later.',
});

export const searchLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  message: 'Too many search requests, please try again later.',
});

export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later.',
});
