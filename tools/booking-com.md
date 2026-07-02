# Booking.com Tool

## Overview

Booking.com affiliate API integration for hotel search, availability, and booking with access to 28+ million listings.

## Tool ID

`tool_booking_com`

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
| Autocomplete | Destination search | Yes |
| Map Search | Search by map | Yes |
| Filter Search | Advanced filters | Yes |

## Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| Affiliate Only | Must be affiliate | Apply for program |
| Rate Limits | Strict limits | Rate limiter |
| No Direct Booking | Affiliate redirect | Handle redirect |
| Complex XML | Legacy endpoints | Use JSON API |
| Geographic Limits | Some regions limited | Fallback providers |

## Authentication

```yaml
Authentication:
  type: api_key
  methods:
    - query_parameter
    - header
  credentials:
    - affiliate_id
    - api_key
  notes: |
    - Affiliate program required
    - API key in header or query
    - Rotate keys quarterly
    - Monitor usage
```

## Rate Limiting

```yaml
RateLimit:
  requests_per_second: 5
  requests_per_minute: 300
  requests_per_hour: 18000
  daily_limit: 100000
  burst_size: 10
  notes: |
    - Strict rate limiting
    - Implement token bucket
    - Queue excess requests
    - Monitor via headers
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
    - RATE_LIMITED
  non_retryable_errors:
    - INVALID_REQUEST
    - UNAUTHORIZED
    - NOT_FOUND
```

## Error Codes

| Code | Description | Retryable | Action |
|------|-------------|-----------|--------|
| `INVALID_REQUEST` | Bad request | No | Fix request |
| `UNAUTHORIZED` | Auth failed | No | Check API key |
| `RATE_LIMITED` | Too many requests | Yes | Backoff |
| `SERVER_ERROR` | Server error | Yes | Retry |
| `TIMEOUT` | Request timeout | Yes | Retry |
| `NOT_FOUND` | Hotel not found | No | Check hotel ID |
| `NO_AVAILABILITY` | No rooms | No | Try different dates |
| `PARAMETER_ERROR` | Invalid parameter | No | Fix parameter |

## Input Schema

```yaml
BookingComInput:
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
        - autocomplete
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
        child_ages:
          type: array
          items:
            type: integer
        currency:
          type: string
          default: USD
        language:
          type: string
          default: en
        sort:
          type: string
          enum: [price, rating, distance, popularity]
        min_price:
          type: number
        max_price:
          type: number
        min_stars:
          type: integer
        max_stars:
          type: integer
        amenities:
          type: array
          items:
            type: string
        latitude:
          type: number
        longitude:
          type: number
        radius_km:
          type: number
          default: 10
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
BookingComOutput:
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
                properties:
                  amount:
                    type: number
                  currency:
                    type: string
              photos:
                type: array
              amenities:
                type: array
              url:
                type: string
                format: uri
        total_count:
          type: integer
        has_more:
          type: boolean
        destinations:
          type: array
          nullable: true
        reviews:
          type: array
          nullable: true
    error:
      type: object
      nullable: true
      properties:
        code:
          type: string
        message:
          type: string
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
  max_entries: 100000
  strategy: lru
  storage: redis
  notes: |
    - Cache search results (5 min)
    - Cache hotel details (1 hour)
    - Cache destinations (24 hours)
```

## Validation

```yaml
Validation:
  input:
    - Destination validation
    - Date format validation
    - Room/guest count validation
    - Coordinate validation
  output:
    - Hotel data validation
    - Price validation
    - URL validation
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
      condition: booking_unavailable
    - tool: expedia
      condition: no_results
  notes: |
    - Fall back to Hotelbeds
    - Fall back to Expedia
    - Use cached results
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
// Search hotels in Paris
await tool.execute('search_hotels', {
  destination: 'Paris',
  checkin: '2025-06-01',
  checkout: '2025-06-05',
  rooms: 1,
  adults: 2,
  currency: 'EUR'
});

// Get hotel details
await tool.execute('get_hotel_details', {
  hotel_id: '123456'
});

// Autocomplete destination
await tool.execute('autocomplete', {
  query: 'Dubai'
});
```

## Configuration

```yaml
Configuration:
  base_url: "https://distribution-xml.booking.com"
  affiliate_id: "${BOOKING_AFFILIATE_ID}"
  api_key: "${BOOKING_API_KEY}"
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
  - booking_com_requests_total
  - booking_com_requests_duration_seconds
  - booking_com_clicks_total
  - booking_com_revenue_total
  - booking_com_errors_total
```

## Affiliate Model

```yaml
AffiliateModel:
  type: commission
  commission_rate: "25-40%"
  payment: monthly
  notes: |
    - Commission on completed stays
    - Monthly payouts
    - Performance-based tiers
    - Marketing materials provided
```

---

*Booking.com Tool v1.0.0 | Enterprise OTA Platform*
