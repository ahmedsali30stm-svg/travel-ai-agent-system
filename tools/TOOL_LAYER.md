# Tool Abstraction Layer

## Overview

Complete tool abstraction layer for the Travel AI Agent System. Provides unified interfaces, error handling, rate limiting, caching, and fallback mechanisms for all external integrations.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Tool Abstraction Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Browser   │  │   HTTP      │  │   APIs      │            │
│  │  Playwright │  │  Client     │  │  Clients    │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                     │
│  ┌──────▼────────────────▼────────────────▼──────┐            │
│  │              Tool Manager                       │            │
│  │  • Request Routing                              │            │
│  │  • Rate Limiting                                │            │
│  │  • Circuit Breaking                             │            │
│  │  • Retry Logic                                  │            │
│  │  • Cache Management                             │            │
│  │  • Authentication                               │            │
│  │  • Error Handling                               │            │
│  │  • Monitoring                                   │            │
│  └─────────────────────┬───────────────────────────┘            │
│                        │                                        │
│  ┌─────────────────────▼───────────────────────────┐            │
│  │              External Services                   │            │
│  │  • Hotel APIs  • Activity APIs  • Maps APIs     │            │
│  │  • Flight APIs • Search APIs    • Web Scraping  │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Tool Categories

| Category | Tools | Purpose |
|----------|-------|---------|
| **Browser Automation** | Playwright, Browser | Web scraping, form filling, screenshots |
| **HTTP Client** | HTTP, REST APIs | API calls, web requests |
| **Maps & Location** | Google Maps, OpenStreetMap | Geocoding, routing, places |
| **Hotel Search** | Hotelbeds, Booking.com, Agoda, Expedia, Trip.com, Hotels.com | Hotel availability, pricing, booking |
| **Activities & Tours** | Viator, GetYourGuide, KKday, Klook | Tours, activities, attractions |

## Tool Registry

```yaml
ToolRegistry:
  tools:
    playwright:
      category: browser
      version: "1.42.0"
      priority: 1
      enabled: true
    browser:
      category: browser
      version: "1.0.0"
      priority: 2
      enabled: true
    http:
      category: http
      version: "1.0.0"
      priority: 1
      enabled: true
    rest_apis:
      category: http
      version: "1.0.0"
      priority: 2
      enabled: true
    google_maps:
      category: maps
      version: "3.0.0"
      priority: 1
      enabled: true
    hotelbeds:
      category: hotel
      version: "3.0.0"
      priority: 1
      enabled: true
    booking_com:
      category: hotel
      version: "1.0.0"
      priority: 2
      enabled: true
    agoda:
      category: hotel
      version: "1.0.0"
      priority: 3
      enabled: true
    expedia:
      category: hotel
      version: "1.0.0"
      priority: 4
      enabled: true
    trip_com:
      category: hotel
      version: "1.0.0"
      priority: 5
      enabled: true
    hotels_com:
      category: hotel
      version: "1.0.0"
      priority: 6
      enabled: true
    viator:
      category: activities
      version: "1.0.0"
      priority: 1
      enabled: true
    getyourguide:
      category: activities
      version: "1.0.0"
      priority: 2
      enabled: true
    kkday:
      category: activities
      version: "1.0.0"
      priority: 3
      enabled: true
    klook:
      category: activities
      version: "1.0.0"
      priority: 4
      enabled: true
    openstreetmap:
      category: maps
      version: "1.0.0"
      priority: 2
      enabled: true
```

## Common Interface

All tools implement the following interface:

```typescript
interface Tool {
  // Identity
  readonly id: string;
  readonly name: string;
  readonly category: ToolCategory;
  readonly version: string;

  // Lifecycle
  initialize(config: ToolConfig): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
  destroy(): Promise<void>;

  // Operations
  execute<TInput, TOutput>(
    operation: string,
    input: TInput,
    options?: ToolOptions
  ): Promise<ToolResult<TOutput>>;

  // Capabilities
  getCapabilities(): ToolCapabilities;
  getLimitations(): ToolLimitations;
  getSupportedOperations(): string[];
}

interface ToolConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  rateLimit?: RateLimitConfig;
  cache?: CacheConfig;
  circuitBreaker?: CircuitBreakerConfig;
}

interface ToolOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTtl?: number;
  priority?: RequestPriority;
  fallback?: string;
}

interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: ToolError;
  metadata: ResultMetadata;
}

interface ResultMetadata {
  toolId: string;
  operation: string;
  duration: number;
  cached: boolean;
  retryCount: number;
  timestamp: string;
}
```

## Rate Limiting

