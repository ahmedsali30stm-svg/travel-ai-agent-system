# Trip Memory

> Complete trip lifecycle storage from search to post-trip.
> Immutable historical records with rich metadata.

---

## Purpose

Trip memory stores:
- Full trip itinerary snapshots
- Booking records and confirmations
- User feedback and ratings
- Trip analytics and insights
- Historical trip data for patterns

---

## Data Schema

### Trip Record

```typescript
interface TripRecord {
  trip_id: string;
  user_id: string;
  
  // Lifecycle
  status: 'planning' | 'booked' | 'active' | 'completed' | 'cancelled';
  created_at: number;
  updated_at: number;
  
  // Trip details
  trip: {
    destination: string;
    origin: string;
    dates: {
      start: string;
      end: string;
      duration_days: number;
    };
    travelers: {
      adults: number;
      children: number;
      infants: number;
    };
    purpose: 'leisure' | 'business' | 'family' | 'adventure';
  };
  
  // Itinerary snapshot
  itinerary: ItinerarySnapshot;
  
  // Bookings
  bookings: Booking[];
  
  // Costs
  costs: {
    total: number;
    currency: string;
    breakdown: Record<string, number>;
  };
  
  // User feedback
  feedback?: {
    rating: number;
    review?: string;
    highlights?: string[];
    complaints?: string[];
  };
  
  // Analytics
  analytics: {
    search_duration_ms: number;
    agents_used: string[];
    tools_used: string[];
    total_api_calls: number;
  };
}
```

**Key Pattern**: `trip:{trip_id}`
**TTL**: Never (permanent record)
**Size**: ~15KB per trip

---

### Itinerary Snapshot

```typescript
interface ItinerarySnapshot {
  snapshot_id: string;
  version: number;
  generated_at: number;
  
  // Daily itinerary
  days: {
    date: string;
    activities: {
      time: string;
      type: 'flight' | 'hotel' | 'activity' | 'transport' | 'meal';
      title: string;
      description: string;
      location?: {
        name: string;
        lat: number;
        lng: number;
      };
      cost?: number;
      booking_ref?: string;
    }[];
  }[];
  
  // Hotel details
  hotel?: {
    name: string;
    address: string;
    checkin: string;
    checkout: string;
    room_type: string;
    confirmation?: string;
  };
  
  // Flight details
  flight?: {
    airline: string;
    flight_number: string;
    departure: string;
    arrival: string;
    confirmation?: string;
  };
}
```

**Key Pattern**: `trip:{trip_id}:itinerary`
**TTL**: Never
**Size**: ~8KB

---

### Booking Record

```typescript
interface Booking {
  booking_id: string;
  trip_id: string;
  
  // Booking details
  type: 'hotel' | 'flight' | 'activity' | 'transport';
  provider: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  
  // Booking info
  confirmation_number: string;
  booked_at: number;
  
  // Pricing
  price: {
    amount: number;
    currency: string;
    per_unit?: number;
  };
  
  // Cancellation
  cancellation?: {
    policy: string;
    deadline: string;
    fee?: number;
  };
  
  // Provider details
  provider_data: Record<string, any>;
}
```

**Key Pattern**: `trip:{trip_id}:booking:{booking_id}`
**TTL**: Never
**Size**: ~2KB per booking

---

## Storage Architecture

### Redis Structure

```
┌─────────────────────────────────────────────────────────────┐
│                       TRIP MEMORY                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Trip Record                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ trip:trip_xyz789                                     │   │
│  │ {                                                   │   │
│  │   trip_id: "trip_xyz789",                           │   │
│  │   user_id: "user_456",                              │   │
│  │   status: "completed",                              │   │
│  │   trip: { destination: "Paris", ... },              │   │
│  │   costs: { total: 2500, ... },                      │   │
│  │   feedback: { rating: 5, ... },                     │   │
│  │ }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Itinerary                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ trip:trip_xyz789:itinerary                           │   │
│  │ {                                                   │   │
│  │   version: 3,                                       │   │
│  │   days: [...],                                      │   │
│  │   hotel: { name: "Hotel Paris", ... },              │   │
│  │   flight: { airline: "Air France", ... },           │   │
│  │ }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Bookings                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ trip:trip_xyz789:booking:book_001                    │   │
│  │ trip:trip_xyz789:booking:book_002                    │   │
│  │ trip:trip_xyz789:booking:book_003                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Access Patterns

### Write Operations

```typescript
// Create trip record
async function createTrip(trip: TripRecord): Promise<void> {
  await memory.set(`trip:${trip.trip_id}`, trip);
  await memory.append(`user:${trip.user_id}:trips`, trip.trip_id);
}

