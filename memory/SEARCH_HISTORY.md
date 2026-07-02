# Search History

> Search query tracking for pattern analysis and quick re-search.
> Optimized for fast lookups and analytics.

---

## Purpose

Search history stores:
- User search queries
- Search results metadata
- Search patterns and trends
- Popular destinations
- Price snapshots at search time

---

## Data Schema

### Search Record

```typescript
interface SearchRecord {
  search_id: string;
  user_id: string;
  session_id: string;
  timestamp: number;
  
  // Query
  query: {
    destination: string;
    dates?: {
      start: string;
      end: string;
    };
    travelers?: number;
    budget?: number;
    preferences: Record<string, any>;
  };
  
  // Results
  results: {
    hotels_found: number;
    flights_found: number;
    activities_found: number;
    prices: {
      hotel_min: number;
      hotel_max: number;
      flight_min: number;
      flight_max: number;
    };
  };
  
  // Selection
  selection?: {
    hotel_id?: string;
    flight_id?: string;
    activity_ids?: string[];
    total_cost: number;
  };
  
  // Metadata
  metadata: {
    duration_ms: number;
    agents_used: string[];
    tools_used: string[];
    api_calls: number;
  };
}
```

**Key Pattern**: `search:{search_id}`
**TTL**: 30 days
**Size**: ~2KB per search

---

### User Search Index

```typescript
interface UserSearchIndex {
  user_id: string;
  
  // Search IDs by category
  searches: {
    recent: string[];      // Last 20 searches
    by_destination: Record<string, string[]>;
    by_date_range: Record<string, string[]>;
  };
  
  // Aggregated stats
  stats: {
    total_searches: number;
    unique_destinations: number;
    avg_budget: number;
    conversion_rate: number;  // Searches that led to bookings
  };
}
```

**Key Pattern**: `search:user:{user_id}:index`
**TTL**: 30 days
**Size**: ~3KB

---

### Popular Searches

```typescript
interface PopularSearches {
  updated_at: number;
  
  // Global popular searches
  global: {
    destination: string;
    search_count: number;
    avg_budget: number;
    trend: 'rising' | 'stable' | 'declining';
  }[];
  
  // Trending (last 7 days)
  trending: {
    destination: string;
    search_count: number;
    growth_rate: number;
  }[];
  
  // Seasonal patterns
  seasonal: {
    month: number;
    top_destinations: string[];
    avg_budget: number;
  }[];
}
```

**Key Pattern**: `search:popular`
**TTL**: 1 hour
**Size**: ~5KB

---

## Storage Architecture

### Redis Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      SEARCH HISTORY                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Search Records                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ search:srch_abc123                                   │   │
│  │ search:srch_def456                                   │   │
│  │ search:srch_ghi789                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  User Index                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ search:user:user_456:index                           │   │
│  │ {                                                   │   │
│  │   searches: {                                       │   │
│  │     recent: ["srch_abc123", "srch_def456", ...],    │   │
│  │     by_destination: { "Paris": [...], ... },         │   │
│  │   },                                                │   │
│  │   stats: { total_searches: 45, ... },              │   │
│  │ }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Popular Searches                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ search:popular                                       │   │
│  │ {                                                   │   │
│  │   global: [...],                                    │   │
│  │   trending: [...],                                  │   │
│  │   seasonal: [...]                                   │   │
│  │ }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Access Patterns

### Write Operations

```typescript
// Record search
async function recordSearch(search: SearchRecord): Promise<void> {
  // Store search record
  await memory.set(
    `search:${search.search_id}`,
    search,
    { ttl: 2592000 }  // 30 days
  );
  
  // Update user index
  await memory.transaction(async (tx) => {
    const index = await tx.get(`search:user:${search.user_id}:index`);
    
    // Add to recent (keep last 20)
    index.searches.recent.unshift(search.search_id);
    index.searches.recent = index.searches.recent.slice(0, 20);
    
    // Add to destination index
    const dest = search.query.destination;
    if (!index.searches.by_destination[dest]) {
      index.searches.by_destination[dest] = [];
    }
    index.searches.by_destination[dest].unshift(search.search_id);
    
    // Update stats
    index.stats.total_searches++;
    
    await tx.set(`search:user:${search.user_id}:index`, index);
  });
  
  // Update popular searches
  await updatePopularSearches(search.query.destination);
}

// Record selection (after search)
async function recordSelection(
  searchId: string,
  selection: SearchRecord['selection']
): Promise<void> {
  const search = await memory.get(`search:${searchId}`);
  search.selection = selection;
  await memory.set(`search:${searchId}`, search);
}
```

