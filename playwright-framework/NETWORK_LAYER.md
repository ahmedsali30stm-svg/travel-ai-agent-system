# Network Layer

> Request interception, HAR recording, and network traffic management.

---

## Overview

The Network Layer handles request/response interception, HAR recording, network mocking, and traffic analysis for web scraping operations.

---

## Network Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        NETWORK LAYER ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         REQUEST INTERCEPTOR                                 │ │
│  │                                                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  URL        │ │  Header     │ │  Body       │ │  Response   │     │ │
│  │  │  Filter     │ │  Modifier   │ │  Modifier   │ │  Modifier   │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         HAR RECORDER                                       │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Request  │ │  Response │ │  Timing   │ │  Cookies  │ │  Export   │  │ │
│  │  │  Capture  │ │  Capture  │ │  Capture  │ │  Capture  │ │  HAR      │  │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         TRAFFIC ANALYSIS                                   │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Request  │ │  Response │ │  Timing   │ │  Error    │ │  Security │  │ │
│  │  │  Logger   │ │  Logger   │ │  Analyzer │ │  Detector │ │  Analyzer │  │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Network Layer Implementation

```typescript
import { Page, Request, Response, Route } from 'playwright';

interface NetworkConfig {
  // Request interception
  interception: {
    enabled: boolean;
    patterns: InterceptionPattern[];
  };
  
  // HAR recording
  har: {
    enabled: boolean;
    path: string;
    content: 'full' | 'minimal' | 'none';
  };
  
  // Request modification
  modification: {
    headers: Record<string, string>;
    cookies: Record<string, string>;
  };
  
  // Blocking
  blocking: {
    resources: string[];
    urls: string[];
  };
  
  // Throttling
  throttling: {
    enabled: boolean;
    downloadSpeed: number;
    uploadSpeed: number;
    latency: number;
  };
}

interface InterceptionPattern {
  // URL pattern
  urlPattern: string | RegExp;
  
  // Resource type
  resourceType?: string;
  
  // Action
  action: 'modify' | 'block' | 'mock' | 'log';
  
  // Modification
  modification?: {
    headers?: Record<string, string>;
    body?: any;
    response?: {
      status: number;
      headers: Record<string, string>;
      body: any;
    };
  };
}

class NetworkLayer {
  private page: Page;
  private config: NetworkConfig;
  private harRecorder: HARRecorder;
  private requestLogger: RequestLogger;
  
  constructor(page: Page, config: NetworkConfig) {
    this.page = page;
    this.config = config;
    this.harRecorder = new HARRecorder();
    this.requestLogger = new RequestLogger();
    
    // Setup interceptors
    this.setupInterceptors();
    
    // Setup HAR recording
    this.setupHARRecording();
  }
  
  // Setup request interceptors
  private async setupInterceptors(): Promise<void> {
    if (!this.config.interception.enabled) {
      return;
    }
    
    await this.page.route('**/*', async (route) => {
      const request = route.request();
      
      // Check patterns
      for (const pattern of this.config.interception.patterns) {
        if (this.matchesPattern(request, pattern)) {
          await this.handleInterception(route, pattern);
          return;
        }
      }
      
      // Continue with request
      await route.continue();
    });
  }
  
  // Check if request matches pattern
  private matchesPattern(request: Request, pattern: InterceptionPattern): boolean {
    // Check URL pattern
    if (pattern.urlPattern instanceof RegExp) {
      if (!pattern.urlPattern.test(request.url())) {
        return false;
      }
    } else if (typeof pattern.urlPattern === 'string') {
      if (!request.url().includes(pattern.urlPattern)) {
        return false;
      }
    }
    
    // Check resource type
    if (pattern.resourceType && request.resourceType() !== pattern.resourceType) {
      return false;
    }
    
    return true;
  }
  
  // Handle interception
  private async handleInterception(
    route: Route,
    pattern: InterceptionPattern
  ): Promise<void> {
    switch (pattern.action) {
      case 'modify':
        await this.handleModify(route, pattern);
        break;
      case 'block':
        await this.handleBlock(route);
        break;
      case 'mock':
        await this.handleMock(route, pattern);
        break;
      case 'log':
        await this.handleLog(route);
        break;
    }
  }
  
  // Handle modify
  private async handleModify(
    route: Route,
    pattern: InterceptionPattern
  ): Promise<void> {
    const headers = {
      ...route.request().headers(),
      ...pattern.modification?.headers,
      ...this.config.modification.headers,
    };
    
    await route.continue({ headers });
  }
  
  // Handle block
  private async handleBlock(route: Route): Promise<void> {
    await route.abort();
  }
  
  // Handle mock
  private async handleMock(
    route: Route,
    pattern: InterceptionPattern
  ): Promise<void> {
    if (pattern.modification?.response) {
      await route.fulfill({
        status: pattern.modification.response.status,
        headers: pattern.modification.response.headers,
        body: JSON.stringify(pattern.modification.response.body),
      });
    } else {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pattern.modification?.body || {}),
      });
    }
  }
  
  // Handle log
  private async handleLog(route: Route): Promise<void> {
    this.requestLogger.logRequest(route.request());
    await route.continue();
  }
  
  // Setup HAR recording
  private async setupHARRecording(): Promise<void> {
    if (!this.config.har.enabled) {
      return;
    }
    
    // Start HAR recording
    await this.page.route('**/*', async (route) => {
      const request = route.request();
      
      // Log request
      this.harRecorder.logRequest(request);
      
      // Continue with request
      await route.continue();
    });
    
    // Listen for responses
    this.page.on('response', async (response) => {
      this.harRecorder.logResponse(response);
    });
  }
  
  // Add interception pattern
  addPattern(pattern: InterceptionPattern): void {
    this.config.interception.patterns.push(pattern);
  }
  
  // Remove interception pattern
  removePattern(urlPattern: string | RegExp): void {
    this.config.interception.patterns = this.config.interception.patterns.filter(
      p => p.urlPattern !== urlPattern
    );
  }
  
  // Block resource types
  blockResources(types: string[]): void {
    for (const type of types) {
      this.config.blocking.resources.push(type);
    }
  }
  
  // Block URLs
  blockUrls(patterns: string[]): void {
    for (const pattern of patterns) {
      this.config.blocking.urls.push(pattern);
    }
  }
  
  // Set headers
  setHeaders(headers: Record<string, string>): void {
    this.config.modification.headers = {
      ...this.config.modification.headers,
      ...headers,
    };
  }
  
  // Get HAR file
  async getHAR(): Promise<HARFile> {
    return this.harRecorder.getHAR();
  }
  
  // Save HAR file
  async saveHAR(path: string): Promise<void> {
    const har = await this.getHAR();
    await fs.writeFile(path, JSON.stringify(har));
  }
  
  // Get request logs
  getRequestLogs(): RequestLog[] {
    return this.requestLogger.getLogs();
  }
  
  // Clear request logs
  clearRequestLogs(): void {
    this.requestLogger.clear();
  }
}
```

