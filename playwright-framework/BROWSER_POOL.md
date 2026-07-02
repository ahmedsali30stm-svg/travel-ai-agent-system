# Browser Pool

> Manages browser instances for parallel execution and resource optimization.

---

## Overview

The Browser Pool manages a pool of browser instances, providing efficient resource utilization, parallel execution, and automatic lifecycle management.

---

## Browser Pool Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         BROWSER POOL ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         POOL MANAGER                                       │ │
│  │                                                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  Instance   │  │  Lifecycle  │  │  Resource   │  │  Health     │     │ │
│  │  │  Registry   │  │  Manager    │  │  Monitor    │  │  Checker    │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         BROWSER INSTANCES                                  │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                                                                     │  │ │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│  │ │
│  │  │  │Browser 1│  │Browser 2│  │Browser 3│  │Browser 4│  │Browser 5││  │ │
│  │  │  │  ● Ready│  │  ● Ready│  │  ● Busy │  │  ● Ready│  │  ● Busy ││  │ │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘│  │ │
│  │  │                                                                     │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                            │ │
│  │  Status: 3 Ready | 2 Busy | 0 Idle | 0 Failed                           │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         ALLOCATION STRATEGIES                              │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Round    │ │  Least    │ │  Weighted │ │  Smart    │                │ │
│  │  │  Robin    │ │  Loaded   │ │  Fair     │ │  Assign   │                │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘                  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Browser Pool Implementation

