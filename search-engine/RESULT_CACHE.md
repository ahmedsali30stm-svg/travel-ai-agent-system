# Result Cache

> High-performance caching system for search results.

---

## Overview

The Result Cache module provides fast access to previously fetched results, reducing API calls and improving response times.

---

## Cache Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RESULT CACHE ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         CACHE LAYERS                                       │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  L1 Cache (In-Memory)                                               │  │ │
│  │  │  ─────────────────────────────────────────────────────────────────  │  │ │
│  │  │  • Fastest access (< 1ms)                                          │  │ │
│  │  │  • Limited size (1000 entries)                                     │  │ │
│  │  │  • TTL: 5 minutes                                                  │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  L2 Cache (Redis)                                                   │  │ │
│  │  │  ─────────────────────────────────────────────────────────────────  │  │ │
│  │  │  • Fast access (< 5ms)                                             │  │ │
│  │  │  • Distributed (shared across instances)                           │  │ │
│  │  │  • TTL: 15 minutes                                                 │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  L3 Cache (Database)                                                │  │ │
│  │  │  ─────────────────────────────────────────────────────────────────  │  │ │
│  │  │  • Moderate access (< 50ms)                                        │  │ │
│  │  │  • Persistent storage                                              │  │ │
│  │  │  • TTL: 1 hour                                                     │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         CACHE OPERATIONS                                   │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  GET      │ │  SET      │ │  DELETE   │ │  INVALIDATE│               │ │
│  │  │  (Read)   │ │  (Write)  │ │  (Remove) │ │  (Clear)   │               │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  HIT      │ │  MISS     │ │  EXPIRE   │ │  EVICT    │                │ │
│  │  │  (Found)  │ │  (Not Found)│ │ (Timeout) │ │ (Full)    │               │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Cache Implementation

### 1. In-Memory Cache (L1)

```typescript
interface MemoryCache {
  // Get from cache
  get<T>(key: string): T | null;
  
  // Set in cache
  set<T>(key: string, value: T, ttl: number): void;
  
  // Delete from cache
  delete(key: string): void;
  
  // Clear all cache
  clear(): void;
  
  // Get cache stats
  getStats(): CacheStats;
}

// LRU Cache implementation
class LRUCache<T> implements MemoryCache {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private accessOrder: string[];
  
  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }
    
    // Update access order
    this.updateAccessOrder(key);
    
    return entry.value;
  }
  
  set<T>(key: string, value: T, ttl: number): void {
    // Check if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }
    
    // Add new entry
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    });
    
    // Update access order
    this.updateAccessOrder(key);
  }
  
  delete(key: string): void {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
  }
  
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
  
  private evict(): void {
    // Evict least recently used
    const leastUsed = this.accessOrder.shift();
    if (leastUsed) {
      this.cache.delete(leastUsed);
    }
  }
  
  private updateAccessOrder(key: string): void {
    // Remove from current position
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }
  
  getStats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.calculateMemoryUsage(),
    };
  }
}
```

---

### 2. Redis Cache (L2)

```typescript
interface RedisCache {
  // Get from cache
  get<T>(key: string): Promise<T | null>;
  
  // Set in cache
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  
  // Delete from cache
  delete(key: string): Promise<void>;
  
  // Get multiple keys
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  
  // Set multiple keys
  mset<T>(entries: { key: string; value: T; ttl: number }[]): Promise<void>;
}

// Redis cache implementation
class RedisCacheImpl implements RedisCache {
  private client: RedisClient;
  private prefix: string;
  
  constructor(config: RedisConfig) {
    this.client = new RedisClient(config);
    this.prefix = config.prefix || 'search:';
  }
  
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.prefix + key;
    const value = await this.client.get(fullKey);
    
    if (!value) {
      return null;
    }
    
    return JSON.parse(value);
  }
  
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const fullKey = this.prefix + key;
    const serialized = JSON.stringify(value);
    
    await this.client.setex(fullKey, ttl / 1000, serialized);
  }
  
  async delete(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    await this.client.del(fullKey);
  }
  
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const fullKeys = keys.map(k => this.prefix + k);
    const values = await this.client.mget(fullKeys);
    
    return values.map(v => v ? JSON.parse(v) : null);
  }
  
  async mset<T>(entries: { key: string; value: T; ttl: number }[]): Promise<void> {
    const pipeline = this.client.pipeline();
    
    for (const entry of entries) {
      const fullKey = this.prefix + entry.key;
      const serialized = JSON.stringify(entry.value);
      pipeline.setex(fullKey, entry.ttl / 1000, serialized);
    }
    
    await pipeline.exec();
  }
}
```

---

### 3. Cache Key Generation

```typescript
interface CacheKeyGenerator {
  // Generate cache key for search query
  generateSearchKey(query: SearchQuery): string;
  
  // Generate cache key for provider response
  generateProviderKey(
    provider: string,
    query: SearchQuery
  ): string;
  
  // Generate cache key for result
  generateResultKey(resultId: string): string;
}

// Cache key generation
function generateSearchKey(query: SearchQuery): string {
  const components = [
    query.type,
    query.destination?.city || '',
    query.destination?.country || '',
    query.checkin || '',
    query.checkout || '',
    query.guests?.adults || 0,
    query.guests?.children || 0,
    query.guests?.rooms || 0,
    JSON.stringify(query.filters || {}),
  ];
  
  const hash = createHash(components.join(':'));
  return `search:${hash}`;
}

function generateProviderKey(
  provider: string,
  query: SearchQuery
): string {
  const searchKey = generateSearchKey(query);
  return `provider:${provider}:${searchKey}`;
}

function generateResultKey(resultId: string): string {
  return `result:${resultId}`;
}
```

