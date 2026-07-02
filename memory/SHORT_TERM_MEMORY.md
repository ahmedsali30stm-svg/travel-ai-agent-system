# Short-Term Memory

> Session-based storage for active agent state and temporary data.
> Automatic expiration after 24 hours. Optimized for fast read/write.

---

## Purpose

Short-term memory stores data needed during a session:
- Agent execution state
- Intermediate results
- Temporary calculations
- Session context
- Working data

---

## Data Schema

### Session State

```typescript
interface SessionState {
  session_id: string;
  user_id: string;
  created_at: number;
  updated_at: number;
  expires_at: number;
  
  // Current request
  current_request: {
    request_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    started_at: number;
  };
  
  // Agent states
  agents: Record<string, AgentState>;
  
  // Working data
  working: {
    search_results: Record<string, any>;
    calculations: Record<string, any>;
    temporary: Record<string, any>;
  };
  
  // Context
  context: {
    destination: string;
    dates: { start: string; end: string };
    travelers: number;
    budget: number;
    preferences: Record<string, any>;
  };
  
  // Progress
  progress: {
    completed_steps: string[];
    current_step: string;
    total_steps: number;
    percentage: number;
  };
}
```

**Key Pattern**: `st:session:{session_id}`
**TTL**: 24 hours
**Size**: ~10KB per session

---

### Agent State

```typescript
interface AgentState {
  agent_id: string;
  status: 'idle' | 'working' | 'waiting' | 'error';
  started_at: number;
  
  // Current task
  current_task: {
    task_id: string;
    type: string;
    inputs: Record<string, any>;
  };
  
  // Results
  results: Record<string, any>;
  
  // Error state
  error?: {
    message: string;
    code: string;
    retry_count: number;
  };
  
  // Metrics
  metrics: {
    operations: number;
    duration_ms: number;
    memory_used: number;
  };
}
```

**Key Pattern**: `st:agent:{session_id}:{agent_id}`
**TTL**: 24 hours
**Size**: ~2KB per agent

---

### Working Data

```typescript
interface WorkingData {
  key: string;
  created_at: number;
  expires_at: number;
  
  // Data
  data: any;
  
  // Metadata
  metadata: {
    type: string;
    size: number;
    compressed: boolean;
  };
}
```

**Key Pattern**: `st:work:{session_id}:{key}`
**TTL**: 24 hours (configurable)
**Size**: Variable

---

### Temporary Calculations

```typescript
interface TempCalculation {
  calc_id: string;
  session_id: string;
  created_at: number;
  
  // Calculation
  operation: string;
  inputs: Record<string, any>;
  result: any;
  
  // Performance
  duration_ms: number;
  cached: boolean;
}
```

**Key Pattern**: `st:calc:{session_id}:{calc_id}`
**TTL**: 1 hour
**Size**: ~1KB per calculation

---

## Storage Architecture

### Redis Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    SHORT-TERM MEMORY                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Session 1                     Session 2                    │
│  ┌─────────────────────┐      ┌─────────────────────┐      │
│  │ st:session:sess_001  │      │ st:session:sess_002  │      │
│  │                     │      │                     │      │
│  │ st:agent:sess_001:  │      │ st:agent:sess_002:  │      │
│  │   hotel_03          │      │   flight_04         │      │
│  │   flight_04         │      │   activities_05     │      │
│  │   activities_05     │      │                     │      │
│  │                     │      │                     │      │
│  │ st:work:sess_001:   │      │ st:work:sess_002:   │      │
│  │   search_results    │      │   search_results    │      │
│  │   price_calc        │      │   price_calc        │      │
│  │                     │      │                     │      │
│  │ st:calc:sess_001:   │      │ st:calc:sess_002:   │      │
│  │   total_cost        │      │   total_cost        │      │
│  └─────────────────────┘      └─────────────────────┘      │
│                                                              │
│  Expiration: 24h                Expiration: 24h              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Memory Management

```typescript
interface MemoryManager {
  // Get session memory usage
  getSessionMemory(sessionId: string): Promise<number>;
  
  // Set memory limit per session
  setSessionLimit(sessionId: string, limit: number): Promise<void>;
  
  // Check memory pressure
  checkMemoryPressure(): Promise<{
    usage: number;
    pressure: 'low' | 'medium' | 'high' | 'critical';
  }>;
  
  // Evict old sessions
  evictSessions(strategy: 'lru' | 'lfu' | 'fifo'): Promise<number>;
}
```

---

## Access Patterns

### Read Operations

