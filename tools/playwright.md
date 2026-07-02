# Playwright Tool

## Overview

Browser automation tool for web scraping, form filling, screenshots, and end-to-end testing using Playwright.

## Tool ID

`tool_playwright`

## Category

Browser Automation

## Capabilities

| Capability | Description | Supported |
|------------|-------------|-----------|
| Navigate URLs | Load web pages | Yes |
| Click Elements | Interact with page elements | Yes |
| Fill Forms | Input text into forms | Yes |
| Take Screenshots | Capture page images | Yes |
| PDF Generation | Convert pages to PDF | Yes |
| Wait for Elements | Wait for dynamic content | Yes |
| Extract Text | Get text content | Yes |
| Extract HTML | Get HTML content | Yes |
| Execute JavaScript | Run custom JS | Yes |
| Handle Downloads | Download files | Yes |
| Handle Uploads | Upload files | Yes |
| Multi-tab | Handle multiple tabs | Yes |
| Mobile Emulation | Simulate devices | Yes |
| Network Interception | Mock API calls | Yes |
| Cookie Management | Handle cookies | Yes |
| Local Storage | Access storage | Yes |

## Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| Resource Intensive | High CPU/memory usage | Browser pooling |
| Slow Startup | Browser launch delay | Keep-alive instances |
| JavaScript Required | Needs JS rendering | Already handled |
| CAPTCHA Detection | Cannot solve CAPTCHAs | Skip/fallback |
| Rate Limiting | Sites may block | Rotate proxies |
| Cookie Consent | May block content | Auto-dismiss |
| Iframe Handling | Complex iframe logic | Deep navigation |
| Shadow DOM | Limited support | pierce selector |
| File Downloads | Requires download dir | Configurable path |
| Memory Leaks | Long sessions | Session rotation |

## Authentication

```yaml
Authentication:
  type: none
  description: Playwright does not require authentication
  notes: |
    - Browser automation is local
    - No API key required
    - Use for scraping public websites
    - Respect robots.txt
```

## Rate Limiting

```yaml
RateLimit:
  requests_per_second: 5
  requests_per_minute: 200
  requests_per_hour: 10000
  burst_size: 10
  concurrent_sessions: 5
  notes: |
    - Limit concurrent browser sessions
    - Add delays between requests
    - Respect website terms of service
    - Use proxy rotation for high volume
```

## Retry Policy

```yaml
RetryPolicy:
  max_retries: 2
  initial_delay_ms: 1000
  max_delay_ms: 5000
  backoff_multiplier: 2
  jitter: true
  retryable_errors:
    - NAVIGATION_TIMEOUT
    - ELEMENT_NOT_FOUND
    - PAGE_CRASHED
    - NETWORK_ERROR
  non_retryable_errors:
    - CAPTCHA_DETECTED
    - ACCESS_DENIED
    - INVALID_SELECTOR
```

## Error Codes

| Code | Description | Retryable | Action |
|------|-------------|-----------|--------|
| `NAVIGATION_TIMEOUT` | Page load timeout | Yes | Retry with longer timeout |
| `ELEMENT_NOT_FOUND` | Selector not found | Yes | Wait and retry |
| `PAGE_CRASHED` | Browser crashed | Yes | Restart browser |
| `NETWORK_ERROR` | Connection failed | Yes | Retry |
| `CAPTCHA_DETECTED` | CAPTCHA encountered | No | Skip/fallback |
| `ACCESS_DENIED` | 403/401 response | No | Skip/fallback |
| `INVALID_SELECTOR` | Bad CSS/XPath | No | Fix selector |
| `DOWNLOAD_FAILED` | File download failed | Yes | Retry |
| `BROWSER_NOT_READY` | Browser not initialized | Yes | Wait and retry |
| `JAVASCRIPT_ERROR` | JS execution error | No | Fix script |

## Input Schema

```yaml
PlaywrightInput:
  type: object
  required:
    - operation
  properties:
    operation:
      type: string
      enum:
        - navigate
        - click
        - fill
        - screenshot
        - pdf
        - get_text
        - get_html
        - execute_js
        - wait_for
        - download
        - upload
        - get_cookies
        - set_cookies
    url:
      type: string
      format: uri
      description: URL to navigate to
      required_for:
        - navigate
    selector:
      type: string
      description: CSS/XPath selector
      required_for:
        - click
        - fill
        - wait_for
        - get_text
        - get_html
    value:
      type: string
      description: Value for fill operation
      required_for:
        - fill
    script:
      type: string
      description: JavaScript to execute
      required_for:
        - execute_js
    screenshot:
      type: object
      properties:
        full_page:
          type: boolean
          default: false
        element:
          type: string
        format:
          type: string
          enum: [png, jpeg]
          default: png
        quality:
          type: integer
          minimum: 0
          maximum: 100
          default: 80
        path:
          type: string
    pdf:
      type: object
      properties:
        format:
          type: string
          enum: [A4, A3, Letter]
          default: A4
        landscape:
          type: boolean
          default: false
        path:
          type: string
    wait:
      type: object
      properties:
        timeout:
          type: integer
          default: 30000
        state:
          type: string
          enum: [visible, hidden, attached, detached]
          default: visible
    options:
      type: object
      properties:
        timeout:
          type: integer
          default: 30000
        wait_until:
          type: string
          enum: [load, domcontentloaded, networkidle]
          default: domcontentloaded
        viewport:
          type: object
          properties:
            width:
              type: integer
              default: 1920
            height:
              type: integer
              default: 1080
        user_agent:
          type: string
          nullable: true
        proxy:
          type: object
          nullable: true
        headless:
          type: boolean
          default: true
```