```typescript
interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstSize: number;
  queueSize: number;
  queueTimeout: number;
}

// Implementation uses Token Bucket Algorithm
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  async acquire(tokens: number = 1): Promise<void>;
  async tryAcquire(tokens: number = 1): Promise<boolean>;
  getRemaining(): number;
  getResetTime(): number;
}
```

## Circuit Breaker

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMax: number;
  monitor: boolean;
}

// States: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
// CLOSED: Normal operation, counting failures
// OPEN: Rejecting requests, waiting for reset
// HALF_OPEN: Testing if service recovered

class CircuitBreaker {
  async execute<T>(fn: () => Promise<T>): Promise<T>;
  getState(): CircuitState;
  getMetrics(): CircuitMetrics;
  reset(): void;
}
```

## Caching Strategy

```typescript
interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxEntries: number;
  strategy: CacheStrategy;
  storage: 'memory' | 'redis' | 'both';
}

type CacheStrategy =
  | 'lru'      // Least Recently Used
  | 'lfu'      // Least Frequently Used
  | 'fifo'     // First In First Out
  | 'ttl'      // Time To Live only
  | 'manual';  // Manual invalidation

// Cache Key Generation
function generateCacheKey(
  toolId: string,
  operation: string,
  params: Record<string, any>
): string;

// Cache Layers
class CacheManager {
  private l1Cache: MemoryCache;  // In-memory (fast)
  private l2Cache: RedisCache;   // Redis (shared)

  async get<T>(key: string): Promise<T | null>;
  async set<T>(key: string, value: T, ttl?: number): Promise<void>;
  async invalidate(pattern: string): Promise<void>;
  async clear(): Promise<void>;
}
```

## Error Handling

```typescript
interface ToolError {
  code: ErrorCode;
  message: string;
  toolId: string;
  operation: string;
  retryable: boolean;
  details?: Record<string, any>;
}

enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',

  // Tool-specific
  TOOL_NOT_INITIALIZED = 'TOOL_NOT_INITIALIZED',
  TOOL_UNAVAILABLE = 'TOOL_UNAVAILABLE',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  CACHE_ERROR = 'CACHE_ERROR',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Provider-specific
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  API_KEY_INVALID = 'API_KEY_INVALID',
}
```

## Retry Policy

```typescript
interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorCode[];
  jitter: boolean;
}

// Default policies by error type
const RetryPolicies: Record<string, RetryPolicy> = {
  network: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT],
    jitter: true,
  },
  rateLimit: {
    maxRetries: 5,
    initialDelay: 5000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    retryableErrors: [ErrorCode.RATE_LIMITED],
    jitter: false,
  },
  server: {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [ErrorCode.INTERNAL_ERROR, ErrorCode.SERVICE_UNAVAILABLE],
    jitter: true,
  },
  none: {
    maxRetries: 0,
    initialDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    retryableErrors: [],
    jitter: false,
  },
};
```

## Fallback Strategy

```typescript
interface FallbackStrategy {
  primary: string;
  fallbacks: string[];
  condition: FallbackCondition;
  timeout: number;
}

type FallbackCondition =
  | 'error'        // On any error
  | 'timeout'      // On timeout
  | 'slow'         // On slow response
  | 'quota'        // On quota exceeded
  | 'manual';      // Manual trigger

// Example: Hotel Search Fallback Chain
const HotelSearchFallback: FallbackStrategy = {
  primary: 'hotelbeds',
  fallbacks: ['booking_com', 'agoda', 'expedia', 'trip_com'],
  condition: 'error',
  timeout: 10000,
};
```

## Validation

```typescript
interface ValidationSchema {
  input: JSONSchema;
  output: JSONSchema;
  strict: boolean;
}

// Input validation
function validateInput<T>(
  schema: ValidationSchema,
  input: T
): ValidationResult;

// Output validation
function validateOutput<T>(
  schema: ValidationSchema,
  output: T
): ValidationResult;

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  path: string;
  message: string;
  code: string;
}
```

## Monitoring & Metrics

```typescript
interface ToolMetrics {
  // Request metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;

  // Latency metrics
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;

  // Error metrics
  errorRate: number;
  retryRate: number;
  timeoutRate: number;

  // Cache metrics
  cacheHitRate: number;
  cacheMissRate: number;

  // Rate limit metrics
  rateLimitHits: number;
  queueDepth: number;

  // Circuit breaker metrics
  circuitBreakerTrips: number;
  circuitBreakerResets: number;
}

