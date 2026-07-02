# Enterprise Playwright Framework

> Production-grade browser automation framework for web scraping and data extraction.

---

## Overview

The Enterprise Playwright Framework is a comprehensive browser automation system designed for large-scale web scraping, data extraction, and browser-based testing. It provides parallel execution, anti-detection capabilities, session management, and enterprise-grade reliability.

---

## Framework Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ENTERPRISE PLAYWRIGHT FRAMEWORK                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         ORCHESTRATION LAYER                                 │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Task     │ │  Job      │ │  Workflow │ │  Schedule │ │  Queue    │  │ │
│  │  │  Manager  │ │  Manager  │ │  Engine   │ │  Engine   │ │  Manager  │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         BROWSER LAYER                                       │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Browser  │ │  Context  │ │  Page     │ │  Tab      │ │  Frame    │  │ │
│  │  │  Pool     │ │  Manager  │ │  Manager  │ │  Manager  │ │  Manager  │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         NETWORK LAYER                                       │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Proxy    │ │  Cookie   │ │  Session  │ │  Request  │ │  HAR      │  │ │
│  │  │  Rotator  │ │  Manager  │ │  Manager  │ │  Interceptor│ │ Recorder │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         EXTRACTION LAYER                                    │ │
│  │                                                                            │ │
│ │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │ │
│  │  │  Selector │ │  Auto-    │ │  Structured│ │  Screenshot│ │  Content │   │ │
│  │  │  Engine   │ │  Wait     │ │  Extractor│ │  Capture  │ │  Parser   │   │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         RELIABILITY LAYER                                   │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Error    │ │  Retry    │ │  CAPTCHA  │ │  Rate     │ │  Download │  │ │
│  │  │  Recovery │ │  Manager  │ │  Detector │ │  Limiter  │ │  Manager  │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         OBSERVABILITY LAYER                                 │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Logger   │ │  Metrics  │ │  Tracer   │ │  Alert    │ │  Dashboard│  │ │
│  │  │           │ │  Collector│ │           │ │  Manager  │ │           │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

| Component | Purpose | File |
|-----------|---------|------|
| Browser Pool | Manages browser instances | `BROWSER_POOL.md` |
| Context Manager | Manages browser contexts | `CONTEXT_MANAGER.md` |
| Page Manager | Manages pages and tabs | `PAGE_MANAGER.md` |
| Session Manager | Cookie & session persistence | `SESSION_MANAGER.md` |
| Proxy Rotator | Proxy rotation & management | `PROXY_ROTATOR.md` |
| Network Layer | Request interception & HAR | `NETWORK_LAYER.md` |
| Extraction Engine | Data extraction | `EXTRACTION_ENGINE.md` |
| CAPTCHA Detector | CAPTCHA detection & handling | `CAPTCHA_DETECTOR.md` |
| Download Manager | File download handling | `DOWNLOAD_MANAGER.md` |
| Error Recovery | Error handling & retry | `ERROR_RECOVERY.md` |
| Rate Limiter | Request rate limiting | `RATE_LIMITER.md` |
| Logger | Structured logging | `LOGGER.md` |
| Metrics Collector | Performance metrics | `METRICS_COLLECTOR.md` |

---

## Quick Start

