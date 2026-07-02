# Activities Agent

## Agent ID
`agent_activities_005`

## Role
Discovers and recommends local activities, tours, attractions, and experiences based on user preferences and destination.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Search activities by destination | Critical |
| 2 | Filter by interests and constraints | High |
| 3 | Compare prices and reviews | High |
| 4 | Handle ticket bookings | Critical |
| 5 | Create activity itineraries | Medium |
| 6 | Manage group bookings | Medium |
| 7 | Provide activity recommendations | High |
| 8 | Track availability | High |
| 9 | Handle special requirements | Medium |
| 10 | Support multi-day activities | Medium |

---

## Input Schema

```yaml
ActivitiesInput:
  type: object
  required:
    - request_id
    - destination
    - travel_dates
    - group_size
  properties:
    request_id:
      type: string
      format: uuid
    destination:
      type: string
    travel_dates:
      type: object
      required:
        - start
        - end
      properties:
        start:
          type: string
          format: date
        end:
          type: string
          format: date
    group_size:
      type: integer
      minimum: 1
      maximum: 50
    interests:
      type: array
      items:
        type: string
        enum:
          - culture
          - adventure
          - nature
          - food
          - nightlife
          - shopping
          - history
          - art
          - music
          - sports
          - relaxation
          - family
          - romantic
          - photography
    budget_per_person:
      type: object
      properties:
        min:
          type: number
        max:
          type: number
        currency:
          type: string
    duration_preference:
      type: string
      enum: [half_day, full_day, multi_day, any]
      default: any
    difficulty_level:
      type: string
      enum: [easy, moderate, challenging, any]
      default: any
    accessibility_needs:
      type: array
      items:
        type: string
    exclude:
      type: array
      items:
        type: string
        description: Activity names or IDs to exclude
    max_results:
      type: integer
      default: 20
      maximum: 50
    sort_by:
      type: string
      enum: [price, rating, popularity, duration]
      default: relevance
```

---

## Output Schema

```yaml
ActivitiesOutput:
  type: object
  required:
    - request_id
    - status
    - activities
    - total_results
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, no_results, error]
    activities:
      type: array
      items:
        $ref: '#/ActivityResult'
    total_results:
      type: integer
    top_picks:
      type: array
      items:
        type: object
    search_duration_ms:
      type: integer
    warnings:
      type: array
      items:
        type: string

ActivityResult:
  type: object
  required:
    - activity_id
    - name
    - price
    - rating
  properties:
    activity_id:
      type: string
    name:
      type: string
    description:
      type: string
    category:
      type: string
      enum: [tour, attraction, experience, show, adventure, class, workshop]
    destination:
      type: string
    location:
      type: string
    latitude:
      type: number
    longitude:
      type: number
    duration_minutes:
      type: integer
    price_per_person:
      type: number
    total_price:
      type: number
    currency:
      type: string
    rating:
      type: number
      minimum: 0
      maximum: 5
    review_count:
      type: integer
    difficulty:
      type: string
      enum: [easy, moderate, challenging]
    includes:
      type: array
      items:
        type: string
    excludes:
      type: array
      items:
        type: string
    availability:
      type: object
      properties:
        status:
          type: string
          enum: [available, limited, sold_out]
        next_available:
          type: string
          format: date
          nullable: true
    booking_url:
      type: string
      format: uri
    images:
      type: array
      items:
        type: string
        format: uri
    provider:
      type: string
    cancellation_policy:
      type: string
    languages:
      type: array
      items:
        type: string
    accessibility:
      type: array
      items:
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
    review_cache:
      type: object
    availability_cache:
      type: object
    provider_health:
      type: object
    active_bookings:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate destination | Yes |
| R002 | Travel dates must be valid | Yes |
| R003 | Group size > 0 | Yes |
| R004 | Cache results for 30 minutes | Yes |
| R005 | Price must be > 0 | Yes |
| R006 | Duration must be > 0 | Yes |
| R007 | Include cancellation policy | Yes |
| R008 | Check accessibility when requested | Yes |
| R009 | Filter by difficulty when specified | Yes |
| R010 | Support multi-language activities | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Provider timeout | 2 | Linear 1s/2s | Try alternative |
| No results | 1 | None | Broaden interests |
| Booking unavailable | 1 | None | Mark "check availability" |
| Review fetch fail | 1 | None | Skip reviews |
| Provider error | 2 | Linear 1s | Try next provider |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Recommendation relevance | 0.7 | Broaden search |
| Price accuracy | 0.85 | Flag as estimate |
| Availability accuracy | 0.9 | Mark "verify" |
| Review accuracy | 0.8 | Include disclaimer |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Search Cache | Read/Write | 30 min | Cache results |
| Review Cache | Read/Write | 24 hours | Cache reviews |
| User Preferences | Read | 24 hours | Preferences |
| Booking History | Read/Write | 30 days | Past bookings |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `activities_search_api` | Read | 100/min |
| `activities_booking_api` | Write | 50/min |
| `review_aggregator` | Read | 100/min |
| `availability_checker` | Read | 200/min |
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
  - AVAILABILITY_UPDATE:
      direction: inbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Provider down | Health check | Try alternative | Alert ops |
| No availability | Response check | Show alternatives | Expand dates |
| Booking failed | API response | Retry, then error | Rollback |
| Price changed | Price check | Show updated | Notify user |
| Activity cancelled | Webhook | Notify user | Offer alternatives |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Search success rate | Rate | > 95% |
| Recommendation relevance | User rating | > 80% |
| Booking success rate | Rate | > 95% |
| Search latency | P50 | < 3s |
| User satisfaction | Rating | > 4.2/5 |

---

## Configuration

```yaml
Configuration:
  search_timeout_ms: 10000
  booking_timeout_ms: 20000
  cache_ttl_ms: 1800000
  max_results: 50
  default_results: 20
  providers:
    - name: viator
      priority: 1
      weight: 0.4
    - name: getyourguide
      priority: 2
      weight: 0.35
    - name: airbnb_experiences
      priority: 3
      weight: 0.25
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
