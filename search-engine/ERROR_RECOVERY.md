# Error Recovery

> Comprehensive error handling and recovery system.

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
  
  // Provider errors
  PROVIDER_ERROR: 'PROVIDER_ERROR';
  RATE_LIMITED: 'RATE_LIMITED';
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR';
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED';
  
  // Data errors
  INVALID_DATA: 'INVALID_DATA';
  MISSING_DATA: 'MISSING_DATA';
  PARSE_ERROR: 'PARSE_ERROR';
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR';
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE';
  MEMORY_EXCEEDED: 'MEMORY_EXCEEDED';
}
```

---

## Retry Logic

```typescript
interface RetryManager {
  // Execute with retry
  executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T>;
  
  // Calculate retry delay
  calculateDelay(
    attempt: number,
    options: RetryOptions
  ): number;
  
  // Check if retryable error
  isRetryableError(error: Error): boolean;
}

interface RetryOptions {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

// Execute with retry
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      if (!isRetryableError(error, options.retryableErrors)) {
        throw error;
      }
      
      // Check if we have attempts left
      if (attempt === options.maxAttempts) {
        throw error;
      }
      
      // Calculate delay
      const delay = calculateDelay(attempt, options);
      
      // Call retry callback
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
      
      // Wait before retry
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// Calculate retry delay
function calculateDelay(
  attempt: number,
  options: RetryOptions
): number {
  // Exponential backoff
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  
  // Add jitter
  const jitter = delay * 0.1 * Math.random();
  
  // Cap at max delay
  return Math.min(delay + jitter, options.maxDelay);
}

// Check if error is retryable
function isRetryableError(
  error: Error,
  retryableErrors: string[]
): boolean {
  const errorType = getErrorType(error);
  return retryableErrors.includes(errorType);
}
```

---

## Circuit Breaker

```typescript
interface CircuitBreaker {
  // Execute with circuit breaker
  execute<T>(
    operation: () => Promise<T>,
    options: CircuitBreakerOptions
  ): Promise<T>;
  
  // Get circuit state
  getState(): CircuitState;
  
