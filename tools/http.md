# HTTP Tool

## Overview

Generic HTTP client for making REST API calls with full request/response handling, authentication, and error management.

## Tool ID

`tool_http`

## Category

HTTP Client

## Capabilities

| Capability | Description | Supported |
|------------|-------------|-----------|
| GET Requests | Fetch resources | Yes |
| POST Requests | Create resources | Yes |
| PUT Requests | Update resources | Yes |
| DELETE Requests | Delete resources | Yes |
| PATCH Requests | Partial updates | Yes |
| Headers | Custom headers | Yes |
| Query Params | URL parameters | Yes |
| Form Data | URL-encoded forms | Yes |
| JSON Data | JSON payloads | Yes |
| Multipart | File uploads | Yes |
| Authentication | Bearer/Basic/API Key | Yes |
| Timeouts | Configurable timeouts | Yes |
| Redirects | Follow redirects | Yes |
| Proxies | HTTP/SOCKS proxy | Yes |
| SSL | Certificate handling | Yes |
| Retries | Automatic retries | Yes |

## Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| No JavaScript | Cannot render JS | Use Playwright |
| No Streaming | Limited SSE support | Use WebSocket |
| No WebSockets | Not supported | Use dedicated client |
| No gRPC | Not supported | Use gRPC client |
| Memory Large Files | Loads into memory | Stream to disk |
| Rate Limits | Provider limits | Use rate limiter |
| Connection Limits | Max connections | Use pool |

## Authentication

```yaml
Authentication:
  types:
    bearer:
      header: "Authorization"
      format: "Bearer {token}"
    basic:
      header: "Authorization"
      format: "Basic {base64}"
    api_key:
      header: "X-API-Key"
      format: "{key}"
    custom:
      header: "{header}"
      format: "{format}"
  notes: |
    - Supports multiple auth methods
    - Auto-refresh OAuth tokens
    - Secure credential storage
```

## Rate Limiting

```yaml
RateLimit:
  requests_per_second: 50
  requests_per_minute: 3000
  requests_per_hour: 180000
  burst_size: 100
  notes: |
    - Global rate limit
    - Per-provider limits configurable
    - Token bucket algorithm
    - Automatic backoff on 429
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
    - SERVER_ERROR (5xx)
    - RATE_LIMITED (429)
  non_retryable_errors:
    - BAD_REQUEST (400)
    - UNAUTHORIZED (401)
    - FORBIDDEN (403)
    - NOT_FOUND (404)
```

## Error Codes

| Code | Description | Retryable | Action |
|------|-------------|-----------|--------|
| `NETWORK_ERROR` | Connection failed | Yes | Retry |
| `TIMEOUT` | Request timeout | Yes | Retry |
| `BAD_REQUEST` | Invalid request | No | Fix request |
| `UNAUTHORIZED` | Auth failed | No | Refresh token |
| `FORBIDDEN` | Access denied | No | Check permissions |
| `NOT_FOUND` | Resource not found | No | Check URL |
| `METHOD_NOT_ALLOWED` | Wrong HTTP method | No | Fix method |
| `RATE_LIMITED` | Too many requests | Yes | Backoff |
| `SERVER_ERROR` | 5xx error | Yes | Retry |
| `GATEWAY_TIMEOUT` | Upstream timeout | Yes | Retry |
| `PARSE_ERROR` | Response parse error | No | Check response |
| `SSL_ERROR` | Certificate error | No | Check cert |

## Input Schema

