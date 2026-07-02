# KKday Tool

## Overview

KKday API integration for tours, activities, and attractions with focus on Asia-Pacific markets.

## Tool ID

`tool_kkday`

## Category

Activities & Tours

## Capabilities

| Capability | Description | Supported |
|------------|-------------|-----------|
| Activity Search | Search activities | Yes |
| Activity Details | Get activity info | Yes |
| Availability | Check availability | Yes |
| Prices | Get activity prices | Yes |
| Reviews | Get reviews | Yes |
| Photos | Get photos | Yes |
| Destinations | Search destinations | Yes |
| Categories | Search by category | Yes |
| Mobile Tickets | E-tickets | Yes |
| Free Cancellation | Cancel policies | Yes |

## Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| Asia Focus | Stronger in APAC | Fallback providers |
| Rate Limits | Strict limits | Rate limiter |
| No Direct Booking | Affiliate redirect | Handle redirect |
| Limited Destinations | Not all destinations | Fallback providers |

## Authentication

```yaml
Authentication:
  type: api_key
  methods:
    - header
    - query_parameter
  credentials:
    - api_key
    - partner_id
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
| `NOT_FOUND` | Activity not found | No | Check ID |

## Input Schema

```yaml
KKdayInput:
  type: object
  required:
    - operation
  properties:
    operation:
      type: string
      enum:
        - search_activities
        - get_activity_details
        - check_availability
        - get_prices
        - get_reviews
        - search_destinations
        - get_categories
    params:
      type: object
      properties:
        destination:
          type: string
        activity_id:
          type: string
        date:
          type: string
          format: date
        travelers:
          type: integer
          minimum: 1
          maximum: 50
        category:
          type: string
        currency:
          type: string
          default: USD
        language:
          type: string
          default: en
        sort:
          type: string
          enum: [price, rating, popularity]
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
KKdayOutput:
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
        activities:
          type: array
          items:
            type: object
            properties:
              activity_id:
                type: string
              title:
                type: string
              description:
                type: string
              destination:
                type: string
              duration:
                type: string
              price_from:
                type: object
                properties:
                  amount:
                    type: number
                  currency:
                    type: string
              rating:
                type: number
              review_count:
                type: integer
              photos:
                type: array
              includes:
                type: array
              category:
                type: string
              mobile_ticket:
                type: boolean
              free_cancellation:
                type: boolean
              url:
                type: string
        total_count:
          type: integer
        has_more:
          type: boolean
        destinations:
          type: array
          nullable: true
        categories:
          type: array
          nullable: true
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
    - Traveler count validation
  output:
    - Activity data validation
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
    - tool: klook
      condition: kkday_unavailable
    - tool: viator
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
// Search activities in Taipei
await tool.execute('search_activities', {
  destination: 'Taipei',
  date: '2025-06-15',
  travelers: 2,
  category: 'tours'
});

// Get activity details
await tool.execute('get_activity_details', {
  activity_id: '123456'
});

// Check availability
await tool.execute('check_availability', {
  activity_id: '123456',
  date: '2025-06-15',
  travelers: 2
});
```

## Configuration

```yaml
Configuration:
  base_url: "https://api.kkday.com"
  api_key: "${KKDAY_API_KEY}"
  partner_id: "${KKDAY_PARTNER_ID}"
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
  - kkday_requests_total
  - kkday_requests_duration_seconds
  - kkday_bookings_total
  - kkday_errors_total
```

---

*KKday Tool v1.0.0 | Enterprise OTA Platform*
