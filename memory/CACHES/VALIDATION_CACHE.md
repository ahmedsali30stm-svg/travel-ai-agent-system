# Validation Cache

> Data validation results caching to avoid repeated validations.

---

## Purpose

Validation cache stores:
- Schema validation results
- Business rule validation
- Data quality scores
- Error patterns

---

## Data Schema

### Validation Result

```typescript
interface ValidationResult {
  validation_id: string;
  
  // What was validated
  target: {
    type: 'hotel' | 'flight' | 'activity' | 'itinerary' | 'user_input';
    id: string;
    data_hash: string;
  };
  
  // Result
  valid: boolean;
  
  // Errors
  errors: {
    code: string;
    message: string;
    field?: string;
    severity: 'error' | 'warning' | 'info';
  }[];
  
  // Quality score
  quality_score: number;  // 0-100
  
  // Metadata
  validator: string;
  timestamp: number;
}
```

**Key Pattern**: `cache:validation:{validation_id}`
**TTL**: 24 hours
**Size**: ~2KB per result

---

### Validation Summary

```typescript
interface ValidationSummary {
  target_type: string;
  
  // Statistics
  stats: {
    total_validated: number;
    valid_count: number;
    invalid_count: number;
    avg_quality_score: number;
  };
  
  // Common errors
  common_errors: {
    code: string;
    count: number;
    last_seen: number;
  }[];
  
  // Last updated
  last_updated: number;
}
```

**Key Pattern**: `cache:validation:summary:{target_type}`
**TTL**: 24 hours
**Size**: ~3KB

---

## Access Patterns

### Store Validation

```typescript
async function storeValidation(result: ValidationResult): Promise<void> {
  await memory.set(
    `cache:validation:${result.validation_id}`,
    result,
    { ttl: 86400 }  // 24 hours
  );
  
  // Update summary
  await memory.transaction(async (tx) => {
    const summaryKey = `cache:validation:summary:${result.target.type}`;
    const summary = await tx.get(summaryKey) || {
      target_type: result.target.type,
      stats: {
        total_validated: 0,
        valid_count: 0,
        invalid_count: 0,
        avg_quality_score: 0
      },
      common_errors: [],
      last_updated: Date.now()
    };
    
    // Update stats
    summary.stats.total_validated++;
    if (result.valid) {
      summary.stats.valid_count++;
    } else {
      summary.stats.invalid_count++;
    }
    
    // Update average quality score
    summary.stats.avg_quality_score =
      (summary.stats.avg_quality_score * (summary.stats.total_validated - 1) +
       result.quality_score) / summary.stats.total_validated;
    
    // Update common errors
    for (const error of result.errors) {
      const existing = summary.common_errors.find(e => e.code === error.code);
      if (existing) {
        existing.count++;
        existing.last_seen = Date.now();
      } else {
        summary.common_errors.push({
          code: error.code,
          count: 1,
          last_seen: Date.now()
        });
      }
    }
    
    // Keep top 10 errors
    summary.common_errors.sort((a, b) => b.count - a.count);
    summary.common_errors = summary.common_errors.slice(0, 10);
    
    summary.last_updated = Date.now();
    
    await tx.set(summaryKey, summary, { ttl: 86400 });
  });
}

// Get validation result
async function getValidation(
  targetType: string,
  targetId: string,
  dataHash: string
): Promise<ValidationResult | null> {
  const pattern = `cache:validation:*`;
  const keys = await memory.keys(pattern);
  
  for (const key of keys) {
    const result = await memory.get(key);
    if (
      result.target.type === targetType &&
      result.target.id === targetId &&
      result.target.data_hash === dataHash
    ) {
      return result;
    }
  }
  
  return null;
}

// Get validation summary
async function getValidationSummary(
  targetType: string
): Promise<ValidationSummary | null> {
  return memory.get(`cache:validation:summary:${targetType}`);
}
```

---

## Cleanup

### Old Validation Cleanup

```typescript
async function cleanupOldValidations(): Promise<number> {
  const pattern = 'cache:validation:*';
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
| `validation_cache.total_validations` | Total validations |
| `validation_cache.cache_hit_rate` | Cache hit rate |
| `validation_cache.avg_quality_score` | Average quality score |
| `validation_cache.common_errors` | Common error count |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Low Quality Score | Avg < 70 | Warning |
| High Error Rate | > 20% invalid | Warning |
| Stale Data | Summaries > 24h old | Warning |
