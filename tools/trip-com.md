# Trip.com Tool

## Overview

Trip.com API integration for hotel search, availability, and booking with strong Asia coverage.

## Tool ID

`tool_trip_com`

## Category

Hotel Search & Booking

## Capabilities

| Capability | Description | Supported |
|------------|-------------|-----------|
| Hotel Search | Search hotels | Yes |
| Hotel Details | Get hotel info | Yes |
| Availability | Check rooms | Yes |
| Prices | Get room prices | Yes |
| Reviews | Get guest reviews | Yes |
| Photos | Get hotel photos | Yes |
| Destinations | Search destinations | Yes |
| Flash Deals | Get flash sales | Yes |
| Train Tickets | Search trains | Yes |
| Flights | Search flights | Yes |

## Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| Asia Focus | Stronger in APAC | Fallback providers |
| Rate Limits | Strict limits | Rate limiter |
| Complex Pricing | Dynamic pricing | Real-time fetch |
| Affiliate Only | Must be affiliate | Apply for program |

## Authentication

```yaml
Authentication:
  type: api_key
  methods:
    - header
    - query_parameter
  credentials:
    - app_id
    - api_key
  notes: |
    - Partnership required
    - API key in header
    - Signature for some endpoints
```

## Rate Limiting

```yaml
RateLimit:
  requests_per_second: 5
  requests_per_minute: 300
  requests_per_hour: 18000
  daily_limit: 50000
  burst_size: 10
```

## Retry Policy

```yaml
RetryPolicy:
  max_retries: 3
  initial_delay_ms: 1000
  max_delay_ms: 15000
  backoff_multiplier: 2
  jitter: true
  retryable_errors:
    - NETWORK_ERROR
    - TIMEOUT
    - SERVER_ERROR
```

## Error Codes

| Code | Description | Retryable | Action |
|------|-------------|-----------|--------|
| `INVALID_REQUEST` | Bad request | No | Fix request |
| `UNAUTHORIZED` | Auth failed | No | Check credentials |
| `RATE_LIMITED` | Too many requests | Yes | Backoff |
| `SERVER_ERROR` | Server error | Yes | Retry |
| `TIMEOUT` | Timeout | Yes | Retry |
| `NOT_FOUND` | Hotel not found | No | Check ID |

## Input Schema

```yaml
TripComInput:
  type: object
  required:
    - operation
  properties:
    operation:
      type: string
      enum:
        - search_hotels
        - get_hotel_details
        - check_availability
        - get_prices
        - get_reviews
        - search_destinations
    params:
      type: object
      properties:
        destination:
          type: string
        hotel_id:
          type: string
        checkin:
          type: string
          format: date
        checkout:
          type: string
          format: date
        rooms:
          type: integer
          minimum: 1
          maximum: 8
        adults:
          type: integer
          minimum: 1
          maximum: 30
        children:
          type: integer
          minimum: 0
          maximum: 10
        currency:
          type: string
          default: USD
        language:
          type: string
          default: en
        sort:
          type: string
          enum: [price, rating, distance]
        limit:
          type: integer
          default: 20
        offset:
          type: integer
          default: 0
    options:
      type: object
      properties:
        timeout:
          type: integer
          default: 30000
        retries:
          type: integer
          default: 3
        cache:
          type: boolean
          default: true
        cache_ttl:
          type: integer
          default: 300000
```

## Output Schema

```yaml
TripComOutput:
  type: object
  required:
    - success
    - operation
  properties:
    success:
      type: boolean
    operation:
      type: string
    data:
      type: object
      nullable: true
      properties:
        hotels:
          type: array
          items:
            type: object
            properties:
              hotel_id:
                type: string
              name:
                type: string
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
              star_rating:
                type: number
              review_score:
                type: number
              review_count:
                type: integer
              price_from:
                type: object
              photos:
                type: array
              amenities:
                type: array
              url:
                type: string
        total_count:
          type: integer
        has_more:
          type: boolean
    error:
      type: object
      nullable: true
    metadata:
      type: object
      properties:
        duration_ms:
          type: integer
        cached:
          type: boolean
```

## Caching

```yaml
Caching:
  enabled: true
  ttl_ms: 300000
  max_entries: 50000
  strategy: lru
  storage: redis
```

## Validation

```yaml
Validation:
  input:
    - Destination validation
    - Date format validation
    - Room count validation
  output:
    - Hotel data validation
    - Price validation
```

## Timeout

```yaml
Timeout:
  default_ms: 30000
  search_ms: 30000
  details_ms: 15000
  max_ms: 45000
```

## Fallback

```yaml
Fallback:
  strategy: provider_chain
  fallbacks:
    - tool: hotelbeds
      condition: trip_com_unavailable
    - tool: agoda
      condition: no_results
```

## Recovery

```yaml
Recovery:
  rate_limited:
    action: exponential_backoff
  auth_failed:
    action: alert_ops
  server_error:
    action: use_fallback
```

## Usage Examples

```typescript
// Search hotels in Tokyo
await tool.execute('search_hotels', {
  destination: 'Tokyo',
  checkin: '2025-06-01',
  checkout: '2025-06-05',
  rooms: 1,
  adults: 2,
  currency: 'JPY'
});

// Get hotel details
await tool.execute('get_hotel_details', {
  hotel_id: '123456'
});
```

## Configuration

```yaml
Configuration:
  base_url: "https://api.trip.com"
  app_id: "${TRIP_APP_ID}"
  api_key: "${TRIP_API_KEY}"
  timeout: 30000
  retries: 3
  rate_limit:
    requests_per_second: 5
    requests_per_minute: 300
  cache:
    enabled: true
    ttl_ms: 300000
```

## Monitoring

```yaml
Metrics:
  - trip_com_requests_total
  - trip_com_requests_duration_seconds
  - trip_com_bookings_total
  - trip_com_errors_total
```

---

*Trip.com Tool v1.0.0 | Enterprise OTA Platform*
