# Recovery

> Data recovery mechanisms for crash scenarios and data corruption.

---

## Purpose

Recovery handles:
- Crash recovery
- Data corruption repair
- Backup restoration
- Consistency checks

---

## Recovery Strategies

### 1. Write-Ahead Logging (WAL)

```typescript
interface WALEntry {
  lsn: number;           // Log Sequence Number
  timestamp: number;
  operation: 'write' | 'delete' | 'update';
  key: string;
  value?: any;
  old_value?: any;
}

class WALManager {
  private entries: WALEntry[] = [];
  private checkpointLsn = 0;
  
  async append(entry: Omit<WALEntry, 'lsn'>): Promise<number> {
    const lsn = this.entries.length + 1;
    this.entries.push({ ...entry, lsn });
    
    // Persist to disk
    await this.persistToDisk(entry);
    
    return lsn;
  }
  
  async checkpoint(): Promise<void> {
    // Save current state as checkpoint
    const snapshot = await this.createSnapshot();
    await this.saveCheckpoint(snapshot);
    this.checkpointLsn = this.entries.length;
  }
  
  async recover(): Promise<RecoveryResult> {
    // Load last checkpoint
    const checkpoint = await this.loadCheckpoint();
    
    // Replay WAL entries after checkpoint
    const entriesToReplay = this.entries.slice(this.checkpointLsn);
    
    let recovered = 0;
    for (const entry of entriesToReplay) {
      await this.replayEntry(entry);
      recovered++;
    }
    
    return {
      checkpointLsn: this.checkpointLsn,
      entriesReplayed: recovered,
      recovered: true
    };
  }
  
  private async replayEntry(entry: WALEntry): Promise<void> {
    switch (entry.operation) {
      case 'write':
      case 'update':
        await memory.set(entry.key, entry.value);
        break;
      case 'delete':
        await memory.del(entry.key);
        break;
    }
  }
}
```

### 2. Checkpointing

```typescript
class CheckpointManager {
  private checkpointDir: string;
  
  async createCheckpoint(): Promise<Checkpoint> {
    const data = await memory.dumpAll();
    
    const checkpoint: Checkpoint = {
      id: generateId(),
      timestamp: Date.now(),
      size: data.length,
      checksum: this.calculateChecksum(data)
    };
    
    await fs.writeFile(
      path.join(this.checkpointDir, checkpoint.id),
      data
    );
    
    return checkpoint;
  }
  
  async restoreCheckpoint(checkpointId: string): Promise<void> {
    const data = await fs.readFile(
      path.join(this.checkpointDir, checkpointId)
    );
    
    // Verify checksum
    const checkpoint = await this.getCheckpoint(checkpointId);
    if (this.calculateChecksum(data) !== checkpoint.checksum) {
      throw new Error('Checkpoint corrupted');
    }
    
    await memory.loadAll(data);
  }
  
  async listCheckpoints(): Promise<Checkpoint[]> {
    const files = await fs.readdir(this.checkpointDir);
    return Promise.all(
      files.map(f => this.getCheckpoint(f))
    );
  }
}
```

### 3. Replication

```typescript
class ReplicationManager {
  private primary: Redis;
  private replicas: Redis[];
  
  async replicate(key: string, value: any): Promise<void> {
    // Write to primary
    await this.primary.set(key, value);
    
    // Replicate to all replicas
    await Promise.all(
      this.replicas.map(replica =>
        replica.set(key, value)
      )
    );
  }
  
  async failover(): Promise<Redis> {
    // Find healthy replica
    for (const replica of this.replicas) {
      try {
        await replica.ping();
        return replica;
      } catch {
        continue;
      }
    }
    
    throw new Error('No healthy replicas available');
  }
}
```

---

## Corruption Detection

### Integrity Checks

```typescript
interface IntegrityCheck {
  key: string;
  checksum: string;
  size: number;
  valid: boolean;
  error?: string;
}

async function checkIntegrity(key: string): Promise<IntegrityCheck> {
  try {
    const data = await memory.get(key);
    const serialized = JSON.stringify(data);
    
    return {
      key,
      checksum: createHash('sha256').update(serialized).digest('hex'),
      size: serialized.length,
      valid: true
    };
  } catch (error) {
    return {
      key,
      checksum: '',
      size: 0,
      valid: false,
      error: error.message
    };
  }
}

async function fullIntegrityCheck(): Promise<IntegrityCheck[]> {
  const keys = await memory.keys('*');
  const results = await Promise.all(
    keys.map(checkIntegrity)
  );
  
  return results.filter(r => !r.valid);
}
```

