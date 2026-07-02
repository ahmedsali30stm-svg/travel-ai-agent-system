# Flight Agent

## Agent ID
`agent_flight_004`

## Role
Handles all flight-related operations including search, comparison, booking, modification, and cancellation across multiple airline providers.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Search flights by route and dates | Critical |
| 2 | Compare prices across airlines | Critical |
| 3 | Execute flight bookings | Critical |
| 4 | Handle seat selection | Medium |
| 5 | Manage booking modifications | High |
| 6 | Process cancellations | High |
| 7 | Track price changes | High |
| 8 | Provide flight recommendations | Medium |
| 9 | Handle multi-city itineraries | High |
| 10 | Support flexible date search | Medium |

---

## Input Schema

```yaml
FlightInput:
  type: object
  required:
    - request_id
    - origin
    - destination
    - departure_date
    - passengers
  properties:
    request_id:
      type: string
      format: uuid
    origin:
      type: string
      description: IATA airport code or city name
    destination:
      type: string
      description: IATA airport code or city name
    departure_date:
      type: string
      format: date
    return_date:
      type: string
      format: date
      nullable: true
    passengers:
      type: object
      required:
        - adults
      properties:
        adults:
          type: integer
          minimum: 1
          maximum: 9
        children:
          type: integer
          minimum: 0
          maximum: 8
        infants:
          type: integer
          minimum: 0
          maximum: 4
    class:
      type: string
      enum: [economy, premium_economy, business, first]
      default: economy
    trip_type:
      type: string
      enum: [one_way, round_trip, multi_city]
      default: round_trip
    budget_per_ticket:
      type: object
      properties:
        max:
          type: number
        currency:
          type: string
          format: iso-4217
    preferences:
      type: object
      properties:
        airlines:
          type: array
          items:
            type: string
        max_stops:
          type: integer
          minimum: 0
          maximum: 3
          default: 2
        departure_time:
          type: string
          enum: [morning, afternoon, evening, night, any]
          default: any
        baggage_included:
          type: boolean
        refundable:
          type: boolean
        seat_preference:
          type: string
          enum: [window, aisle, middle, any]
        meal_preference:
          type: string
    flexible_dates:
      type: boolean
      default: false
    date_range_days:
      type: integer
      default: 3
      maximum: 7
    max_results:
      type: integer
      default: 20
      maximum: 100
    sort_by:
      type: string
      enum: [price, duration, departure_time, arrival_time, stops]
      default: price
    multi_city_segments:
      type: array
      items:
        type: object
        properties:
          origin:
            type: string
          destination:
            type: string
          date:
            type: string
            format: date
```

---

## Output Schema

```yaml
FlightOutput:
  type: object
  required:
    - request_id
    - status
    - flights
    - total_results
    - search_duration_ms
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, no_results, error]
    flights:
      type: array
      items:
        $ref: '#/FlightResult'
    total_results:
      type: integer
    search_duration_ms:
      type: integer
    best_match:
      type: object
      nullable: true
    price_trend:
      type: string
      enum: [stable, rising, falling, volatile]
    warnings:
      type: array
      items:
        type: string

FlightResult:
  type: object
  required:
    - flight_id
    - airline
    - price
    - departure
    - arrival
  properties:
    flight_id:
      type: string
    airline:
      type: string
    flight_number:
      type: string
    origin:
      type: string
      description: IATA code
    destination:
      type: string
      description: IATA code
    departure:
      type: string
      format: date-time
    arrival:
      type: string
      format: date-time
    duration_minutes:
      type: integer
    stops:
      type: integer
    stop_cities:
      type: array
      items:
        type: string
    layover_durations:
      type: array
      items:
        type: integer
        description: minutes
    class:
      type: string
    price_per_ticket:
      type: number
    total_price:
      type: number
    currency:
      type: string
    baggage:
      type: object
      properties:
        carry_on:
          type: string
        checked:
          type: string
    refundable:
      type: boolean
    cancellation_policy:
      type: string
    booking_class:
      type: string
      description: Fare class code
    provider:
      type: string
    booking_url:
      type: string
      format: uri
    seats_available:
      type: integer
    aircraft_type:
      type: string
    on_time_performance:
      type: number
      description: Percentage
    confidence_score:
      type: number
```

