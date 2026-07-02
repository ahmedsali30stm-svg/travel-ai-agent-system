# Context Manager

> Manages browser contexts for isolated sessions and parallel execution.

---

## Overview

The Context Manager handles browser context creation, configuration, and lifecycle management, enabling isolated sessions and parallel scraping operations.

---

## Context Manager Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CONTEXT MANAGER ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         CONTEXT POOL                                        │ │
│  │                                                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  Context    │  │  Context    │  │  Context    │  │  Context    │     │ │
│  │  │  Factory    │  │  Registry   │  │  Lifecycle  │  │  Isolation  │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         CONTEXT INSTANCES                                  │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                                                                     │  │ │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │  │ │
│  │  │  │Context 1│  │Context 2│  │Context 3│  │Context N│             │  │ │
│  │  │  │┌───────┐│  │┌───────┐│  │┌───────┐│  │┌───────┐│             │  │ │
│  │  │  ││Page 1 ││  ││Page 1 ││  ││Page 1 ││  ││Page 1 ││             │  │ │
│  │  │  ││Page 2 ││  ││Page 2 ││  ││Page 2 ││  ││Page 2 ││             │  │ │
│  │  │  ││Page 3 ││  ││Page 3 ││  ││Page 3 ││  ││Page 3 ││             │  │ │
│  │  │  │└───────┘│  │└───────┘│  │└───────┘│  │└───────┘│             │  │ │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘             │  │ │
│  │  │                                                                     │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         CONTEXT FEATURES                                   │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Cookie   │ │  Storage  │ │  Proxy    │ │  Viewport │ │  User     │  │ │
│  │  │  Isolation│ │  Isolation│ │  Per-     │ │  Per-     │ │  Agent    │  │ │
│  │  │           │ │           │ │  Context  │ │  Context  │ │  Per-     │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Context Manager Implementation

```typescript
import { Browser, BrowserContext, Page } from 'playwright';

interface ContextConfig {
  // Proxy
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  
  // Viewport
  viewport?: {
    width: number;
    height: number;
  };
  
  // User agent
  userAgent?: string;
  
  // Locale
  locale?: string;
  
  // Timezone
  timezone?: string;
  
  // Geolocation
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  
  // Permissions
  permissions?: string[];
  
  // Extra HTTP headers
  extraHTTPHeaders?: Record<string, string>;
  
  // Service workers
  serviceWorkers?: 'block' | 'allow';
  
  // JavaScript enabled
  javaScriptEnabled?: boolean;
  
  // Bypass CSP
  bypassCSP?: boolean;
}

interface ContextInstance {
  // Context ID
  id: string;
  
  // Browser context
  context: BrowserContext;
  
  // Pages
  pages: Map<string, Page>;
  
  // Config
  config: ContextConfig;
  
  // Metadata
  metadata: {
    createdAt: number;
    lastUsed: number;
    requestCount: number;
    errorCount: number;
  };
  
  // Status
  status: 'active' | 'idle' | 'closing' | 'closed';
}

class ContextManager {
  private contexts: Map<string, ContextInstance>;
  private browser: Browser;
  private config: ContextConfig;
  
  constructor(browser: Browser, config: ContextConfig) {
    this.browser = browser;
    this.config = config;
    this.contexts = new Map();
  }
  
  // Create new context
  async create(config?: ContextConfig): Promise<ContextInstance> {
    const mergedConfig = { ...this.config, ...config };
    
    // Create browser context
    const context = await this.browser.newContext(mergedConfig);
    
    // Create context instance
    const instance: ContextInstance = {
      id: this.generateId(),
      context,
      pages: new Map(),
      config: mergedConfig,
      metadata: {
        createdAt: Date.now(),
        lastUsed: Date.now(),
        requestCount: 0,
        errorCount: 0,
      },
      status: 'active',
    };
    
    // Register context
    this.contexts.set(instance.id, instance);
    
    return instance;
  }
  
  // Get context by ID
  get(id: string): ContextInstance | null {
    return this.contexts.get(id) || null;
  }
  
  // Get or create context
  async getOrCreate(id: string, config?: ContextConfig): Promise<ContextInstance> {
    let context = this.get(id);
    
    if (!context) {
      context = await this.create(config);
    }
    
    return context;
  }
  
  // Create page in context
  async createPage(contextId: string): Promise<Page> {
    const context = this.get(contextId);
    
    if (!context) {
      throw new Error(`Context ${contextId} not found`);
    }
    
    // Create page
    const page = await context.context.newPage();
    
    // Generate page ID
    const pageId = this.generatePageId();
    
    // Register page
    context.pages.set(pageId, page);
    
    // Update metadata
    context.metadata.lastUsed = Date.now();
    context.metadata.requestCount++;
    
    return page;
  }
  
  // Get page from context
  getPage(contextId: string, pageId: string): Page | null {
    const context = this.get(contextId);
    
    if (!context) {
      return null;
    }
    
    return context.pages.get(pageId) || null;
  }
  
  // Close page
  async closePage(contextId: string, pageId: string): Promise<void> {
    const context = this.get(contextId);
    
    if (!context) {
      return;
    }
    
    const page = context.pages.get(pageId);
    
    if (page) {
      await page.close();
      context.pages.delete(pageId);
    }
  }
  
  // Close context
  async close(id: string): Promise<void> {
    const context = this.get(id);
    
    if (!context) {
      return;
    }
    
    // Update status
    context.status = 'closing';
    
    // Close all pages
    for (const [pageId, page] of context.pages) {
      try {
        await page.close();
      } catch (error) {
        // Ignore close errors
      }
    }
    
    // Close context
    try {
      await context.context.close();
    } catch (error) {
      // Ignore close errors
    }
    
    // Update status
    context.status = 'closed';
    
    // Remove from registry
    this.contexts.delete(id);
  }
  
  // Close all contexts
  async closeAll(): Promise<void> {
    for (const [id, context] of this.contexts) {
      await this.close(id);
    }
  }
  
  // Get active contexts
  getActive(): ContextInstance[] {
    return Array.from(this.contexts.values())
      .filter(c => c.status === 'active');
  }
  
  // Get idle contexts
  getIdle(): ContextInstance[] {
    return Array.from(this.contexts.values())
      .filter(c => c.status === 'idle');
  }
  
  // Get context stats
  getStats(): ContextStats {
    const contexts = Array.from(this.contexts.values());
    
    return {
      total: contexts.length,
      active: contexts.filter(c => c.status === 'active').length,
      idle: contexts.filter(c => c.status === 'idle').length,
      totalPages: contexts.reduce((sum, c) => sum + c.pages.size, 0),
      avgPagesPerContext: contexts.length > 0
        ? contexts.reduce((sum, c) => sum + c.pages.size, 0) / contexts.length
        : 0,
    };
  }
  
  // Generate unique ID
  private generateId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Generate page ID
  private generatePageId(): string {
    return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## Context Isolation

```typescript
interface ContextIsolation {
  // Cookie isolation
  cookieIsolation: boolean;
  
