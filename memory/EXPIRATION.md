# Expiration

> Memory lifecycle management with TTL, lazy expiration, and background cleanup.

---

## Purpose

Expiration manages:
- Automatic data cleanup
- TTL enforcement
- Memory pressure handling
- Resource optimization

---

## Expiration Policies

### Per-Memory-Type TTL

| Memory Type | TTL | Strategy |
|-------------|-----|----------|
| Long-Term | Never | Manual cleanup |
| Short-Term | 24 hours | Lazy + Background |
| Conversation | 7 days | Lazy + Background |
| Trip | Never | Manual cleanup |
| Price Cache | 24 hours | Lazy |
| Hotel Cache | 1 hour | Lazy |
| Image Cache | 7 days | Lazy |
| Validation Cache | 24 hours | Lazy |
| Research Cache | 7 days | Lazy |
| Search History | 30 days | Background |

---

## Lazy Expiration

### Access-Time Check

```typescript
async function getWithLazyExpiration<T>(
  key: string
): Promise<T | null> {
  const value = await redis.get(key);
  
  if (!value) return null;
  
  // Check TTL on access
  const ttl = await redis.ttl(key);
  
  if (ttl === -2) {
    // Key already expired (race condition possible)
    await redis.del(key);
    return null;
  }
  
  if (ttl === -1) {
    // Key exists but no TTL set
    // Apply default TTL based on key prefix
    await applyDefaultTTL(key);
  }
  
  return deserialize(value);
}

async function applyDefaultTTL(key: string): Promise<void> {
  const prefix = key.split(':')[0];
  const ttlMap: Record<string, number> = {
    'st': 86400,      // Short-term: 24h
    'conv': 604800,   // Conversation: 7 days
    'cache': {
      'price': 86400,
      'hotel': 3600,
      'image': 604800,
      'validation': 86400,
      'research': 604800
    }[key.split(':')[1]] || 3600,
    'search': 2592000  // Search: 30 days
  };
  
  if (ttlMap[prefix]) {
    await redis.expire(key, ttlMap[prefix]);
  }
}
```

---

## Background Cleanup

### Sweep Process

```typescript
class ExpirationSweep {
  private isRunning = false;
  private interval: NodeJS.Timeout;
  
  constructor(
    private redis: Redis,
    private config: SweepConfig
  ) {}
  
  start(): void {
    this.interval = setInterval(
      () => this.sweep(),
      this.config.intervalMs
    );
  }
  
  stop(): void {
    clearInterval(this.interval);
  }
  
  async sweep(): Promise<SweepResult> {
    if (this.isRunning) {
      return { skipped: true, reason: 'already running' };
    }
    
    this.isRunning = true;
    const startTime = Date.now();
    let cleaned = 0;
    
    try {
      // Sweep each memory type
      for (const [prefix, ttl] of Object.entries(this.config.ttlMap)) {
        const cleanedCount = await this.sweepPrefix(prefix, ttl);
        cleaned += cleanedCount;
      }
      
      return {
        cleaned,
        duration_ms: Date.now() - startTime
      };
    } finally {
      this.isRunning = false;
    }
  }
  
  private async sweepPrefix(
    prefix: string,
    maxAge: number
  ): Promise<number> {
    const pattern = `${prefix}:*`;
    let cursor = 0;
    let cleaned = 0;
    const cutoff = Date.now() - maxAge;
    
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        
        // Already expired
        if (ttl === -2) {
          await this.redis.del(key);
          cleaned++;
          continue;
        }
        
        // Check creation time
        const createdAt = await this.getCreatedAt(key);
        if (createdAt && createdAt < cutoff) {
          await this.redis.del(key);
          cleaned++;
        }
      }
    } while (cursor !== 0);
    
    return cleaned;
  }
}
```

---

## Memory Pressure Handling

### Pressure Levels

```typescript
interface MemoryPressure {
  level: 'low' | 'medium' | 'high' | 'critical';
  usage_percent: number;
  available_mb: number;
  recommendations: string[];
}

async function checkMemoryPressure(): Promise<MemoryPressure> {
  const info = await redis.info('memory');
  const usedMemory = parseInt(info.used_memory);
  const maxMemory = parseInt(info.maxmemory);
  const usagePercent = (usedMemory / maxMemory) * 100;
  
  let level: MemoryPressure['level'];
  let recommendations: string[] = [];
  
  if (usagePercent < 50) {
    level = 'low';
  } else if (usagePercent < 70) {
    level = 'medium';
    recommendations.push('Consider increasing cleanup frequency');
  } else if (usagePercent < 85) {
    level = 'high';
    recommendations.push('Increase cleanup frequency');
    recommendations.push('Evict old short-term data');
  } else {
    level = 'critical';
    recommendations.push('Immediate cleanup required');
    recommendations.push('Evict all non-essential data');
    recommendations.push('Scale Redis memory');
  }
  
  return {
    level,
    usage_percent: usagePercent,
    available_mb: (maxMemory - usedMemory) / 1024 / 1024,
    recommendations
  };
}
```

### Pressure Response

```typescript
async function handleMemoryPressure(pressure: MemoryPressure): Promise<void> {
  switch (pressure.level) {
    case 'high':
      // Aggressive cleanup
      await cleanupShortTerm(3600);  // 1 hour
      await cleanupConversations(604800);  // 7 days
      break;
      
    case 'critical':
      // Emergency cleanup
      await cleanupShortTerm(0);  // All
      await cleanupConversations(86400);  // 1 day
      await cleanupCaches();
      await alertOps('Memory critical', pressure);
      break;
  }
}
```

---

## TTL Management

### Set TTL

```typescript
async function setTTL(
  key: string,
  ttl: number
): Promise<void> {
  if (ttl <= 0) {
    // No expiration
    await redis.persist(key);
  } else {
    await redis.expire(key, ttl);
  }
}

// Get TTL
async function getTTL(key: string): Promise<number> {
  return redis.ttl(key);
}

// Extend TTL
async function extendTTL(
  key: string,
  additionalSeconds: number
): Promise<void> {
  const currentTTL = await redis.ttl(key);
  if (currentTTL > 0) {
    await redis.expire(key, currentTTL + additionalSeconds);
  }
}

// Prevent expiration
async function preventExpiration(key: string): Promise<void> {
  await redis.persist(key);
}
```

---

## Monitoring

### Metrics

| Metric | Description |
|--------|-------------|
| `expiration.sweep_runs` | Total sweep runs |
| `expiration.keys_cleaned` | Total keys cleaned |
| `expiration.avg_sweep_time` | Avg sweep duration |
| `expiration.memory_pressure` | Current pressure level |
| `expiration.ttl_violations` | Keys that expired early |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Cleanup Volume | > 10000 keys per sweep | Warning |
| Slow Sweep | Sweep takes > 30s | Warning |
| Memory Pressure High | Usage > 70% | Warning |
| Memory Pressure Critical | Usage > 85% | Critical |
