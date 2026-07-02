# Provider Registry

> Centralized provider management and configuration.

---

## Overview

The Provider Registry manages all travel providers, their configurations, health status, and capabilities.

---

## Provider Registry Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PROVIDER REGISTRY ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         PROVIDER MANAGEMENT                                │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Provider │ │  Config   │ │  Health   │ │  Metrics  │                │ │
│  │  │  Registry │ │  Manager  │ │  Monitor  │ │  Collector│                │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         PROVIDER LAYER                                     │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Hotel Providers                                                     │  │ │
│  │  │  ─────────────────────────────────────────────────────────────────  │  │ │
│  │  │  • Booking.com      • Agoda           • Expedia                     │  │ │
│  │  │  • Hotels.com       • Trip.com        • Hotelbeds                   │  │ │
│  │  │  • Rakuten          • Japanican                                   │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Activity Providers                                                  │  │ │
│  │  │  ─────────────────────────────────────────────────────────────────  │  │ │
│  │  │  • Viator           • GetYourGuide   • Klook                        │  │ │
│  │  │  • KKday                                                           │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         PROVIDER STATUS                                    │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Healthy  │ │  Degraded │ │  Unhealthy│ │  Offline  │                │ │
│  │  │  ●        │ │  ●        │ │  ●        │ │  ●        │                │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Provider Configuration

```typescript
interface ProviderConfig {
  // Basic info
  id: string;
  name: string;
  type: 'hotel' | 'activity' | 'flight';
  enabled: boolean;
  
  // Priority and weight
  priority: number;
  weight: number;
  
  // Rate limiting
  rateLimit: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    dailyLimit: number;
  };
  
  // Retry policy
  retry: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
    maxDelay: number;
  };
  
  // Circuit breaker
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenMax: number;
  };
  
  // Authentication
  auth: {
    type: 'api_key' | 'oauth' | 'basic';
    credentials: Record<string, string>;
  };
  
  // Endpoint
  endpoint: string;
  timeout: number;
  
  // Capabilities
  capabilities: ProviderCapabilities;
}

interface ProviderCapabilities {
  // Search capabilities
  search: {
    hotels: boolean;
    activities: boolean;
    flights: boolean;
  };
  
  // Filter capabilities
  filters: {
    price: boolean;
    starRating: boolean;
    amenities: boolean;
    location: boolean;
    cancellation: boolean;
  };
  
  // Data availability
  data: {
    images: boolean;
    reviews: boolean;
    availability: boolean;
    pricing: boolean;
  };
  
  // Supported currencies
  currencies: string[];
  
  // Supported languages
  languages: string[];
}
```

---

## Provider Registry Implementation

```typescript
class ProviderRegistryImpl implements ProviderRegistry {
  private providers: Map<string, ProviderConfig>;
  private healthStatus: Map<string, ProviderHealth>;
  private metrics: Map<string, ProviderMetrics>;
  
  constructor() {
    this.providers = new Map();
    this.healthStatus = new Map();
    this.metrics = new Map();
  }
  
  // Register provider
  register(provider: ProviderConfig): void {
    this.providers.set(provider.id, provider);
    this.healthStatus.set(provider.id, {
      status: 'healthy',
      lastChecked: Date.now(),
      successRate: 1,
      avgResponseTime: 0,
    });
    this.metrics.set(provider.id, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      lastUpdated: Date.now(),
    });
  }
  
  // Get provider
  get(id: string): ProviderConfig | null {
    return this.providers.get(id) || null;
  }
  
  // Get all providers
  getAll(): ProviderConfig[] {
    return Array.from(this.providers.values());
  }
  
  // Get providers by type
  getByType(type: string): ProviderConfig[] {
    return this.getAll().filter(p => p.type === type);
  }
  
  // Get healthy providers
  getHealthy(): ProviderConfig[] {
    return this.getAll().filter(p => {
      const health = this.healthStatus.get(p.id);
      return health && health.status === 'healthy';
    });
  }
  
  // Update health status
  updateHealth(id: string, status: ProviderHealth): void {
    this.healthStatus.set(id, status);
  }
  
  // Update metrics
  updateMetrics(id: string, metrics: ProviderMetrics): void {
    this.metrics.set(id, metrics);
  }
  
  // Get provider health
  getHealth(id: string): ProviderHealth | null {
    return this.healthStatus.get(id) || null;
  }
  
  // Get provider metrics
  getMetrics(id: string): ProviderMetrics | null {
    return this.metrics.get(id) || null;
  }
}
```

---

## Provider Health Monitoring

```typescript
interface ProviderHealth {
  // Health status
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  
  // Last checked
  lastChecked: number;
  
  // Success rate
  successRate: number;
  
  // Average response time
  avgResponseTime: number;
  
  // Error rate
  errorRate: number;
  
  // Recent errors
  recentErrors: ProviderError[];
}

// Health check implementation
async function checkProviderHealth(
  provider: ProviderConfig
): Promise<ProviderHealth> {
  const startTime = Date.now();
  
  try {
    // Make health check request
    const response = await fetch(provider.endpoint + '/health', {
      method: 'GET',
      timeout: 5000,
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        status: 'healthy',
        lastChecked: Date.now(),
        successRate: 1,
        avgResponseTime: responseTime,
        errorRate: 0,
        recentErrors: [],
      };
    } else {
      return {
        status: 'degraded',
        lastChecked: Date.now(),
        successRate: 0.5,
        avgResponseTime: responseTime,
        errorRate: 0.5,
        recentErrors: [],
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      lastChecked: Date.now(),
      successRate: 0,
      avgResponseTime: 0,
      errorRate: 1,
      recentErrors: [{
        timestamp: Date.now(),
        error: error.message,
      }],
    };
  }
}
```