### Read Operations

```typescript
// Get recent searches
async function getRecentSearches(
  userId: string,
  limit: number = 10
): Promise<SearchRecord[]> {
  const index = await memory.get(`search:user:${userId}:index`);
  const searchIds = index.searches.recent.slice(0, limit);
  
  return memory.mget(
    searchIds.map(id => `search:${id}`)
  );
}

// Get searches by destination
async function getSearchesByDestination(
  userId: string,
  destination: string,
  limit: number = 10
): Promise<SearchRecord[]> {
  const index = await memory.get(`search:user:${userId}:index`);
  const searchIds = (index.searches.by_destination[destination] || [])
    .slice(0, limit);
  
  return memory.mget(
    searchIds.map(id => `search:${id}`)
  );
}

// Get popular destinations
async function getPopularDestinations(
  limit: number = 10
): Promise<PopularSearches['global']> {
  const popular = await memory.get('search:popular');
  return popular.global.slice(0, limit);
}

// Get trending destinations
async function getTrendingDestinations(
  limit: number = 10
): Promise<PopularSearches['trending']> {
  const popular = await memory.get('search:popular');
  return popular.trending.slice(0, limit);
}

// Search analytics
async function getSearchAnalytics(
  userId: string
): Promise<{
  total_searches: number;
  unique_destinations: number;
  conversion_rate: number;
  avg_budget: number;
}> {
  const index = await memory.get(`search:user:${userId}:index`);
  return index.stats;
}
```

---

## Popular Searches Update

### Update Algorithm

```typescript
async function updatePopularSearches(
  destination: string
): Promise<void> {
  await memory.transaction(async (tx) => {
    const popular = await tx.get('search:popular');
    
    // Update global
    const globalEntry = popular.global.find(
      e => e.destination === destination
    );
    
    if (globalEntry) {
      globalEntry.search_count++;
    } else {
      popular.global.push({
        destination,
        search_count: 1,
        avg_budget: 0,
        trend: 'rising'
      });
    }
    
    // Sort by search count
    popular.global.sort((a, b) => b.search_count - a.search_count);
    
    // Update trending (last 7 days)
    await updateTrending(popular);
    
    popular.updated_at = Date.now();
    await tx.set('search:popular', popular);
  });
}

async function updateTrending(
  popular: PopularSearches
): Promise<void> {
  const sevenDaysAgo = Date.now() - 604800000;
  
  // Get recent searches
  const recentSearches = await memory.scan(
    'search:*',
    { filter: { timestamp: { $gte: sevenDaysAgo } } }
  );
  
  // Count by destination
  const counts: Record<string, number> = {};
  for (const search of recentSearches) {
    counts[search.query.destination] =
      (counts[search.query.destination] || 0) + 1;
  }
  
  // Update trending
  popular.trending = Object.entries(counts)
    .map(([destination, search_count]) => ({
      destination,
      search_count,
      growth_rate: calculateGrowthRate(destination, counts)
    }))
    .sort((a, b) => b.search_count - a.search_count)
    .slice(0, 20);
}
```

---

## Cleanup Strategy

### Old Search Cleanup

```typescript
async function cleanupOldSearches(): Promise<number> {
  const pattern = 'search:srch_*';
  let cursor = 0;
  let cleaned = 0;
  const thirtyDaysAgo = Date.now() - 2592000000;
  
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor, 'MATCH', pattern, 'COUNT', 100
    );
    cursor = nextCursor;
    
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -2) {
        await redis.del(key);
        cleaned++;
      }
    }
  } while (cursor !== 0);
  
  return cleaned;
}
```

---

## Monitoring

### Metrics

| Metric | Description |
|--------|-------------|
| `search.total_searches` | Total searches recorded |
| `search.unique_users` | Unique users searching |
| `search.avg_results` | Average results per search |
| `search.conversion_rate` | Searches → bookings rate |
| `search.popular_destinations` | Top destinations count |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Search Volume | > 1000 searches/hour | Info |
| Low Conversion | < 1% conversion rate | Warning |
| Stale Popular Data | Updated > 1 hour ago | Warning |
