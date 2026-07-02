# Metrics Collector

> Performance metrics collection and monitoring for web scraping operations.

---

## Overview

The Metrics Collector tracks performance metrics, generates reports, and provides monitoring capabilities.

---

## Metrics Collector Implementation

```typescript
import { EventEmitter } from 'events';

interface MetricsConfig {
  // Collection settings
  collectInterval: number;
  retentionPeriod: number;
  
  // Metrics
  metrics: MetricDefinition[];
  
  // Export
  exportFormat: 'json' | 'csv' | 'prometheus';
  exportPath: string;
  
  // Alerts
  alerts: AlertConfig[];
}

interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels: string[];
}

interface AlertConfig {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  duration: number;
  action: 'log' | 'notify' | 'webhook';
}

interface MetricValue {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

class MetricsCollector extends EventEmitter {
  private config: MetricsConfig;
  private metrics: Map<string, MetricValue[]>;
  private counters: Map<string, number>;
  private gauges: Map<string, number>;
  private histograms: Map<string, number[]>;
  private collectTimer: NodeJS.Timeout | null = null;
  
  constructor(config: MetricsConfig) {
    super();
    this.config = config;
    this.metrics = new Map();
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
  }
  
  // Start collection
  start(): void {
    this.collectTimer = setInterval(() => {
      this.collect();
    }, this.config.collectInterval);
  }
  
  // Stop collection
  stop(): void {
    if (this.collectTimer) {
      clearInterval(this.collectTimer);
      this.collectTimer = null;
    }
  }
  
  // Increment counter
  incrementCounter(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    const key = this.getMetricKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }
  
  // Set gauge
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, value);
  }
  
  // Add to histogram
  addToHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.getMetricKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }
  
  // Record timing
  recordTiming(name: string, duration: number, labels: Record<string, string> = {}): void {
    this.addToHistogram(name, duration, labels);
  }
  
  // Get metric key
  private getMetricKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    
    return `${name}{${labelStr}}`;
  }
  
  // Collect metrics
  private collect(): void {
    const timestamp = Date.now();
    
    // Collect counters
    for (const [key, value] of this.counters) {
      this.storeMetric({
        name: key,
        value,
        labels: {},
        timestamp,
      });
    }
    
    // Collect gauges
    for (const [key, value] of this.gauges) {
      this.storeMetric({
        name: key,
        value,
        labels: {},
        timestamp,
      });
    }
    
    // Collect histograms
    for (const [key, values] of this.histograms) {
      const stats = this.calculateHistogramStats(values);
      this.storeMetric({
        name: key,
        value: stats.p95,
        labels: { p50: String(stats.p50), p95: String(stats.p95), p99: String(stats.p99) },
        timestamp,
      });
    }
    
    // Check alerts
    this.checkAlerts();
    
    // Emit collection event
    this.emit('collected', this.getMetrics());
  }
  
  // Calculate histogram statistics
  private calculateHistogramStats(values: number[]): HistogramStats {
    const sorted = [...values].sort((a, b) => a - b);
    const length = sorted.length;
    
    return {
      count: length,
      sum: sorted.reduce((a, b) => a + b, 0),
      min: sorted[0],
      max: sorted[length - 1],
      avg: sorted.reduce((a, b) => a + b, 0) / length,
      p50: sorted[Math.floor(length * 0.5)],
      p95: sorted[Math.floor(length * 0.95)],
      p99: sorted[Math.floor(length * 0.99)],
    };
  }
  
  // Store metric
  private storeMetric(metric: MetricValue): void {
    const values = this.metrics.get(metric.name) || [];
    values.push(metric);
    
    // Apply retention
    const cutoff = Date.now() - this.config.retentionPeriod;
    const filtered = values.filter(v => v.timestamp > cutoff);
    
    this.metrics.set(metric.name, filtered);
  }
  
  // Check alerts
  private checkAlerts(): void {
    for (const alert of this.config.alerts) {
      const values = this.metrics.get(alert.metric);
      if (!values || values.length === 0) continue;
      
      const latest = values[values.length - 1];
      const triggered = this.evaluateAlert(latest.value, alert);
      
      if (triggered) {
        this.emit('alert', {
          metric: alert.metric,
          value: latest.value,
          threshold: alert.threshold,
          operator: alert.operator,
        });
      }
    }
  }
  
  // Evaluate alert condition
  private evaluateAlert(value: number, alert: AlertConfig): boolean {
    switch (alert.operator) {
      case 'gt': return value > alert.threshold;
      case 'lt': return value < alert.threshold;
      case 'eq': return value === alert.threshold;
      case 'gte': return value >= alert.threshold;
      case 'lte': return value <= alert.threshold;
      default: return false;
    }
  }
  
  // Get all metrics
  getMetrics(): MetricValue[] {
    const result: MetricValue[] = [];
    for (const values of this.metrics.values()) {
      result.push(...values);
    }
    return result;
  }
  
  // Get metric by name
  getMetric(name: string): MetricValue[] {
    return this.metrics.get(name) || [];
  }
  
  // Get stats summary
  getStatsSummary(): MetricsSummary {
    return {
      totalMetrics: this.metrics.size,
      totalValues: this.getMetrics().length,
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
    };
  }
  
  // Export metrics
  async export(format: 'json' | 'csv' | 'prometheus'): Promise<string> {
    const metrics = this.getMetrics();
    
    switch (format) {
      case 'json':
        return JSON.stringify(metrics, null, 2);
      case 'csv':
        return this.toCSV(metrics);
      case 'prometheus':
        return this.toPrometheus(metrics);
      default:
        return JSON.stringify(metrics, null, 2);
    }
  }
  
  // Convert to CSV
  private toCSV(metrics: MetricValue[]): string {
    if (metrics.length === 0) return '';
    
    const headers = ['name', 'value', 'timestamp', 'labels'];
    const rows = metrics.map(m => [
      m.name,
      m.value,
      m.timestamp,
      JSON.stringify(m.labels),
    ].join(','));
    
    return [headers.join(','), ...rows].join('\n');
  }
  
  // Convert to Prometheus format
  private toPrometheus(metrics: MetricValue[]): string {
    const lines: string[] = [];
    
    for (const metric of metrics) {
      const labels = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      
      const labelStr = labels ? `{${labels}}` : '';
      lines.push(`${metric.name}${labelStr} ${metric.value} ${metric.timestamp}`);
    }
    
    return lines.join('\n');
  }
}

interface HistogramStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

interface MetricsSummary {
  totalMetrics: number;
  totalValues: number;
  counters: Record<string, number>;
  gauges: Record<string, number>;
}
```

