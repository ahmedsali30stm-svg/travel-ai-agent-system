# Playwright Framework API Reference

> Complete API reference for the Enterprise Playwright Framework.

---

## Core Classes

### BrowserPool

```typescript
class BrowserPool {
  constructor(config: BrowserPoolConfig);
  
  // Get browser instance
  async acquire(strategy?: AllocationStrategy): Promise<BrowserInstance>;
  
  // Release browser instance
  release(instance: BrowserInstance): void;
  
  // Get pool stats
  getStats(): PoolStats;
  
  // Cleanup all browsers
  async cleanup(): Promise<void>;
}

interface BrowserPoolConfig {
  min: number;
  max: number;
  maxAge: number;
  maxRequests: number;
  recycleOn: 'age' | 'requests' | 'both';
}

interface PoolStats {
  total: number;
  available: number;
  inUse: number;
  pending: number;
}
```

### ContextManager

```typescript
class ContextManager {
  constructor(page: Page);
  
  // Create isolated context
  async createContext(options?: ContextOptions): Promise<BrowserContext>;
  
  // Get all contexts
  getContexts(): BrowserContext[];
  
  // Cleanup specific context
  async cleanupContext(context: BrowserContext): Promise<void>;
  
  // Cleanup all contexts
  async cleanup(): Promise<void>;
}

interface ContextOptions {
  viewport?: { width: number; height: number };
  userAgent?: string;
  proxy?: ProxyConfig;
  locale?: string;
  timezone?: string;
  permissions?: string[];
  storageState?: string;
}
```

### SessionManager

```typescript
class SessionManager {
  constructor(page: Page, config: SessionConfig);
  
  // Save session state
  async save(sessionId: string): Promise<SessionData>;
  
  // Load session state
  async load(sessionId: string): Promise<SessionData>;
  
  // Delete session
  async delete(sessionId: string): Promise<void>;
  
  // List all sessions
  async list(): Promise<SessionInfo[]>;
  
  // Export session
  async export(sessionId: string): Promise<string>;
  
  // Import session
  async import(data: string): Promise<string>;
}

interface SessionConfig {
  storagePath: string;
  encrypt: boolean;
  encryptionKey?: string;
  maxAge: number;
}
```

### ProxyRotator

```typescript
class ProxyRotator {
  constructor(proxies: ProxyConfig[], strategy: RotationStrategy);
  
  // Get next proxy
  async getNext(): Promise<ProxyConfig>;
  
  // Mark proxy as failed
  markFailed(proxy: ProxyConfig): void;
  
  // Mark proxy as successful
  markSuccess(proxy: ProxyConfig): void;
  
  // Get proxy stats
  getStats(): ProxyStats;
  
  // Refresh proxy list
  async refresh(): Promise<void>;
}

type RotationStrategy = 'round-robin' | 'random' | 'least-used' | 'session-sticky' | 'smart';

interface ProxyStats {
  total: number;
  active: number;
  failed: number;
  avgResponseTime: number;
}
```

### NetworkLayer

```typescript
class NetworkLayer {
  constructor(page: Page, config: NetworkConfig);
  
  // Start interception
  async startInterception(): Promise<void>;
  
  // Stop interception
  async stopInterception(): Promise<void>;
  
  // Add request filter
  addFilter(filter: RequestFilter): void;
  
  // Remove request filter
  removeFilter(filterId: string): void;
  
  // Get network stats
  getStats(): NetworkStats;
  
  // Export HAR
  async exportHAR(): Promise<HARData>;
  
  // Record network traffic
  async startRecording(): Promise<void>;
  
  // Stop recording
  async stopRecording(): Promise<void>;
}

interface NetworkConfig {
  intercept: boolean;
  blockResources: string[];
  modifyHeaders: Record<string, string>;
  recordTraffic: boolean;
}
```

### ExtractionEngine