---

## HAR Recorder

```typescript
interface HARFile {
  // HAR version
  version: string;
  
  // Creator info
  creator: {
    name: string;
    version: string;
  };
  
  // Entries
  entries: HAREntry[];
  
  // Page info
  pages: HARPage[];
}

interface HAREntry {
  // Request
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    cookies: HARCookie[];
    queryString: { name: string; value: string }[];
    postData?: {
      mimeType: string;
      text: string;
    };
    headersSize: number;
    bodySize: number;
  };
  
  // Response
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    cookies: HARCookie[];
    content: {
      size: number;
      mimeType: string;
      text?: string;
    };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  
  // Timing
  time: number;
  timings: {
    send: number;
    wait: number;
    receive: number;
  };
  
  // Page
  pageRef: string;
}

interface HARPage {
  // Page ID
  id: string;
  
  // Page title
  title: string;
  
  // Start time
  startedDateTime: string;
  
  // Page timings
  pageTimings: {
    onContentLoad: number;
    onLoad: number;
  };
}

interface HARCookie {
  name: string;
  value: string;
  path: string;
  domain: string;
  expires: string;
  httpOnly: boolean;
  secure: boolean;
}

class HARRecorder {
  private entries: HAREntry[];
  private pages: HARPage[];
  private requestMap: Map<string, HAREntry>;
  
  constructor() {
    this.entries = [];
    this.pages = [];
    this.requestMap = new Map();
  }
  
  // Log request
  logRequest(request: Request): void {
    const entry: HAREntry = {
      request: {
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        cookies: [],
        queryString: this.parseQueryString(request.url()),
        postData: request.postData() ? {
          mimeType: request.headers()['content-type'] || '',
          text: request.postData() || '',
        } : undefined,
        headersSize: -1,
        bodySize: request.postData()?.length || 0,
      },
      response: {
        status: 0,
        statusText: '',
        headers: {},
        cookies: [],
        content: {
          size: 0,
          mimeType: '',
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: 0,
      },
      time: 0,
      timings: {
        send: 0,
        wait: 0,
        receive: 0,
      },
      pageRef: '',
    };
    
    this.requestMap.set(request.url(), entry);
  }
  
  // Log response
  logResponse(response: Response): void {
    const entry = this.requestMap.get(response.url());
    
    if (entry) {
      entry.response = {
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        cookies: [],
        content: {
          size: parseInt(response.headers()['content-length'] || '0'),
          mimeType: response.headers()['content-type'] || '',
        },
        redirectURL: response.headers()['location'] || '',
        headersSize: -1,
        bodySize: parseInt(response.headers()['content-length'] || '0'),
      };
      
      this.entries.push(entry);
      this.requestMap.delete(response.url());
    }
  }
  
  // Parse query string
  private parseQueryString(url: string): { name: string; value: string }[] {
    const queryString: { name: string; value: string }[] = [];
    
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.forEach((value, name) => {
        queryString.push({ name, value });
      });
    } catch (error) {
      // Ignore URL parse errors
    }
    
    return queryString;
  }
  
  // Get HAR file
  getHAR(): HARFile {
    return {
      version: '1.2',
      creator: {
        name: 'Enterprise Playwright Framework',
        version: '1.0.0',
      },
      entries: this.entries,
      pages: this.pages,
    };
  }
  
  // Clear
  clear(): void {
    this.entries = [];
    this.pages = [];
    this.requestMap.clear();
  }
}
```

