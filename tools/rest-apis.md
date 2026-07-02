# REST APIs Tool

## Overview

Unified REST API client for multiple travel providers with automatic authentication, rate limiting, and error handling.

## Tool ID

`tool_rest_apis`

## Category

HTTP Client

## Capabilities

| Capability | Description | Supported |
|------------|-------------|-----------|
| Multi-provider | Multiple API support | Yes |
| Auto-authentication | Provider auth handling | Yes |
| Request signing | HMAC signatures | Yes |
| API versioning | Version management | Yes |
| Pagination | Auto-pagination | Yes |
| Field selection | Sparse fieldsets | Yes |
| Batch requests | Parallel requests | Yes |
| Response caching | intelligent caching | Yes |
| Webhook support | Event notifications | Yes |
| GraphQL | Query language | Yes |

## Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| Provider specific | Different APIs | Unified interface |
| Auth complexity | Varying auth methods | Auto-handling |
| Rate limits | Provider limits | Per-provider limits |
| Data formats | JSON/XML/etc. | Format adapters |
| Versioning | API changes | Version pinning |
| Error formats | Different errors | Unified errors |

## Authentication

```yaml
Authentication:
  types:
    oauth2:
      flows:
        - authorization_code
        - client_credentials
        - refresh_token
      auto_refresh: true
    hmac:
      algorithm: SHA256
      header: X-Signature
    api_key:
      header: X-API-Key
    basic:
      encode: base64
  credential_store:
    type: vault
    auto_rotate: true
```

## Rate Limiting

```yaml
RateLimit:
  global:
    requests_per_second: 100
    requests_per_minute: 6000
    requests_per_hour: 360000
  per_provider:
    hotelbeds:
      requests_per_second: 10
      requests_per_minute: 600
    booking_com:
      requests_per_second: 5
      requests_per_minute: 300
    expedia:
      requests_per_second: 5
      requests_per_minute: 300
```

## Retry Policy

```yaml
RetryPolicy:
  max_retries: 3
  initial_delay_ms: 1000
  max_delay_ms: 30000
  backoff_multiplier: 2
  jitter: true
  retryable_errors:
    - NETWORK_ERROR
    - TIMEOUT
    - SERVER_ERROR
    - RATE_LIMITED
  provider_specific:
    hotelbeds:
      max_retries: 2
      rate_limit_backoff: 5000
    booking_com:
      max_retries: 3
      rate_limit_backoff: 10000
```

## Error Codes

| Code | Description | Retryable | Action |
|------|-------------|-----------|--------|
| `PROVIDER_ERROR` | Provider specific error | Varies | Check provider docs |
| `AUTH_FAILED` | Authentication failed | No | Refresh credentials |
| `QUOTA_EXCEEDED` | Rate limit exceeded | Yes | Backoff |
| `INVALID_REQUEST` | Bad request format | No | Fix request |
| `RESOURCE_NOT_FOUND` | Resource not found | No | Check ID |
| `SERVER_ERROR` | Provider 5xx | Yes | Retry |
| `TIMEOUT` | Request timeout | Yes | Retry |
| `PARSE_ERROR` | Response parse error | No | Check format |
| `NETWORK_ERROR` | Connection failed | Yes | Retry |
| `VERSION_DEPRECATED` | API version deprecated | No | Upgrade |

## Input Schema

```yaml
RESTAPIsInput:
  type: object
  required:
    - provider
    - operation
  properties:
    provider:
      type: string
      enum:
        - hotelbeds
        - booking_com
        - agoda
        - expedia
        - trip_com
        - hotels_com
        - viator
        - getyourguide
        - kkday
        - klook
        - google_maps
    operation:
      type: string
      description: Provider-specific operation name
    params:
      type: object
      nullable: true
      description: Operation parameters
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
        pagination:
          type: object
          properties:
            enabled:
              type: boolean
              default: true
            max_pages:
              type: integer
              default: 10
        fields:
          type: array
          items:
            type: string
          nullable: true
        sort:
          type: object
          nullable: true
          properties:
            field:
              type: string
            order:
              type: string
              enum: [asc, desc]
```

