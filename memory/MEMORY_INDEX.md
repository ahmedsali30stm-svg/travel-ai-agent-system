# Memory System Index

> Master index for the complete memory architecture.

---

## Overview

The memory system provides persistent, session-based, and cached storage for the travel AI agent platform.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MEMORY SYSTEM                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        MEMORY ENGINE                                 │   │
│  │  - Synchronization  - Conflict Resolution  - Expiration             │   │
│  │  - Serialization    - Recovery            - Monitoring               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        MEMORY TYPES                                  │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │   │
│  │  │   LONG-TERM      │  │   SHORT-TERM     │  │   CONVERSATION  │    │   │
│  │  │   (Permanent)    │  │   (24h)          │  │   (7 days)      │    │   │
│  │  │                  │  │                  │  │                  │    │   │
│  │  │   - User Profile │  │   - Session      │  │   - Chat History│    │   │
│  │  │   - Trip History │  │   - Agent State  │  │   - Context     │    │   │
│  │  │   - Patterns     │  │   - Working Data │  │   - Summaries   │    │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐                          │   │
│  │  │   TRIP           │  │   SEARCH         │                          │   │
│  │  │   (Permanent)    │  │   HISTORY        │                          │   │
│  │  │                  │  │   (30 days)      │                          │   │
│  │  │   - Itineraries  │  │                  │                          │   │
│  │  │   - Bookings     │  │   - Queries      │                          │   │
│  │  │   - Feedback     │  │   - Patterns     │                          │   │
│  │  └─────────────────┘  └─────────────────┘                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CACHE LAYER                                  │   │
│  │                                                                      │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │   │
│  │  │   PRICE   │ │   HOTEL   │ │   IMAGE   │ │ VALIDATION│          │   │
│  │  │   (24h)   │ │   (1h)    │ │   (7d)    │ │   (24h)   │          │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘          │   │
│  │                                                                      │   │
│  │  ┌───────────┐                                                      │   │
│  │  │ RESEARCH  │                                                      │   │
│  │  │  (30d)    │                                                      │   │
│  │  └───────────┘                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files Index

### Core Memory Engine

| File | Purpose | Key Features |
|------|---------|--------------|
| `MEMORY_ENGINE.md` | Main memory engine | Orchestration, API, Monitoring |
| `LONG_TERM_MEMORY.md` | Persistent storage | User profiles, Trip history, Patterns |
| `SHORT_TERM_MEMORY.md` | Session storage | Agent state, Working data, Temporary |
| `CONVERSATION_MEMORY.md` | Chat history | Messages, Context, Summaries |
| `TRIP_MEMORY.md` | Trip lifecycle | Itineraries, Bookings, Feedback |
| `SEARCH_HISTORY.md` | Search tracking | Queries, Patterns, Analytics |

### Infrastructure

| File | Purpose | Key Features |
|------|---------|--------------|
| `SYNCHRONIZATION.md` | Multi-agent sync | Read-write locks, Consistency |
| `CONFLICT_RESOLUTION.md` | Conflict handling | LWW, Merge, Version-based |
| `EXPIRATION.md` | TTL management | Lazy expiration, Background cleanup |
| `SERIALIZATION.md` | Data formats | JSON, MessagePack, Compression |
| `RECOVERY.md` | Crash recovery | WAL, Checkpointing, Backup |

### Cache Layer

| File | Purpose | TTL |
|------|---------|-----|
| `CACHES/PRICE_CACHE.md` | Price tracking | 24 hours |
| `CACHES/HOTEL_CACHE.md` | Hotel search | 1 hour |
| `CACHES/IMAGE_CACHE.md` | Image storage | 7 days |
| `CACHES/VALIDATION_CACHE.md` | Validation results | 24 hours |
| `CACHES/RESEARCH_CACHE.md` | Destination info | 30 days |

---

## Key Patterns

### Redis Key Patterns

| Prefix | Memory Type | TTL |
|--------|-------------|-----|
| `lt:` | Long-term memory | Never |
| `st:` | Short-term memory | 24 hours |
| `conv:` | Conversation | 7 days |
| `trip:` | Trip records | Never |
| `search:` | Search history | 30 days |
| `cache:price:` | Price cache | 24 hours |
| `cache:hotel:` | Hotel cache | 1 hour |
| `cache:image:` | Image cache | 7 days |
| `cache:validation:` | Validation cache | 24 hours |
| `cache:research:` | Research cache | 30 days |

---

## API Reference

### Core Operations

```typescript
// Get
await memory.get(key);

// Set
await memory.set(key, value, { ttl });

// Delete
await memory.del(key);

// Transaction
await memory.transaction(async (tx) => {
  const data = await tx.get(key);
  data.field = newValue;
  await tx.set(key, data);
});
```

### Synchronization

```typescript
// Read lock
const lock = await memory.acquireReadLock(key, agentId);
try {
  // Read operation
} finally {
  await lock.release();
}

// Write lock
const lock = await memory.acquireWriteLock(key, agentId);
try {
  // Write operation
} finally {
  await lock.release();
}
```

---

## Configuration

### Default TTLs

```yaml
memory:
  long_term:
    ttl: never
  short_term:
    ttl: 86400  # 24 hours
  conversation:
    ttl: 604800  # 7 days
  trip:
    ttl: never
  search:
    ttl: 2592000  # 30 days
  cache:
    price: 86400  # 24 hours
    hotel: 3600  # 1 hour
    image: 604800  # 7 days
    validation: 86400  # 24 hours
    research: 2592000  # 30 days
```

### Cleanup Schedule

```yaml
cleanup:
  short_term:
    interval: 3600  # 1 hour
  conversation:
    interval: 86400  # 1 day
  cache:
    interval: 3600  # 1 hour
  full_sweep:
    interval: 86400  # 1 day
```

---

## Monitoring

### Key Metrics

| Metric | Description |
|--------|-------------|
| `memory.total_keys` | Total keys across all types |
| `memory.total_memory_mb` | Total memory usage |
| `memory.cache_hit_rate` | Overall cache hit rate |
| `memory.expired_total` | Total expired keys |
| `memory.conflicts_total` | Total conflicts |

### Dashboards

- **Memory Overview**: Total usage, key counts, hit rates
- **Cache Performance**: Per-cache hit rates, sizes
- **Sync Operations**: Lock contention, conflicts
- **Cleanup Activity**: Keys cleaned, duration

---

## System Complete

### File Count Summary

| Category | Files |
|----------|-------|
| Core Memory | 6 files |
| Infrastructure | 5 files |
| Cache Layer | 5 files |
| **Total** | **16 files** |

### Documentation Coverage

- ✅ Architecture diagrams
- ✅ Data schemas (TypeScript)
- ✅ Storage structure (Redis)
- ✅ Access patterns (CRUD)
- ✅ Cleanup strategies
- ✅ Monitoring metrics
- ✅ Alert configurations
