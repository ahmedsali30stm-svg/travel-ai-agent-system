# Transportation Agent

## Agent ID
`agent_transportation_006`

## Role
Handles all ground transportation including airport transfers, public transit, taxi, rideshare, and car rental options.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Search transport options | Critical |
| 2 | Compare prices and modes | High |
| 3 | Book airport transfers | Critical |
| 4 | Provide public transit info | High |
| 5 | Handle taxi/rideshare booking | High |
| 6 | Calculate routes and times | High |
| 7 | Track surge pricing | Medium |
| 8 | Support accessibility needs | Medium |
| 9 | Provide real-time availability | High |
| 10 | Handle multi-modal journeys | Medium |

---

## Input Schema

```yaml
TransportationInput:
  type: object
  required:
    - request_id
    - pickup_location
    - dropoff_location
    - date_time
    - passengers
  properties:
    request_id:
      type: string
      format: uuid
    pickup_location:
      type: string
      description: Address, coordinates, or landmark
    dropoff_location:
      type: string
    date_time:
      type: string
      format: date-time
    passengers:
      type: integer
      minimum: 1
      maximum: 20
    luggage_count:
      type: integer
      minimum: 0
      maximum: 20
      default: 0
    transport_mode:
      type: string
      enum: [any, taxi, rideshare, public_transit, shuttle, car_rental]
      default: any
    budget:
      type: object
      properties:
        max:
          type: number
        currency:
          type: string
    preferences:
      type: object
      properties:
        shared_ride:
          type: boolean
        luxury:
          type: boolean
        child_seat:
          type: boolean
        wheelchair_accessible:
          type: boolean
        pet_friendly:
          type: boolean
        wifi:
          type: boolean
    return_trip:
      type: boolean
      default: false
    max_results:
      type: integer
      default: 10
      maximum: 30
    sort_by:
      type: string
      enum: [price, time, rating, distance]
      default: relevance
```

---

## Output Schema

```yaml
TransportationOutput:
  type: object
  required:
    - request_id
    - status
    - options
    - total_results
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, no_results, error]
    options:
      type: array
      items:
        $ref: '#/TransportOption'
    total_results:
      type: integer
    recommended:
      type: object
      nullable: true
    search_duration_ms:
      type: integer
    warnings:
      type: array
      items:
        type: string

TransportOption:
  type: object
  required:
    - option_id
    - mode
    - price
    - estimated_time
  properties:
    option_id:
      type: string
    mode:
      type: string
      enum: [taxi, rideshare, public_transit, shuttle, car_rental, walking]
    provider:
      type: string
    pickup_location:
      type: string
    dropoff_location:
      type: string
    estimated_time_minutes:
      type: integer
    estimated_cost:
      type: number
    currency:
      type: string
    distance_km:
      type: number
    availability:
      type: string
      enum: [available, limited, surge, unavailable]
    surge_multiplier:
      type: number
      default: 1.0
    booking_url:
      type: string
      format: uri
      nullable: true
    features:
      type: array
      items:
        type: string
    rating:
      type: number
      nullable: true
    pickup_instructions:
      type: string
      nullable: true
    cancellation_policy:
      type: string
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
    route_cache:
      type: object
    surge_history:
      type: object
    provider_health:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate pickup location | Yes |
| R002 | Validate dropoff location | Yes |
| R003 | DateTime must be future | Yes |
| R004 | Passengers > 0 | Yes |
| R005 | Cache results for 10 minutes | Yes |
| R006 | Include surge pricing info | Yes |
| R007 | Show multiple modes | Yes |
| R008 | Calculate accurate ETAs | Yes |
| R009 | Support accessibility | Yes |
| R010 | Include pickup instructions | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| API timeout | 2 | Linear 1s/2s | Try alternative mode |
| No rides available | 1 | None | Suggest public transit |
| Price fetch fail | 1 | None | Use estimate |
| Provider error | 2 | Linear 1s | Try next provider |
| Surge pricing | 0 | None | Warn user |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Price accuracy | 0.85 | Flag as estimate |
| ETA accuracy | 0.8 | Show range |
| Availability accuracy | 0.9 | Mark "verify" |
| Route accuracy | 0.95 | Show disclaimer |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Search Cache | Read/Write | 10 min | Cache results |
| Route Cache | Read/Write | 1 hour | Cache routes |
| Surge History | Read/Write | 24 hours | Track patterns |
| User Preferences | Read | 24 hours | Preferences |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `transport_search_api` | Read | 100/min |
| `rideshare_api` | Read/Write | 50/min |
| `transit_api` | Read | 200/min |
| `taxi_api` | Read/Write | 50/min |
| `route_calculator` | Read | 200/min |
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
  - SURGE_ALERT:
      direction: outbound
  - ARRIVAL_UPDATE:
      direction: inbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Provider down | Health check | Try alternative | Alert ops |
| No availability | Response check | Expand search | Suggest alternatives |
| Surge pricing | Price check | Warn user | Suggest waiting |
| Booking failed | API response | Retry, then error | Rollback |
| Route unavailable | API response | Provide estimate | Log |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Search success rate | Rate | > 95% |
| Price accuracy | vs actual | Within 15% |
| ETA accuracy | vs actual | Within 20% |
| Booking success rate | Rate | > 90% |
| Search latency | P50 | < 2s |
| User satisfaction | Rating | > 4.1/5 |

---

## Configuration

```yaml
Configuration:
  search_timeout_ms: 10000
  booking_timeout_ms: 20000
  cache_ttl_ms: 600000
  max_results: 30
  default_results: 10
  providers:
    - name: uber
      priority: 1
    - name: lyft
      priority: 2
    - name: google_transit
      priority: 3
    - name: local_taxi
      priority: 4
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
