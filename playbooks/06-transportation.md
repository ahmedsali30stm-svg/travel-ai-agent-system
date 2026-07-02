# Step 6: Transportation

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Finds ground transport options: airport transfers, public transit, taxi, rideshare |
| **Agent(s)** | Transport Agent (primary) |
| **Criticality** | Medium — non-critical; can be skipped if unavailable |
| **Parallel** | Sequential — runs after Step 4 (needs hotel location) |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Transport Agent** | Primary | Transport search, comparison, booking |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `pickup_location` | string | Yes | Step 3/4 results | Pickup address/coordinates |
| `dropoff_location` | string | Yes | Step 1 entities | Destination address/coordinates |
| `date_time` | datetime | Yes | Step 1 entities | Transport date/time |
| `passengers` | integer | Yes | Step 1 entities | Number of passengers |
| `luggage_count` | integer | No | User input | Number of bags |
| `accessibility_needs` | list | No | User profile | Accessibility requirements |
| `budget` | decimal | No | Budget Agent | Max transport budget |
| `preferences` | object | No | User profile | Transport preferences |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `options` | list | Transport options (taxi, rideshare, transit) |
| `recommended` | object | Best option |
| `total_cost` | decimal | Estimated total cost |
| `travel_time` | integer | Estimated travel time (minutes) |
| `route_map` | string | Route URL |
| `alternatives` | list | Backup options |

### Transport Option Schema

```yaml
transport:
  option_id: string
  mode: enum              # taxi, rideshare, public_transit, shuttle, car_rental
  provider: string        # Uber, Lyft, local taxi, transit agency
  pickup_location: string
  dropoff_location: string
  estimated_time: integer # minutes
  estimated_cost: decimal
  currency: string
  distance: decimal       # km
  availability: enum      # available, limited, surge
  surge_multiplier: decimal  # 1.0 = no surge
  booking_url: string
  features: list[string]  # wifi, wheelchair, child_seat
  rating: decimal         # provider rating 0-5
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| Pickup location valid | business | Critical | Return error |
| Dropoff location valid | business | Critical | Return error |
| DateTime is future | business | High | Return error |
| Passengers > 0 | range | High | Return error |
| At least 1 option | business | Medium | Expand search radius |
| Cost > 0 | business | Low | Exclude option |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| API timeout | 2 | Linear 1s/2s | Try alternative mode |
| No rides available | 1 | None | Suggest public transit |
| Price fetch failure | 1 | None | Use estimate |
| Provider error (5xx) | 2 | Linear 1s | Try next provider |
| Surge pricing | 0 | None | Warn user, suggest waiting |

### Retry Decision Tree

```
Transport Search Fails
    │
    ├── API timeout?
    │   ├── Yes → Retry (max 2x, linear 1s/2s)
    │   │         └── Still fails? → Try alternative mode
    │   └── No → Continue
    │
    ├── No rides available?
    │   └── Yes → Suggest public transit or taxi
    │
    └── Surge pricing active?
        └── Yes → Warn user, suggest waiting 15-30 minutes
```

### Mode Fallback Chain

```
Primary: Rideshare (Uber/Lyft)
    │
    ├── unavailable → Secondary: Taxi
    │                    │
    │                    ├── unavailable → Tertiary: Public Transit
    │                    │                    │
    │                    │                    └── unavailable → Shuttle service
    │                    │
    │                    └── available → Return results
    │
    └── available → Return results
```

---

## Timing

| Metric | Target | Warning | Timeout | Critical |
|--------|--------|---------|---------|----------|
| Transit API call | < 2s | 3s | 5s | 8s |
| Rideshare API call | < 2s | 3s | 5s | 8s |
| Route calculation | < 1s | 2s | 3s | 5s |
| **Total Step** | < 3s | 5s | 10s | 15s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Invalid location | E6001 | "Invalid pickup/dropoff location" | Return error |
| No transport found | E6002 | "No transport available. Showing alternatives..." | Expand search |
| Surge pricing | E6003 | "Surge pricing active: ${multiplier}x normal rate" | Warn user |
| Route unavailable | E6004 | "Route unavailable. Showing general directions" | Provide estimate |
| Provider down | E6005 | "Service temporarily unavailable" | Try alternative |

### Error Response Format

```json
{
  "error": false,
  "warning": true,
  "warning_code": "W6003",
  "message": "Surge pricing active (2.1x). Consider waiting 15 minutes or:",
  "options": [...],
  "alternative_modes": ["taxi", "public_transit"]
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| Rideshare API (Uber) | External | Yes |
| Rideshare API (Lyft) | External | Fallback |
| Transit API (Google Maps) | External | Fallback |
| Taxi API | External | Fallback |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Results returned | Latency | < 3 seconds |
| Price accuracy | vs actual ride | Within 10% |
| Time accuracy | vs actual time | Within 20% |
| Mode selection relevance | User satisfaction | > 85% |
| Booking success rate | Conversion | > 90% |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `transport_search_started` | request_id, pickup, dropoff | On search start |
| `transport_search_completed` | request_id, options_count, duration | On completion |
| `transport_selected` | option_id, mode, price | On user selection |
| `transport_booked` | option_id, booking_id | On booking |

---

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| Search results | 10 minutes | Availability change |
| Route calculations | 1 hour | Road condition change |
| Price estimates | 5 minutes | Surge change |
| Transit schedules | 15 minutes | Schedule change |

---

## Notes

- Cache results for 10 minutes (transport is semi-volatile)
- Track surge pricing patterns for user guidance
- Log mode selection preferences
- Include accessibility options when available
- Show multiple modes side-by-side for comparison
- Always show estimated travel time

---

*Step 6 of 12 | Transportation*