// Prometheus metrics format
const metrics = {
  tool_requests_total: Counter,
  tool_request_duration_seconds: Histogram,
  tool_errors_total: Counter,
  tool_retries_total: Counter,
  tool_cache_hits_total: Counter,
  tool_rate_limit_hits_total: Counter,
  tool_circuit_breaker_state: Gauge,
};
```

## Tool Documentation

| Tool | Category | Documentation |
|------|----------|---------------|
| Playwright | Browser | [playwright.md](./playwright.md) |
| Browser | Browser | [browser.md](./browser.md) |
| HTTP | HTTP | [http.md](./http.md) |
| REST APIs | HTTP | [rest-apis.md](./rest-apis.md) |
| Google Maps | Maps | [google-maps.md](./google-maps.md) |
| OpenStreetMap | Maps | [openstreetmap.md](./openstreetmap.md) |
| Hotelbeds | Hotel | [hotelbeds.md](./hotelbeds.md) |
| Booking.com | Hotel | [booking-com.md](./booking-com.md) |
| Agoda | Hotel | [agoda.md](./agoda.md) |
| Expedia | Hotel | [expedia.md](./expedia.md) |
| Trip.com | Hotel | [trip-com.md](./trip-com.md) |
| Hotels.com | Hotel | [hotels-com.md](./hotels-com.md) |
| Viator | Activities | [viator.md](./viator.md) |
| GetYourGuide | Activities | [getyourguide.md](./getyourguide.md) |
| KKday | Activities | [kkday.md](./kkday.md) |
| Klook | Activities | [klook.md](./klook.md) |

## Quick Start

```typescript
// Initialize tool manager
const toolManager = new ToolManager();

// Register tools
await toolManager.register('hotelbeds', {
  apiKey: process.env.HOTELBEDS_API_KEY,
  baseUrl: 'https://api.hotelbeds.com',
  timeout: 10000,
  retries: 3,
  rateLimit: {
    requestsPerSecond: 10,
    requestsPerMinute: 600,
    requestsPerHour: 36000,
    burstSize: 20,
    queueSize: 100,
    queueTimeout: 5000,
  },
  cache: {
    enabled: true,
    ttl: 300000,
    maxEntries: 10000,
    strategy: 'lru',
    storage: 'redis',
  },
});

// Execute tool operation
const result = await toolManager.execute('hotelbeds', 'searchHotels', {
  destination: 'Dubai',
  checkIn: '2025-06-01',
  checkOut: '2025-06-05',
  adults: 2,
  rooms: 1,
});

if (result.success) {
  console.log(`Found ${result.data.hotels.length} hotels`);
} else {
  console.error(`Error: ${result.error.message}`);
}
```

## Configuration

```yaml
# tool-config.yaml
tool_manager:
  default_timeout: 10000
  default_retries: 3
  max_concurrent_requests: 50
  
  cache:
    enabled: true
    storage: redis
    redis:
      host: localhost
      port: 6379
      db: 0
    default_ttl: 300000
    max_entries: 100000

  circuit_breaker:
    enabled: true
    failure_threshold: 5
    reset_timeout: 60000
    half_open_max: 3

  monitoring:
    enabled: true
    metrics_port: 9090
    log_level: info

  rate_limiting:
    enabled: true
    global_limit: 1000
    per_tool_limit: 100
```

## Operations

### Health Check

```bash
# Check all tools
curl http://localhost:9090/tools/health

# Check specific tool
curl http://localhost:9090/tools/hotelbeds/health
```

### Metrics

```bash
# Prometheus metrics
curl http://localhost:9090/metrics
```

### Cache Management

```bash
# Clear cache for tool
curl -X DELETE http://localhost:9090/cache/hotelbeds

# Clear all cache
curl -X DELETE http://localhost:9090/cache
```

## Documentation

- [Playwright](./playwright.md) - Browser automation
- [Browser](./browser.md) - Web browsing
- [HTTP](./http.md) - HTTP client
- [REST APIs](./rest-apis.md) - REST API client
- [Google Maps](./google-maps.md) - Maps & Places
- [OpenStreetMap](./openstreetmap.md) - Open maps
- [Hotelbeds](./hotelbeds.md) - Hotel API
- [Booking.com](./booking-com.md) - Hotel API
- [Agoda](./agoda.md) - Hotel API
- [Expedia](./expedia.md) - Hotel API
- [Trip.com](./trip-com.md) - Hotel API
- [Hotels.com](./hotels-com.md) - Hotel API
- [Viator](./viator.md) - Activities API
- [GetYourGuide](./getyourguide.md) - Activities API
- [KKday](./kkday.md) - Activities API
- [Klook](./klook.md) - Activities API

---

*Tool Abstraction Layer v1.0.0 | Enterprise OTA Platform*
