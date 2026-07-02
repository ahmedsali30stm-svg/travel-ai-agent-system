# Search Intelligence Engine

> Enterprise-grade search orchestration system for multi-provider travel data aggregation.

---

## Overview

The Search Intelligence Engine is the core brain of the OTA platform, responsible for orchestrating parallel searches across multiple providers, normalizing data, detecting duplicates, and delivering the best possible results to users.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SEARCH INTELLIGENCE ENGINE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         SEARCH PIPELINE                                    │  │
│  │                                                                            │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │  │
│  │  │ Query   │→ │ Route   │→ │ Execute │→ │ Collect │→ │ Process │       │  │
│  │  │ Parser  │  │ Engine  │  │ Engine  │  │ Engine  │  │ Engine  │       │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                      ↓                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                       NORMALIZATION LAYER                                   │  │
│  │                                                                            │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐             │  │
│  │  │  Price    │  │ Currency  │  │   Tax     │  │  Image    │             │  │
│  │  │ Normalize │  │ Normalize │  │ Normalize │  │ Verify    │             │  │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘             │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                      ↓                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                       INTELLIGENCE LAYER                                   │  │
│  │                                                                            │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐             │  │
│  │  │ Duplicate │  │  Scoring  │  │  Ranking  │  │ Recommend │             │  │
│  │  │ Detection │  │  Engine   │  │  Engine   │  │  Engine   │             │  │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘             │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                      ↓                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                       PROVIDER LAYER                                       │  │
│  │                                                                            │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │  │
│  │  │Booking  │ │ Agoda   │ │Expedia  │ │Hotels   │ │ Trip    │           │  │
│  │  │.com     │ │         │ │         │ │.com     │ │.com     │           │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │  │
│  │                                                                            │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │  │
│  │  │Hotelbeds│ │Rakuten  │ │Japanican│ │ Klook   │ │ KKday   │           │  │
│  │  │         │ │         │ │         │ │         │ │         │           │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │  │
│  │                                                                            │  │
│  │  ┌─────────┐ ┌─────────┐                                                  │  │
│  │  │ Viator  │ │GetYour  │                                                  │  │
│  │  │         │ │Guide    │                                                  │  │
│  │  └─────────┘ └─────────┘                                                  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                      ↓                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                       INFRASTRUCTURE                                       │  │
│  │                                                                            │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐             │  │
│  │  │  Cache    │  │  Health   │  │  Retry    │  │  Error    │             │  │
│  │  │  Layer    │  │ Monitor   │  │  Manager  │  │ Recovery  │             │  │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘             │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

| Component | Purpose | File |
|-----------|---------|------|
| Search Pipeline | Orchestrates search flow | `SEARCH_PIPELINE.md` |
| Ranking Engine | Ranks results by relevance | `RANKING_ENGINE.md` |
| Scoring Engine | Calculates scores | `SCORING_ENGINE.md` |
| Filtering Engine | Filters results | `FILTERING_ENGINE.md` |
| Recommendation Engine | Provides recommendations | `RECOMMENDATION_ENGINE.md` |
| Price Intelligence | Price analysis & comparison | `PRICE_INTELLIGENCE.md` |
| Duplicate Detection | Identifies duplicates | `DUPLICATE_DETECTION.md` |
| Normalization Layer | Data normalization | `NORMALIZATION_LAYER.md` |
| Error Recovery | Fault tolerance | `ERROR_RECOVERY.md` |
| Result Cache | Caching layer | `RESULT_CACHE.md` |
| Provider Registry | Provider management | `PROVIDER_REGISTRY.md` |
| Health Monitor | Provider health | `HEALTH_MONITOR.md` |

---

## Data Flow

```
User Query
    ↓
Query Parser ──→ Validate & Parse
    ↓
Route Engine ──→ Select Providers
    ↓
Execute Engine ──→ Parallel Search
    ↓
┌─────────────────────────────────────┐
│         Provider Responses           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ BDC │ │ AGD │ │ EXP │ │ ... │  │
│  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘  │
│     └───────┴───────┴───────┘      │
└─────────────────────────────────────┘
    ↓
Collect Engine ──→ Aggregate Results
    ↓
Normalization Layer
    ├─→ Price Normalize
    ├─→ Currency Normalize
    ├─→ Tax Normalize
    ├─→ Image Verify
    └─→ Rating Normalize
    ↓
Duplicate Detection ──→ Merge Duplicates
    ↓
Scoring Engine ──→ Calculate Scores
    ├─→ Best Value Score
    ├─→ Confidence Score
    └─→ Provider Trust Score
    ↓
Ranking Engine ──→ Sort Results
    ↓
Recommendation Engine ──→ Top Picks
    ↓
Final Response
```

---

## Provider Configuration

```typescript
interface ProviderConfig {
  id: string;
  name: string;
  type: 'hotel' | 'activity' | 'flight';
  enabled: boolean;
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
}
```

