# Step 5: Activities Search

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Searches local activities, tours, attractions, experiences |
| **Agent(s)** | Activities Agent (primary), Review Agent (support) |
| **Criticality** | Medium — non-critical; can be skipped if unavailable |
| **Parallel** | Runs in parallel with Steps 3, 4 |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Activities Agent** | Primary | Activity search, comparison, booking |
| **Review Agent** | Support | Review aggregation, sentiment analysis |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `destination` | string | Yes | Step 1 entities | Destination city/area |
| `travel_dates` | object | Yes | Step 1 entities | Start and end dates |
| `interests` | list | No | User profile | Activity preferences |
| `group_size` | integer | Yes | Step 1 entities | Number of participants |
| `budget` | decimal | No | Budget Agent | Total activity budget |
| `duration_preference` | enum | No | User preference | half_day, full_day, multi_day |
| `accessibility_needs` | list | No | User profile | Accessibility requirements |
| `exclude` | list | No | User input | Activities to exclude |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `activities` | list | Available activity options |
| `top_picks` | list | Recommended activities (max 5) |
| `total_cost` | decimal | Total activity cost |
| `reviews_summary` | object | Aggregated reviews |
| `alternatives` | list | Backup options |
| `search_metadata` | object | Provider, search time, result count |

### Activity Option Schema

```yaml
activity:
  activity_id: string
  name: string
  description: string
  category: enum           # tour, attraction, experience, show, adventure
  destination: string
  location: string
  latitude: decimal
  longitude: decimal
  duration: integer        # minutes
  price_per_person: decimal
  total_price: decimal
  currency: string
  rating: decimal          # 0-5
  review_count: integer
  difficulty: enum         # easy, moderate, hard
  includes: list[string]   # what's included
  excludes: list[string]   # what's not included
  availability: object     # available dates/times
  booking_url: string
  images: list[string]
  provider: string
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| Destination is valid | business | Critical | Return error |
| Travel dates are valid | business | Critical | Return error |
| Group size > 0 | range | High | Return error |
| Activities found | business | Medium | Expand search |
| Price > 0 | business | Medium | Exclude option |
| Duration > 0 | business | Low | Exclude option |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| API timeout | 2 | Linear 1s/2s | Try alternative provider |
| No results found | 1 | None | Broaden interests |
| Booking unavailable | 1 | None | Mark as "check availability" |
| Review fetch failure | 1 | None | Skip review summary |
| Provider error (5xx) | 2 | Linear 1s | Try next provider |

### Retry Decision Tree

```
Activities Search Fails
    │
    ├── API timeout?
    │   ├── Yes → Retry (max 2x, linear 1s/2s)
    │   │         └── Still fails? → Try alternative provider
    │   └── No → Continue
    │
    ├── No results found?
    │   └── Yes → Broaden search (more categories, wider area)
    │
    └── Review fetch fails?
        └── Yes → Skip reviews, continue with activity data
```

### Provider Fallback Chain

```
Primary: Viator
    │
    ├── fails → Secondary: GetYourGuide
    │              │
    │              ├── fails → Tertiary: Airbnb Experiences
    │              │              │
    │              │              └── fails → Return empty (non-critical)
    │              │
    │              └── succeeds → Return results
    │
    └── succeeds → Return results
```

---

## Timing

| Metric | Target | Warning | Timeout | Critical |
|--------|--------|---------|---------|----------|
| Search API call | < 2s | 4s | 8s | 10s |
| Review aggregation | < 1s | 2s | 3s | 5s |
| Filtering/ranking | < 500ms | 1s | 2s | 3s |
| **Total Step** | < 3s | 6s | 10s | 15s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Invalid destination | E5001 | "Invalid destination: {dest}" | Return error |
| No activities found | E5002 | "No activities found for your dates" | Expand search |
| All providers down | E5003 | "Activities temporarily unavailable" | Skip step |
| Booking unavailable | E5004 | "Check availability directly" | Mark as info |
| Price unavailable | E5005 | "Contact provider for pricing" | Mark as info |

### Error Response Format

```json
{
  "error": false,
  "warning": true,
  "warning_code": "W5002",
  "message": "No activities found for your specific dates. Showing popular options:",
  "activities": [...],
  "search_metadata": {
    "note": "Availability may vary by date"
  }
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| Activities API (Viator) | External | Yes |
| Activities API (GetYourGuide) | External | Fallback |
| Activities API (Airbnb) | External | Fallback |
| Review Agent | Internal | No |
| Review Cache (Redis) | Internal | Yes |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Search results returned | Latency | < 3 seconds |
| Recommendation relevance | User rating | > 80% |
| Booking success rate | Conversion | > 95% |
| User satisfaction | Rating | > 4/5 |
| Review accuracy | vs actual | > 90% |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `activity_search_started` | request_id, destination | On search start |
| `activity_search_completed` | request_id, results_count, duration | On completion |
| `activity_selected` | activity_id, price, provider | On user selection |
| `activity_booked` | activity_id, booking_id | On booking |

---

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| Search results | 30 minutes | Availability change |
| Reviews | 24 hours | New review posted |
| Activity details | 1 hour | Manual update |
| Provider health | 5 minutes | Status change |

---

## Notes

- Cache results for 30 minutes (activities are stable)
- Track activity popularity for recommendations
- Log booking conversion rates
- Consider user's past activity preferences
- Include accessibility information when available
- Group activities by category for easier browsing

---

*Step 5 of 12 | Activities Search*
