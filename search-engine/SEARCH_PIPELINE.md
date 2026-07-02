# Search Pipeline

> Orchestrates the complete search flow from query parsing to result delivery.

---

## Overview

The Search Pipeline is the main orchestrator that manages the end-to-end flow of a search query through the system. It coordinates all other components to deliver accurate, fast, and comprehensive results.

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SEARCH PIPELINE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐                                                                │
│  │ Query Input │                                                                │
│  └──────┬──────┘                                                                │
│         ↓                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Stage 1   │→ │   Stage 2   │→ │   Stage 3   │→ │   Stage 4   │          │
│  │   Parse     │  │   Validate  │  │   Enrich    │  │   Route     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                                      ↓        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Stage 8   │← │   Stage 7   │← │   Stage 6   │← │   Stage 5   │          │
│  │   Return    │  │   Rank      │  │   Process   │  │   Execute   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Pipeline Stages

### Stage 1: Query Parsing

**Purpose**: Parse and structure the raw search query.

```typescript
interface QueryParser {
  parse(rawQuery: string | SearchQuery): ParsedQuery;
  validateSyntax(query: string): ValidationResult;
  extractEntities(query: string): QueryEntities;
}

interface ParsedQuery {
  // Raw query data
  original: string;
  normalized: string;
  
  // Extracted entities
  entities: {
    destination: DestinationEntity;
    dates: DateEntity;
    guests: GuestEntity;
    preferences: PreferenceEntity;
  };
  
  // Query metadata
  metadata: {
    queryType: QueryType;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedResults: number;
  };
}

type QueryType = 
  | 'hotel_search'
  | 'activity_search'
  | 'flight_search'
  | 'package_search'
  | 'multi_destination';
```

**Processing Rules**:
1. Trim and normalize whitespace
2. Detect language and encoding
3. Extract location entities (city, country, coordinates)
4. Parse date formats (relative and absolute)
5. Extract guest counts and room requirements
6. Identify special preferences and requirements

---

### Stage 2: Query Validation

**Purpose**: Validate the parsed query for completeness and correctness.

```typescript
interface QueryValidator {
  validate(query: ParsedQuery): ValidationResult;
  checkConstraints(query: ParsedQuery): ConstraintResult;
  validateDates(dates: DateEntity): DateValidation;
  validateLocation(location: DestinationEntity): LocationValidation;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// Validation rules
const VALIDATION_RULES = {
  // Date rules
  CHECKIN_AFTER_TODAY: 'Check-in must be today or later',
  CHECKOUT_AFTER_CHECKIN: 'Check-out must be after check-in',
  MAX_STAY_DURATION: 'Maximum stay is 30 nights',
  MIN_ADVANCE_BOOKING: 'Must book at least 1 day in advance',
  
  // Guest rules
  MIN_ADULTS: 'At least 1 adult required',
  MAX_ADULTS: 'Maximum 8 adults per room',
  MAX_CHILDREN: 'Maximum 6 children per room',
  MAX_ROOMS: 'Maximum 10 rooms per booking',
  
  // Location rules
  VALID_DESTINATION: 'Valid destination required',
  DESTINATION_NOT_FOUND: 'Destination not found',
  
  // Price rules
  VALID_PRICE_RANGE: 'Invalid price range',
  MIN_PRICE_EXCEEDS_MAX: 'Minimum price exceeds maximum',
};
```

**Validation Flow**:
```
┌─────────────────┐
│ Validate Query   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Check Required   │──→ Missing Fields Error
│ Fields           │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Validate Dates   │──→ Invalid Dates Error
└────────┬────────┘
         ↓
┌─────────────────┐
│ Validate Location│──→ Location Error
└────────┬────────┘
         ↓
┌─────────────────┐
│ Validate Guests  │──→ Guest Error
└────────┬────────┘
         ↓
┌─────────────────┐
│ Validate Filters │──→ Filter Error
└────────┬────────┘
         ↓
┌─────────────────┐
│ Return Result    │
└─────────────────┘
```

---

### Stage 3: Query Enrichment

**Purpose**: Enhance the query with additional context and data.

```typescript
interface QueryEnricher {
  enrich(query: ParsedQuery): EnrichedQuery;
  addCoordinates(location: DestinationEntity): EnrichedLocation;
  addSeasonality(dates: DateEntity): SeasonalContext;
  addPricingContext(query: ParsedQuery): PricingContext;
}

interface EnrichedQuery extends ParsedQuery {
  // Enriched location
  enrichedLocation: {
    coordinates: { lat: number; lng: number };
    timezone: string;
    region: string;
    country: string;
    nearbyAirports: Airport[];
    popularAreas: Area[];
  };
  
  // Seasonal context
  seasonalContext: {
    season: 'peak' | 'shoulder' | 'off';
    localEvents: Event[];
    weatherForecast: WeatherData;
    priceTrend: 'high' | 'normal' | 'low';
  };
  
  // Pricing context
  pricingContext: {
    historicalAvg: number;
    currentAvg: number;
    priceTrend: number;
    competitiveIndex: number;
  };
  
  // Search context
  searchContext: {
    popularProviders: string[];
    recommendedProviders: string[];
    excludedProviders: string[];
    searchDepth: 'quick' | 'standard' | 'comprehensive';
  };
}
```