### Repair Mechanisms

```typescript
async function repairCorruptedData(key: string): Promise<boolean> {
  try {
    // Try to read raw data
    const raw = await redis.getBuffer(key);
    
    // Attempt to deserialize
    const data = JSON.parse(raw.toString());
    
    // Re-serialize and write back
    await redis.set(key, JSON.stringify(data));
    
    return true;
  } catch {
    // If repair fails, delete corrupted data
    await redis.del(key);
    return false;
  }
}
```

---

## Backup Strategy

### Backup Types

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Full | Daily | 30 days | S3 |
| Incremental | Hourly | 7 days | S3 |
| WAL | Real-time | 24 hours | Local |

### Backup Process

```typescript
class BackupManager {
  async createBackup(type: 'full' | 'incremental'): Promise<Backup> {
    const backup: Backup = {
      id: generateId(),
      type,
      timestamp: Date.now(),
      size: 0,
      checksum: ''
    };
    
    let data: string;
    
    if (type === 'full') {
      data = await memory.dumpAll();
    } else {
      data = await this.getChangesSinceLastBackup();
    }
    
    // Compress
    const compressed = await Compressor.compress(
      Buffer.from(data),
      'zstd'
    );
    
    // Calculate checksum
    backup.checksum = createHash('sha256')
      .update(compressed)
      .digest('hex');
    backup.size = compressed.length;
    
    // Upload to S3
    await this.uploadToS3(backup.id, compressed);
    
    // Save metadata
    await this.saveMetadata(backup);
    
    return backup;
  }
  
  async restore(backupId: string): Promise<void> {
    // Download from S3
    const data = await this.downloadFromS3(backupId);
    
    // Verify checksum
    const backup = await this.getMetadata(backupId);
    const checksum = createHash('sha256')
      .update(data)
      .digest('hex');
    
    if (checksum !== backup.checksum) {
      throw new Error('Backup corrupted');
    }
    
    // Decompress
    const decompressed = await Compressor.decompress({
      data,
      strategy: 'zstd',
      checksum: backup.checksum,
      originalSize: backup.size,
      compressedSize: data.length
    });
    
    // Load into memory
    await memory.loadAll(decompressed.toString());
  }
}
```

---

## Recovery Procedures

### Automatic Recovery

```typescript
async function automaticRecovery(): Promise<RecoveryResult> {
  // 1. Check if Redis is accessible
  try {
    await redis.ping();
  } catch {
    // Redis down, try to restart
    await restartRedis();
  }
  
  // 2. Check for corrupted keys
  const corrupted = await fullIntegrityCheck();
  
  // 3. Repair or delete corrupted keys
  for (const check of corrupted) {
    const repaired = await repairCorruptedData(check.key);
    if (!repaired) {
      console.warn(`Deleted corrupted key: ${check.key}`);
    }
  }
  
  // 4. Replay WAL if needed
  const walResult = await walManager.recover();
  
  // 5. Verify consistency
  const consistent = await verifyConsistency();
  
  return {
    corruptedFound: corrupted.length,
    repaired: corrupted.length - walResult.entriesReplayed,
    walReplayed: walResult.entriesReplayed,
    consistent
  };
}
```

### Manual Recovery

```typescript
async function manualRecovery(options: RecoveryOptions): Promise<void> {
  if (options.restoreFromBackup) {
    await backupManager.restore(options.backupId);
  }
  
  if (options.resetToCheckpoint) {
    await checkpointManager.restoreCheckpoint(options.checkpointId);
  }
  
  if (options.purgeAndRestart) {
    await memory.flushall();
    await walManager.reset();
  }
}
```

---

## Monitoring

### Metrics

| Metric | Description |
|--------|-------------|
| `recovery.checkpoints` | Total checkpoints created |
| `recovery.backups` | Total backups created |
| `recovery.recovery_attempts` | Recovery attempts |
| `recovery.recovery_successes` | Successful recoveries |
| `recovery.data_loss` | Data loss events |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Checkpoint Failed | Checkpoint creation fails | Warning |
| Backup Failed | Backup upload fails | Critical |
| Corruption Detected | Any corruption found | Warning |
| Recovery Needed | Recovery procedure triggered | Critical |