  // Storage isolation
  storageIsolation: boolean;
  
  // Proxy isolation
  proxyIsolation: boolean;
  
  // Viewport isolation
  viewportIsolation: boolean;
  
  // User agent isolation
  userAgentIsolation: boolean;
}

// Create isolated context
async function createIsolatedContext(
  browser: Browser,
  isolation: ContextIsolation
): Promise<BrowserContext> {
  const config: ContextConfig = {};
  
  // Add proxy if isolated
  if (isolation.proxyIsolation) {
    config.proxy = {
      server: getRandomProxy(),
    };
  }
  
  // Add viewport if isolated
  if (isolation.viewportIsolation) {
    config.viewport = getRandomViewport();
  }
  
  // Add user agent if isolated
  if (isolation.userAgentIsolation) {
    config.userAgent = getRandomUserAgent();
  }
  
  return await browser.newContext(config);
}
```

---

## Context Configuration

```yaml
contextManager:
  # Default context config
  defaults:
    viewport:
      width: 1920
      height: 1080
    locale: en-US
    timezone: America/New_York
    javaScriptEnabled: true
    bypassCSP: false
  
  # Isolation settings
  isolation:
    cookieIsolation: true
    storageIsolation: true
    proxyIsolation: true
    viewportIsolation: false
    userAgentIsolation: true
  
  # Lifecycle settings
  lifecycle:
    maxAge: 3600000 # 1 hour
    maxPages: 10
    idleTimeout: 300000 # 5 minutes
  
  # Resource limits
  limits:
    maxContexts: 50
    maxPagesPerContext: 10
    memoryLimit: 200 # MB per context
```

---

## Context Statistics

```typescript
interface ContextStats {
  // Counts
  total: number;
  active: number;
  idle: number;
  
  // Pages
  totalPages: number;
  avgPagesPerContext: number;
  
  // Performance
  avgCreateTime: number;
  avgCloseTime: number;
  
  // Resources
  totalMemoryUsage: number;
  avgMemoryPerContext: number;
}
```