**Enrichment Sources**:
1. Geocoding service for coordinates
2. Timezone database
3. Historical pricing data
4. Weather API
5. Events calendar
6. Provider popularity data

---

### Stage 4: Provider Routing

**Purpose**: Select and route to appropriate providers.

```typescript
interface ProviderRouter {
  route(query: EnrichedQuery): RoutingDecision;
  selectProviders(query: EnrichedQuery): ProviderSelection;
  prioritizeProviders(selection: ProviderSelection): PrioritizedProviders;
}

interface RoutingDecision {
  // Selected providers
  primary: ProviderRoute[];
  secondary: ProviderRoute[];
  fallback: ProviderRoute[];
  
  // Execution strategy
  strategy: 'parallel' | 'cascade' | 'hybrid';
  maxConcurrency: number;
  timeout: number;
  
  // Cost estimation
  estimatedCost: {
    apiCalls: number;
    estimatedLatency: number;
    estimatedTokens: number;
  };
}

interface ProviderRoute {
  provider: string;
  priority: number;
  weight: number;
  timeout: number;
  retryAttempts: number;
  endpoint: string;
  auth: AuthConfig;
}

// Routing rules
const ROUTING_RULES = {
  // Hotel search
  hotel_search: {
    primary: ['booking_com', 'agoda', 'expedia'],
    secondary: ['hotels_com', 'trip_com', 'hotelbeds'],
    fallback: ['rakuten', 'japanican'],
  },
  
  // Activity search
  activity_search: {
    primary: ['viator', 'getyourguide'],
    secondary: ['klook', 'kkday'],
    fallback: [],
  },
  
  // Flight search
  flight_search: {
    primary: ['skyscanner', 'kayak'],
    secondary: ['momondo', 'google_flights'],
    fallback: [],
  },
};
```

**Routing Logic**:
```
┌────────────────────────────┐
│ Analyze Query              │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Check Provider Health      │──→ Exclude Unhealthy
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Check Rate Limits          │──→ Exclude Rate Limited
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Check Budget               │──→ Exclude Over Budget
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Select by Query Type       │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Prioritize by Trust Score  │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Assign Weights             │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Return Routing Decision    │
└────────────────────────────┘
```

---

### Stage 5: Query Execution

**Purpose**: Execute searches across selected providers in parallel.

```typescript
interface QueryExecutor {
  execute(query: EnrichedQuery, routing: RoutingDecision): ExecutionResult;
  executeParallel(queries: ProviderQuery[]): Promise<ProviderResponse[]>;
  executeWithTimeout(query: ProviderQuery, timeout: number): Promise<ProviderResponse>;
  handleProviderError(error: ProviderError, query: ProviderQuery): RetryDecision;
}

interface ExecutionResult {
  // Responses
  responses: ProviderResponse[];
  
  // Execution metadata
  metadata: {
    totalExecuted: number;
    successful: number;
    failed: number;
    timedOut: number;
    retried: number;
    totalDuration: number;
    providerDurations: Record<string, number>;
  };
  
  // Errors
  errors: ExecutionError[];
  
  // Retry decisions
  retries: RetryDecision[];
}

interface ProviderResponse {
  provider: string;
  success: boolean;
  data: any;
  error?: string;
  duration: number;
  retryCount: number;
  cached: boolean;
}

// Execution configuration
const EXECUTION_CONFIG = {
  // Parallel execution
  parallel: {
    maxConcurrency: 50,
    queueSize: 1000,
    timeout: 5000,
  },
  
  // Timeout settings
  timeout: {
    query: 5000,
    response: 10000,
    connection: 2000,
  },
  
  // Retry settings
  retry: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 100,
    maxDelay: 2000,
    retryableErrors: [
      'TIMEOUT',
      'NETWORK_ERROR',
      'RATE_LIMITED',
      'SERVER_ERROR',
    ],
  },
};
```