```typescript
class ExtractionEngine {
  constructor(page: Page, config: ExtractionConfig);
  
  // Extract data using selectors
  async extract(selectors: SelectorMap): Promise<ExtractionResult>;
  
  // Extract with fallback
  async extractWithFallback(
    primary: SelectorMap,
    fallback: SelectorMap
  ): Promise<ExtractionResult>;
  
  // Auto-detect selectors
  async autoDetect(dataType: string): Promise<SelectorMap>;
  
  // Validate extraction
  validate(data: any, schema: any): ValidationResult;
}

interface ExtractionConfig {
  autoWait: boolean;
  waitTimeout: number;
  retryOnFailure: boolean;
  maxRetries: number;
}

interface SelectorMap {
  [key: string]: string | SelectorConfig;
}

interface SelectorConfig {
  selector: string;
  type: 'text' | 'attribute' | 'html' | 'computed';
  attribute?: string;
  transform?: (value: string) => any;
}
```

### CaptchaDetector

```typescript
class CaptchaDetector {
  constructor(page: Page);
  
  // Detect CAPTCHA
  async detect(): Promise<CaptchaResult>;
  
  // Get CAPTCHA type
  getType(): CaptchaType | null;
  
  // Get confidence score
  getConfidence(): number;
  
  // Get detection history
  getHistory(): CaptchaDetection[];
}

type CaptchaType = 'recaptcha-v2' | 'recaptcha-v3' | 'hcaptcha' | 'turnstile' | 'fun-captcha' | 'custom';

interface CaptchaResult {
  detected: boolean;
  type: CaptchaType | null;
  confidence: number;
  elements: string[];
  suggestions: string[];
}
```

### DownloadManager

```typescript
class DownloadManager {
  constructor(page: Page, config: DownloadConfig);
  
  // Download single file
  async download(url: string, filename?: string): Promise<DownloadTask>;
  
  // Download batch
  async downloadBatch(urls: string[]): Promise<DownloadTask[]>;
  
  // Cancel download
  cancel(taskId: string): void;
  
  // Cancel all downloads
  cancelAll(): void;
  
  // Get task status
  getStatus(taskId: string): DownloadTask | null;
  
  // Get all tasks
  getAllTasks(): DownloadTask[];
  
  // Get stats
  getStats(): DownloadStats;
}

interface DownloadConfig {
  downloadPath: string;
  maxParallel: number;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  allowedExtensions: string[];
  maxFileSize: number;
  organizeByType: boolean;
  organizeByDate: boolean;
}
```

### RateLimiter

```typescript
class RateLimiter {
  constructor(config: RateLimiterConfig);
  
  // Acquire permission
  async acquire(): Promise<void>;
  
  // Release permission
  release(): void;
  
  // Get stats
  getStats(): RateLimiterStats;
}

interface RateLimiterConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  maxConcurrent: number;
  strategy: 'fixed' | 'sliding' | 'token-bucket' | 'leaky-bucket';
  burstSize: number;
  burstInterval: number;
}
```

### MetricsCollector

```typescript
class MetricsCollector extends EventEmitter {
  constructor(config: MetricsConfig);
  
  // Start collection
  start(): void;
  
  // Stop collection
  stop(): void;
  
  // Increment counter
  incrementCounter(name: string, value?: number, labels?: Record<string, string>): void;
  
  // Set gauge
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
  
  // Add to histogram
  addToHistogram(name: string, value: number, labels?: Record<string, string>): void;
  
  // Record timing
  recordTiming(name: string, duration: number, labels?: Record<string, string>): void;
  
  // Get metrics
  getMetrics(): MetricValue[];
  
  // Get metric by name
  getMetric(name: string): MetricValue[];
  
  // Export metrics
  async export(format: 'json' | 'csv' | 'prometheus'): Promise<string>;
}

interface MetricsConfig {
  collectInterval: number;
  retentionPeriod: number;
  metrics: MetricDefinition[];
  exportFormat: 'json' | 'csv' | 'prometheus';
  exportPath: string;
  alerts: AlertConfig[];
}
```

### Logger