## Output Schema

```yaml
PlaywrightOutput:
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
        url:
          type: string
          format: uri
        title:
          type: string
        text:
          type: string
          description: Text content for get_text
        html:
          type: string
          description: HTML content for get_html
        screenshot:
          type: string
          format: uri
          description: Screenshot file path
        pdf:
          type: string
          format: uri
          description: PDF file path
        result:
          type: any
          description: Result from execute_js
        cookies:
          type: array
          items:
            type: object
          description: Cookie list
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
        page_url:
          type: string
          format: uri
        page_title:
          type: string
```

## Caching

```yaml
Caching:
  enabled: false
  notes: |
    - Playwright operations are not cached
    - Each request requires fresh browser session
    - Use for real-time data only
    - Consider HTTP tool for cacheable requests
```

## Validation

```yaml
Validation:
  input:
    - Required fields check
    - URL format validation
    - Selector syntax validation
    - Timeout range validation
  output:
    - Response structure validation
    - Data type verification
    - Null checks
```

## Timeout

```yaml
Timeout:
  default_ms: 30000
  navigation_ms: 60000
  element_wait_ms: 30000
  screenshot_ms: 10000
  pdf_ms: 30000
  javascript_ms: 30000
  max_ms: 120000
```

## Fallback

```yaml
Fallback:
  strategy: browser
  fallbacks:
    - tool: browser
      condition: playwright_unavailable
    - tool: http
      condition: js_rendering_not_required
    - tool: rest_apis
      condition: api_available
  notes: |
    - Fall back to simpler browser tool if Playwright fails
    - Fall back to HTTP if JS rendering not needed
    - Fall back to direct API if available
```

## Recovery

```yaml
Recovery:
  browser_crash:
    action: restart_browser
    timeout_ms: 10000
  memory_leak:
    action: session_rotation
    threshold_mb: 500
  stuck_page:
    action: close_and_retry
    timeout_ms: 60000
  zombie_process:
    action: kill_and_restart
```

## Usage Examples

```typescript
// Navigate to URL
await tool.execute('navigate', {
  url: 'https://www.booking.com',
  options: { wait_until: 'networkidle' }
});

// Take screenshot
await tool.execute('screenshot', {
  selector: '#search-form',
  screenshot: { full_page: true, format: 'png' }
});

// Fill search form
await tool.execute('fill', {
  selector: 'input[name="ss"]',
  value: 'Dubai'
});

// Click search button
await tool.execute('click', {
  selector: 'button[type="submit"]'
});

// Wait for results
await tool.execute('wait_for', {
  selector: '.hotel-list',
  wait: { timeout: 30000, state: 'visible' }
});

// Extract hotel data
await tool.execute('execute_js', {
  script: `
    Array.from(document.querySelectorAll('.hotel-item')).map(el => ({
      name: el.querySelector('.hotel-name')?.textContent,
      price: el.querySelector('.price')?.textContent,
      rating: el.querySelector('.rating')?.textContent
    }))
  `
});
```

## Configuration

```yaml
Configuration:
  browser: chromium
  headless: true
  viewport:
    width: 1920
    height: 1080
  timeout: 30000
  navigation_timeout: 60000
  proxy:
    enabled: false
    server: ""
    username: ""
    password: ""
  downloads:
    enabled: true
    path: ./downloads
  screenshots:
    path: ./screenshots
  pdfs:
    path: ./pdfs
  pool:
    min_instances: 2
    max_instances: 10
    idle_timeout_ms: 300000
```

## Monitoring

```yaml
Metrics:
  - playwright_sessions_active
  - playwright_requests_total
  - playwright_requests_duration_seconds
  - playwright_errors_total
  - playwright_navigation_duration_seconds
  - playwright_screenshot_duration_seconds
```

## Security Notes

- Respect website robots.txt
- Do not scrape personal data without consent
- Use appropriate delays between requests
- Rotate user agents and proxies
- Handle cookie consent dialogs appropriately
- Do not bypass access controls

---

*Playwright Tool v1.0.0 | Enterprise OTA Platform*