```typescript
import { PlaywrightFramework } from '@enterprise/playwright';

// Initialize framework
const framework = new PlaywrightFramework({
  // Browser settings
  browser: {
    type: 'chromium',
    headless: true,
    poolSize: 5,
  },
  
  // Proxy settings
  proxy: {
    enabled: true,
    rotation: 'round-robin',
    providers: [
      { host: 'proxy1.example.com', port: 8080 },
      { host: 'proxy2.example.com', port: 8080 },
    ],
  },
  
  // Session settings
  session: {
    persist: true,
    storagePath: './sessions',
    ttl: 3600000,
  },
  
  // Rate limiting
  rateLimit: {
    requestsPerSecond: 10,
    requestsPerMinute: 300,
  },
  
  // Logging
  logging: {
    level: 'info',
    format: 'json',
    destination: './logs',
  },
});

// Create a job
const job = await framework.createJob({
  name: 'scrape-hotels',
  urls: [
    'https://example.com/hotel/1',
    'https://example.com/hotel/2',
    'https://example.com/hotel/3',
  ],
  
  // Extraction rules
  extract: {
    name: 'h1.property-name',
    price: '.price-value',
    rating: '.rating-score',
    images: {
      selector: '.gallery img',
      attribute: 'src',
    },
  },
  
  // Options
  options: {
    parallel: true,
    maxConcurrency: 5,
    screenshot: true,
    har: true,
  },
});

// Run job
const results = await framework.runJob(job);

// Get results
console.log(results);
```

---

## Feature Matrix

| Feature | Status | Description |
|---------|--------|-------------|
| Multi-tab Browsing | ✅ | Support for multiple tabs per context |
| Parallel Contexts | ✅ | Multiple browser contexts in parallel |
| Proxy Rotation | ✅ | Automatic proxy rotation with health checks |
| Cookie Persistence | ✅ | Save and restore cookies |
| Session Persistence | ✅ | Full session state persistence |
| CAPTCHA Detection | ✅ | Detect and handle CAPTCHAs |
| Infinite Scrolling | ✅ | Automatic infinite scroll handling |
| Lazy Loading | ✅ | Wait for lazy-loaded content |
| Screenshot Capture | ✅ | Full page and element screenshots |
| Network Interception | ✅ | Request/response interception |
| HAR Recording | ✅ | Record network traffic to HAR |
| Request Retry | ✅ | Automatic retry with backoff |
| Browser Pool | ✅ | Reuse browser instances |
| Headless/Headed | ✅ | Both modes supported |
| Download Manager | ✅ | Handle file downloads |
| Structured Extraction | ✅ | Extract structured data |
| Selector Fallback | ✅ | Multiple selector strategies |
| Auto-wait | ✅ | Automatic wait for elements |
| Rate Limiting | ✅ | Configurable rate limits |
| Error Recovery | ✅ | Graceful error handling |
| Logging | ✅ | Structured logging |
| Metrics | ✅ | Performance metrics collection |

---

## Configuration

```typescript
interface FrameworkConfig {
  // Browser settings
  browser: {
    type: 'chromium' | 'firefox' | 'webkit';
    headless: boolean;
    poolSize: number;
    timeout: number;
    viewport: { width: number; height: number };
    userAgent?: string;
    args?: string[];
  };
  
  // Proxy settings
  proxy: {
    enabled: boolean;
    rotation: 'round-robin' | 'random' | 'least-used' | 'smart';
    providers: ProxyConfig[];
    healthCheck: boolean;
    timeout: number;
  };
  
  // Session settings
  session: {
    persist: boolean;
    storagePath: string;
    ttl: number;
    encryption: boolean;
  };
  
  // Rate limiting
  rateLimit: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    concurrent: number;
    strategy: 'fixed' | 'sliding' | 'token-bucket';
  };
  
  // Extraction settings
  extraction: {
    autoWait: boolean;
    waitTimeout: number;
    retryOnEmpty: boolean;
    screenshotOnError: boolean;
  };
  
  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    destination: string;
    rotation: boolean;
  };
  
  // Metrics
  metrics: {
    enabled: boolean;
    interval: number;
    destination: string;
  };
}
```

---

## Performance Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Pages per Second | > 50 | Scraping throughput |
| Context Startup | < 500ms | Time to create context |
| Page Load | < 3s | Average page load time |
| Extraction | < 100ms | Data extraction time |
| Memory per Context | < 100MB | Memory usage |
| CPU per Context | < 10% | CPU usage |
| Error Rate | < 1% | Failed requests |
| Success Rate | > 99% | Successful extractions |
