# Browser Tool

## Overview

Lightweight web browsing tool for simple page fetching, content extraction, and basic interaction without full browser automation.

## Tool ID

`tool_browser`

## Category

Browser Automation

## Capabilities

| Capability | Description | Supported |
|------------|-------------|-----------|
| Fetch HTML | Get page HTML | Yes |
| Extract Text | Get text content | Yes |
| Parse Links | Extract all links | Yes |
| Parse Images | Extract images | Yes |
| Meta Tags | Extract meta information | Yes |
| Open Graph | Extract OG tags | Yes |
| Structured Data | Extract JSON-LD | Yes |
| Redirects | Follow redirects | Yes |
| Headers | Custom headers | Yes |
| Cookies | Handle cookies | Yes |
| User Agent | Custom UA | Yes |
| Timeout | Configurable timeout | Yes |

## Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| No JavaScript | Cannot execute JS | Use Playwright |
| No Interaction | Cannot click/fill | Use Playwright |
| No Dynamic Content | SPAs not supported | Use Playwright |
| No Screenshots | Cannot capture images | Use Playwright |
| No PDF | Cannot generate PDF | Use Playwright |
| Limited Parsing | Basic extraction only | Use specialized parser |
| CAPTCHA | Cannot solve | Skip/fallback |
| Rate Limits | Sites may block | Delays/proxies |

## Authentication

```yaml
Authentication:
  type: none
  description: Browser tool does not require authentication
  notes: |
    - Local HTTP client
    - No API key required
    - Use for public content
```

## Rate Limiting

```yaml
RateLimit:
  requests_per_second: 10
  requests_per_minute: 500
  requests_per_hour: 30000
  burst_size: 20
  notes: |
    - Faster than Playwright
    - Still respect robots.txt
    - Add delays for same domain
```

## Retry Policy

```yaml
RetryPolicy:
  max_retries: 3
  initial_delay_ms: 500
  max_delay_ms: 5000
  backoff_multiplier: 2
  jitter: true
  retryable_errors:
    - NETWORK_ERROR
    - TIMEOUT
    - SERVER_ERROR
  non_retryable_errors:
    - NOT_FOUND
    - ACCESS_DENIED
    - INVALID_URL
```

## Error Codes

| Code | Description | Retryable | Action |
|------|-------------|-----------|--------|
| `NETWORK_ERROR` | Connection failed | Yes | Retry |
| `TIMEOUT` | Request timeout | Yes | Retry with longer timeout |
| `NOT_FOUND` | 404 response | No | Skip |
| `ACCESS_DENIED` | 403/401 | No | Skip |
| `SERVER_ERROR` | 5xx response | Yes | Retry |
| `INVALID_URL` | Bad URL format | No | Fix URL |
| `PARSE_ERROR` | HTML parse error | No | Use fallback |
| `REDIRECT_LOOP` | Too many redirects | No | Skip |
| `SSL_ERROR` | Certificate error | No | Skip |
| `DNS_ERROR` | DNS resolution failed | No | Check URL |

## Input Schema

```yaml
BrowserInput:
  type: object
  required:
    - operation
    - url
  properties:
    operation:
      type: string
      enum:
        - fetch
        - extract_text
        - extract_links
        - extract_images
        - extract_meta
        - extract_structured_data
        - check_status
    url:
      type: string
      format: uri
    options:
      type: object
      properties:
        method:
          type: string
          enum: [GET, POST, PUT, DELETE]
          default: GET
        headers:
          type: object
          nullable: true
        body:
          type: string
          nullable: true
        timeout:
          type: integer
          default: 10000
        follow_redirects:
          type: boolean
          default: true
        max_redirects:
          type: integer
          default: 5
        user_agent:
          type: string
          nullable: true
        cookies:
          type: object
          nullable: true
        selectors:
          type: object
          nullable: true
          description: CSS selectors for extraction
    extract:
      type: object
      nullable: true
      properties:
        title:
          type: boolean
          default: true
        description:
          type: boolean
          default: true
        keywords:
          type: boolean
          default: true
        og_tags:
          type: boolean
          default: true
        twitter_tags:
          type: boolean
          default: false
        json_ld:
          type: boolean
          default: true
        links:
          type: boolean
          default: false
        images:
          type: boolean
          default: false
        text:
          type: boolean
          default: false
```