```typescript
import { Browser, BrowserContext, Page } from 'playwright';

interface BrowserPoolConfig {
  // Pool size
  minSize: number;
  maxSize: number;
  
  // Browser settings
  browserType: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  args: string[];
  userAgent?: string;
  
  // Lifecycle settings
  maxAge: number; // Max age before recycle
  maxRequests: number; // Max requests before recycle
  idleTimeout: number; // Idle timeout before cleanup
  
  // Resource limits
  memoryLimit: number; // Max memory per browser (MB)
  cpuLimit: number; // Max CPU percentage
  
  // Health check
  healthCheckInterval: number;
  healthCheckTimeout: number;
}

interface BrowserInstance {
  // Instance ID
  id: string;
  
  // Browser reference
  browser: Browser;
  
  // Status
  status: 'ready' | 'busy' | 'idle' | 'failed' | 'recycling';
  
  // Metadata
  metadata: {
    createdAt: number;
    lastUsed: number;
    requestCount: number;
    errorCount: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  
  // Contexts
  contexts: BrowserContext[];
  
  // Metrics
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
  };
}

class BrowserPoolImpl {
  private instances: Map<string, BrowserInstance>;
  private config: BrowserPoolConfig;
  private readyQueue: string[];
  private busySet: Set<string>;
  
  constructor(config: BrowserPoolConfig) {
    this.config = config;
    this.instances = new Map();
    this.readyQueue = [];
    this.busySet = new Set();
    
    // Initialize pool
    this.initializePool();
    
    // Start health check
    this.startHealthCheck();
  }
  
  // Initialize pool with minimum instances
  private async initializePool(): Promise<void> {
    for (let i = 0; i < this.config.minSize; i++) {
      await this.createInstance();
    }
  }
  
  // Create new browser instance
  private async createInstance(): Promise<BrowserInstance> {
    const browser = await this.launchBrowser();
    const instance: BrowserInstance = {
      id: this.generateId(),
      browser,
      status: 'ready',
      metadata: {
        createdAt: Date.now(),
        lastUsed: Date.now(),
        requestCount: 0,
        errorCount: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      },
      contexts: [],
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
      },
    };
    
    this.instances.set(instance.id, instance);
    this.readyQueue.push(instance.id);
    
    return instance;
  }
  
  // Launch browser
  private async launchBrowser(): Promise<Browser> {
    const playwright = require('playwright');
    
    return await playwright[this.config.browserType].launch({
      headless: this.config.headless,
      args: this.config.args,
    });
  }
  
  // Acquire browser instance
  async acquire(): Promise<BrowserInstance> {
    // Check if we can create new instance
    if (this.readyQueue.length === 0 && this.instances.size < this.config.maxSize) {
      await this.createInstance();
    }
    
    // Wait for ready instance
    while (this.readyQueue.length === 0) {
      await this.waitForReady();
    }
    
    // Get instance from queue
    const instanceId = this.readyQueue.shift()!;
    const instance = this.instances.get(instanceId)!;
    
    // Update status
    instance.status = 'busy';
    instance.metadata.lastUsed = Date.now();
    this.busySet.add(instanceId);
    
    return instance;
  }
  
  // Release browser instance
  async release(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    
    if (!instance) {
      return;
    }
    
    // Check if should recycle
    if (this.shouldRecycle(instance)) {
      await this.recycleInstance(instanceId);
      return;
    }
    
    // Update status
    instance.status = 'ready';
    this.busySet.delete(instanceId);
    this.readyQueue.push(instanceId);
  }
  
  // Check if instance should be recycled
  private shouldRecycle(instance: BrowserInstance): boolean {
    // Check age
    if (Date.now() - instance.metadata.createdAt > this.config.maxAge) {
      return true;
    }
    
    // Check request count
    if (instance.metadata.requestCount >= this.config.maxRequests) {
      return true;
    }
    
    // Check memory usage
    if (instance.metadata.memoryUsage > this.config.memoryLimit) {
      return true;
    }
    
    return false;
  }
  
  // Recycle instance
  private async recycleInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    
    if (!instance) {
      return;
    }
    
    // Update status
    instance.status = 'recycling';
    this.busySet.delete(instanceId);
    
    // Close browser
    try {
      await instance.browser.close();
    } catch (error) {
      // Ignore close errors
    }
    
    // Remove from pool
    this.instances.delete(instanceId);
    
    // Create new instance
    await this.createInstance();
  }
  
  // Wait for ready instance
  private async waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.readyQueue.length > 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
  
  // Start health check
  private startHealthCheck(): void {
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }
  
  // Perform health check
  private async performHealthCheck(): Promise<void> {
    for (const [instanceId, instance] of this.instances) {
      try {
        // Check if browser is still alive
        const isAlive = instance.browser.isConnected();
        
        if (!isAlive) {
          await this.recycleInstance(instanceId);
        }
      } catch (error) {
        await this.recycleInstance(instanceId);
      }
    }
  }
  
  // Get pool stats
  getStats(): PoolStats {
    return {
      total: this.instances.size,
      ready: this.readyQueue.length,
      busy: this.busySet.size,
      idle: this.getIdleCount(),
      failed: this.getFailedCount(),
      memoryUsage: this.getTotalMemoryUsage(),
    };
  }
  
  // Generate unique ID
  private generateId(): string {
    return `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## Allocation Strategies

### 1. Round Robin

```typescript
class RoundRobinStrategy {
  private currentIndex = 0;
  
  acquire(instances: BrowserInstance[]): BrowserInstance {
    const readyInstances = instances.filter(i => i.status === 'ready');
    
    if (readyInstances.length === 0) {
      throw new Error('No ready instances available');
    }
    
    const instance = readyInstances[this.currentIndex % readyInstances.length];
    this.currentIndex = (this.currentIndex + 1) % readyInstances.length;
    
    return instance;
  }
}
```

### 2. Least Loaded

```typescript
class LeastLoadedStrategy {
  acquire(instances: BrowserInstance[]): BrowserInstance {
    const readyInstances = instances.filter(i => i.status === 'ready');
    
    if (readyInstances.length === 0) {
      throw new Error('No ready instances available');
    }
    
    // Sort by load (memory + cpu + request count)
    readyInstances.sort((a, b) => {
      const loadA = a.metadata.memoryUsage + a.metadata.cpuUsage + a.metadata.requestCount;
      const loadB = b.metadata.memoryUsage + b.metadata.cpuUsage + b.metadata.requestCount;
      return loadA - loadB;
    });
    
    return readyInstances[0];
  }
}
```