**Execution Flow**:
```
┌────────────────────────────┐
│ Create Execution Plan      │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Initialize Connection Pool │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Start Parallel Execution   │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Monitor Progress           │
│  ┌──────────────────────┐  │
│  │ Provider 1: ✓ Done   │  │
│  │ Provider 2: ✓ Done   │  │
│  │ Provider 3: ⏳ Wait  │  │
│  │ Provider 4: ✗ Failed │  │
│  └──────────────────────┘  │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Handle Timeouts            │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Execute Retries            │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Collect Results            │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Return Execution Result    │
└────────────────────────────┘
```

---

### Stage 6: Result Collection

**Purpose**: Collect and aggregate results from all providers.

```typescript
interface ResultCollector {
  collect(responses: ProviderResponse[]): CollectedResult;
  aggregateResults(results: CollectedResult[]): AggregatedResult;
  mergeResults(results: AggregatedResult[]): MergedResult;
}

interface CollectedResult {
  // Raw results
  rawResults: SearchResult[];
  
  // By provider
  byProvider: Record<string, SearchResult[]>;
  
  // Statistics
  stats: {
    totalResults: number;
    uniqueResults: number;
    duplicatesDetected: number;
    avgResultsPerProvider: number;
  };
  
  // Provider performance
  providerPerformance: Record<string, {
    resultsCount: number;
    avgPrice: number;
    avgRating: number;
    responseTime: number;
  }>;
}

// Collection strategies
const COLLECTION_STRATEGIES = {
  // Collect all results
  ALL: 'all',
  
  // Collect until limit reached
  EARLY_STOP: 'early_stop',
  
  // Collect best results only
  BEST_ONLY: 'best_only',
  
  // Collect with diversity
  DIVERSITY: 'diversity',
};
```

---

### Stage 7: Result Processing

**Purpose**: Process, normalize, and enhance collected results.

```typescript
interface ResultProcessor {
  process(results: CollectedResult): ProcessedResult;
  normalize(results: SearchResult[]): NormalizedResult[];
  deduplicate(results: NormalizedResult[]): DeduplicatedResult[];
  score(results: DeduplicatedResult[]): ScoredResult[];
}

interface ProcessedResult {
  // Processed results
  results: ScoredResult[];
  
  // Processing metadata
  metadata: {
    totalProcessed: number;
    normalized: number;
    deduplicated: number;
    scored: number;
    enriched: number;
  };
  
  // Quality metrics
  quality: {
    dataCompleteness: number;
    imageAvailability: number;
    reviewAvailability: number;
    priceConfidence: number;
  };
}
```

**Processing Steps**:
```
┌────────────────────────────┐
│ Raw Results                │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Normalize Prices           │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Normalize Currencies       │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Normalize Ratings          │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Detect Duplicates          │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Merge Duplicates           │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Verify Images              │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Verify Availability        │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Calculate Scores           │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Enrich Results             │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│ Processed Results          │
└────────────────────────────┘
```

---

### Stage 8: Result Ranking

**Purpose**: Rank results by relevance and quality.

```typescript
interface ResultRanker {
  rank(results: ScoredResult[]): RankedResult[];
  calculateRelevance(result: ScoredResult, query: ParsedQuery): number;
  applyBusinessRules(results: RankedResult[]): RankedResult[];
}

interface RankedResult extends ScoredResult {
  // Ranking data
  ranking: {
    position: number;
    relevanceScore: number;
    qualityScore: number;
    valueScore: number;
    overallScore: number;
  };
  
  // Badges
  badges: {
    cheapest: boolean;
    bestValue: boolean;
    topRated: boolean;
    mostReviewed: boolean;
    staffPick: boolean;
    trending: boolean;
  };
}
```

---

## Pipeline Configuration

```yaml
pipeline:
  # Execution settings
  execution:
    maxConcurrency: 100
    queryTimeout: 5000
    collectTimeout: 10000
    processTimeout: 3000
    
  # Stage settings
  stages:
    parse:
      enabled: true
      timeout: 100
    validate:
      enabled: true
      strict: false
    enrich:
      enabled: true
      timeout: 200
    route:
      enabled: true
      strategy: parallel
    execute:
      enabled: true
      maxRetries: 3
    collect:
      enabled: true
      strategy: all
    process:
      enabled: true
      deduplication: true
    rank:
      enabled: true
      algorithm: weighted
    
  # Quality thresholds
  quality:
    minConfidence: 0.6
    minDataCompleteness: 0.5
    minImageAvailability: 0.3
```

---

## Error Handling

| Error | Stage | Recovery |
|-------|-------|----------|
| Parse Error | 1 | Return error message |
| Validation Error | 2 | Return suggestions |
| Enrichment Error | 3 | Continue with defaults |
| Routing Error | 4 | Use fallback providers |
| Execution Error | 5 | Retry with backoff |
| Collection Error | 6 | Use partial results |
| Processing Error | 7 | Skip failed items |
| Ranking Error | 8 | Use basic ranking |
