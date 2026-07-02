# Hotelbeds Tool

## Overview

Hotelbeds API integration for hotel search, availability, booking, and management. Provides access to 300,000+ hotels worldwide.

## Tool ID

`tool_hotelbeds`

## Category

Hotel Search & Booking

## Capabilities

| Capability | Description | Supported |
|------------|-------------|-----------|
| Hotel Search | Search hotels | Yes |
| Hotel Details | Get hotel info | Yes |
| Availability | Check room availability | Yes |
| Rates | Get room rates | Yes |
| Booking | Create bookings | Yes |
| Cancellation | Cancel bookings | Yes |
| Booking Status | Check booking status | Yes |
| Destinations | Search destinations | Yes |
| Hotel Categories | Filter by category | Yes |
| Room Types | Filter by room type | Yes |
| Board Types | Filter by board type | Yes |
| Geo Search | Search by coordinates | Yes |
| Photo URLs | Get hotel photos | Yes |
| Cancellation Policies | Get cancellation rules | Yes |

## Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| Rate Limits | 10 req/sec | Rate limiter |
| Quota Limits | Daily limits | Monitor usage |
| No Real-time | Cached availability | Recheck before booking |
| Complex Auth | HMAC signing | Auto-signing |
| XML Legacy | Some XML endpoints | Use JSON APIs |
| Currency | Fixed currencies | Convert as needed |

## Authentication

```yaml
Authentication:
  type: hmac
  algorithm: SHA256
  headers:
    - api-key: API key
    - X-Signature: HMAC signature
  signature_format: "{api_key}{secret}{timestamp}"
  notes: |
    - HMAC-SHA256 signature required
    - Signature = SHA256(api_key + secret + timestamp)
    - Timestamp must be current (±5 minutes)
    - Rotate keys quarterly
```

## Rate Limiting

```yaml
RateLimit:
  requests_per_second: 10
  requests_per_minute: 600
  requests_per_hour: 36000
  daily_limit: 100000
  burst_size: 20
  notes: |
    - Hard limit at 10 req/sec
    - Implement token bucket
    - Queue excess requests
    - Monitor via API headers
```

## Retry Policy

```yaml
RetryPolicy:
  max_retries: 3
  initial_delay_ms: 1000
  max_delay_ms: 10000
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
    - HOTEL_NOT_FOUND
    - NO_AVAILABILITY
```

## Error Codes

| Code | Description | Retryable | Action |
|------|-------------|-----------|--------|
| `INVALID_REQUEST` | Bad request format | No | Fix request |
| `UNAUTHORIZED` | Auth failed | No | Check credentials |
| `HOTEL_NOT_FOUND` | Hotel not found | No | Check hotel ID |
| `NO_AVAILABILITY` | No rooms available | No | Try different dates |
| `RATE_LIMITED` | Too many requests | Yes | Backoff |
| `SERVER_ERROR` | Server error | Yes | Retry |
| `TIMEOUT` | Request timeout | Yes | Retry |
| `BOOKING_FAILED` | Booking creation failed | Yes | Retry |
| `CANCELLATION_FAILED` | Cancellation failed | No | Contact support |
| `PAYMENT_ERROR` | Payment processing error | No | Check payment |

## Input Schema

```yaml
HotelbedsInput:
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
        - get_rates
        - create_booking
        - cancel_booking
        - get_booking_status
        - search_destinations
    params:
      type: object
      required_for:
        search_hotels: [destination, checkin, checkout, rooms]
        get_hotel_details: [hotel_id]
        check_availability: [hotel_id, checkin, checkout, rooms]
        get_rates: [hotel_id, checkin, checkout, rooms]
        create_booking: [hotel_id, checkin, checkout, rooms, guest]
        cancel_booking: [booking_id]
        get_booking_status: [booking_id]
        search_destinations: [query]
      properties:
        destination:
          type: string
          description: Destination name or code
        hotel_id:
          type: string
          description: Hotelbeds hotel ID
        checkin:
          type: string
          format: date
        checkout:
          type: string
          format: date
        rooms:
          type: array
          items:
            type: object
            properties:
              adults:
                type: integer
                minimum: 1
                maximum: 9
              children:
                type: integer
                minimum: 0
                maximum: 6
              child_ages:
                type: array
                items:
                  type: integer
          minItems: 1
        guest:
          type: object
          properties:
            name:
              type: string
            email:
              type: string
              format: email
            phone:
              type: string
            nationality:
              type: string
        currency:
          type: string
          default: USD
        language:
          type: string
          default: EN
        filters:
          type: object
          nullable: true
          properties:
            min_stars:
              type: integer
            max_stars:
              type: integer
            min_price:
              type: number
            max_price:
              type: number
            board_types:
              type: array
              items:
                type: string
            hotel_types:
              type: array
              items:
                type: string
        sort:
          type: object
          nullable: true
          properties:
            field:
              type: string
              enum: [price, rating, distance]
            order:
              type: string
              enum: [asc, desc]
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
HotelbedsOutput:
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
              description:
                type: string
              category:
                type: string
              destination:
                type: string
              address:
                type: string
              city:
                type: string
              country:
                type: string
              postal_code:
                type: string
              latitude:
                type: number
              longitude:
                type: number
              phones:
                type: array
              emails:
                type: array
              website:
                type: string
              star_rating:
                type: number
              review_score:
                type: number
              review_count:
                type: integer
              photos:
                type: array
              amenities:
                type: array
              rooms:
                type: array
                items:
                  type: object
                  properties:
                    room_id:
                      type: string
                    room_name:
                      type: string
                    board_type:
                      type: string
                    price:
                      type: object
                      properties:
                        amount:
                          type: number
                        currency:
                          type: string
                        tax_included:
                          type: boolean
                    cancellation:
                      type: object
                    amenities:
                      type: array
        total_count:
          type: integer
        has_more:
          type: boolean
        booking:
          type: object
          nullable: true
          properties:
            booking_id:
              type: string
            status:
              type: string
            hotel:
              type: object
            checkin:
              type: string
            checkout:
              type: string
            rooms:
              type: array
            total_price:
              type: object
            guest:
              type: object
            created_at:
              type: string
              format: date-time
        destinations:
          type: array
          nullable: true
          items:
            type: object
            properties:
              destination_id:
                type: string
              name:
                type: string
              country:
                type: string
              type:
                type: string
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
        retry_count:
          type: integer
        rate_limit_remaining:
          type: integer
```

