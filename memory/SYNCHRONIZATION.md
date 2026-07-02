# Synchronization

> Multi-agent memory synchronization with read-write locks and eventual consistency.

---

## Purpose

Synchronization ensures:
- Consistent memory access across agents
- Prevents race conditions
- Handles concurrent writes
- Maintains data integrity

---

## Synchronization Strategy

### Read-Write Locks

```
┌─────────────────────────────────────────────────────────────┐
│                    READ-WRITE LOCKS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Agent 1 (Read) ─────┐                                      │
│                       │                                      │
│  Agent 2 (Read) ─────┼──→ Shared Lock ──→ Allow Multiple    │
│                       │                                      │
│  Agent 3 (Read) ─────┘                                      │
│                                                              │
│  Agent 4 (Write) ────→ Exclusive Lock ──→ Block Others      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Lock Implementation

```typescript
class MemoryLock {
  private readLocks: Map<string, Set<string>> = new Map();
  private writeLock: Map<string, string> = new Map();
  private writeQueues: Map<string, string[]> = new Map();
  
  async acquireReadLock(
    key: string,
    agentId: string
  ): Promise<LockHandle> {
    // Wait if write lock held
    while (this.writeLock.has(key)) {
      await this.waitForLock(key);
    }
    
    // Acquire read lock
    if (!this.readLocks.has(key)) {
      this.readLocks.set(key, new Set());
    }
    this.readLocks.get(key)!.add(agentId);
    
    return {
      type: 'read',
      key,
      agentId,
      acquiredAt: Date.now(),
      release: () => this.releaseReadLock(key, agentId)
    };
  }
  
  async acquireWriteLock(
    key: string,
    agentId: string,
    timeout: number = 5000
  ): Promise<LockHandle> {
    const startTime = Date.now();
    
    // Wait for queue position
    while (this.writeLock.has(key) || this.isInQueue(key, agentId)) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Lock acquisition timeout');
      }
      await this.waitForLock(key);
    }
    
    // Add to queue
    this.addToQueue(key, agentId);
    
    // Wait for our turn
    while (this.writeLock.has(key)) {
      await this.waitForLock(key);
    }
    
    // Acquire write lock
    this.writeLock.set(key, agentId);
    
    return {
      type: 'write',
      key,
      agentId,
      acquiredAt: Date.now(),
      release: () => this.releaseWriteLock(key, agentId)
    };
  }
  
  private releaseReadLock(key: string, agentId: string): void {
    this.readLocks.get(key)?.delete(agentId);
  }
  
  private releaseWriteLock(key: string, agentId: string): void {
    this.writeLock.delete(key);
    this.removeFromQueue(key, agentId);
    this.notifyWaiters(key);
  }
}
```

---

## Concurrency Patterns

### Pattern 1: Read-Heavy Workload

```typescript
// Multiple agents reading same data
async function readHeavyPattern(): Promise<void> {
  const agents = ['hotel_03', 'flight_04', 'activities_05'];
  
  // All can read simultaneously
  const results = await Promise.all(
    agents.map(agentId =>
      withReadLock(`session:${sessionId}`, agentId, async () => {
        return memory.get(`session:${sessionId}`);
      })
    )
  );
}
```

### Pattern 2: Write-Heavy Workload

```typescript
// Multiple agents writing different keys
async function writeHeavyPattern(): Promise<void> {
  // Each agent writes to own key (no conflict)
  await Promise.all([
    memory.set(`agent:${sessionId}:hotel_03`, hotelState),
    memory.set(`agent:${sessionId}:flight_04`, flightState),
    memory.set(`agent:${sessionId}:activities_05`, activitiesState)
  ]);
}
```

### Pattern 3: Mixed Read-Write

```typescript
// Agents reading and updating shared state
async function mixedPattern(): Promise<void> {
  await withWriteLock(`session:${sessionId}`, 'supervisor_01', async () => {
    const session = await memory.get(`session:${sessionId}`);
    
    // Update progress
    session.progress.completed_steps.push('hotel_search');
    session.progress.percentage = 30;
    
    // Write back
    await memory.set(`session:${sessionId}`, session);
  });
}
```

---

## Eventual Consistency

### Consistency Model

```typescript
interface ConsistencyConfig {
  // Consistency level
  level: 'strong' | 'eventual' | 'weak';
  