---

## Cache Strategies

### 1. Cache-Aside Pattern

```typescript
interface CacheAsidePattern {
  // Read through cache
  readThrough<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number
  ): Promise<T>;
  
  // Write through cache
  writeThrough<T>(
    key: string,
    value: T,
    ttl: number
  ): Promise<void>;
}

// Cache-aside implementation
async function readThrough<T>(
  key: string,
  loader: () => Promise<T>,
  ttl: number
): Promise<T> {
  // Try to get from cache
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Load from source
  const value = await loader();
  
  // Store in cache
  await cache.set(key, value, ttl);
  
  return value;
}
```

---

### 2. Write-Behind Pattern

```typescript
interface WriteBehindPattern {
  // Write to cache immediately, persist later
  writeBehind<T>(
    key: string,
    value: T,
    ttl: number,
    persist: (value: T) => Promise<void>
  ): Promise<void>;
}

// Write-behind implementation
async function writeBehind<T>(
  key: string,
  value: T,
  ttl: number,
  persist: (value: T) => Promise<void>
): Promise<void> {
  // Write to cache immediately
  await cache.set(key, value, ttl);
  
  // Persist in background
  setImmediate(async () => {
    try {
      await persist(value);
    } catch (error) {
      console.error('Background persistence failed:', error);
    }
  });
}
```

---

### 3. Refresh-Ahead Pattern

```typescript
interface RefreshAheadPattern {
  // Refresh cache before expiration
  refreshAhead<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number,
    refreshThreshold: number
  ): Promise<T>;
}

// Refresh-ahead implementation
async function refreshAhead<T>(
  key: string,
  loader: () => Promise<T>,
  ttl: number,
  refreshThreshold: number
): Promise<T> {
  // Try to get from cache
  const cached = await cache.get<T>(key);
  
  if (cached !== null) {
    // Check if refresh needed
    const entry = await cache.getEntry(key);
    if (entry && Date.now() > entry.expiresAt - refreshThreshold) {
      // Refresh in background
      setImmediate(async () => {
        try {
          const newValue = await loader();
          await cache.set(key, newValue, ttl);
        } catch (error) {
          console.error('Background refresh failed:', error);
        }
      });
    }
    
    return cached;
  }
  
  // Load from source
  const value = await loader();
  
  // Store in cache
  await cache.set(key, value, ttl);
  
  return value;
}
```

---

## Cache Invalidation

```typescript
interface CacheInvalidation {
  // Invalidate by key
  invalidate(key: string): Promise<void>;
  
  // Invalidate by pattern
  invalidatePattern(pattern: string): Promise<void>;
  
  // Invalidate by provider
  invalidateProvider(provider: string): Promise<void>;
  
  // Invalidate by destination
  invalidateDestination(destination: string): Promise<void>;
}

// Cache invalidation implementation
async function invalidateByPattern(pattern: string): Promise<void> {
  // Get all keys matching pattern
  const keys = await cache.keys(pattern);
  
  // Delete all matching keys
  for (const key of keys) {
    await cache.delete(key);
  }
}

async function invalidateByProvider(provider: string): Promise<void> {
  await invalidateByPattern(`provider:${provider}:*`);
}

async function invalidateByDestination(destination: string): Promise<void> {
  await invalidateByPattern(`*:${destination}:*`);
}
```

---

## Cache Statistics

```typescript
interface CacheStats {
  // Size info
  size: number;
  maxSize: number;
  
  // Hit/miss info
  hits: number;
  misses: number;
  hitRate: number;
  
  // Memory info
  memoryUsage: number;
  memoryLimit: number;
  
  // Performance info
  avgReadTime: number;
  avgWriteTime: number;
  
  // Eviction info
  evictions: number;
  expiredEntries: number;
}

// Calculate cache statistics
function calculateCacheStats(): CacheStats {
  const hits = cache.hits || 0;
  const misses = cache.misses || 0;
  const total = hits + misses;
  
  return {
    size: cache.size,
    maxSize: cache.maxSize,
    hits,
    misses,
    hitRate: total > 0 ? hits / total : 0,
    memoryUsage: cache.memoryUsage || 0,
    memoryLimit: cache.memoryLimit || 0,
    avgReadTime: cache.avgReadTime || 0,
    avgWriteTime: cache.avgWriteTime || 0,
    evictions: cache.evictions || 0,
    expiredEntries: cache.expiredEntries || 0,
  };
}
```

---

## Cache Configuration

```yaml
cache:
  # Enable cache
  enabled: true
  
  # L1 Cache (In-Memory)
  l1:
    enabled: true
    maxSize: 1000
    ttl: 300000 # 5 minutes
    strategy: lru
  
  # L2 Cache (Redis)
  l2:
    enabled: true
    host: localhost
    port: 6379
    password: ${REDIS_PASSWORD}
    database: 0
    prefix: search:
    ttl: 900000 # 15 minutes
    poolSize: 10
  
  # L3 Cache (Database)
  l3:
    enabled: true
    ttl: 3600000 # 1 hour
    cleanupInterval: 300000 # 5 minutes
  
  # Cache key generation
  keys:
    algorithm: sha256
    prefix: search
    separator: ':'
  
  # Cache invalidation
  invalidation:
    onProviderUpdate: true
    onPriceChange: true
    onAvailabilityChange: true
    onReviewUpdate: false
  
  # Cache statistics
  stats:
    enabled: true
    interval: 60000 # 1 minute
    logLevel: info
```