## Caching

```yaml
Caching:
  enabled: true
  strategy: intelligent
  ttl_ms: 300000
  max_entries: 100000
  storage: redis
  invalidation:
    - availability_change
    - rate_change
    - manual
  notes: |
    - Cache search results (5 min)
    - Cache hotel details (1 hour)
    - Cache destinations (24 hours)
    - Don't cache bookings
```

## Validation

```yaml
Validation:
  input:
    - Destination validation
    - Date format validation (YYYY-MM-DD)
    - Room configuration validation
    - Guest info validation
    - Email format validation
  output:
    - Hotel data structure validation
    - Price calculation validation
    - Booking confirmation validation
```

## Timeout

```yaml
Timeout:
  default_ms: 30000
  search_ms: 30000
  details_ms: 15000
  availability_ms: 30000
  booking_ms: 45000
  max_ms: 60000
```

## Fallback

```yaml
Fallback:
  strategy: provider_chain
  fallbacks:
    - tool: booking_com
      condition: hotelbeds_unavailable
    - tool: expedia
      condition: no_results
  notes: |
    - Fall back to other providers
    - Use cached results
    - Graceful degradation
```

## Recovery

```yaml
Recovery:
  rate_limited:
    action: exponential_backoff
    max_wait_ms: 30000
  auth_failed:
    action: refresh_credentials
    max_retries: 3
  server_error:
    action: use_fallback
    alert: true
  circuit_breaker:
    enabled: true
    failure_threshold: 5
    reset_timeout_ms: 60000
```

## Usage Examples

```typescript
// Search hotels in Dubai
await tool.execute('search_hotels', {
  destination: 'Dubai',
  checkin: '2025-06-01',
  checkout: '2025-06-05',
  rooms: [{ adults: 2, children: 0 }],
  currency: 'USD'
});

// Get hotel details
await tool.execute('get_hotel_details', {
  hotel_id: '123456'
});

// Create booking
await tool.execute('create_booking', {
  hotel_id: '123456',
  checkin: '2025-06-01',
  checkout: '2025-06-05',
  rooms: [{ adults: 2, children: 0 }],
  guest: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    nationality: 'US'
  }
});
```

## Configuration

```yaml
Configuration:
  base_url: "https://api.hotelbeds.com"
  api_version: "3.0"
  api_key: "${HOTELBEDS_API_KEY}"
  secret: "${HOTELBEDS_SECRET}"
  timeout: 30000
  retries: 3
  rate_limit:
    requests_per_second: 10
    requests_per_minute: 600
  cache:
    enabled: true
    ttl_ms: 300000
  circuit_breaker:
    enabled: true
    failure_threshold: 5
```

## Monitoring

```yaml
Metrics:
  - hotelbeds_requests_total
  - hotelbeds_requests_duration_seconds
  - hotelbeds_bookings_total
  - hotelbeds_revenue_total
  - hotelbeds_errors_total
  - hotelbeds_rate_limit_hits
```

## Pricing

```yaml
Pricing:
  model: commission
  hotelbeds_commission: "15-25%"
  payment: net_rate
  notes: |
    - Commission-based model
    - Net rates provided
    - Settlement via Hotelbeds
    - Monthly invoicing
```

---

*Hotelbeds Tool v1.0.0 | Enterprise OTA Platform*
