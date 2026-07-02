# Research Cache

> Destination research and travel information caching.

---

## Purpose

Research cache stores:
- Destination information
- Visa requirements
- Weather data
- Local attractions
- Travel tips

---

## Data Schema

### Destination Research

```typescript
interface DestinationResearch {
  research_id: string;
  
  // Destination
  destination: {
    city: string;
    country: string;
    region?: string;
  };
  
  // Information
  info: {
    overview: string;
    best_time_to_visit: string;
    language: string;
    currency: string;
    timezone: string;
    emergency_numbers: Record<string, string>;
  };
  
  // Costs
  costs: {
    avg_daily_budget: number;
    currency: string;
    breakdown: {
      accommodation: number;
      food: number;
      transport: number;
      activities: number;
    };
  };
  
  // Attractions
  attractions: {
    name: string;
    type: string;
    rating?: number;
    description: string;
  }[];
  
  // Tips
  tips: {
    category: string;
    tip: string;
    importance: 'high' | 'medium' | 'low';
  }[];
  
  // Source
  source: string;
  confidence: number;
  
  // Metadata
  timestamp: number;
}
```

**Key Pattern**: `cache:research:destination:{city}:{country}`
**TTL**: 30 days
**Size**: ~10KB per destination

---

### Visa Information

```typescript
interface VisaInfo {
  visa_id: string;
  
  // Route
  from_country: string;
  to_country: string;
  
  // Requirements
  required: boolean;
  type?: string;
  duration_days?: number;
  
  // Documents
  documents: string[];
  
  // Process
  process: {
    steps: string[];
    processing_time: string;
    cost?: number;
    currency?: string;
  };
  
  // Notes
  notes: string[];
  
  // Source
  source: string;
  last_verified: number;
}
```

**Key Pattern**: `cache:research:visa:{from}:{to}`
**TTL**: 90 days
**Size**: ~3KB

---

### Weather Data

```typescript
interface WeatherData {
  weather_id: string;
  
  // Location
  destination: string;
  
  // Current weather
  current: {
    temperature: number;
    feels_like: number;
    humidity: number;
    condition: string;
    wind_speed: number;
    icon: string;
  };
  
  // Forecast
  forecast: {
    date: string;
    high: number;
    low: number;
    condition: string;
    precipitation_chance: number;
  }[];
  
  // Seasonal averages
  seasonal: {
    month: number;
    avg_high: number;
    avg_low: number;
    rainy_days: number;
  }[];
  
  // Source
  source: string;
  timestamp: number;
}
```

**Key Pattern**: `cache:research:weather:{destination}`
**TTL**: 24 hours
**Size**: ~5KB

---

## Access Patterns

### Store Research

```typescript
async function storeDestinationResearch(
  research: DestinationResearch
): Promise<void> {
  const key = `cache:research:destination:${research.destination.city}:${research.destination.country}`;
  
  await memory.set(key, research, { ttl: 2592000 });  // 30 days
}

// Get research
async function getDestinationResearch(
  city: string,
  country: string
): Promise<DestinationResearch | null> {
  return memory.get(
    `cache:research:destination:${city}:${country}`
  );
}

// Store visa info
async function storeVisaInfo(visa: VisaInfo): Promise<void> {
  const key = `cache:research:visa:${visa.from_country}:${visa.to_country}`;
  
  await memory.set(key, visa, { ttl: 7776000 });  // 90 days
}

// Get visa info
async function getVisaInfo(
  fromCountry: string,
  toCountry: string
): Promise<VisaInfo | null> {
  return memory.get(
    `cache:research:visa:${fromCountry}:${toCountry}`
  );
}

// Store weather
async function storeWeatherData(weather: WeatherData): Promise<void> {
  const key = `cache:research:weather:${weather.destination}`;
  
  await memory.set(key, weather, { ttl: 86400 });  // 24 hours
}

// Get weather
async function getWeatherData(
  destination: string
): Promise<WeatherData | null> {
  return memory.get(`cache:research:weather:${destination}`);
}
```

---

## Cleanup

### Old Research Cleanup

```typescript
async function cleanupOldResearch(): Promise<number> {
  const pattern = 'cache:research:*';
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
| `research_cache.destinations` | Cached destinations |
| `research_cache.visa_infos` | Cached visa infos |
| `research_cache.weather_entries` | Cached weather data |
| `research_cache.cache_hit_rate` | Cache hit rate |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Stale Weather | Weather > 24h old | Warning |
| Low Confidence | Research confidence < 70% | Warning |
| High Memory | > 200MB used | Warning |