  // Sync interval for eventual consistency
  syncInterval: number;  // milliseconds
  
  // Conflict resolution
  conflictResolution: 'last-write-wins' | 'merge' | 'manual';
  
  // Read-your-writes guarantee
  readYourWrites: boolean;
}

const DEFAULT_CONFIG: ConsistencyConfig = {
  level: 'eventual',
  syncInterval: 1000,  // 1 second
  conflictResolution: 'last-write-wins',
  readYourWrites: true
};
```

### Sync Protocol

```typescript
class ConsistencyManager {
  private pendingWrites: Map<string, WriteOperation[]> = new Map();
  private localVersion: Map<string, number> = new Map();
  
  async sync(): Promise<void> {
    // Process pending writes
    for (const [key, writes] of this.pendingWrites) {
      if (writes.length === 0) continue;
      
      // Sort by timestamp
      writes.sort((a, b) => a.timestamp - b.timestamp);
      
      // Apply writes
      for (const write of writes) {
        await this.applyWrite(write);
      }
      
      // Clear pending
      this.pendingWrites.set(key, []);
    }
    
    // Sync with remote
    await this.syncWithRemote();
  }
  
  private async applyWrite(write: WriteOperation): Promise<void> {
    const currentVersion = this.localVersion.get(write.key) || 0;
    
    if (write.version > currentVersion) {
      await memory.set(write.key, write.value);
      this.localVersion.set(write.key, write.version);
    }
  }
}
```

---

## Race Condition Prevention

### Optimistic Locking

```typescript
async function updateWithOptimisticLock<T>(
  key: string,
  agentId: string,
  updater: (current: T) => T
): Promise<T> {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    // Read current value
    const current = await memory.get(key);
    const version = current._version || 0;
    
    // Apply update
    const updated = updater(current);
    updated._version = version + 1;
    updated._updated_by = agentId;
    updated._updated_at = Date.now();
    
    // Try to write
    const success = await memory.compareAndSwap(
      key,
      version,
      updated
    );
    
    if (success) {
      return updated;
    }
    
    attempts++;
    await sleep(100 * attempts);  // Backoff
  }
  
  throw new Error(`Failed to update ${key} after ${maxAttempts} attempts`);
}
```

### Example Usage

```typescript
// Update session progress safely
const session = await updateWithOptimisticLock(
  `session:${sessionId}`,
  'hotel_03',
  (current) => {
    current.progress.completed_steps.push('hotel_search');
    current.progress.percentage = 30;
    return current;
  }
);
```

---

## Distributed Synchronization

### Redis Pub/Sub

```typescript
class MemorySync {
  private subscriber: Redis;
  private publisher: Redis;
  
  constructor() {
    this.subscriber = new Redis();
    this.publisher = new Redis();
  }
  
  async subscribe(channel: string, handler: (data: any) => void): Promise<void> {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        handler(JSON.parse(message));
      }
    });
  }
  
  async publish(channel: string, data: any): Promise<void> {
    this.publisher.publish(channel, JSON.stringify(data));
  }
  
  async broadcastMemoryUpdate(key: string, value: any): Promise<void> {
    await this.publish('memory:updates', {
      type: 'update',
      key,
      value,
      timestamp: Date.now()
    });
  }
}
```

### Sync Channels

```
memory:updates     → Broadcasts memory updates
memory:locks       → Manages distributed locks
memory:invalidates → Cache invalidation events
memory:sync        → Full sync requests
```

---

## Monitoring

### Metrics

| Metric | Description |
|--------|-------------|
| `sync.lock_acquisitions` | Total lock acquisitions |
| `sync.lock_timeouts` | Lock acquisition timeouts |
| `sync.read_locks_held` | Current read locks |
| `sync.write_locks_held` | Current write locks |
| `sync.sync_operations` | Total sync operations |
| `sync.conflicts_detected` | Conflicts detected |
| `sync.conflicts_resolved` | Conflicts resolved |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Lock Contention | > 100 lock waits/sec | Warning |
| Lock Timeout | Any lock timeout > 5s | Warning |
| Sync Failures | > 5 sync failures/hour | Critical |
| High Conflict Rate | > 10% conflicts | Warning |