---

## Internal State

```yaml
InternalState:
  type: object
  properties:
    search_cache:
      type: object
    price_history:
      type: object
    provider_health:
      type: object
    active_bookings:
      type: object
    seat_maps:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate IATA airport codes | Yes |
| R002 | Departure must be future date | Yes |
| R003 | Return must be after departure | Yes |
| R004 | Total passengers: 1-21 | Yes |
| R005 | Infants <= adults | Yes |
| R006 | Cache results for 5 minutes | Yes |
| R007 | Price must be > 0 | Yes |
| R008 | Duration must be > 0 | Yes |
| R009 | Validate multi-city segments | Yes |
| R010 | Include baggage info | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Provider timeout | 3 | Exponential 2s/4s/8s | Try alternative |
| No flights found | 1 | None | Expand dates ±3 days |
| Price fetch fail | 2 | Linear 1s | Use cached price |
| Provider error | 2 | Linear 2s | Try next provider |
| Rate limit | 3 | Exponential 5s/10s/20s | Use cache |
| Partial results | 0 | None | Return available |

### Provider Fallback Chain

```
Primary: Amadeus
    │
    ├── fails → Secondary: Skyscanner
    │              │
    │              ├── fails → Tertiary: Google Flights
    │              │              │
    │              │              └── fails → Return cached
    │              │
    │              └── succeeds → Return results
    │
    └── succeeds → Return results
```

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Price accuracy | 0.95 | Flag as estimate |
| Schedule accuracy | 0.98 | Show disclaimer |
| Availability accuracy | 0.95 | Mark "verify" |
| Seat availability | 0.9 | Show approximate |
| Baggage info accuracy | 0.9 | Include disclaimer |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Search Cache | Read/Write | 5 min | Cache results |
| Price History | Read/Write | 24 hours | Track trends |
| User Preferences | Read | 24 hours | Preferences |
| Booking History | Read/Write | 30 days | Past bookings |
| Provider Health | Read/Write | 5 min | Provider status |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `flight_search_api` | Read | 100/min |
| `flight_booking_api` | Write | 50/min |
| `seat_selection_api` | Read/Write | 50/min |
| `price_tracker` | Read/Write | 200/min |
| `airport_database` | Read | Unlimited |
| `airline_database` | Read | Unlimited |
| `cache_store` | Read/Write | Unlimited |

---

## Communication Protocol

```yaml
MessageType:
  - SEARCH_REQUEST:
      direction: inbound
  - SEARCH_RESPONSE:
      direction: outbound
  - BOOKING_REQUEST:
      direction: inbound
  - BOOKING_RESPONSE:
      direction: outbound
  - PRICE_ALERT:
      direction: outbound
  - SCHEDULE_CHANGE:
      direction: inbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Provider down | Health check | Try alternative | Alert ops |
| No flights | Response check | Expand search | Suggest alternatives |
| Price changed | Price check | Show updated | Notify user |
| Booking failed | API response | Retry, then error | Rollback |
| Schedule change | Webhook | Notify user | Offer rebooking |
| Overbooking | Booking response | Find alternative | Compensate |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Search success rate | Rate | > 98% |
| Price accuracy | vs booking | Within 2% |
| Booking success rate | Rate | > 98% |
| Search latency | P50 | < 3s |
| Search latency | P95 | < 8s |
| User satisfaction | Rating | > 4.4/5 |

---

## Configuration

```yaml
Configuration:
  search_timeout_ms: 15000
  booking_timeout_ms: 30000
  cache_ttl_ms: 300000
  max_results: 100
  default_results: 20
  providers:
    - name: amadeus
      priority: 1
      weight: 0.4
    - name: skyscanner
      priority: 2
      weight: 0.35
    - name: google_flights
      priority: 3
      weight: 0.25
  rate_limit_per_provider: 100
  retry_base_delay_ms: 2000
  retry_max_delay_ms: 20000
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
