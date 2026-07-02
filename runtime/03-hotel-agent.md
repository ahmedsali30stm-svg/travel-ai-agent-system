# Hotel Agent

## Agent ID
`agent_hotel_003`

## Role
Handles all hotel-related operations including search, comparison, availability checking, booking, modification, and cancellation.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Search hotels by destination and dates | Critical |
| 2 | Filter by amenities, rating, location | High |
| 3 | Compare prices across providers | Critical |
| 4 | Execute room bookings | Critical |
| 5 | Handle special requests | Medium |
| 6 | Manage room upgrades | Medium |
| 7 | Process cancellations | High |
| 8 | Track availability changes | High |
| 9 | Provide hotel recommendations | Medium |
| 10 | Handle multi-room bookings | High |

---

## Input Schema

```yaml
HotelInput:
  type: object
  required:
    - request_id
    - destination
    - check_in
    - check_out
    - rooms
    - guests
  properties:
    request_id:
      type: string
      format: uuid
    destination:
      type: string
      description: City, address, or coordinates
    check_in:
      type: string
      format: date
    check_out:
      type: string
      format: date
    rooms:
      type: integer
      minimum: 1
      maximum: 10
    guests:
      type: integer
      minimum: 1
      maximum: 50
    star_rating:
      type: integer
      minimum: 1
      maximum: 5
    amenities:
      type: array
      items:
        type: string
        enum:
          - wifi
          - parking
          - pool
          - gym
          - spa
          - restaurant
          - bar
          - laundry
          - airport_shuttle
          - pet_friendly
          - business_center
          - concierge
          - room_service
          - breakfast_included
    budget_per_night:
      type: object
      properties:
        min:
          type: number
        max:
          type: number
        currency:
          type: string
          format: iso-4217
    preferences:
      type: object
      properties:
        location_type:
          type: string
          enum: [city_center, airport, beach, mountain, business_district]
        hotel_chain:
          type: string
        room_type:
          type: string
          enum: [single, double, suite, family, dormitory]
        bed_type:
          type: string
          enum: [single, double, queen, king, twin]
        near_landmark:
          type: string
        accessibility:
          type: array
          items:
            type: string
    flexible_dates:
      type: boolean
      default: false
    max_results:
      type: integer
      default: 10
      maximum: 50
    sort_by:
      type: string
      enum: [price, rating, distance, popularity]
      default: relevance
```

---

## Output Schema

