# Enterprise Playwright Framework

> A comprehensive web scraping and browser automation framework built on Playwright.

---

## Overview

The Enterprise Playwright Framework provides production-ready browser automation with built-in support for:

- **Browser Pool Management** - Efficient browser instance recycling
- **Context Isolation** - Isolated browser contexts with custom configurations
- **Session Persistence** - Cookie and storage persistence across sessions
- **Proxy Rotation** - Intelligent proxy rotation with health checking
- **Network Interception** - Request filtering, header modification, HAR recording
- **CAPTCHA Detection** - Detection of common CAPTCHA types
- **Data Extraction** - Structured data extraction with selector fallback
- **Download Management** - File download handling with progress tracking
- **Rate Limiting** - Request rate control with multiple strategies
- **Error Recovery** - Retry logic, circuit breakers, and fallback mechanisms
- **Metrics Collection** - Performance monitoring and alerting
- **Logging** - Structured logging with multiple transports

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ENTERPRISE PLAYWRIGHT FRAMEWORK                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         CORE LAYER                                         │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Browser  │ │  Context  │ │  Session  │ │  Network  │ │  Download │  │ │
│  │  │  Pool     │ │  Manager  │ │  Manager  │ │  Layer    │ │  Manager  │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         INTELLIGENCE LAYER                                 │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Extraction│ │  CAPTCHA  │ │  Proxy    │ │  Rate     │ │  Error    │  │ │
│  │  │  Engine   │ │  Detector │ │  Rotator  │ │  Limiter  │ │  Recovery │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         OBSERVABILITY LAYER                                │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Logger   │ │  Metrics  │ │  Alerts   │ │  Tracing  │ │  Reports  │  │ │
│  │  │           │ │  Collector│ │           │ │           │ │           │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Files

| File | Description |
|------|-------------|
| `PLAYWRIGHT_FRAMEWORK.md` | Main architecture and implementation |
| `BROWSER_POOL.md` | Browser instance pool management |
| `CONTEXT_MANAGER.md` | Browser context isolation |
| `SESSION_MANAGER.md` | Cookie/session persistence with encryption |
| `PROXY_ROTATOR.md` | Proxy rotation and health checking |
| `NETWORK_LAYER.md` | Request interception and HAR recording |
| `EXTRACTION_ENGINE.md` | Structured data extraction with selector fallback |
| `CAPTCHA_DETECTOR.md` | CAPTCHA detection and handling |
| `DOWNLOAD_MANAGER.md` | File download handling and management |
| `ERROR_RECOVERY.md` | Error handling and recovery mechanisms |
| `RATE_LIMITER.md` | Request rate limiting |
| `METRICS_COLLECTOR.md` | Performance metrics collection |
| `LOGGER.md` | Structured logging system |
| `API_REFERENCE.md` | Complete API documentation |

---

## Quick Start

```typescript
import { Scraper } from './playwright-framework';

// Create scraper instance
const scraper = new Scraper({
  headless: true,
  browserType: 'chromium',
  viewport: { width: 1920, height: 1080 },
  proxy: {
    server: 'http://proxy.example.com:8080',
    username: 'user',
    password: 'pass',
  },
  poolSize: 5,
  timeout: 30000,
});

// Initialize
await scraper.initialize();

// Navigate and extract
await scraper.navigate('https://example.com');

const data = await scraper.extract({
  title: 'h1',
  items: {
    selector: '.item',
    type: 'list',
    children: {
      name: '.name',
      price: '.price',
    },
  },
});

console.log(data);

// Cleanup
await scraper.close();
```

---

## Features

### Browser Pool Management
- Min/max browser instances
- LRU allocation strategy
- Automatic recycling based on age or request count
- Smart assignment based on proxy and viewport

### Context Isolation
- Per-context proxy, viewport, user agent
- Storage state persistence
- Permission management
- Cookie isolation

### Session Persistence
- Cookie, localStorage, sessionStorage persistence
- AES-256-CBC encryption for sensitive data
- Session export/import
- Automatic expiration

### Proxy Rotation
- Round-robin, random, least-used, session-sticky, smart strategies
- Health checking with automatic failover
- Response time tracking
- Geographic distribution support

### Network Interception
- Request filtering by URL pattern
- Header modification
- Resource blocking (images, CSS, fonts)
- HAR 1.2 format recording

### CAPTCHA Detection
- reCAPTCHA v2/v3 detection
- hCaptcha detection
- Turnstile detection
- Fun CAPTCHA detection
- Custom CAPTCHA patterns

### Data Extraction
- CSS, XPath, text, role selectors
- Automatic fallback between selector strategies
- Auto-wait for elements
- Data transformation and validation

### Download Management
- Parallel downloads
- Progress tracking
- File organization by type/date
- Resume support

### Rate Limiting
- Token bucket algorithm
- Sliding window rate limiting
- Concurrency control
- Burst handling

### Error Recovery
- Exponential backoff retry
- Circuit breaker pattern
- Proxy rotation on failure
- User agent rotation

### Metrics Collection
- Counter, gauge, histogram metrics
- Prometheus export format
- Custom alerting
- Performance tracking

### Logging
- Multiple log levels
- JSON, text, pretty formats
- Console, file, HTTP, Elasticsearch transports
- Structured context support

---

## Configuration

```yaml
# Scraper configuration
scraper:
  headless: true
  browserType: chromium
  viewport:
    width: 1920
    height: 1080
  poolSize: 5
  timeout: 30000

# Browser pool
browserPool:
  min: 3
  max: 20
  maxAge: 3600000
  maxRequests: 1000
  recycleOn: both

# Proxy rotation
proxy:
  strategy: smart
  healthCheckInterval: 30000
  failureThreshold: 3

# Rate limiting
rateLimiter:
  requestsPerSecond: 10
  maxConcurrent: 5
  strategy: token-bucket

# Error recovery
errorRecovery:
  retry:
    maxAttempts: 3
    backoffMultiplier: 2
    initialDelay: 1000
  circuitBreaker:
    failureThreshold: 5
    resetTimeout: 60000

# Logging
logging:
  level: info
  format: json
  transports:
    - type: console
    - type: file
      config:
        path: ./logs/scraper.log

# Metrics
metrics:
  collectInterval: 10000
  retentionPeriod: 86400000
  alerts:
    - metric: scraping_failures_total
      threshold: 10
      operator: gt
```

---

## License

Enterprise use only. Proprietary.