```yaml
HTTPInput:
  type: object
  required:
    - method
    - url
  properties:
    method:
      type: string
      enum: [GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS]
    url:
      type: string
      format: uri
    headers:
      type: object
      nullable: true
      additionalProperties:
        type: string
    query:
      type: object
      nullable: true
      additionalProperties:
        type: string
    body:
      type: object
      nullable: true
      description: Request body
    body_type:
      type: string
      enum: [json, form, multipart, text, binary]
      default: json
    auth:
      type: object
      nullable: true
      properties:
        type:
          type: string
          enum: [bearer, basic, api_key, custom]
        token:
          type: string
        username:
          type: string
        password:
          type: string
        api_key:
          type: string
        header:
          type: string
    options:
      type: object
      properties:
        timeout:
          type: integer
          default: 30000
        follow_redirects:
          type: boolean
          default: true
        max_redirects:
          type: integer
          default: 10
        verify_ssl:
          type: boolean
          default: true
        proxy:
          type: object
          nullable: true
          properties:
            server:
              type: string
            username:
              type: string
              nullable: true
            password:
              type: string
              nullable: true
        retries:
          type: integer
          default: 3
        response_type:
          type: string
          enum: [json, text, binary, stream]
          default: json
```

## Output Schema

```yaml
HTTPOutput:
  type: object
  required:
    - success
    - status_code
    - headers
  properties:
    success:
      type: boolean
    status_code:
      type: integer
    headers:
      type: object
    data:
      type: any
      nullable: true
      description: Parsed response body
    error:
      type: object
      nullable: true
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: object
    metadata:
      type: object
      properties:
        duration_ms:
          type: integer
        request_size:
          type: integer
        response_size:
          type: integer
        redirect_count:
          type: integer
        retry_count:
          type: integer
```

## Caching

```yaml
Caching:
  enabled: true
  ttl_ms: 300000
  max_entries: 50000
  strategy: lru
  storage: redis
  conditions:
    - method: GET
    - cache_control: true
    - etag: true
  notes: |
    - Cache GET requests by default
    - Respect Cache-Control headers
    - ETag support for validation
    - Manual invalidation API
```

## Validation

```yaml
Validation:
  input:
    - HTTP method validation
    - URL format validation
    - Header format validation
    - Body schema validation
    - Auth configuration validation
  output:
    - Status code validation
    - Content-Type validation
    - JSON schema validation
    - Response size limits
```

## Timeout

```yaml
Timeout:
  default_ms: 30000
  connect_ms: 10000
  dns_ms: 5000
  tls_ms: 5000
  max_ms: 120000
  stream_ms: 300000
```

## Fallback

```yaml
Fallback:
  strategy: retry
  fallbacks:
    - action: retry_with_backoff
      condition: network_error
    - action: use_cache
      condition: server_error
    - action: skip
      condition: client_error
  notes: |
    - Retry on network/server errors
    - Use cache as fallback
    - Skip on client errors
```

## Recovery

```yaml
Recovery:
  connection_pool:
    max_size: 100
    keep_alive: true
    timeout_ms: 60000
  circuit_breaker:
    enabled: true
    failure_threshold: 10
    reset_timeout_ms: 60000
```

## Usage Examples

```typescript
// GET request with query params
await tool.execute('GET', 'https://api.example.com/hotels', {
  query: { city: 'Dubai', checkin: '2025-06-01' },
  headers: { 'Accept': 'application/json' }
});

// POST request with JSON body
await tool.execute('POST', 'https://api.example.com/bookings', {
  body: {
    hotel_id: 123,
    check_in: '2025-06-01',
    check_out: '2025-06-05'
  },
  auth: { type: 'bearer', token: 'xxx' }
});

// File upload
await tool.execute('POST', 'https://api.example.com/upload', {
  body_type: 'multipart',
  body: { file: './document.pdf' }
});
```

## Configuration

```yaml
Configuration:
  base_url: ""
  timeout: 30000
  retries: 3
  verify_ssl: true
  follow_redirects: true
  max_redirects: 10
  pool:
    max_connections: 100
    max_per_host: 20
    keep_alive: true
  proxy:
    enabled: false
    server: ""
    username: ""
    password: ""
  cache:
    enabled: true
    ttl_ms: 300000
```

## Monitoring

```yaml
Metrics:
  - http_requests_total
  - http_requests_duration_seconds
  - http_requests_by_status
  - http_errors_total
  - http_retries_total
  - http_cache_hits_total
  - http_connection_pool_active
```

---

*HTTP Tool v1.0.0 | Enterprise OTA Platform*
