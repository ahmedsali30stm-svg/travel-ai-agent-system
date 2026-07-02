# Rate Limiter

> Request rate limiting for web scraping operations.

---

## Overview

The Rate Limiter controls request rates to avoid detection and respect website limits.

---

## Rate Limiter Implementation

```typescript
interface RateLimiterConfig {
  // Rate limits
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  
  // Concurrency
  maxConcurrent: number;
  
  // Strategy
  strategy: 'fixed' | 'sliding' | 'token-bucket' | 'leaky-bucket';
  
  // Burst settings
  burstSize: number;
  burstInterval: number;
}

class RateLimiter {
  private config: RateLimiterConfig;
  private tokens: number;
  private lastRefill: number;
  private queue: (() => void)[];
  private active: number;
  
  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.tokens = config.burstSize;
    this.lastRefill = Date.now();
    this.queue = [];
    this.active = 0;
  }
  
  // Acquire permission to make request
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      // Check if we can proceed
      if (this.canProceed()) {
        this.consumeToken();
        resolve();
        return;
      }
      
      // Add to queue
      this.queue.push(() => {
        this.consumeToken();
        resolve();
      });
      
      // Process queue
      this.processQueue();
    });
  }
  
  // Check if we can proceed
  private canProceed(): boolean {
    // Check concurrency
    if (this.active >= this.config.maxConcurrent) {
      return false;
    }
    
    // Check tokens
    if (this.tokens <= 0) {
      return false;
    }
    
    return true;
  }
  
  // Consume token
  private consumeToken(): void {
    this.tokens--;
    this.active++;
  }
  
  // Release token
  release(): void {
    this.active--;
    this.processQueue();
  }
  
  // Process queue
  private processQueue(): void {
    while (this.queue.length > 0 && this.canProceed()) {
      const next = this.queue.shift()!;
      next();
    }
  }
  
  // Refill tokens
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    
    // Calculate tokens to add
    const tokensToAdd = Math.floor(elapsed / 1000) * this.config.requestsPerSecond;
    
    // Add tokens
    this.tokens = Math.min(
      this.config.burstSize,
      this.tokens + tokensToAdd
    );
    
    this.lastRefill = now;
  }
  
  // Start token refill
  startRefill(): void {
    setInterval(() => {
      this.refillTokens();
    }, 100);
  }
  
  // Get stats
  getStats(): RateLimiterStats {
    return {
      tokens: this.tokens,
      maxTokens: this.config.burstSize,
      queueLength: this.queue.length,
      active: this.active,
      maxConcurrent: this.config.maxConcurrent,
    };
  }
}

interface RateLimiterStats {
  tokens: number;
  maxTokens: number;
  queueLength: number;
  active: number;
  maxConcurrent: number;
}
```

---

## Token Bucket Algorithm

```typescript
class TokenBucket {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;
  
  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }
  
  // Try to consume tokens
  tryConsume(tokens: number): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  // Wait for tokens
  async waitForTokens(tokens: number): Promise<void> {
    while (!this.tryConsume(tokens)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Refill tokens
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    
    const tokensToAdd = (elapsed / 1000) * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    
    this.lastRefill = now;
  }
}
```

---

## Sliding Window Rate Limiter

```typescript
class SlidingWindowRateLimiter {
  private windowSize: number;
  private maxRequests: number;
  private requests: number[];
  
  constructor(windowSize: number, maxRequests: number) {
    this.windowSize = windowSize;
    this.maxRequests = maxRequests;
    this.requests = [];
  }
  
  // Try to acquire permission
  tryAcquire(): boolean {
    const now = Date.now();
    
    // Remove old requests
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowSize
    );
    
    // Check if we can proceed
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  // Wait for permission
  async acquire(): Promise<void> {
    while (!this.tryAcquire()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Get current count
  getCount(): number {
    const now = Date.now();
    return this.requests.filter(
      timestamp => now - timestamp < this.windowSize
    ).length;
  }
}
```

---

## Rate Limiter Configuration

```yaml
rateLimiter:
  # Rate limits
  requestsPerSecond: 10
  requestsPerMinute: 300
  requestsPerHour: 10000
  
  # Concurrency
  maxConcurrent: 5
  
  # Strategy
  strategy: token-bucket
  
  # Burst settings
  burstSize: 20
  burstInterval: 1000
```

---

## Rate Limiter Statistics

```typescript
interface RateLimiterStats {
  // Token info
  tokens: number;
  maxTokens: number;
  
  // Queue info
  queueLength: number;
  
  // Concurrency info
  active: number;
  maxConcurrent: number;
  
  // Performance
  avgWaitTime: number;
  totalRequests: number;
  rejectedRequests: number;
}
```
