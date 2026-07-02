# Step 3: Flight Search

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Searches available flights, compares options, tracks prices |
| **Agent(s)** | Flight Agent (primary), PriceMonitor Agent (support) |
| **Criticality** | High — results used in final output; fallback to cached data available |
| **Parallel** | Runs in parallel with Steps 4, 5 |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Flight Agent** | Primary | Flight search, comparison, booking |
| **PriceMonitor Agent** | Support | Price tracking, trend analysis, alerts |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `origin` | string | Yes | Step 1 entities | Origin airport/city code |
| `destination` | string | Yes | Step 1 entities | Destination airport/city code |
| `departure_date` | date | Yes | Step 1 entities | Departure date (YYYY-MM-DD) |
| `return_date` | date | No | Step 1 entities | Return date (for round trip) |
| `passengers` | integer | Yes | Step 1 entities | Number of passengers |
| `class` | enum | No | User preference | economy, business, first |
| `budget_per_ticket` | decimal | No | Budget Agent | Max price per ticket |
| `preferences` | object | No | User profile | Airline, stops, times |
| `flexible_dates` | boolean | No | User input | Allow ±3 day search |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `flights` | list | Available flight options (sorted by relevance) |
| `best_option` | object | Recommended flight |
| `total_cost` | decimal | Total flight cost for all passengers |
| `price_trend` | enum | stable, rising, falling |
| `alternatives` | list | Backup options |
| `search_metadata` | object | Provider, search time, result count |

### Flight Option Schema

```yaml
flight:
  flight_id: string
  airline: string
  flight_number: string
  origin: string          # IATA code
  destination: string     # IATA code
  departure: datetime
  arrival: datetime
  duration: integer       # minutes
  stops: integer
  stop_cities: list[string]
  class: enum
  price_per_ticket: decimal
  total_price: decimal
  currency: string
  baggage: object
  refundable: boolean
  provider: string
  booking_url: string
  seats_available: integer
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| Origin is valid IATA code | format | Critical | Return error |
| Destination is valid IATA code | format | Critical | Return error |
| Departure is future date | business | Critical | Return date error |
| Return > departure (if round trip) | business | High | Return date error |
| Passengers: 1-9 adults | range | High | Clamp to valid |
| At least 1 flight found | business | High | Expand search |
| Price > 0 | business | Medium | Exclude option |
| Duration > 0 | business | Low | Exclude option |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Primary API timeout | 3 | Exponential 2s/4s/8s | Try alternative provider |
| No results found | 1 | None | Expand date range ±3 days |
| Price fetch failure | 2 | Linear 1s | Use cached price |
| Provider error (5xx) | 2 | Linear 2s | Try next provider |
| Rate limit hit | 3 | Exponential 5s/10s/20s | Use cached results |
| Partial results | 0 | None | Return available results |

### Retry Decision Tree

```
Flight Search Fails
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
        └── Yes → Expand search (±3 days, alternative airports)
```

### Provider Fallback Chain

```
Primary: Amadeus
    │
    ├── fails → Secondary: Skyscanner
    │              │
    │              ├── fails → Tertiary: Google Flights
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
| Price comparison | < 500ms | 1s | 2s | 3s |
| Price monitoring | < 200ms | 500ms | 1s | 2s |
| **Total Step** | < 5s | 10s | 15s | 20s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Invalid airport code | E3001 | "Invalid airport code: {code}" | Return error |
| No flights found | E3002 | "No flights found. Expanding search..." | Expand search |
| All providers down | E3003 | "Showing cached results. Prices may vary." | Use cache |
| Price spike detected | E3004 | "Prices increased 20% since yesterday" | Warn user |
| Booking unavailable | E3005 | "This flight is no longer available" | Show alternatives |
| Rate limited | E3006 | "Please wait a moment..." | Retry with backoff |

### Error Response Format

```json
{
  "error": false,
  "warning": true,
  "warning_code": "W3002",
  "message": "No direct flights found. Showing options with 1 stop:",
  "flights": [...],
  "search_metadata": {
    "expanded_search": true,
    "alternative_airports": ["JFK", "EWR"],
    "date_range": ["2026-07-10", "2026-07-14"]
  }
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| Flight Search API (Amadeus) | External | Yes |
| Flight Search API (Skyscanner) | External | Fallback |
| Flight Search API (Google) | External | Fallback |
| PriceMonitor Agent | Internal | Yes |
| Price Cache (Redis) | Internal | Yes |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Search results returned | Latency | < 5 seconds |
| Price accuracy | vs final booking | Within 2% |
| Booking success rate | Conversion | > 98% |
| Zero duplicate bookings | Idempotency | 100% |
| Provider availability | Uptime | > 99% |
| Price cache hit rate | Performance | > 70% |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `flight_search_started` | request_id, origin, destination | On search start |
| `flight_search_completed` | request_id, results_count, duration | On completion |
| `flight_selected` | flight_id, price, provider | On user selection |
| `flight_price_tracked` | flight_id, price, trend | Price update |
| `flight_provider_fallback` | from_provider, to_provider | Provider fallback |

---

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| Search results | 5 minutes | Price change > 5% |
| Price snapshots | 1 hour | Manual or scheduled |
| Price trends | 24 hours | Daily refresh |
| Provider health | 5 minutes | Status change |

---

## Notes

- Cache results for 5 minutes (flights are volatile)
- Track price changes for alerts
- Log provider performance for reliability metrics
- Consider user's airline preferences from profile
- Support flexible date search for better prices
- Always show total price (not per-person)

---

*Step 3 of 12 | Flight Search*
