# Shared Memory Engine

> Production-grade memory system for concurrent multi-agent travel AI.
> Sub-millisecond access, automatic expiration, conflict resolution, and disaster recovery.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MEMORY ENGINE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Long-Term     │  │   Short-Term    │  │  Conversation   │     │
│  │   Memory        │  │   Memory        │  │  Memory         │     │
│  │                 │  │                 │  │                 │     │
│  │  - User prefs   │  │  - Session      │  │  - Chat history │     │
│  │  - Trip history │  │  - Agent state  │  │  - Context      │     │
│  │  - Learnings    │  │  - Temp data    │  │  - Preferences  │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Trip Memory   │  │  Search History │  │  Cache Layer    │     │
│  │                 │  │                 │  │                 │     │
│  │  - Itineraries  │  │  - Past queries │  │  - Price cache  │     │
│  │  - Bookings     │  │  - Results      │  │  - Hotel cache  │     │
│  │  - Preferences  │  │  - Patterns     │  │  - Image cache  │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                     SYNCHRONIZATION LAYER                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Lock Manager   │  │  Conflict       │  │  Expiration     │     │
│  │                 │  │  Resolution     │  │  Manager        │     │
│  │  - Read locks   │  │  - Last-write   │  │  - TTL          │     │
│  │  - Write locks  │  │  - Merge        │  │  - Cleanup      │     │
│  │  - Granular     │  │  - Version      │  │  - Archival     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                     PERSISTENCE LAYER                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Serialization  │  │  Recovery       │  │  Backup         │     │
│  │                 │  │                 │  │                 │     │
│  │  - JSON         │  │  - WAL          │  │  - Snapshots    │     │
│  │  - Binary       │  │  - Checkpoint   │  │  - Replication  │     │
│  │  - Compressed   │  │  - Rollback     │  │  - DR           │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Memory Types

| Type | Purpose | TTL | Persistence | Access Pattern |
|------|---------|-----|-------------|----------------|
| **Long-Term** | Permanent user data | Never | Redis + S3 | Read-heavy |
| **Short-Term** | Session state | 24h | Redis | Read/Write |
| **Conversation** | Chat history | 7d | Redis + DB | Append-only |
| **Trip** | Trip data | 90d | Redis + S3 | Read/Write |
| **Price Cache** | Price data | 1h | Redis | Read-heavy |
| **Hotel Cache** | Hotel data | 6h | Redis | Read-heavy |
| **Image Cache** | Image URLs | 24h | Redis | Read-heavy |
| **Validation Cache** | Validation results | 1h | Redis | Read-heavy |
| **Research Cache** | Research data | 24h | Redis | Read-heavy |
| **Search History** | Past searches | 30d | Redis + DB | Append-only |

---

## Key Design Decisions

### 1. Redis as Primary Store
- **Latency**: Sub-millisecond reads
- **Throughput**: 100K+ ops/second
- **Persistence**: AOF + RDB
- **Clustering**: Redis Cluster for horizontal scaling

### 2. Write-Ahead Logging (WAL)
- All mutations logged before application
- Enables crash recovery
- Supports point-in-time recovery

### 3. Optimistic Locking
- Version-based conflict detection
- No blocking reads
- Automatic merge for non-conflicting changes

### 4. Lazy Expiration
- TTL checked on access
- Background cleanup for memory management
- Graceful degradation on expiration

---

## API Interface

### Core Operations

```typescript
interface MemoryEngine {
  // Basic CRUD
  get(key: string): Promise<MemoryEntry | null>;
  set(key: string, value: any, options?: SetOptions): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  
  // Atomic operations
  increment(key: string, amount?: number): Promise<number>;
  decrement(key: string, amount?: number): Promise<number>;
  compareAndSwap(key: string, expected: any, desired: any): Promise<boolean>;
  
  // Batch operations
  mget(keys: string[]): Promise<(MemoryEntry | null)[]>;
  mset(entries: Record<string, any>): Promise<void>;
  mdelete(keys: string[]): Promise<void>;
  
  // Search
  search(pattern: string, options?: SearchOptions): Promise<MemoryEntry[]>;
  
  // Expiration
  ttl(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  persist(key: string): Promise<void>;
  
  // Transaction
  transaction(fn: (tx: Transaction) => Promise<void>): Promise<void>;
}
```