---

## Search Query Schema

```typescript
interface SearchQuery {
  id: string;
  type: 'hotel' | 'activity' | 'flight';
  
  // Location
  destination: {
    city?: string;
    country?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  };
  
  // Dates
  checkin?: string;
  checkout?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  
  // Guests
  guests?: {
    adults: number;
    children?: number;
    rooms?: number;
  };
  
  // Filters
  filters?: {
    priceRange?: { min: number; max: number };
    starRating?: number[];
    amenities?: string[];
    propertyType?: string[];
    mealPlan?: string[];
    cancellationPolicy?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  
  // Preferences
  preferences?: {
    language?: string;
    currency?: string;
    nationality?: string;
  };
  
  // Options
  options?: {
    limit?: number;
    offset?: number;
    includeUnavailable?: boolean;
    includeImages?: boolean;
    includeReviews?: boolean;
  };
}
```

---

## Search Response Schema

```typescript
interface SearchResponse {
  queryId: string;
  timestamp: number;
  duration: number;
  
  // Results
  results: SearchResult[];
  totalResults: number;
  
  // Metadata
  metadata: {
    providersQueried: string[];
    providersSucceeded: string[];
    providersFailed: string[];
    cacheHits: number;
    duplicatesRemoved: number;
  };
  
  // Aggregations
  aggregations: {
    priceRange: { min: number; max: number; avg: number };
    starRatings: Record<number, number>;
    propertyTypes: Record<string, number>;
    amenities: Record<string, number>;
  };
  
  // Recommendations
  recommendations: {
    cheapest: string;
    bestValue: string;
    premium: string;
    closest: string;
  };
}

interface SearchResult {
  id: string;
  provider: string;
  
  // Basic info
  name: string;
  type: string;
  description: string;
  
  // Location
  location: {
    address: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  
  // Pricing
  pricing: {
    original: PriceInfo;
    normalized: PriceInfo;
    breakdown: PriceBreakdown;
  };
  
  // Rating
  rating: {
    score: number;
    normalized: number;
    reviews: number;
    source: string;
  };
  
  // Images
  images: ImageInfo[];
  
  // Availability
  availability: {
    available: boolean;
    roomsLeft?: number;
    lastChecked: number;
  };
  
  // Scores
  scores: {
    bestValue: number;
    confidence: number;
    providerTrust: number;
  };
  
  // Source
  source: {
    provider: string;
    url: string;
    lastUpdated: number;
  };
}
```

---

## Performance Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Latency (p50) | < 500ms | Median response time |
| Latency (p95) | < 1500ms | 95th percentile |
| Latency (p99) | < 3000ms | 99th percentile |
| Throughput | > 1000 RPS | Queries per second |
| Availability | 99.9% | Uptime |
| Cache Hit Rate | > 70% | Cache effectiveness |
| Error Rate | < 1% | Failed queries |
| Provider Success | > 95% | Provider availability |

---

## Monitoring & Alerting

### Key Metrics

```typescript
interface SearchMetrics {
  // Performance
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  
  // Volume
  totalQueries: number;
  queriesPerSecond: number;
  
  // Success
  successRate: number;
  errorRate: number;
  
  // Providers
  providerMetrics: Record<string, {
    queries: number;
    successRate: number;
    avgLatency: number;
    errorRate: number;
  }>;
  
  // Cache
  cacheHitRate: number;
  cacheSize: number;
  
  // Business
  resultsReturned: number;
  avgResultsPerQuery: number;
  clickThroughRate: number;
}
```

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Latency | p95 > 2s | Warning |
| High Error Rate | > 5% | Critical |
| Provider Down | Success rate < 50% | Critical |
| Cache Miss Rate | > 50% | Warning |
| Circuit Open | Any provider | Warning |
| Rate Limit | > 80% usage | Warning |

---

## Configuration

```yaml
search:
  # Pipeline
  pipeline:
    maxConcurrency: 100
    queryTimeout: 5000
    collectTimeout: 10000
    
  # Providers
  providers:
    enabled:
      - booking_com
      - agoda
      - expedia
      - hotels_com
      - trip_com
      - hotelbeds
      - rakuten
      - japanican
      - klook
      - kkday
      - viator
      - getyourguide
      
  # Cache
  cache:
    enabled: true
    ttl: 300
    maxSize: 10000
    strategy: 'lru'
    
  # Rate limiting
  rateLimit:
    global: 1000
    perProvider: 100
    
  # Retry
  retry:
    maxAttempts: 3
    backoffMultiplier: 2
    initialDelay: 100
    
  # Circuit breaker
  circuitBreaker:
    enabled: true
    failureThreshold: 5
    resetTimeout: 60000
```

---

## Security

- API key authentication for providers
- Rate limiting per user and globally
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Request signing
- Audit logging