## Output Schema

```yaml
RESTAPIsOutput:
  type: object
  required:
    - success
    - provider
    - operation
  properties:
    success:
      type: boolean
    provider:
      type: string
    operation:
      type: string
    data:
      type: any
      nullable: true
    pagination:
      type: object
      nullable: true
      properties:
        page:
          type: integer
        per_page:
          type: integer
        total:
          type: integer
        has_more:
          type: boolean
    error:
      type: object
      nullable: true
      properties:
        code:
          type: string
        message:
          type: string
        provider_error:
          type: object
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
    - provider_update
    - manual
    - ttl_expiry
  notes: |
    - Cache by provider + operation + params
    - Respect provider cache headers
    - ETag/Last-Modified support
    - Manual invalidation API
```

## Validation

```yaml
Validation:
  input:
    - Provider validation
    - Operation validation
    - Parameter schema validation
    - Auth configuration validation
  output:
    - Response schema validation
    - Data type verification
    - Business rule validation
```

## Timeout

```yaml
Timeout:
  default_ms: 30000
  max_ms: 120000
  provider_specific:
    hotelbeds: 30000
    booking_com: 45000
    expedia: 30000
    viator: 30000
```

## Fallback

```yaml
Fallback:
  strategy: provider_chain
  chains:
    hotel_search:
      - hotelbeds
      - booking_com
      - agoda
      - expedia
      - trip_com
    activity_search:
      - viator
      - getyourguide
      - kkday
      - klook
  notes: |
    - Automatic provider fallback
    - Configurable fallback chains
    - Health-based selection
```

## Recovery

```yaml
Recovery:
  provider_down:
    action: use_fallback_provider
    alert: true
  auth_expired:
    action: refresh_credentials
    max_retries: 3
  rate_limited:
    action: exponential_backoff
    max_wait_ms: 60000
  circuit_breaker:
    enabled: true
    failure_threshold: 5
    reset_timeout_ms: 60000
```

## Usage Examples

```typescript
// Search hotels via Hotelbeds
await tool.execute('hotelbeds', 'searchHotels', {
  destination: 'Dubai',
  checkin: '2025-06-01',
  checkout: '2025-06-05',
  adults: 2,
  rooms: 1
});

// Search activities via Viator
await tool.execute('viator', 'searchActivities', {
  destination: 'Paris',
  date: '2025-06-15',
  travelers: 4
});

// Get hotel details from Booking.com
await tool.execute('booking_com', 'getHotelDetails', {
  hotel_id: '123456',
  checkin: '2025-06-01',
  checkout: '2025-06-05'
});
```

## Configuration

```yaml
Configuration:
  providers:
    hotelbeds:
      base_url: "https://api.hotelbeds.com"
      api_version: "3.0"
      auth:
        type: hmac
        api_key: "${HOTELBEDS_API_KEY}"
        secret: "${HOTELBEDS_SECRET}"
      rate_limit:
        requests_per_second: 10
    booking_com:
      base_url: "https://distribution-xml.booking.com"
      api_version: "2.0"
      auth:
        type: api_key
        api_key: "${BOOKING_API_KEY}"
      rate_limit:
        requests_per_second: 5
    expedia:
      base_url: "https://api.ean.com"
      api_version: "3.0"
      auth:
        type: api_key
        api_key: "${EXPEDIA_API_KEY}"
      rate_limit:
        requests_per_second: 5
  global:
    timeout: 30000
    retries: 3
    cache:
      enabled: true
      ttl_ms: 300000
```

## Monitoring

```yaml
Metrics:
  - rest_apis_requests_total
  - rest_apis_requests_duration_seconds
  - rest_apis_requests_by_provider
  - rest_apis_errors_total
  - rest_apis_rate_limit_hits
  - rest_apis_provider_health
```

---

*REST APIs Tool v1.0.0 | Enterprise OTA Platform*
