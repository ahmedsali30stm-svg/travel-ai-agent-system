# Long-Term Memory

> Persistent storage for user data, trip history, and learned patterns.
> Never expires by default. Backed by Redis + S3 for durability.

---

## Purpose

Long-term memory stores data that should persist across sessions:
- User preferences and profiles
- Historical trip data
- Learned patterns and insights
- System configuration
- Audit logs

---

## Data Schema

### User Profile

```typescript
interface UserProfile {
  user_id: string;
  created_at: number;
  updated_at: number;
  
  // Personal info (encrypted)
  personal: {
    name: string;
    email: string;
    phone?: string;
    nationality?: string;
    passport_expiry?: string;
  };
  
  // Preferences
  preferences: {
    budget_level: 'budget' | 'moderate' | 'luxury' | 'ultra_luxury';
    travel_style: 'adventure' | 'relaxation' | 'cultural' | 'business';
    interests: string[];
    dietary_restrictions: string[];
    accessibility_needs: string[];
    accommodation_preferences: {
      star_rating: number[];
      amenities: string[];
      chain_preferences: string[];
    };
    flight_preferences: {
      cabin_class: string;
      seat_preference: string;
      airline_preferences: string[];
    };
  };
  
  // History
  history: {
    trips_completed: number;
    countries_visited: string[];
    total_spent: number;
    average_trip_cost: number;
  };
  
  // Metadata
  metadata: {
    version: number;
    last_synced: number;
    data_source: string;
  };
}
```

**Key Pattern**: `lt:user:{user_id}`
**TTL**: Never (permanent)
**Size**: ~2KB per user

---

### Trip History

```typescript
interface TripHistory {
  trip_id: string;
  user_id: string;
  created_at: number;
  completed_at?: number;
  
  // Trip details
  details: {
    destination: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    travelers: number;
  };
  
  // Booking data
  bookings: {
    hotels: HotelBooking[];
    flights: FlightBooking[];
    activities: ActivityBooking[];
    transportation: TransportBooking[];
  };
  
  // Costs
  costs: {
    total: number;
    currency: string;
    breakdown: {
      accommodation: number;
      flights: number;
      activities: number;
      transportation: number;
      other: number;
    };
  };
  
  // Ratings
  ratings: {
    overall: number;
    hotels: number[];
    activities: number[];
    flights: number[];
  };
  
  // Feedback
  feedback?: {
    pros: string[];
    cons: string[];
    recommendations: string;
    would_return: boolean;
  };
  
  // Status
  status: 'planning' | 'booked' | 'in_progress' | 'completed' | 'cancelled';
}
```

**Key Pattern**: `lt:trip:{trip_id}`
**Secondary Index**: `lt:user:{user_id}:trips`
**TTL**: Never (permanent)
**Size**: ~5KB per trip

---

### Learned Patterns

```typescript
interface LearnedPattern {
  pattern_id: string;
  created_at: number;
  updated_at: number;
  
  // Pattern definition
  pattern: {
    type: 'preference' | 'behavior' | 'pricing' | 'seasonal';
    description: string;
    confidence: number;  // 0-1
    evidence_count: number;
  };
  
  // Conditions
  conditions: {
    user_segment?: string;
    destination_type?: string;
    season?: string;
    budget_range?: string;
  };
  
  // Insights
  insights: {
    insight: string;
    recommendation: string;
    impact_score: number;  // 1-10
  };
  
  // Metadata
  metadata: {
    source: string;
    last_validated: number;
    expiry?: number;
  };
}
```

**Key Pattern**: `lt:pattern:{pattern_id}`
**Secondary Indexes**:
- `lt:patterns:type:{type}`
- `lt:patterns:user:{user_id}`
**TTL**: Never (permanent)
**Size**: ~1KB per pattern

---

### System Configuration

```typescript
interface SystemConfig {
  config_id: string;
  category: string;
  
  // Configuration
  config: Record<string, any>;
  
  // Metadata
  metadata: {
    version: number;
    updated_at: number;
    updated_by: string;
    description: string;
  };
}
```

**Key Pattern**: `lt:config:{category}`
**TTL**: Never (permanent)
**Size**: Variable

---

## Storage Architecture

### Redis Layer