```typescript
class Logger {
  constructor(config: LoggerConfig);
  
  // Log levels
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  fatal(message: string, context?: Record<string, any>): void;
  
  // Flush logs
  async flush(): Promise<void>;
  
  // Create child logger
  child(context: Record<string, any>): Logger;
  
  // Cleanup
  async cleanup(): Promise<void>;
}

interface LoggerConfig {
  level: LogLevel;
  transports: Transport[];
  format: 'json' | 'text' | 'pretty';
  context: Record<string, any>;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
```

### ErrorRecovery

```typescript
class ErrorRecovery {
  constructor(config: ErrorRecoveryConfig);
  
  // Execute with recovery
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    context: any
  ): Promise<T>;
  
  // Handle error
  async handleError(error: Error, context: any): Promise<void>;
  
  // Get stats
  getStats(): RecoveryStats;
}

interface ErrorRecoveryConfig {
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  fallback: {
    enabled: boolean;
    strategies: FallbackStrategy[];
  };
  recovery: {
    maxRecoveryAttempts: number;
    recoveryDelay: number;
  };
}

interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMax: number;
}
```

---

## Scraper Class (Main Entry Point)

```typescript
class Scraper {
  constructor(config: ScraperConfig);
  
  // Initialize scraper
  async initialize(): Promise<void>;
  
  // Navigate to URL
  async navigate(url: string, options?: NavigationOptions): Promise<void>;
  
  // Extract data
  async extract<T>(selectors: SelectorMap): Promise<T>;
  
  // Wait for element
  async waitForSelector(selector: string, options?: WaitForSelectorOptions): Promise<void>;
  
  // Click element
  async click(selector: string, options?: ClickOptions): Promise<void>;
  
  // Type text
  async type(selector: string, text: string, options?: TypeOptions): Promise<void>;
  
  // Screenshot
  async screenshot(options?: ScreenshotOptions): Promise<Buffer>;
  
  // Get page content
  async getContent(): Promise<string>;
  
  // Get page title
  async getTitle(): Promise<string>;
  
  // Get current URL
  async getURL(): Promise<string>;
  
  // Execute JavaScript
  async evaluate<T>(script: string | Function, ...args: any[]): Promise<T>;
  
  // Close scraper
  async close(): Promise<void>;
}

interface ScraperConfig {
  // Browser settings
  headless: boolean;
  browserType: 'chromium' | 'firefox' | 'webkit';
  
  // Context settings
  viewport: { width: number; height: number };
  userAgent: string;
  locale: string;
  timezone: string;
  
  // Proxy settings
  proxy?: ProxyConfig;
  
  // Performance settings
  poolSize: number;
  timeout: number;
  
  // Anti-detection
  fingerprint: FingerprintConfig;
  
  // Logging
  logging: LoggerConfig;
}
```

---

## Usage Examples

### Basic Scraping

```typescript
const scraper = new Scraper({
  headless: true,
  browserType: 'chromium',
  viewport: { width: 1920, height: 1080 },
  userAgent: 'Mozilla/5.0 ...',
  locale: 'en-US',
  timezone: 'America/New_York',
  poolSize: 5,
  timeout: 30000,
  fingerprint: { ... },
  logging: { ... },
});

await scraper.initialize();
await scraper.navigate('https://example.com');

const data = await scraper.extract({
  title: 'h1',
  description: '.description',
  price: '.price',
});

await scraper.close();
```

### With Proxy Rotation

```typescript
const proxyRotator = new ProxyRotator(proxies, 'smart');
const proxy = await proxyRotator.getNext();

const scraper = new Scraper({
  proxy,
  // ... other config
});
```

### With Session Persistence

```typescript
const sessionManager = new SessionManager(page, {
  storagePath: './sessions',
  encrypt: true,
  maxAge: 86400000,
});

// Save session
await sessionManager.save('session-1');

// Load session
const session = await sessionManager.load('session-1');
```

### With Rate Limiting

```typescript
const rateLimiter = new RateLimiter({
  requestsPerSecond: 10,
  maxConcurrent: 5,
  strategy: 'token-bucket',
  burstSize: 20,
  burstInterval: 1000,
});

await rateLimiter.acquire();
try {
  await scraper.navigate(url);
} finally {
  rateLimiter.release();
}
```