// Update itinerary
async function updateItinerary(
  tripId: string,
  itinerary: ItinerarySnapshot
): Promise<void> {
  const trip = await memory.get(`trip:${tripId}`);
  trip.itinerary = itinerary;
  trip.updated_at = Date.now();
  
  await memory.set(`trip:${tripId}`, trip);
  await memory.set(
    `trip:${tripId}:itinerary`,
    itinerary
  );
}

// Add booking
async function addBooking(
  tripId: string,
  booking: Booking
): Promise<void> {
  await memory.set(
    `trip:${tripId}:booking:${booking.booking_id}`,
    booking
  );
  
  const trip = await memory.get(`trip:${tripId}`);
  trip.bookings.push(booking);
  trip.updated_at = Date.now();
  await memory.set(`trip:${tripId}`, trip);
}

// Add feedback
async function addFeedback(
  tripId: string,
  feedback: TripRecord['feedback']
): Promise<void> {
  const trip = await memory.get(`trip:${tripId}`);
  trip.feedback = feedback;
  trip.updated_at = Date.now();
  await memory.set(`trip:${tripId}`, trip);
}
```

### Read Operations

```typescript
// Get trip record
async function getTrip(tripId: string): Promise<TripRecord> {
  return memory.get(`trip:${tripId}`);
}

// Get user trips
async function getUserTrips(
  userId: string,
  options: { limit?: number; status?: string } = {}
): Promise<TripRecord[]> {
  let tripIds = await memory.get(`user:${userId}:trips`);
  
  if (options.status) {
    const trips = await memory.mget(
      tripIds.map(id => `trip:${id}`)
    );
    tripIds = trips
      .filter(t => t.status === options.status)
      .map(t => t.trip_id);
  }
  
  if (options.limit) {
    tripIds = tripIds.slice(-options.limit);
  }
  
  return memory.mget(tripIds.map(id => `trip:${id}`));
}

// Get trip analytics
async function getTripAnalytics(
  tripId: string
): Promise<TripRecord['analytics']> {
  const trip = await memory.get(`trip:${tripId}`);
  return trip.analytics;
}
```

---

## Trip Lifecycle

### Status Transitions

```
planning → booked → active → completed
    ↓         ↓        ↓
cancelled  cancelled  cancelled
```

### Lifecycle Management

```typescript
async function transitionTripStatus(
  tripId: string,
  newStatus: TripRecord['status']
): Promise<void> {
  const trip = await memory.get(`trip:${tripId}`);
  
  // Validate transition
  if (!isValidTransition(trip.status, newStatus)) {
    throw new Error(
      `Invalid transition: ${trip.status} → ${newStatus}`
    );
  }
  
  // Update status
  trip.status = newStatus;
  trip.updated_at = Date.now();
  
  // Handle specific transitions
  if (newStatus === 'completed') {
    await completeTrip(trip);
  } else if (newStatus === 'cancelled') {
    await cancelTrip(trip);
  }
  
  await memory.set(`trip:${tripId}`, trip);
}

function isValidTransition(
  current: string,
  next: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    planning: ['booked', 'cancelled'],
    booked: ['active', 'cancelled'],
    active: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };
  
  return validTransitions[current]?.includes(next) ?? false;
}
```

---

## Historical Analytics

### Trip Patterns

```typescript
interface TripPatterns {
  user_id: string;
  
  // Destination patterns
  destinations: {
    destination: string;
    visit_count: number;
    last_visit: number;
  }[];
  
  // Booking patterns
  booking: {
    avg_lead_time_days: number;
    preferred_providers: string[];
    avg_trip_duration: number;
  };
  
  // Spending patterns
  spending: {
    avg_per_trip: number;
    avg_per_day: number;
    categories: Record<string, number>;
  };
  
  // Timing patterns
  timing: {
    preferred_months: number[];
    preferred_days: string[];
    booking_frequency: string;
  };
}

async function analyzeTripPatterns(
  userId: string
): Promise<TripPatterns> {
  const trips = await getUserTrips(userId, { status: 'completed' });
  
  return {
    user_id: userId,
    destinations: analyzeDestinations(trips),
    booking: analyzeBookingPatterns(trips),
    spending: analyzeSpendingPatterns(trips),
    timing: analyzeTimingPatterns(trips)
  };
}
```

---

## Monitoring

### Metrics

| Metric | Description |
|--------|-------------|
| `trip.total_trips` | Total trips stored |
| `trip.active_trips` | Currently active trips |
| `trip.completed_trips` | Completed trips |
| `trip.avg_trip_duration` | Average trip duration |
| `trip.avg_booking_value` | Average booking value |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Trip Count | > 10000 trips per user | Warning |
| Large Trip Record | > 100KB per trip | Warning |
| Inactive Trip | Status "planning" for > 30 days | Info |
