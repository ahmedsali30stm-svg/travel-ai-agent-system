# Conflict Resolution

> Handling concurrent updates and data conflicts across agents.

---

## Purpose

Conflict resolution handles:
- Multiple agents updating same data
- Last-write-wins decisions
- Merge strategies
- Version-based conflicts
- Manual resolution triggers

---

## Conflict Types

### 1. Write-Write Conflict

```
Agent A: Read key=10 → Write key=15
Agent B: Read key=10 → Write key=20
                        ↑ CONFLICT
```

### 2. Read-Write Conflict

```
Agent A: Read key=10 → ... → Write key=15
Agent B: ──────────→ Read key=10 (stale) → Write key=20
```

### 3. Lost Update

```
Agent A: Read key=10 → Write key=15
Agent B: Read key=10 → Write key=20
Agent C: Read key=10 → Write key=25
Result: Only last write (key=25) survives
```

---

## Resolution Strategies

### 1. Last-Write-Wins (LWW)

```typescript
interface LWWEntry {
  value: any;
  timestamp: number;
  version: number;
}

async function resolveLWW(
  key: string,
  update1: LWWEntry,
  update2: LWWEntry
): Promise<LWWEntry> {
  // Compare timestamps
  if (update1.timestamp > update2.timestamp) {
    return update1;
  } else if (update2.timestamp > update1.timestamp) {
    return update2;
  }
  
  // Same timestamp, use version
  if (update1.version > update2.version) {
    return update1;
  }
  
  // Default to update2
  return update2;
}

// Implementation
async function lastWriteWins(
  key: string,
  newValue: any,
  agentId: string
): Promise<void> {
  await memory.transaction(async (tx) => {
    const current = await tx.get(key);
    
    // Check if another agent wrote since we read
    if (current._updated_at > newValue._read_at) {
      // Conflict detected
      const resolved = await resolveLWW(key, current, newValue);
      await tx.set(key, resolved);
    } else {
      // No conflict
      newValue._version = (current._version || 0) + 1;
      newValue._updated_by = agentId;
      newValue._updated_at = Date.now();
      await tx.set(key, newValue);
    }
  });
}
```

### 2. Merge Strategy

```typescript
interface MergeResult {
  merged: any;
  conflicts: string[];
  resolution: 'auto' | 'manual';
}

async function mergeUpdates(
  key: string,
  update1: any,
  update2: any
): Promise<MergeResult> {
  const conflicts: string[] = [];
  const merged: any = {};
  
  // Merge each field
  for (const field of Object.keys(update1)) {
    if (field.startsWith('_')) continue;  // Skip metadata
    
    if (JSON.stringify(update1[field]) === JSON.stringify(update2[field])) {
      // Same value, no conflict
      merged[field] = update1[field];
    } else if (update2[field] === undefined) {
      // Only in update1
      merged[field] = update1[field];
    } else if (update1[field] === undefined) {
      // Only in update2
      merged[field] = update2[field];
    } else {
      // Conflict
      conflicts.push(field);
      
      // Auto-resolve based on field type
      if (Array.isArray(update1[field])) {
        // Merge arrays (union)
        merged[field] = [...new Set([...update1[field], ...update2[field]])];
      } else if (typeof update1[field] === 'object') {
        // Deep merge objects
        merged[field] = await mergeObjects(update1[field], update2[field]);
      } else {
        // Last-write-wins for primitives
        merged[field] = update1._timestamp > update2._timestamp
          ? update1[field]
          : update2[field];
      }
    }
  }
  
  return {
    merged,
    conflicts,
    resolution: conflicts.length > 0 ? 'auto' : 'auto'
  };
}
```

### 3. Version-Based Resolution

```typescript
interface VersionedEntry {
  value: any;
  version: number;
  branch?: string;
}

async function versionedResolution(
  key: string,
  base: VersionedEntry,
  update1: VersionedEntry,
  update2: VersionedEntry
): Promise<VersionedEntry> {
  // Check if updates are from same base
  if (update1.version === base.version && update2.version === base.version) {
    // Both branched from same version - merge required
    const merged = await mergeUpdates(key, update1.value, update2.value);
    
    return {
      value: merged.merged,
      version: Math.max(update1.version, update2.version) + 1,
      branch: 'merged'
    };
  }
  
  // One update is ahead
  if (update1.version > update2.version) {
    return update1;
  } else {
    return update2;
  }
}
```

---

## Conflict Detection

### Detect Conflicts