---

## Provider Metrics

```typescript
interface ProviderMetrics {
  // Request metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  
  // Performance metrics
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // Error metrics
  errorRate: number;
  timeoutRate: number;
  
  // Cost metrics
  apiCalls: number;
  estimatedCost: number;
  
  // Last updated
  lastUpdated: number;
}

// Collect provider metrics
function collectProviderMetrics(
  providerId: string,
  request: ProviderRequest,
  response: ProviderResponse
): void {
  const metrics = providerRegistry.getMetrics(providerId);
  
  if (!metrics) {
    return;
  }
  
  // Update request metrics
  metrics.totalRequests++;
  if (response.success) {
    metrics.successfulRequests++;
  } else {
    metrics.failedRequests++;
  }
  
  // Update performance metrics
  const responseTime = response.duration;
  metrics.avgResponseTime = 
    (metrics.avgResponseTime * (metrics.totalRequests - 1) + responseTime) / 
    metrics.totalRequests;
  
  // Update error metrics
  metrics.errorRate = metrics.failedRequests / metrics.totalRequests;
  metrics.timeoutRate = 
    (metrics.timeoutRate * (metrics.totalRequests - 1) + (response.timeout ? 1 : 0)) / 
    metrics.totalRequests;
  
  // Update timestamp
  metrics.lastUpdated = Date.now();
  
  // Save metrics
  providerRegistry.updateMetrics(providerId, metrics);
}
```

---

## Provider Selection

```typescript
interface ProviderSelector {
  // Select providers for query
  selectProviders(
    query: SearchQuery,
    options: ProviderSelectionOptions
  ): ProviderSelection;
  
  // Select by priority
  selectByPriority(
    providers: ProviderConfig[],
    limit: number
  ): ProviderConfig[];
  
  // Select by health
  selectByHealth(
    providers: ProviderConfig[]
  ): ProviderConfig[];
  
  // Select by capabilities
  selectByCapabilities(
    providers: ProviderConfig[],
    requirements: CapabilityRequirements
  ): ProviderConfig[];
}

interface ProviderSelectionOptions {
  // Selection strategy
  strategy: 'priority' | 'health' | 'round-robin' | 'weighted';
  
  // Maximum providers
  maxProviders: number;
  
  // Include unhealthy
  includeUnhealthy: boolean;
  
  // Minimum health score
  minHealthScore: number;
}

// Select providers for query
function selectProviders(
  query: SearchQuery,
  options: ProviderSelectionOptions
): ProviderSelection {
  // Get all providers for query type
  let providers = providerRegistry.getByType(query.type);
  
  // Filter by health
  if (!options.includeUnhealthy) {
    providers = selectByHealth(providers);
  }
  
  // Filter by capabilities
  providers = selectByCapabilities(providers, {
    type: query.type,
    requiredFilters: Object.keys(query.filters || {}),
  });
  
  // Sort by selection strategy
  providers = sortByStrategy(providers, options.strategy);
  
  // Limit results
  providers = providers.slice(0, options.maxProviders);
  
  return {
    providers,
    strategy: options.strategy,
    totalSelected: providers.length,
  };
}
```

---

## Provider Registry Configuration

```yaml
providerRegistry:
  # Enable provider registry
  enabled: true
  
  # Providers
  providers:
    # Hotel providers
    hotel:
      - id: booking_com
        name: Booking.com
        type: hotel
        enabled: true
        priority: 1
        weight: 1.0
        endpoint: https://api.booking.com
        timeout: 5000
        rateLimit:
          requestsPerSecond: 10
          requestsPerMinute: 100
          dailyLimit: 10000
        retry:
          maxAttempts: 3
          backoffMultiplier: 2
          initialDelay: 100
          maxDelay: 2000
        circuitBreaker:
          failureThreshold: 5
          resetTimeout: 60000
          halfOpenMax: 3
        auth:
          type: api_key
          credentials:
            apiKey: ${BOOKING_API_KEY}
      
      - id: agoda
        name: Agoda
        type: hotel
        enabled: true
        priority: 2
        weight: 0.9
        endpoint: https://api.agoda.com
        timeout: 5000
        rateLimit:
          requestsPerSecond: 10
          requestsPerMinute: 100
          dailyLimit: 10000
        retry:
          maxAttempts: 3
          backoffMultiplier: 2
          initialDelay: 100
          maxDelay: 2000
        circuitBreaker:
          failureThreshold: 5
          resetTimeout: 60000
          halfOpenMax: 3
        auth:
          type: api_key
          credentials:
            apiKey: ${AGODA_API_KEY}
    
    # Activity providers
    activity:
      - id: viator
        name: Viator
        type: activity
        enabled: true
        priority: 1
        weight: 1.0
        endpoint: https://api.viator.com
        timeout: 5000
        rateLimit:
          requestsPerSecond: 10
          requestsPerMinute: 100
          dailyLimit: 10000
        retry:
          maxAttempts: 3
          backoffMultiplier: 2
          initialDelay: 100
          maxDelay: 2000
        circuitBreaker:
          failureThreshold: 5
          resetTimeout: 60000
          halfOpenMax: 3
        auth:
          type: api_key
          credentials:
            apiKey: ${VIATOR_API_KEY}
  
  # Health check settings
  healthCheck:
    enabled: true
    interval: 30000 # 30 seconds
    timeout: 5000
    unhealthyThreshold: 3
    healthyThreshold: 2
  
  # Metrics collection
  metrics:
    enabled: true
    interval: 60000 # 1 minute
    retention: 86400000 # 1 day
```
