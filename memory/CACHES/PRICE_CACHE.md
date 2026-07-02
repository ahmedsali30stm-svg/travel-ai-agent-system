# Price Cache

> Hotel and flight price caching for comparison and tracking.

---

## Purpose

Price cache stores:
- Historical price data
- Price comparisons
- Price alerts
- Trend analysis

---

## Data Schema

### Price Record

```typescript
interface PriceRecord {
  price_id: string;
  
  // Item details
  item_type: 'hotel' | 'flight' | 'activity';
  item_id: string;
  provider: string;
  
  // Price
  price: {
    amount: number;
    currency: string;
    per_unit?: number;
    total_with_fees: number;
  };
  
  // Context
  context: {
    search_date: string;
    checkin_date?: string;
    checkout_date?: string;
    destination: string;
    travelers: number;
  };
  
  // Metadata
  timestamp: number;
  ttl: number;
}
```

**Key Pattern**: `cache:price:{item_type}:{item_id}:{provider}`
**TTL**: 24 hours
**Size**: ~1KB per record

---

### Price History

```typescript
interface PriceHistory {
  item_type: 'hotel' | 'flight' | 'activity';
  item_id: string;
  
  // Price points
  prices: {
    timestamp: number;
    price: number;
    currency: string;
  }[];
  
  // Statistics
  stats: {
    min: number;
    max: number;
    avg: number;
    current: number;
    trend: 'rising' | 'falling' | 'stable';
  };
  
  // Last updated
  last_updated: number;
}
```

**Key Pattern**: `cache:price:history:{item_type}:{item_id}`
**TTL**: 30 days
**Size**: ~5KB

---

### Price Alert

```typescript
interface PriceAlert {
  alert_id: string;
  user_id: string;
  
  // Alert condition
  condition: {
    item_type: 'hotel' | 'flight' | 'activity';
    item_id: string;
    target_price: number;
    direction: 'below' | 'above';
  };
  
  // Status
  status: 'active' | 'triggered' | 'expired';
  
  // Triggered info
  triggered?: {
    price: number;
    timestamp: number;
  };
  
  // Created
  created_at: number;
  expires_at: number;
}
```

**Key Pattern**: `cache:price:alert:{alert_id}`
**TTL**: 7 days
**Size**: ~500 bytes

---

## Access Patterns

### Store Price

```typescript
async function storePrice(record: PriceRecord): Promise<void> {
  // Store current price
  await memory.set(
    `cache:price:${record.item_type}:${record.item_id}:${record.provider}`,
    record,
    { ttl: record.ttl || 86400 }
  );
  
  // Update history
  await memory.transaction(async (tx) => {
    const historyKey = `cache:price:history:${record.item_type}:${record.item_id}`;
    const history = await tx.get(historyKey) || {
      item_type: record.item_type,
      item_id: record.item_id,
      prices: [],
      stats: { min: 0, max: 0, avg: 0, current: 0, trend: 'stable' },
      last_updated: Date.now()
    };
    
    // Add price point
    history.prices.push({
      timestamp: record.timestamp,
      price: record.price.amount,
      currency: record.price.currency
    });
    
    // Keep last 1000 points
    history.prices = history.prices.slice(-1000);
    
    // Update stats
    history.stats = calculateStats(history.prices);
    history.last_updated = Date.now();
    
    await tx.set(historyKey, history, { ttl: 2592000 });
  });
  
  // Check alerts
  await checkPriceAlerts(record);
}
```

### Get Price

```typescript
async function getPrice(
  itemType: string,
  itemId: string,
  provider: string
): Promise<PriceRecord | null> {
  return memory.get(`cache:price:${itemType}:${itemId}:${provider}`);
}

async function getPriceHistory(
  itemType: string,
  itemId: string
): Promise<PriceHistory | null> {
  return memory.get(`cache:price:history:${itemType}:${itemId}`);
}

async function comparePrices(
  itemType: string,
  itemId: string
): Promise<{
  prices: PriceRecord[];
  cheapest: PriceRecord;
  best_value: PriceRecord;
}> {
  const providers = ['hotelbeds', 'booking', 'agoda', 'expedia', 'trip'];
  
  const prices = await Promise.all(
    providers.map(p => getPrice(itemType, itemId, p))
  );
  
  const validPrices = prices.filter(p => p !== null);
  
  if (validPrices.length === 0) {
    throw new Error('No prices found');
  }
  
  // Find cheapest
  const cheapest = validPrices.reduce((min, p) =>
    p.price.total_with_fees < min.price.total_with_fees ? p : min
  );
  
  // Find best value (considering rating, cancellation policy, etc.)
  const bestValue = validPrices.reduce((best, p) =>
    calculateValueScore(p) > calculateValueScore(best) ? p : best
  );
  
  return {
    prices: validPrices,
    cheapest,
    best_value: bestValue
  };
}
```

### Price Alerts

```typescript
async function createPriceAlert(alert: PriceAlert): Promise<void> {
  await memory.set(
    `cache:price:alert:${alert.alert_id}`,
    alert,
    { ttl: 604800 }  // 7 days
  );
  
  // Add to user's alerts index
  await memory.sadd(`cache:price:alerts:user:${alert.user_id}`, alert.alert_id);
}

async function checkPriceAlerts(record: PriceRecord): Promise<void> {
  const pattern = `cache:price:alert:*`;
  const alertIds = await memory.keys(pattern);
  
  for (const alertId of alertIds) {
    const alert = await memory.get(alertId);
    
    if (
      alert.condition.item_type === record.item_type &&
      alert.condition.item_id === record.item_id &&
      alert.status === 'active'
    ) {
      const shouldTrigger =
        (alert.condition.direction === 'below' &&
         record.price.amount <= alert.condition.target_price) ||
        (alert.condition.direction === 'above' &&
         record.price.amount >= alert.condition.target_price);
      
      if (shouldTrigger) {
        await triggerAlert(alert, record);
      }
    }
  }
}

async function triggerAlert(
  alert: PriceAlert,
  record: PriceRecord
): Promise<void> {
  alert.status = 'triggered';
  alert.triggered = {
    price: record.price.amount,
    timestamp: Date.now()
  };
  
  await memory.set(`cache:price:alert:${alert.alert_id}`, alert);
  
  // Notify user
  await notificationService.send({
    user_id: alert.user_id,
    type: 'price_alert',
    title: `Price Alert: ${record.item_type}`,
    message: `Price is now ${record.price.amount} ${record.price.currency}`,
    data: { alert, record }
  });
}
```

---

## Cleanup

### Old Price Cleanup

```typescript
async function cleanupOldPrices(): Promise<number> {
  const pattern = 'cache:price:*';
  let cursor = 0;
  let cleaned = 0;
  const oneDayAgo = Date.now() - 86400000;
  
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
| `price_cache.total_records` | Total price records |
| `price_cache.cache_hit_rate` | Cache hit rate |
| `price_cache.price_alerts` | Active price alerts |
| `price_cache.alerts_triggered` | Alerts triggered today |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Low Cache Hit Rate | < 70% hit rate | Warning |
| High Alert Volume | > 100 alerts/hour | Warning |
| Stale Prices | Prices > 24h old | Warning |
