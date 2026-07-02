# Proxy Rotator

> Proxy rotation and management for anti-detection and rate limiting bypass.

---

## Overview

The Proxy Rotator manages proxy providers, performs health checks, rotates proxies, and handles proxy authentication for web scraping operations.

---

## Proxy Rotator Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PROXY ROTATOR ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         PROXY POOL                                          │ │
│  │                                                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  Provider   │  │  Health     │  │  Rotation   │  │  Blacklist  │     │ │
│  │  │  Manager    │  │  Checker    │  │  Engine     │  │  Manager    │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         PROXY TYPES                                         │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  HTTP     │ │  HTTPS    │ │  SOCKS5   │ │  Residential│ │  Datacenter│ │ │
│  │  │  Proxy    │ │  Proxy    │ │  Proxy    │ │  Proxy    │ │  Proxy    │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         ROTATION STRATEGIES                                │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Round    │ │  Random   │ │  Least    │ │  Session  │ │  Smart    │  │ │
│  │  │  Robin    │ │           │ │  Used     │ │  Sticky   │ │  Rotate   │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Proxy Rotator Implementation

```typescript
interface ProxyConfig {
  // Proxy server
  server: string;
  port: number;
  
  // Protocol
  protocol: 'http' | 'https' | 'socks5';
  
  // Authentication
  username?: string;
  password?: string;
  
  // Provider
  provider: string;
  
  // Metadata
  metadata: {
    country: string;
    city?: string;
    isp?: string;
    type: 'residential' | 'datacenter' | 'mobile';
  };
}

interface ProxyInstance {
  // Proxy config
  config: ProxyConfig;
  
  // Status
  status: 'healthy' | 'degraded' | 'unhealthy' | 'blacklisted';
  
  // Metrics
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    lastUsed: number;
    lastChecked: number;
  };
  
  // Health
  health: {
    score: number;
    responseTime: number;
    uptime: number;
  };
}

class ProxyRotator {
  private proxies: Map<string, ProxyInstance>;
  private blacklist: Set<string>;
  private rotationIndex: number;
  private config: RotatorConfig;
  
  constructor(config: RotatorConfig) {
    this.config = config;
    this.proxies = new Map();
    this.blacklist = new Set();
    this.rotationIndex = 0;
    
    // Load proxies
    this.loadProxies();
    
    // Start health check
    this.startHealthCheck();
  }
  
  // Load proxies from config
  private async loadProxies(): Promise<void> {
    for (const proxy of this.config.proxies) {
      const instance: ProxyInstance = {
        config: proxy,
        status: 'healthy',
        metrics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          avgResponseTime: 0,
          lastUsed: 0,
          lastChecked: 0,
        },
        health: {
          score: 100,
          responseTime: 0,
          uptime: 100,
        },
      };
      
      this.proxies.set(this.generateKey(proxy), instance);
    }
  }
  
  // Get proxy by strategy
  async getProxy(strategy?: RotationStrategy): Promise<ProxyConfig> {
    const availableProxies = this.getAvailableProxies();
    
    if (availableProxies.length === 0) {
      throw new Error('No available proxies');
    }
    
    let selected: ProxyInstance;
    
    switch (strategy || this.config.strategy) {
      case 'round-robin':
        selected = this.roundRobin(availableProxies);
        break;
      case 'random':
        selected = this.random(availableProxies);
        break;
      case 'least-used':
        selected = this.leastUsed(availableProxies);
        break;
      case 'session-sticky':
        selected = this.sessionSticky(availableProxies);
        break;
      case 'smart':
        selected = this.smart(availableProxies);
        break;
      default:
        selected = this.roundRobin(availableProxies);
    }
    
    // Update metrics
    selected.metrics.lastUsed = Date.now();
    selected.metrics.totalRequests++;
    
    return selected.config;
  }
  
  // Get available proxies
  private getAvailableProxies(): ProxyInstance[] {
    return Array.from(this.proxies.values()).filter(
      p => p.status !== 'blacklisted' && !this.blacklist.has(this.generateKey(p.config))
    );
  }
  
  // Round robin rotation
  private roundRobin(proxies: ProxyInstance[]): ProxyInstance {
    const proxy = proxies[this.rotationIndex % proxies.length];
    this.rotationIndex = (this.rotationIndex + 1) % proxies.length;
    return proxy;
  }
  
  // Random rotation
  private random(proxies: ProxyInstance[]): ProxyInstance {
    const index = Math.floor(Math.random() * proxies.length);
    return proxies[index];
  }
  
  // Least used rotation
  private leastUsed(proxies: ProxyInstance[]): ProxyInstance {
    return proxies.reduce((least, current) => {
      if (current.metrics.totalRequests < least.metrics.totalRequests) {
        return current;
      }
      return least;
    });
  }
  
  // Session sticky rotation
  private sessionSticky(proxies: ProxyInstance[]): ProxyInstance {
    // Get proxy with best health score
    return proxies.reduce((best, current) => {
      if (current.health.score > best.health.score) {
        return current;
      }
      return best;
    });
  }
  
  // Smart rotation
  private smart(proxies: ProxyInstance[]): ProxyInstance {
    // Score each proxy
    const scored = proxies.map(proxy => ({
      proxy,
      score: this.calculateScore(proxy),
    }));
    
    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0].proxy;
  }
  
  // Calculate proxy score
  private calculateScore(proxy: ProxyInstance): number {
    let score = 0;
    
    // Health score (0-40)
    score += proxy.health.score * 0.4;
    
    // Response time (0-30)
    const responseTimeScore = Math.max(0, 100 - proxy.health.responseTime / 10);
    score += responseTimeScore * 0.3;
    
    // Success rate (0-20)
    const successRate = proxy.metrics.successfulRequests / 
      Math.max(1, proxy.metrics.totalRequests);
    score += successRate * 20;
    
    // Recency (0-10)
    const recency = Math.max(0, 100 - (Date.now() - proxy.metrics.lastUsed) / 1000);
    score += recency * 0.1;
    
    return score;
  }
  
  // Report success
  reportSuccess(proxyConfig: ProxyConfig, responseTime: number): void {
    const key = this.generateKey(proxyConfig);
    const proxy = this.proxies.get(key);
    
    if (proxy) {
      proxy.metrics.successfulRequests++;
      proxy.metrics.avgResponseTime = 
        (proxy.metrics.avgResponseTime * (proxy.metrics.totalRequests - 1) + responseTime) / 
        proxy.metrics.totalRequests;
      
      // Update health
      proxy.health.responseTime = responseTime;
      proxy.health.score = Math.min(100, proxy.health.score + 1);
    }
  }
  
  // Report failure
  reportFailure(proxyConfig: ProxyConfig, error: Error): void {
    const key = this.generateKey(proxyConfig);
    const proxy = this.proxies.get(key);
    
    if (proxy) {
      proxy.metrics.failedRequests++;
      
      // Update health
      proxy.health.score = Math.max(0, proxy.health.score - 10);
      
      // Blacklist if too many failures
      if (proxy.health.score <= 0) {
        proxy.status = 'blacklisted';
        this.blacklist.add(key);
      }
    }
  }
  
  // Health check
  private async startHealthCheck(): Promise<void> {
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }
  
  // Perform health check
  private async performHealthCheck(): Promise<void> {
    for (const [key, proxy] of this.proxies) {
      try {
        const responseTime = await this.checkProxyHealth(proxy.config);
        
        proxy.health.responseTime = responseTime;
        proxy.health.score = Math.min(100, proxy.health.score + 1);
        proxy.metrics.lastChecked = Date.now();
        
        if (responseTime < 1000) {
          proxy.status = 'healthy';
        } else if (responseTime < 3000) {
          proxy.status = 'degraded';
        } else {
          proxy.status = 'unhealthy';
        }
      } catch (error) {
        proxy.health.score = Math.max(0, proxy.health.score - 5);
        proxy.status = 'unhealthy';
      }
    }
  }
  
  // Check proxy health
  private async checkProxyHealth(proxy: ProxyConfig): Promise<number> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('https://httpbin.org/ip', {
        proxy: {
          host: proxy.server,
          port: proxy.port,
          protocol: proxy.protocol,
        },
        timeout: 5000,
      });
      
      if (response.ok) {
        return Date.now() - startTime;
      }
      
      throw new Error('Health check failed');
    } catch (error) {
      throw error;
    }
  }
  
  // Get proxy stats
  getStats(): ProxyStats {
    const proxies = Array.from(this.proxies.values());
    
    return {
      total: proxies.length,
      healthy: proxies.filter(p => p.status === 'healthy').length,
      degraded: proxies.filter(p => p.status === 'degraded').length,
      unhealthy: proxies.filter(p => p.status === 'unhealthy').length,
      blacklisted: proxies.filter(p => p.status === 'blacklisted').length,
      avgResponseTime: this.calculateAvgResponseTime(proxies),
      avgSuccessRate: this.calculateAvgSuccessRate(proxies),
    };
  }
  
  // Calculate average response time
  private calculateAvgResponseTime(proxies: ProxyInstance[]): number {
    const total = proxies.reduce((sum, p) => sum + p.health.responseTime, 0);
    return total / proxies.length;
  }
  
  // Calculate average success rate
  private calculateAvgSuccessRate(proxies: ProxyInstance[]): number {
    const total = proxies.reduce((sum, p) => {
      const successRate = p.metrics.successfulRequests / 
        Math.max(1, p.metrics.totalRequests);
      return sum + successRate;
    }, 0);
    return total / proxies.length;
  }
  
  // Generate proxy key
  private generateKey(proxy: ProxyConfig): string {
    return `${proxy.protocol}://${proxy.server}:${proxy.port}`;
  }
}
```

---

## Rotation Strategies

### 1. Round Robin
Cycles through proxies in order.

### 2. Random
Selects a random proxy from the pool.

### 3. Least Used
Selects the proxy with the fewest requests.

### 4. Session Sticky
Sticks to the same proxy for a session.

### 5. Smart
Selects based on health, response time, and success rate.

---

## Proxy Configuration

```yaml
proxyRotator:
  # Strategy
  strategy: smart
  
  # Health check
  healthCheck:
    enabled: true
    interval: 60000 # 1 minute
    timeout: 5000
  
  # Blacklist
  blacklist:
    enabled: true
    failureThreshold: 5
    cooldown: 300000 # 5 minutes
  
  # Providers
  providers:
    - name: provider1
      type: residential
      proxies:
        - server: proxy1.example.com
          port: 8080
          protocol: http
        - server: proxy2.example.com
          port: 8080
          protocol: http
    
    - name: provider2
      type: datacenter
      proxies:
        - server: proxy3.example.com
          port: 1080
          protocol: socks5
```

---

## Proxy Statistics

```typescript
interface ProxyStats {
  // Counts
  total: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
  blacklisted: number;
  
  // Performance
  avgResponseTime: number;
  avgSuccessRate: number;
  
  // Usage
  totalRequests: number;
  requestsPerProxy: number;
}
```