```typescript
// Get session state
const session = await shortTerm.get(`st:session:${sessionId}`);

// Get agent state
const agentState = await shortTerm.get(
  `st:agent:${sessionId}:${agentId}`
);

// Get working data
const results = await shortTerm.get(
  `st:work:${sessionId}:search_results`
);

// Get multiple values
const [session, agent1, agent2] = await shortTerm.mget([
  `st:session:${sessionId}`,
  `st:agent:${sessionId}:hotel_03`,
  `st:agent:${sessionId}:flight_04`
]);
```

### Write Operations

```typescript
// Create/update session
await shortTerm.set(`st:session:${sessionId}`, sessionState, {
  ttl: 86400  // 24 hours
});

// Update agent state
await shortTerm.set(
  `st:agent:${sessionId}:${agentId}`,
  agentState,
  { ttl: 86400 }
);

// Store working data
await shortTerm.set(
  `st:work:${sessionId}:search_results`,
  searchResults,
  { ttl: 86400 }
);

// Atomic update
await shortTerm.transaction(async (tx) => {
  const state = await tx.get(`st:session:${sessionId}`);
  state.progress.percentage += 10;
  await tx.set(`st:session:${sessionId}`, state);
});
```

### Cleanup Operations

```typescript
// Delete specific key
await shortTerm.delete(`st:work:${sessionId}:temp_data`);

// Delete all session data
await shortTerm.deletePattern(`st:*:${sessionId}:*`);

// Extend TTL
await shortTerm.expire(`st:session:${sessionId}`, 86400);

// Prevent expiration
await shortTerm.persist(`st:session:${sessionId}`);
```

---

## Expiration Strategy

### Lazy Expiration

```typescript
async function getWithExpiration(key: string): Promise<any> {
  const entry = await redis.get(key);
  
  if (!entry) return null;
  
  // Check TTL on access
  const ttl = await redis.ttl(key);
  if (ttl === -2) {
    // Key expired, clean up
    await redis.del(key);
    return null;
  }
  
  return deserialize(entry);
}
```

### Background Cleanup

```typescript
async function cleanupExpiredSessions(): Promise<number> {
  const pattern = 'st:session:*';
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
        // Expired, clean up all related keys
        await deleteSessionData(key);
        cleaned++;
      }
    }
  } while (cursor !== 0);
  
  return cleaned;
}
```

### Memory Pressure Handling

```typescript
async function handleMemoryPressure(): Promise<void> {
  const { usage, pressure } = await checkMemoryPressure();
  
  if (pressure === 'critical') {
    // Aggressively evict old sessions
    await evictSessions('lru', { maxAge: 3600 }); // 1 hour
    
    // Clear temporary calculations
    await deletePattern('st:calc:*');
  } else if (pressure === 'high') {
    // Evict oldest sessions
    await evictSessions('lru', { maxAge: 7200 }); // 2 hours
  }
}
```

---

## Concurrent Access

### Read-Write Patterns

```typescript
// Multiple agents reading same session
const [hotelState, flightState] = await Promise.all([
  shortTerm.get(`st:agent:${sessionId}:hotel_03`),
  shortTerm.get(`st:agent:${sessionId}:flight_04`)
]);

// Agent updating own state (no conflict)
await shortTerm.set(
  `st:agent:${sessionId}:${agentId}`,
  newState
);

// Multiple agents updating session state (conflict possible)
await shortTerm.transaction(async (tx) => {
  const session = await tx.get(`st:session:${sessionId}`);
  session.progress.completed_steps.push('hotel_search');
  session.progress.percentage = 30;
  await tx.set(`st:session:${sessionId}`, session);
});
```

### Lock Strategy

```typescript
// Read lock (shared)
async function withReadLock<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const lock = await acquireReadLock(key);
  try {
    return await fn();
  } finally {
    await releaseReadLock(lock);
  }
}

// Write lock (exclusive)
async function withWriteLock<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const lock = await acquireWriteLock(key, { timeout: 5000 });
  try {
    return await fn();
  } finally {
    await releaseWriteLock(lock);
  }
}
```

---

## Monitoring

### Metrics

| Metric | Description |
|--------|-------------|
| `stm.active_sessions` | Active sessions count |
| `stm.total_keys` | Total short-term keys |
| `stm.memory_used` | Memory usage |
| `stm.expired_total` | Total expired keys |
| `stm.evicted_total` | Total evicted keys |
| `stm.avg_session_size` | Average session size |
| `stm.memory_pressure` | Current pressure level |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Memory | > 70% usage | Warning |
| Memory Critical | > 90% usage | Critical |
| Session Limit | > 10000 active sessions | Warning |
| Slow Access | p99 > 5ms | Warning |