### Set Options

```typescript
interface SetOptions {
  ttl?: number;           // Time to live in seconds
  nx?: boolean;           // Only set if not exists
  xx?: boolean;           // Only set if exists
  version?: number;       // For optimistic locking
  serialize?: SerializeFormat;  // Serialization format
  compress?: boolean;     // Enable compression
}
```

### Search Options

```typescript
interface SearchOptions {
  limit?: number;
  offset?: number;
  sort?: SortOptions;
  filter?: FilterOptions;
}
```

---

## Synchronization Strategy

### Read-Write Locks

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCK TYPES                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  READ LOCK (Shared)                                         │
│  ─────────────────                                          │
│  - Multiple readers allowed                                │
│  - No writers during read                                  │
│  - Non-blocking                                            │
│                                                              │
│  WRITE LOCK (Exclusive)                                    │
│  ──────────────────                                        │
│  - Single writer only                                      │
│  - No readers during write                                 │
│  - Blocking with timeout                                   │
│                                                              │
│  GRANULAR LOCKS                                             │
│  ─────────────                                             │
│  - Field-level locking                                     │
│  - Reduces contention                                      │
│  - Better concurrency                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Lock Acquisition Order

1. Always acquire locks in consistent order (key hash)
2. Never hold read lock while acquiring write lock
3. Use timeout to prevent deadlocks
4. Automatic lock release on client disconnect

---

## Conflict Resolution

### Strategies

| Strategy | Use Case | Implementation |
|----------|----------|----------------|
| **Last-Write-Wins** | Simple data | Timestamp comparison |
| **Merge** | Complex objects | Field-level merge |
| **Version** | Critical data | Version vector |
| **Custom** | Domain-specific | User-defined rules |

### Conflict Detection

```typescript
interface ConflictDetection {
  version: number;        // Current version
  lastModified: number;   // Timestamp
  modifiedBy: string;     // Agent ID
  checksum: string;       // Data integrity
}
```

### Resolution Process

1. Detect conflict on write
2. Compare versions/timestamps
3. Apply resolution strategy
4. Log conflict for audit
5. Notify affected agents

---

## Expiration Management

### TTL Strategy

| Memory Type | TTL | Cleanup Strategy |
|-------------|-----|------------------|
| Long-Term | Never | Manual archival |
| Short-Term | 24h | Lazy + background |
| Conversation | 7d | Background cleanup |
| Trip | 90d | Archive to S3 |
| Caches | 1-24h | Lazy expiration |
| Search History | 30d | Archive old searches |

### Cleanup Process

1. **Lazy Check**: On access, check TTL
2. **Background Sweep**: Periodic cleanup of expired keys
3. **Memory Pressure**: Aggressive cleanup when memory high
4. **Archival**: Move expired data to cold storage

---

## Serialization Formats

| Format | Use Case | Pros | Cons |
|--------|----------|------|------|
| **JSON** | Most data | Human-readable, flexible | Larger size |
| **MessagePack** | Performance | Compact, fast | Less readable |
| **Protocol Buffers** | Schema data | Very compact, typed | Schema required |
| **LZ4** | Large data | Fast compression | CPU overhead |

### Compression Strategy

| Data Size | Strategy |
|-----------|----------|
| < 1KB | No compression |
| 1KB - 100KB | LZ4 fast compression |
| > 100KB | LZ4 high compression |

---

## Recovery Mechanisms

### Write-Ahead Logging (WAL)

```typescript
interface WALEntry {
  sequence: number;       // Monotonic sequence
  timestamp: number;      // When operation occurred
  operation: string;      // Operation type
  key: string;            // Target key
  value?: any;            // New value
  checksum: string;       // Integrity check
}
```

### Recovery Process