  // Reset circuit
  reset(): void;
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMax: number;
  onStateChange?: (state: CircuitState) => void;
}

type CircuitState = 'closed' | 'open' | 'half-open';

// Circuit breaker implementation
class CircuitBreakerImpl implements CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private options: CircuitBreakerOptions;
  
  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }
  
  async execute<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    // Check circuit state
    if (this.state === 'open') {
      // Check if reset timeout has passed
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
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
        if (this.successCount >= this.options.halfOpenMax) {
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
      
      if (this.failureCount >= this.options.failureThreshold) {
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

## Fallback Mechanisms

```typescript
interface FallbackManager {
  // Execute with fallback
  executeWithFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    options: FallbackOptions
  ): Promise<T>;
  
  // Chain multiple fallbacks
  chainFallbacks<T>(
    operations: (() => Promise<T>)[]
  ): Promise<T>;
}

interface FallbackOptions {
  timeout: number;
  onFallback?: (error: Error) => void;
}

// Execute with fallback
async function executeWithFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  options: FallbackOptions
): Promise<T> {
  try {
    // Try primary operation with timeout
    return await withTimeout(primary(), options.timeout);
  } catch (error) {
    // Log error
    console.error('Primary operation failed:', error);
    
    // Call fallback callback
    if (options.onFallback) {
      options.onFallback(error);
    }
    
    // Try fallback operation
    return await fallback();
  }
}

// Chain multiple fallbacks
async function chainFallbacks<T>(
  operations: (() => Promise<T>)[]
): Promise<T> {
  let lastError: Error;
  
  for (const operation of operations) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error('Operation failed:', error);
    }
  }
  
  throw lastError;
}

// With timeout helper
function withTimeout<T>(
  promise: Promise<T>,
  timeout: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    ),
  ]);
}
```

---

## Error Recovery Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ERROR RECOVERY PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         ERROR DETECTION                                    │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Network  │ │  Provider │ │  Data     │ │  System   │                │ │
│  │  │  Errors   │ │  Errors   │ │  Errors   │ │  Errors   │                │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      ERROR CLASSIFICATION                                   │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Retryable│ │  Transient│ │  Permanent│ │  Fatal    │                │ │
│  │  │  Errors   │ │  Errors   │ │  Errors   │ │  Errors   │                │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      RECOVERY STRATEGIES                                   │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Retry    │ │  Fallback │ │  Circuit  │ │  Graceful │                │ │
│  │  │  Logic    │ │  Providers│ │  Breaker  │ │  Degradation│               │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      RESULT RECOVERY                                       │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Partial  │ │  Cached   │ │  Default  │ │  Fallback │                │ │
│  │  │  Results  │ │  Results  │ │  Results  │ │  Results  │                │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Error Recovery Strategies

### 1. Provider Fallback Chain

```typescript
interface ProviderFallbackChain {
  // Define fallback chain
  chain: string[];
  
  // Execute with provider fallback
  executeWithFallback<T>(
    query: SearchQuery,
    options: FallbackOptions
  ): Promise<T>;
}

// Provider fallback chains
const PROVIDER_FALLBACK_CHAINS = {
  hotel_search: {
    primary: ['booking_com', 'agoda', 'expedia'],
    secondary: ['hotels_com', 'trip_com', 'hotelbeds'],
    fallback: ['rakuten', 'japanican'],
  },
  activity_search: {
    primary: ['viator', 'getyourguide'],
    secondary: ['klook', 'kkday'],
    fallback: [],
  },
};

// Execute with provider fallback
async function executeWithProviderFallback<T>(
  query: SearchQuery,
  options: FallbackOptions
): Promise<T> {
  const chain = PROVIDER_FALLBACK_CHAINS[query.type];
  
  // Try primary providers
  for (const provider of chain.primary) {
    try {
      return await searchProvider(provider, query);
    } catch (error) {
      console.error(`Provider ${provider} failed:`, error);
    }
  }
  
  // Try secondary providers
  for (const provider of chain.secondary) {
    try {
      return await searchProvider(provider, query);
    } catch (error) {
      console.error(`Provider ${provider} failed:`, error);
    }
  }
  
  // Try fallback providers
  for (const provider of chain.fallback) {
    try {
      return await searchProvider(provider, query);
    } catch (error) {
      console.error(`Provider ${provider} failed:`, error);
    }
  }
  
  throw new Error('All providers failed');
}
```

---

### 2. Graceful Degradation

```typescript
interface GracefulDegradation {
  // Execute with degradation
  executeWithDegradation<T>(
    operation: () => Promise<T>,
    degradationLevel: DegradationLevel
  ): Promise<T>;
}

type DegradationLevel = 'full' | 'reduced' | 'minimal' | 'cached';

// Graceful degradation
async function executeWithDegradation<T>(
  operation: () => Promise<T>,
  degradationLevel: DegradationLevel
): Promise<T> {
  try {
    // Try full operation
    return await operation();
  } catch (error) {
    // Apply degradation based on level
    switch (degradationLevel) {
      case 'reduced':
        // Try with reduced scope
        return await executeReduced(operation);
      case 'minimal':
        // Try with minimal scope
        return await executeMinimal(operation);
      case 'cached':
        // Return cached results
        return await getCachedResults();
      default:
        throw error;
    }
  }
}
```

---

### 3. Partial Results Recovery

```typescript
interface PartialResultsRecovery {
  // Recover partial results
  recoverPartialResults(
    results: SearchResult[],
    failedProviders: string[]
  ): SearchResult[];
  
  // Merge partial results
  mergePartialResults(
    partialResults: SearchResult[][]
  ): SearchResult[];
}

// Recover partial results
function recoverPartialResults(
  results: SearchResult[],
  failedProviders: string[]
): SearchResult[] {
  // If we have some results, return them
  if (results.length > 0) {
    return results;
  }
  
  // If no results, try to get from cache
  const cachedResults = getCachedResults();
  if (cachedResults.length > 0) {
    return cachedResults;
  }
  
  // If no cached results, return empty
  return [];
}

// Merge partial results
function mergePartialResults(
  partialResults: SearchResult[][]
): SearchResult[] {
  const allResults: SearchResult[] = [];
  
  for (const results of partialResults) {
    allResults.push(...results);
  }
  
  // Deduplicate
  return deduplicateResults(allResults);
}
```

---

## Error Recovery Configuration

```yaml
errorRecovery:
  # Enable error recovery
  enabled: true
  
  # Retry settings
  retry:
    maxAttempts: 3
    backoffMultiplier: 2
    initialDelay: 100
    maxDelay: 2000
    retryableErrors:
      - NETWORK_ERROR
      - TIMEOUT
      - RATE_LIMITED
      - SERVER_ERROR
  
  # Circuit breaker settings
  circuitBreaker:
    failureThreshold: 5
    resetTimeout: 60000
    halfOpenMax: 3
  
  # Fallback settings
  fallback:
    enabled: true
    timeout: 5000
    providers:
      hotel_search:
        primary:
          - booking_com
          - agoda
          - expedia
        secondary:
          - hotels_com
          - trip_com
          - hotelbeds
        fallback:
          - rakuten
          - japanican
  
  # Graceful degradation
  degradation:
    enabled: true
    levels:
      - full
      - reduced
      - minimal
      - cached
  
  # Partial results
  partialResults:
    enabled: true
    minResults: 1
    useCache: true
```