```
┌─────────────────────────────────────────────────────────────┐
│                      REDIS CLUSTER                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Master Node                    Replica Nodes               │
│  ┌─────────────┐               ┌─────────────┐             │
│  │   Primary   │──────────────▶│  Replica 1  │             │
│  │             │               │             │             │
│  │  Keys:      │               │  Keys:      │             │
│  │  lt:user:*  │               │  lt:user:*  │             │
│  │  lt:trip:*  │               │  lt:trip:*  │             │
│  │  lt:pattern*│               │  lt:pattern*│             │
│  └─────────────┘               └─────────────┘             │
│         │                              │                    │
│         │                              │                    │
│         ▼                              ▼                    │
│  ┌─────────────┐               ┌─────────────┐             │
│  │  Replica 2  │               │  Replica 3  │             │
│  │             │               │             │             │
│  │  Keys:      │               │  Keys:      │             │
│  │  lt:user:*  │               │  lt:user:*  │             │
│  │  lt:trip:*  │               │  lt:trip:*  │             │
│  │  lt:pattern*│               │  lt:pattern*│             │
│  └─────────────┘               └─────────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### S3 Archive Layer

```
┌─────────────────────────────────────────────────────────────┐
│                      S3 ARCHIVE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  s3://travel-ai-memory-archive/                             │
│  ├── long-term/                                             │
│  │   ├── users/                                             │
│  │   │   ├── {user_id}/                                    │
│  │   │   │   ├── profile.json.gz                           │
│  │   │   │   ├── trips/                                    │
│  │   │   │   └── patterns/                                 │
│  │   │   └── ...                                           │
│  │   └── system/                                           │
│  │       └── config/                                       │
│  └── backups/                                               │
│      ├── daily/                                             │
│      └── weekly/                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Access Patterns

### Read Operations

```typescript
// Get user profile
const profile = await longTerm.get(`lt:user:${userId}`);

// Get trip history
const trips = await longTerm.get(`lt:user:${userId}:trips`);

// Get learned patterns
const patterns = await longTerm.search('lt:pattern:*', {
  filter: { 'pattern.type': 'preference' }
});
```

### Write Operations

```typescript
// Create/update user profile
await longTerm.set(`lt:user:${userId}`, profile, {
  version: profile.metadata.version + 1
});

// Add trip to history
await longTerm.append(`lt:user:${userId}:trips`, tripId);

// Store learned pattern
await longTerm.set(`lt:pattern:${patternId}`, pattern);
```

### Batch Operations

```typescript
// Get multiple user profiles
const profiles = await longTerm.mget(
  userIds.map(id => `lt:user:${id}`)
);

// Bulk update patterns
await longTerm.mset(
  patterns.reduce((acc, pattern) => {
    acc[`lt:pattern:${pattern.pattern_id}`] = pattern;
    return acc;
  }, {})
);
```

---

## Data Lifecycle

### Creation

1. Validate input data
2. Generate unique ID
3. Set creation timestamp
4. Apply encryption if sensitive
5. Write to Redis
6. Log to WAL

### Update

1. Read current version
2. Check version compatibility
3. Apply changes
4. Increment version
5. Update timestamp
6. Write to Redis
7. Log to WAL

### Archival

1. Identify data older than threshold
2. Compress with LZ4
3. Upload to S3
4. Update metadata with archive location
5. Optionally delete from Redis

### Deletion

1. Soft delete (mark as deleted)
2. Remove from Redis after grace period
3. Archive to S3
4. Log deletion for audit

---

## Encryption

### Sensitive Fields

```typescript
const SENSITIVE_FIELDS = [
  'personal.email',
  'personal.phone',
  'personal.passport_number',
  'personal.nationality',
  'bookings.*.payment_info',
  'costs.*.card_number'
];
```

### Encryption Process

```typescript
async function encryptSensitive(data: any): Promise<any> {
  const encrypted = { ...data };
  
  for (const field of SENSITIVE_FIELDS) {
    const value = getNestedValue(encrypted, field);
    if (value) {
      const encryptedValue = await encrypt(value);
      setNestedValue(encrypted, field, encryptedValue);
    }
  }
  
  return encrypted;
}
```

---

## Monitoring

### Metrics

| Metric | Description |
|--------|-------------|
| `ltm.total_keys` | Total long-term keys |
| `ltm.memory_used` | Memory usage |
| `ltm.reads_per_second` | Read operations |
| `ltm.writes_per_second` | Write operations |
| `ltm.avg_read_latency` | Average read latency |
| `ltm.avg_write_latency` | Average write latency |
| `ltm.archive_count` | Archived entries |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Memory | > 80% usage | Warning |
| Memory Critical | > 95% usage | Critical |
| Slow Reads | p99 > 10ms | Warning |
| Write Failures | > 1% failure rate | Critical |