---

## Network Layer Configuration

```yaml
networkLayer:
  # Request interception
  interception:
    enabled: true
    patterns:
      - urlPattern: "*.analytics.com"
        action: block
      - urlPattern: "*.tracking.com"
        action: block
      - urlPattern: "api.example.com"
        action: log
  
  # HAR recording
  har:
    enabled: true
    path: ./har
    content: minimal
  
  # Request modification
  modification:
    headers:
      Accept-Language: en-US,en;q=0.9
      Cache-Control: no-cache
  
  # Blocking
  blocking:
    resources:
      - image
      - font
      - media
    urls:
      - "*analytics*"
      - "*tracking*"
      - "*advertising*"
  
  # Throttling
  throttling:
    enabled: false
    downloadSpeed: 1048576 # 1 MB/s
    uploadSpeed: 524288 # 512 KB/s
    latency: 100 # 100ms
```

---

## Network Statistics

```typescript
interface NetworkStats {
  // Request counts
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  
  // Response times
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // Data transfer
  totalDownloaded: number;
  totalUploaded: number;
  
  // Errors
  errorRate: number;
  timeoutRate: number;
  
  // Resources
  resourceBreakdown: {
    document: number;
    stylesheet: number;
    script: number;
    image: number;
    font: number;
    xhr: number;
    fetch: number;
    other: number;
  };
}
```