---

## Pre-defined Metrics

```typescript
// Scraping metrics
const scrapingMetrics = {
  requests: { name: 'scraping_requests_total', type: 'counter', description: 'Total requests made' },
  successes: { name: 'scraping_successes_total', type: 'counter', description: 'Successful requests' },
  failures: { name: 'scraping_failures_total', type: 'counter', description: 'Failed requests' },
  duration: { name: 'scraping_duration_ms', type: 'histogram', description: 'Request duration' },
  dataSize: { name: 'scraping_data_size_bytes', type: 'histogram', description: 'Response data size' },
};

// Browser metrics
const browserMetrics = {
  poolSize: { name: 'browser_pool_size', type: 'gauge', description: 'Browser pool size' },
  activeContexts: { name: 'browser_active_contexts', type: 'gauge', description: 'Active browser contexts' },
  memoryUsage: { name: 'browser_memory_usage_bytes', type: 'gauge', description: 'Browser memory usage' },
  cpuUsage: { name: 'browser_cpu_usage_percent', type: 'gauge', description: 'Browser CPU usage' },
};

// Proxy metrics
const proxyMetrics = {
  activeProxies: { name: 'proxy_active_count', type: 'gauge', description: 'Active proxies' },
  proxyFailures: { name: 'proxy_failures_total', type: 'counter', description: 'Proxy failures' },
  proxyLatency: { name: 'proxy_latency_ms', type: 'histogram', description: 'Proxy latency' },
};
```

---

## Metrics Configuration

```yaml
metrics:
  # Collection settings
  collectInterval: 10000
  retentionPeriod: 86400000
  
  # Metrics definitions
  metrics:
    - name: scraping_requests_total
      type: counter
      description: Total requests made
      labels: [site, status]
    
    - name: scraping_duration_ms
      type: histogram
      description: Request duration
      labels: [site]
    
    - name: browser_pool_size
      type: gauge
      description: Browser pool size
      labels: []
  
  # Export settings
  exportFormat: json
  exportPath: ./metrics
  
  # Alerts
  alerts:
    - metric: scraping_failures_total
      threshold: 10
      operator: gt
      duration: 60000
      action: log
```