## Output Schema

```yaml
BrowserOutput:
  type: object
  required:
    - success
    - url
    - status_code
  properties:
    success:
      type: boolean
    url:
      type: string
      format: uri
    status_code:
      type: integer
    headers:
      type: object
    content_type:
      type: string
    data:
      type: object
      nullable: true
      properties:
        title:
          type: string
        description:
          type: string
        keywords:
          type: array
          items:
            type: string
        og_tags:
          type: object
          nullable: true
        twitter_tags:
          type: object
          nullable: true
        json_ld:
          type: array
          items:
            type: object
          nullable: true
        links:
          type: array
          items:
            type: object
            properties:
              text:
                type: string
              url:
                type: string
              type:
                type: string
          nullable: true
        images:
          type: array
          items:
            type: object
            properties:
              src:
                type: string
              alt:
                type: string
              width:
                type: integer
              height:
                type: integer
          nullable: true
        html:
          type: string
          nullable: true
        text:
          type: string
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
        content_length:
          type: integer
        final_url:
          type: string
          format: uri
```

## Caching

```yaml
Caching:
  enabled: true
  ttl_ms: 300000
  max_entries: 10000
  strategy: lru
  storage: memory
  notes: |
    - Cache GET requests only
    - Cache by URL + headers
    - Respect Cache-Control headers
    - Manual invalidation supported
```

## Validation

```yaml
Validation:
  input:
    - URL format validation
    - HTTP method validation
    - Header format validation
    - Selector syntax validation
  output:
    - HTML structure validation
    - Meta tag validation
    - Link format validation
```

## Timeout

```yaml
Timeout:
  default_ms: 10000
  max_ms: 60000
  connect_ms: 5000
  dns_ms: 5000
```

## Fallback

```yaml
Fallback:
  strategy: progressive
  fallbacks:
    - tool: playwright
      condition: js_rendering_required
    - tool: rest_apis
      condition: api_available
    - tool: google_search
      condition: content_not_accessible
  notes: |
    - Fall back to Playwright for dynamic content
    - Fall back to API if available
    - Fall back to search if blocked
```

## Recovery

```yaml
Recovery:
  connection_timeout:
    action: retry_with_backoff
  dns_failure:
    action: skip_and_log
  ssl_error:
    action: skip_and_log
  parse_error:
    action: return_partial
```

## Usage Examples

```typescript
// Fetch and extract meta tags
await tool.execute('extract_meta', {
  url: 'https://www.booking.com/hotel/dubai.html',
  extract: {
    title: true,
    description: true,
    og_tags: true,
    json_ld: true,
  }
});

// Extract all links
await tool.execute('extract_links', {
  url: 'https://www.tripadvisor.com/Attractions',
  extract: { links: true }
});

// Check page status
await tool.execute('check_status', {
  url: 'https://www.agoda.com'
});
```

## Configuration

```yaml
Configuration:
  user_agent: "Mozilla/5.0 (compatible; TravelBot/1.0)"
  timeout: 10000
  follow_redirects: true
  max_redirects: 5
  verify_ssl: true
  proxy:
    enabled: false
    server: ""
  cache:
    enabled: true
    ttl_ms: 300000
  pool:
    max_connections: 50
    keep_alive: true
```

## Monitoring

```yaml
Metrics:
  - browser_requests_total
  - browser_requests_duration_seconds
  - browser_errors_total
  - browser_cache_hits_total
  - browser_cache_misses_total
```

---

*Browser Tool v1.0.0 | Enterprise OTA Platform*