1. **Crash Detection**: Monitor for abnormal shutdown
2. **WAL Replay**: Replay logged operations
3. **Checkpoint Recovery**: Restore from last checkpoint
4. **Consistency Check**: Verify data integrity
5. **Agent Notification**: Notify agents of recovery

### Backup Strategy

| Frequency | Type | Retention |
|-----------|------|-----------|
| Real-time | WAL | 24h |
| Hourly | Incremental | 7d |
| Daily | Full snapshot | 30d |
| Weekly | Archive | 1y |

---

## Monitoring & Metrics

### Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `memory.ops.total` | Total operations | - |
| `memory.ops.per_second` | Operations per second | < 1000 |
| `memory.latency.p99` | 99th percentile latency | > 10ms |
| `memory.hits` | Cache hits | - |
| `memory.misses` | Cache misses | - |
| `memory.hit_rate` | Hit rate percentage | < 80% |
| `memory.memory_used` | Memory usage | > 80% |
| `memory.expired_total` | Total expired keys | - |
| `memory.conflicts_total` | Total conflicts | - |
| `memory.recovery_total` | Recovery operations | > 0 |

### Health Check

```typescript
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  memory_usage: number;
  connected: boolean;
  replication_lag?: number;
}
```

---

## Configuration

### Redis Configuration

```yaml
redis:
  host: localhost
  port: 6379
  password: ${REDIS_PASSWORD}
  database: 0
  max_connections: 100
  timeout: 5000
  retry_attempts: 3
  retry_delay: 1000
  
  # Cluster
  cluster:
    enabled: false
    nodes:
      - host: redis-node-1
        port: 6379
      - host: redis-node-2
        port: 6379
      - host: redis-node-3
        port: 6379
  
  # Persistence
  persistence:
    aof: true
    rdb: true
    aof_interval: 1000
    
  # Memory
  memory:
    max_memory: 1gb
    max_memory_policy: allkeys-lru
```

### Memory Configuration

```yaml
memory:
  # Long-term
  long_term:
    enabled: true
    ttl: -1  # Never expires
    
  # Short-term
  short_term:
    enabled: true
    ttl: 86400  # 24 hours
    
  # Conversation
  conversation:
    enabled: true
    ttl: 604800  # 7 days
    max_messages: 1000
    
  # Trip
  trip:
    enabled: true
    ttl: 7776000  # 90 days
    
  # Caches
  caches:
    price:
      ttl: 3600  # 1 hour
      max_size: 10000
    hotel:
      ttl: 21600  # 6 hours
      max_size: 5000
    image:
      ttl: 86400  # 24 hours
      max_size: 20000
    validation:
      ttl: 3600  # 1 hour
      max_size: 1000
    research:
      ttl: 86400  # 24 hours
      max_size: 5000
      
  # Search history
  search_history:
    enabled: true
    ttl: 2592000  # 30 days
    max_entries: 10000
```

---

## Usage Examples

### Basic Operations

```typescript
// Initialize memory engine
const memory = new MemoryEngine(config);

// Set a value
await memory.set('user:123:preferences', {
  budget: 'moderate',
  interests: ['beach', 'culture'],
  dietary: ['vegetarian']
}, { ttl: 86400 });

// Get a value
const prefs = await memory.get('user:123:preferences');

// Delete a value
await memory.delete('user:123:preferences');
```

### Atomic Operations

```typescript
// Compare and swap
const success = await memory.compareAndSwap(
  'hotel:availability:456',
  expectedVersion,
  newAvailability
);

// Increment
const count = await memory.increment('search:count:today');
```

### Batch Operations

```typescript
// Get multiple values
const hotels = await memory.mget([
  'hotel:123',
  'hotel:456',
  'hotel:789'
]);

// Set multiple values
await memory.mset({
  'price:hotel:123': priceData1,
  'price:hotel:456': priceData2
});
```

### Transactions

