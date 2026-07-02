# Step 4: Hotel Search

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Searches hotels, compares options, checks availability |
| **Agent(s)** | Hotel Agent (primary), PriceMonitor Agent (support) |
| **Criticality** | High — results used in final output; fallback to cached data available |
| **Parallel** | Runs in parallel with Steps 3, 5 |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Hotel Agent** | Primary | Hotel search, comparison, booking |
| **PriceMonitor Agent** | Support | Price tracking, trend analysis, alerts |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `destination` | string | Yes | Step 1 entities | Destination city/area |
| `check_in` | date | Yes | Step 1 entities | Check-in date (YYYY-MM-DD) |
| `check_out` | date | Yes | Step 1 entities | Check-out date (YYYY-MM-DD) |
| `rooms` | integer | Yes | Step 1 entities | Number of rooms needed |
| `guests` | integer | Yes | Step 1 entities | Total number of guests |
| `star_rating` | integer | No | User preference | Minimum star rating (1-5) |
| `amenities` | list | No | User preference | Required amenities |
| `budget_per_night` | decimal | No | Budget Agent | Max price per night |
| `preferences` | object | No | User profile | Location, style, chain |
| `near_location` | string | No | User input | Landmark/area to be near |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `hotels` | list | Available hotel options (sorted by relevance) |
| `best_option` | object | Recommended hotel |
| `total_cost` | decimal | Total accommodation cost |
| `cancellation_policy` | string | Free cancellation deadline |
| `alternatives` | list | Backup options |
| `search_metadata` | object | Provider, search time, result count |

### Hotel Option Schema

```yaml
hotel:
  hotel_id: string
  name: string
  star_rating: integer
  address: string
  city: string
  country: string
  latitude: decimal
  longitude: decimal
  distance_to_center: decimal  # km
  price_per_night: decimal
  total_price: decimal
  currency: string
  rating: decimal              # guest rating 0-10
  review_count: integer
  amenities: list[string]
  room_type: string
  beds: string
  breakfast_included: boolean
  free_cancellation: boolean
  cancellation_deadline: datetime
  provider: string
  booking_url: string
  images: list[string]
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| Destination is valid city | business | Critical | Return error |
| Check-in is today or future | business | Critical | Return date error |
| Check-out > check-in | business | High | Return date error |
| Rooms: 1-10 | range | High | Clamp to valid |
| Guests > 0 | range | High | Return error |
| Stay < 90 nights | business | Medium | Return error |
| At least 1 hotel found | business | High | Expand search |
| Price > 0 | business | Medium | Exclude option |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Primary API timeout | 3 | Exponential 2s/4s/8s | Try alternative provider |
| No results found | 1 | None | Expand search radius |
| Room sold out | 1 | None | Try alternative dates |
| Price fetch failure | 2 | Linear 1s | Use cached price |
| Provider error (5xx) | 2 | Linear 2s | Try next provider |
| Rate limit hit | 3 | Exponential 5s/10s/20s | Use cached results |

### Retry Decision Tree

```
Hotel Search Fails
    │
    ├── Primary API timeout?
    │   ├── Yes → Retry (max 3x, exponential 2s/4s/8s)
    │   │         └── Still fails? → Try alternative provider
    │   └── No → Continue
    │
    ├── Provider error (5xx)?
    │   ├── Yes → Retry (max 2x, linear 2s)
    │   │         └── Still fails? → Try next provider
    │   └── No → Continue
    │
    ├── Rate limit hit?
    │   ├── Yes → Retry (max 3x, exponential 5s/10s/20s)
    │   │         └── Still fails? → Use cached results
    │   └── No → Continue
    │
    └── No results found?
        └── Yes → Expand search (wider radius, alternative areas)
```

### Provider Fallback Chain

```
Primary: Booking.com
    │
    ├── fails → Secondary: Hotels.com
    │              │
    │              ├── fails → Tertiary: Expedia
    │              │              │
    │              │              └── fails → Return cached results
    │              │
    │              └── succeeds → Return results
    │
    └── succeeds → Return results
```

---

## Timing

| Metric | Target | Warning | Timeout | Critical |
|--------|--------|---------|---------|----------|
| Primary API call | < 3s | 5s | 10s | 15s |
| Alternative API call | < 5s | 8s | 12s | 20s |
| Availability check | < 1s | 2s | 3s | 5s |
| Price comparison | < 500ms | 1s | 2s | 3s |
| **Total Step** | < 5s | 10s | 15s | 20s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Invalid destination | E4001 | "Invalid destination: {dest}" | Return error |
| No hotels found | E4002 | "No hotels found. Expanding search..." | Expand search |
| All providers down | E4003 | "Showing cached results. Prices may vary." | Use cache |
| Price changed | E4004 | "Price updated: was ${old}, now ${new}" | Warn user |
| Room sold out | E4005 | "This room is no longer available" | Show alternatives |
| Rate limited | E4006 | "Please wait a moment..." | Retry with backoff |

### Error Response Format

```json
{
  "error": false,
  "warning": true,
  "warning_code": "W4002",
  "message": "No hotels found in city center. Showing nearby areas:",
  "hotels": [...],
  "search_metadata": {
    "expanded_search": true,
    "alternative_areas": ["Downtown", "Midtown", "Airport"],
    "radius_km": 15
  }
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| Hotel Search API (Booking.com) | External | Yes |
| Hotel Search API (Hotels.com) | External | Fallback |
| Hotel Search API (Expedia) | External | Fallback |
| PriceMonitor Agent | Internal | Yes |
| Price Cache (Redis) | Internal | Yes |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Search results returned | Latency | < 5 seconds |
| Room availability accuracy | vs booking | > 99% |
| Price accuracy | vs final booking | Within 2% |
| Booking success rate | Conversion | > 97% |
| Provider availability | Uptime | > 99% |
| Price cache hit rate | Performance | > 70% |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `hotel_search_started` | request_id, destination, dates | On search start |
| `hotel_search_completed` | request_id, results_count, duration | On completion |
| `hotel_selected` | hotel_id, price, provider | On user selection |
| `hotel_price_tracked` | hotel_id, price, trend | Price update |
| `hotel_provider_fallback` | from_provider, to_provider | Provider fallback |

---

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| Search results | 15 minutes | Price change > 5% |
| Price snapshots | 1 hour | Manual or scheduled |
| Price trends | 24 hours | Daily refresh |
| Provider health | 5 minutes | Status change |
| Availability | 5 minutes | Sold out event |

---

## Notes

- Cache results for 15 minutes (hotels less volatile than flights)
- Track availability changes in real-time
- Log provider reliability metrics
- Consider user's location preferences from profile
- Show distance to city center or specified landmark
- Always show total price for entire stay

---

*Step 4 of 12 | Hotel Search*
