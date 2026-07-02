# Error Recovery

> Comprehensive error handling and recovery for web scraping operations.

---

## Overview

The Error Recovery module handles failures gracefully, providing retry logic, circuit breakers, and fallback mechanisms.

---

## Error Types

```typescript
interface ErrorType {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR';
  TIMEOUT: 'TIMEOUT';
  CONNECTION_REFUSED: 'CONNECTION_REFUSED';
  DNS_RESOLUTION: 'DNS_RESOLUTION';
  
  // Browser errors
  BROWSER_CRASH: 'BROWSER_CRASH';
  PAGE_CRASH: 'PAGE_CRASH';
  CONTEXT_CLOSED: 'CONTEXT_CLOSED';
  
  // Navigation errors
  NAVIGATION_TIMEOUT: 'NAVIGATION_TIMEOUT';
  NAVIGATION_FAILED: 'NAVIGATION_FAILED';
  REDIRECT_LOOP: 'REDIRECT_LOOP';
  
  // Element errors
  ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND';
  ELEMENT_NOT_VISIBLE: 'ELEMENT_NOT_VISIBLE';
  ELEMENT_NOT_INTERACTABLE: 'ELEMENT_NOT_INTERACTABLE';
  
  // Extraction errors
  EXTRACTION_FAILED: 'EXTRACTION_FAILED';
  INVALID_DATA: 'INVALID_DATA';
  MISSING_DATA: 'MISSING_DATA';
  
  // CAPTCHA errors
  CAPTCHA_DETECTED: 'CAPTCHA_DETECTED';
  CAPTCHA_FAILED: 'CAPTCHA_FAILED';
  
  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED';
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS';
  
  // Anti-bot
  BLOCKED: 'BLOCKED';
  DETECTED: 'DETECTED';
  FINGERPRINT_MISMATCH: 'FINGERPRINT_MISMATCH';
}
```

---

## Retry Logic

```typescript
interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      if (!config.retryableErrors.includes(error.type)) {
        throw error;
      }
      
      // Check if we have attempts left
      if (attempt === config.maxAttempts) {
        throw error;
      }
      
      // Calculate delay
      const delay = calculateDelay(attempt, config);
      
      // Wait before retry
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// Calculate retry delay
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  
  // Add jitter
  const jitter = delay * 0.1 * Math.random();
  
  // Cap at max delay
  return Math.min(delay + jitter, config.maxDelay);
}
```

---

## Circuit Breaker

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMax: number;
}

type CircuitState = 'closed' | 'open' | 'half-open';

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;
  
  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === 'open') {
      // Check if reset timeout has passed
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      
      // Handle success
      if (this.state === 'half-open') {
        this.successCount++;
        if (this.successCount >= this.config.halfOpenMax) {
          this.state = 'closed';
          this.failureCount = 0;
        }
      } else {
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      // Handle failure
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}
```

---

## Error Recovery Implementation

```typescript
interface ErrorRecoveryConfig {
  // Retry settings
  retry: RetryConfig;
  
  // Circuit breaker settings
  circuitBreaker: CircuitBreakerConfig;
  
  // Fallback settings
  fallback: {
    enabled: boolean;
    strategies: FallbackStrategy[];
  };
  
  // Recovery settings
  recovery: {
    maxRecoveryAttempts: number;
    recoveryDelay: number;
  };
}

interface FallbackStrategy {
  type: 'proxy-rotation' | 'user-agent-rotation' | 'delay' | 'alternative-url';
  config: any;
}

class ErrorRecovery {
  private config: ErrorRecoveryConfig;
  private circuitBreaker: CircuitBreaker;
  
  constructor(config: ErrorRecoveryConfig) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
  }
  
  // Execute with recovery
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    context: any
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      return retryWithBackoff(operation, this.config.retry);
    });
  }
  
  // Handle error
  async handleError(error: Error, context: any): Promise<void> {
    // Log error
    console.error('Error:', error.message);
    
    // Apply fallback strategies
    if (this.config.fallback.enabled) {
      for (const strategy of this.config.fallback.strategies) {
        try {
          await this.applyFallback(strategy, context);
          return;
        } catch (fallbackError) {
          continue;
        }
      }
    }
    
    // Re-throw if no fallback succeeded
    throw error;
  }
  
  // Apply fallback strategy
  private async applyFallback(
    strategy: FallbackStrategy,
    context: any
  ): Promise<void> {
    switch (strategy.type) {
      case 'proxy-rotation':
        await this.rotateProxy(context);
        break;
      case 'user-agent-rotation':
        await this.rotateUserAgent(context);
        break;
      case 'delay':
        await this.addDelay(strategy.config.delay);
        break;
      case 'alternative-url':
        await this.useAlternativeUrl(context, strategy.config.url);
        break;
    }
  }
  
  // Rotate proxy
  private async rotateProxy(context: any): Promise<void> {
    // This would integrate with the proxy rotator
    console.log('Rotating proxy...');
  }
  
  // Rotate user agent
  private async rotateUserAgent(context: any): Promise<void> {
    // This would change the user agent
    console.log('Rotating user agent...');
  }
  
  // Add delay
  private async addDelay(delay: number): Promise<void> {
    await sleep(delay);
  }
  
  // Use alternative URL
  private async useAlternativeUrl(context: any, url: string): Promise<void> {
    // This would navigate to an alternative URL
    console.log(`Using alternative URL: ${url}`);
  }
  
  // Get recovery stats
  getStats(): RecoveryStats {
    return {
      circuitBreakerState: this.circuitBreaker.getState(),
      failureCount: this.circuitBreaker['failureCount'],
    };
  }
}

interface RecoveryStats {
  circuitBreakerState: CircuitState;
  failureCount: number;
}
```

---

## Error Recovery Configuration

```yaml
errorRecovery:
  # Retry settings
  retry:
    maxAttempts: 3
    backoffMultiplier: 2
    initialDelay: 1000
    maxDelay: 10000
    retryableErrors:
      - NETWORK_ERROR
      - TIMEOUT
      - CONNECTION_REFUSED
      - NAVIGATION_TIMEOUT
      - ELEMENT_NOT_FOUND
  
  # Circuit breaker settings
  circuitBreaker:
    failureThreshold: 5
    resetTimeout: 60000
    halfOpenMax: 3
  
  # Fallback settings
  fallback:
    enabled: true
    strategies:
      - type: proxy-rotation
      - type: user-agent-rotation
      - type: delay
        config:
          delay: 5000
  
  # Recovery settings
  recovery:
    maxRecoveryAttempts: 3
    recoveryDelay: 5000
```