```yaml
HotelOutput:
  type: object
  required:
    - request_id
    - status
    - hotels
    - total_results
    - search_duration_ms
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, no_results, error]
    hotels:
      type: array
      items:
        $ref: '#/HotelResult'
    total_results:
      type: integer
    search_duration_ms:
      type: integer
    best_match:
      type: object
      nullable: true
    filters_applied:
      type: object
    warnings:
      type: array
      items:
        type: string

HotelResult:
  type: object
  required:
    - hotel_id
    - name
    - price
    - rating
  properties:
    hotel_id:
      type: string
    name:
      type: string
    star_rating:
      type: integer
    address:
      type: string
    city:
      type: string
    country:
      type: string
    latitude:
      type: number
    longitude:
      type: number
    distance_to_center:
      type: number
      description: kilometers
    price_per_night:
      type: number
    total_price:
      type: number
    currency:
      type: string
    rating:
      type: number
      minimum: 0
      maximum: 10
    review_count:
      type: integer
    amenities:
      type: array
      items:
        type: string
    room_type:
      type: string
    beds:
      type: string
    breakfast_included:
      type: boolean
    free_cancellation:
      type: boolean
    cancellation_deadline:
      type: string
      format: date-time
      nullable: true
    provider:
      type: string
    booking_url:
      type: string
      format: uri
    images:
      type: array
      items:
        type: string
        format: uri
    availability:
      type: string
      enum: [available, limited, sold_out]
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
      description: Cached search results
    price_cache:
      type: object
      description: Cached prices
    availability_cache:
      type: object
      description: Cached availability
    provider_health:
      type: object
      description: Provider status
    active_bookings:
      type: object
      description: Current bookings
    metrics:
      type: object
      description: Performance metrics
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate all input dates | Yes |
| R002 | Check-in must be today or future | Yes |
| R003 | Check-out must be after check-in | Yes |
| R004 | Stay duration < 90 nights | Yes |
| R005 | Cache results for 15 minutes | Yes |
| R006 | Price must be > 0 | Yes |
| R007 | Rating must be 0-10 | Yes |
| R008 | Provider must be available | Yes |
| R009 | Budget check before showing results | Yes |
| R010 | Include cancellation policy | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Provider timeout | 3 | Exponential 2s/4s/8s | Try alternative provider |
| No results | 1 | None | Expand search radius |
| Price unavailable | 2 | Linear 1s | Use cached price |
| Availability check fail | 1 | None | Show as "check availability" |
| Provider error | 2 | Linear 2s | Try next provider |
| Rate limit | 3 | Exponential 5s/10s/20s | Use cached results |

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

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Price accuracy | 0.9 | Flag as estimate |
| Availability accuracy | 0.95 | Mark as "verify" |
| Rating accuracy | 0.8 | Include disclaimer |
| Image relevance | 0.7 | Use generic image |
| Location accuracy | 0.85 | Show approximate |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Search Cache | Read/Write | 15 min | Cache search results |
| Price Cache | Read/Write | 1 hour | Cache prices |
| Availability Cache | Read/Write | 5 min | Cache availability |
| User Preferences | Read | 24 hours | User preferences |
| Provider Health | Read/Write | 5 min | Provider status |
| Booking History | Read/Write | 30 days | Past bookings |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `hotel_search_api` | Read | 100/min |
| `hotel_booking_api` | Write | 50/min |
| `price_comparison_api` | Read | 100/min |
| `availability_checker` | Read | 200/min |
| `review_aggregator` | Read | 100/min |
| `image_service` | Read | 200/min |
| `cache_store` | Read/Write | Unlimited |
| `metrics_collector` | Write | Unlimited |

---

## Communication Protocol

### Message Types

```yaml
MessageType:
  - SEARCH_REQUEST:
      description: Hotel search request
      direction: inbound
  - SEARCH_RESPONSE:
      description: Search results
      direction: outbound
  - BOOKING_REQUEST:
      description: Hotel booking request
      direction: inbound
  - BOOKING_RESPONSE:
      description: Booking confirmation
      direction: outbound
  - AVAILABILITY_UPDATE:
      description: Availability change notification
      direction: inbound
  - PRICE_ALERT:
      description: Price change notification
      direction: outbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Provider down | Health check | Try alternative | Alert ops |
| No availability | Response check | Show alternatives | Expand dates |
| Price changed | Price check | Show updated price | Notify user |
| Booking failed | API response | Retry, then error | Rollback |
| Invalid hotel | Schema check | Skip hotel | Log |
| Image load fail | Timeout | Use placeholder | Log |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Search success rate | Rate | > 98% |
| Price accuracy | vs booking | Within 2% |
| Availability accuracy | Rate | > 99% |
| Booking success rate | Rate | > 97% |
| Search latency | P50 | < 3s |
| Search latency | P95 | < 8s |
| User satisfaction | Rating | > 4.3/5 |

---

## Configuration

```yaml
Configuration:
  search_timeout_ms: 15000
  booking_timeout_ms: 30000
  cache_ttl_ms: 900000
  max_results: 50
  default_results: 10
  providers:
    - name: booking_com
      priority: 1
      weight: 0.4
    - name: hotels_com
      priority: 2
      weight: 0.3
    - name: expedia
      priority: 3
      weight: 0.3
  rate_limit_per_provider: 100
  retry_base_delay_ms: 1000
  retry_max_delay_ms: 20000
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