```typescript
await memory.transaction(async (tx) => {
  const hotel = await tx.get('hotel:123');
  const availability = await tx.get('availability:123');
  
  if (availability.rooms > 0) {
    await tx.set('availability:123', availability.rooms - 1);
    await tx.set('booking:789', { hotelId: '123', userId: '456' });
  }
});
```

### Search

```typescript
// Search with pattern
const results = await memory.search('hotel:*', {
  limit: 10,
  sort: { field: 'price', order: 'asc' },
  filter: { star_rating: { $gte: 4 } }
});
```

---

## Agent Integration

### Memory Access Pattern

```typescript
// Agent initializes with memory client
class HotelAgent {
  private memory: MemoryClient;
  
  constructor(memory: MemoryClient) {
    this.memory = memory;
  }
  
  async search(params: SearchParams) {
    // Check cache first
    const cacheKey = `cache:hotel:${hashParams(params)}`;
    const cached = await this.memory.get(cacheKey);
    if (cached) return cached;
    
    // Fetch from providers
    const results = await this.fetchFromProviders(params);
    
    // Cache results
    await this.memory.set(cacheKey, results, { ttl: 3600 });
    
    // Store in search history
    await this.memory.append('search:history', {
      type: 'hotel',
      params,
      timestamp: Date.now()
    });
    
    return results;
  }
}
```

### Concurrent Agent Access

```typescript
// Multiple agents can access memory simultaneously
const [hotelData, flightData, activityData] = await Promise.all([
  memory.get('trip:123:hotels'),
  memory.get('trip:123:flights'),
  memory.get('trip:123:activities')
]);

// Agents can write concurrently with conflict resolution
await Promise.all([
  memory.set('trip:123:hotel:selected', hotel1, { version: 1 }),
  memory.set('trip:123:flight:selected', flight1, { version: 1 })
]);
```

---

## Disaster Recovery

### Recovery Procedures

1. **Redis Failure**: Failover to replica
2. **Data Corruption**: Restore from WAL + checkpoint
3. **Network Partition**: Use local cache, sync when reconnected
4. **Full Outage**: Restore from S3 backup

### RPO/RTO Targets

| Metric | Target |
|--------|--------|
| RPO (Recovery Point Objective) | < 1 minute |
| RTO (Recovery Time Objective) | < 5 minutes |

---

## Security

### Data Protection

- Encryption at rest (Redis AES-256)
- Encryption in transit (TLS 1.3)
- Access control (Redis ACL)
- Audit logging

### Sensitive Data

```typescript
// Automatic PII masking
await memory.set('user:123:passport', passportData, {
  encrypt: true,
  mask: ['passportNumber', 'nationality']
});
```

---

## File Structure

```
memory/
├── MEMORY_ENGINE.md           # This file
├── LONG_TERM_MEMORY.md        # Persistent storage
├── SHORT_TERM_MEMORY.md       # Session storage
├── CONVERSATION_MEMORY.md     # Chat history
├── TRIP_MEMORY.md             # Trip data
├── SEARCH_HISTORY.md          # Search tracking
├── SYNCHRONIZATION.md         # Concurrent access
├── CONFLICT_RESOLUTION.md     # Conflict handling
├── EXPIRATION.md              # TTL management
├── SERIALIZATION.md           # Data formats
├── RECOVERY.md                # Disaster recovery
└── CACHES/
    ├── PRICE_CACHE.md         # Price data
    ├── HOTEL_CACHE.md         # Hotel data
    ├── IMAGE_CACHE.md         # Image URLs
    ├── VALIDATION_CACHE.md    # Validation results
    └── RESEARCH_CACHE.md      # Research data
```

---

## Implementation Checklist

- [ ] Redis client setup with connection pooling
- [ ] WAL implementation for crash recovery
- [ ] Lock manager for concurrent access
- [ ] Conflict resolution engine
- [ ] TTL manager with lazy expiration
- [ ] Serialization/deserialization layer
- [ ] Compression for large values
- [ ] Monitoring and metrics
- [ ] Health check endpoint
- [ ] Backup and recovery procedures
- [ ] Security hardening
- [ ] Load testing
- [ ] Documentation
