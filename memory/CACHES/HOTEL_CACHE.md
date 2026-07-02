# Hotel Cache

> Hotel search results and availability caching.

---

## Purpose

Hotel cache stores:
- Search results
- Availability data
- Hotel details
- Room information

---

## Data Schema

### Hotel Search Cache

```typescript
interface HotelSearchCache {
  cache_id: string;
  
  // Search parameters
  query: {
    destination: string;
    checkin: string;
    checkout: string;
    rooms: number;
    guests: number;
    filters?: Record<string, any>;
  };
  
  // Results
  results: {
    hotels: HotelResult[];
    total: number;
    page: number;
    limit: number;
  };
  
  // Metadata
  provider: string;
  timestamp: number;
  ttl: number;
}
```

**Key Pattern**: `cache:hotel:search:{cache_id}`
**TTL**: 1 hour
**Size**: ~50KB per search

---

### Hotel Result

```typescript
interface HotelResult {
  hotel_id: string;
  provider: string;
  
  // Basic info
  name: string;
  star_rating: number;
  address: string;
  
  // Pricing
  price: {
    amount: number;
    currency: string;
    per_night: number;
    total: number;
    taxes: number;
  };
  
  // Availability
  available: boolean;
  rooms_left?: number;
  
  // Rating
  rating: {
    score: number;
    reviews: number;
  };
  
  // Location
  location: {
    lat: number;
    lng: number;
  };
  
  // Images
  images: string[];
}
```

**Key Pattern**: `cache:hotel:detail:{hotel_id}`
**TTL**: 24 hours
**Size**: ~5KB per hotel

---

### Hotel Availability

```typescript
interface HotelAvailability {
  hotel_id: string;
  
  // Availability by date
  availability: {
    date: string;
    available: boolean;
    rooms_left: number;
    price: number;
  }[];
  
  // Last checked
  last_checked: number;
}
```

**Key Pattern**: `cache:hotel:availability:{hotel_id}`
**TTL**: 1 hour
**Size**: ~2KB

---

## Access Patterns

### Store Search Results

```typescript
async function storeHotelSearch(
  query: HotelSearchCache['query'],
  results: HotelSearchCache['results'],
  provider: string
): Promise<void> {
  const cacheId = generateCacheId(query);
  
  const cache: HotelSearchCache = {
    cache_id: cacheId,
    query,
    results,
    provider,
    timestamp: Date.now(),
    ttl: 3600  // 1 hour
  };
  
  await memory.set(
    `cache:hotel:search:${cacheId}`,
    cache,
    { ttl: cache.ttl }
  );
  
  // Store individual hotel details
  for (const hotel of results.hotels) {
    await memory.set(
      `cache:hotel:detail:${hotel.hotel_id}`,
      hotel,
      { ttl: 86400 }  // 24 hours
    );
  }
}

function generateCacheId(query: any): string {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(query));
  return hash.digest('hex').substring(0, 16);
}
```

### Get Search Results

```typescript
async function getHotelSearch(
  query: HotelSearchCache['query']
): Promise<HotelSearchCache | null> {
  const cacheId = generateCacheId(query);
  return memory.get(`cache:hotel:search:${cacheId}`);
}

async function getHotelDetail(
  hotelId: string
): Promise<HotelResult | null> {
  return memory.get(`cache:hotel:detail:${hotelId}`);
}

async function getHotelAvailability(
  hotelId: string
): Promise<HotelAvailability | null> {
  return memory.get(`cache:hotel:availability:${hotelId}`);
}
```

### Check Availability

```typescript
async function checkAvailability(
  hotelId: string,
  checkin: string,
  checkout: string
): Promise<boolean> {
  const availability = await getHotelAvailability(hotelId);
  
  if (!availability) return false;
  
  const dates = getDatesBetween(checkin, checkout);
  
  return dates.every(date => {
    const dayAvailability = availability.availability.find(
      a => a.date === date
    );
    return dayAvailability?.available ?? false;
  });
}
```

---

## Cleanup

### Old Search Cleanup

```typescript
async function cleanupOldHotelSearches(): Promise<number> {
  const pattern = 'cache:hotel:search:*';
  let cursor = 0;
  let cleaned = 0;
  
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
| `hotel_cache.total_searches` | Cached searches |
| `hotel_cache.total_hotels` | Cached hotels |
| `hotel_cache.cache_hit_rate` | Cache hit rate |
| `hotel_cache.avg_results` | Avg results per search |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Low Cache Hit Rate | < 60% hit rate | Warning |
| Stale Data | Searches > 1h old | Warning |
| High Memory | > 500MB used | Warning |