### 3. Weighted Fair

```typescript
class WeightedFairStrategy {
  private weights: Map<string, number> = new Map();
  
  acquire(instances: BrowserInstance[]): BrowserInstance {
    const readyInstances = instances.filter(i => i.status === 'ready');
    
    if (readyInstances.length === 0) {
      throw new Error('No ready instances available');
    }
    
    // Calculate weights based on success rate
    for (const instance of readyInstances) {
      const successRate = instance.metrics.successfulRequests / 
        Math.max(1, instance.metrics.totalRequests);
      this.weights.set(instance.id, successRate);
    }
    
    // Select based on weight
    const totalWeight = Array.from(this.weights.values())
      .reduce((sum, w) => sum + w, 0);
    
    let random = Math.random() * totalWeight;
    
    for (const instance of readyInstances) {
      const weight = this.weights.get(instance.id) || 0;
      random -= weight;
      
      if (random <= 0) {
        return instance;
      }
    }
    
    return readyInstances[0];
  }
}
```

### 4. Smart Assign

```typescript
class SmartAssignStrategy {
  acquire(
    instances: BrowserInstance[],
    task: Task
  ): BrowserInstance {
    const readyInstances = instances.filter(i => i.status === 'ready');
    
    if (readyInstances.length === 0) {
      throw new Error('No ready instances available');
    }
    
    // Score each instance
    const scored = readyInstances.map(instance => ({
      instance,
      score: this.calculateScore(instance, task),
    }));
    
    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0].instance;
  }
  
  private calculateScore(instance: BrowserInstance, task: Task): number {
    let score = 0;
    
    // Prefer fresh instances
    const age = Date.now() - instance.metadata.createdAt;
    score += Math.max(0, 100 - age / 1000);
    
    // Prefer instances with low error rate
    const errorRate = instance.metadata.errorCount / 
      Math.max(1, instance.metadata.requestCount);
    score += (1 - errorRate) * 50;
    
    // Prefer instances with low memory usage
    score += (1 - instance.metadata.memoryUsage / 100) * 30;
    
    // Match proxy if needed
    if (task.proxy && this.hasMatchingProxy(instance, task.proxy)) {
      score += 20;
    }
    
    return score;
  }
}
```

---

## Browser Pool Configuration

```yaml
browserPool:
  # Pool settings
  minSize: 3
  maxSize: 20
  
  # Browser settings
  browserType: chromium
  headless: true
  args:
    - --no-sandbox
    - --disable-setuid-sandbox
    - --disable-dev-shm-usage
    - --disable-accelerated-2d-canvas
    - --no-first-run
    - --no-zygote
    - --disable-gpu
  
  # Lifecycle settings
  maxAge: 3600000 # 1 hour
  maxRequests: 1000
  idleTimeout: 300000 # 5 minutes
  
  # Resource limits
  memoryLimit: 512 # MB
  cpuLimit: 80 # percentage
  
  # Health check
  healthCheckInterval: 30000 # 30 seconds
  healthCheckTimeout: 5000 # 5 seconds
  
  # Allocation strategy
  strategy: smart
  
  # Recycling
  recycling:
    enabled: true
    strategy: age-based
    maxAge: 3600000
    maxRequests: 1000
```

---

## Pool Statistics

```typescript
interface PoolStats {
  // Instance counts
  total: number;
  ready: number;
  busy: number;
  idle: number;
  failed: number;
  
  // Resource usage
  memoryUsage: number;
  cpuUsage: number;
  
  // Performance
  avgAcquireTime: number;
  avgReleaseTime: number;
  
  // Queue
  queueLength: number;
  avgWaitTime: number;
}
```