```typescript
async function detectConflict(
  key: string,
  agentId: string
): Promise<{
  hasConflict: boolean;
  conflictingAgent?: string;
  conflictType?: string;
}> {
  const lockInfo = await memory.getLockInfo(key);
  
  if (!lockInfo) {
    return { hasConflict: false };
  }
  
  // Check if another agent has write lock
  if (lockInfo.writeHolder && lockInfo.writeHolder !== agentId) {
    return {
      hasConflict: true,
      conflictingAgent: lockInfo.writeHolder,
      conflictType: 'write-lock-contention'
    };
  }
  
  // Check version
  const current = await memory.get(key);
  const local = await memory.getLocal(key);
  
  if (current._version !== local._version) {
    return {
      hasConflict: true,
      conflictingAgent: current._updated_by,
      conflictType: 'version-mismatch'
    };
  }
  
  return { hasConflict: false };
}
```

### Conflict Log

```typescript
interface ConflictLog {
  conflict_id: string;
  timestamp: number;
  
  // Conflict details
  key: string;
  agent1: {
    id: string;
    version: number;
    value: any;
  };
  agent2: {
    id: string;
    version: number;
    value: any;
  };
  
  // Resolution
  resolution: {
    strategy: string;
    result: any;
    resolved_by: string;
    resolved_at: number;
  };
}

async function logConflict(
  key: string,
  agent1: string,
  agent2: string,
  resolution: ConflictLog['resolution']
): Promise<void> {
  const log: ConflictLog = {
    conflict_id: generateId(),
    timestamp: Date.now(),
    key,
    agent1: await getAgentData(key, agent1),
    agent2: await getAgentData(key, agent2),
    resolution
  };
  
  await memory.append('conflict:log', log);
  await metrics.increment('conflict.detected');
}
```

---

## Manual Resolution

### Resolution Queue

```typescript
interface ResolutionRequest {
  request_id: string;
  timestamp: number;
  
  // Conflict details
  key: string;
  agent1: string;
  agent2: string;
  
  // Values
  value1: any;
  value2: any;
  
  // Status
  status: 'pending' | 'resolved' | 'escalated';
  
  // Resolution
  resolution?: {
    strategy: string;
    result: any;
    resolved_by: string;
  };
}

async function requestManualResolution(
  key: string,
  agent1: string,
  agent2: string,
  value1: any,
  value2: any
): Promise<string> {
  const request: ResolutionRequest = {
    request_id: generateId(),
    timestamp: Date.now(),
    key,
    agent1,
    agent2,
    value1,
    value2,
    status: 'pending'
  };
  
  await memory.set(
    `resolution:${request.request_id}`,
    request
  );
  
  await memory.append('resolution:queue', request.request_id);
  
  // Alert operators
  await alerting.send({
    severity: 'warning',
    title: 'Conflict requires manual resolution',
    key,
    agents: [agent1, agent2]
  });
  
  return request.request_id;
}

async function resolveManually(
  requestId: string,
  resolution: {
    strategy: string;
    result: any;
    resolved_by: string;
  }
): Promise<void> {
  const request = await memory.get(`resolution:${requestId}`);
  
  request.status = 'resolved';
  request.resolution = {
    ...resolution,
    resolved_at: Date.now()
  };
  
  await memory.set(`resolution:${requestId}`, request);
  
  // Apply resolution
  await memory.set(request.key, resolution.result);
  
  // Remove from queue
  await memory.remove('resolution:queue', requestId);
}
```

---

## Prevention Strategies

### Read-Before-Write

```typescript
async function readBeforeWrite(
  key: string,
  agentId: string,
  updater: (current: any) => any
): Promise<void> {
  // Acquire read lock first
  const lock = await memory.acquireReadLock(key, agentId);
  
  try {
    const current = await memory.get(key);
    const updated = updater(current);
    
    // Release read lock, acquire write lock
    await lock.release();
    const writeLock = await memory.acquireWriteLock(key, agentId);
    
    try {
      // Verify no changes while we were reading
      const latest = await memory.get(key);
      if (latest._version !== current._version) {
        throw new ConflictError('Data changed during read');
      }
      
      updated._version = (latest._version || 0) + 1;
      updated._updated_by = agentId;
      await memory.set(key, updated);
    } finally {
      await writeLock.release();
    }
  } catch (error) {
    await lock.release();
    throw error;
  }
}
```

### Atomic Operations

```typescript
// Use Redis atomic operations when possible
async function atomicIncrement(
  key: string,
  field: string,
  amount: number
): Promise<number> {
  return memory.incrby(`${key}:${field}`, amount);
}

async function atomicAppend(
  key: string,
  value: any
): Promise<void> {
  await memory.rpush(key, JSON.stringify(value));
}
```

---

## Monitoring

### Metrics

| Metric | Description |
|--------|-------------|
| `conflict.total` | Total conflicts detected |
| `conflict.auto_resolved` | Auto-resolved conflicts |
| `conflict.manual_resolved` | Manually resolved conflicts |
| `conflict.pending` | Pending manual resolution |
| `conflict.resolution_time` | Avg resolution time |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Conflict Rate | > 5% of operations | Warning |
| Manual Resolution Needed | Any pending > 1 hour | Warning |
| Critical Conflict | Data integrity risk | Critical |
