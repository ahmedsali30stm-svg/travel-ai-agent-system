import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'Metrics' });

interface MetricValue {
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

interface Counter {
  name: string;
  help: string;
  value: number;
  labels?: Record<string, string>;
}

interface Gauge {
  name: string;
  help: string;
  value: number;
  labels?: Record<string, string>;
}

interface Histogram {
  name: string;
  help: string;
  values: number[];
  buckets: number[];
}

export class MetricsCollector {
  private counters = new Map<string, Counter>();
  private gauges = new Map<string, Gauge>();
  private histograms = new Map<string, Histogram>();
  private metricHistory: MetricValue[] = [];
  private maxHistorySize = 10000;

  constructor() {
    // Initialize metrics collector
    logger.info('Metrics collector initialized');
  }

  // Counter methods
  incrementCounter(name: string, labels?: Record<string, string>, value = 1): void {
    const key = this.getMetricKey(name, labels);
    const counter = this.counters.get(key);
    
    if (counter) {
      counter.value += value;
    } else {
      this.counters.set(key, {
        name,
        help: '',
        value,
        labels,
      });
    }
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricKey(name, labels);
    const counter = this.counters.get(key);
    return counter ? counter.value : 0;
  }

  // Gauge methods
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, {
      name,
      help: '',
      value,
      labels,
    });
  }

  getGauge(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricKey(name, labels);
    const gauge = this.gauges.get(key);
    return gauge ? gauge.value : 0;
  }

  // Histogram methods
  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const histogram = this.histograms.get(key);
    
    if (histogram) {
      histogram.values.push(value);
    } else {
      this.histograms.set(key, {
        name,
        help: '',
        values: [value],
        buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      });
    }
  }

  getHistogram(name: string, labels?: Record<string, string>): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p99: number;
  } | null {
    const key = this.getMetricKey(name, labels);
    const histogram = this.histograms.get(key);
    
    if (!histogram || histogram.values.length === 0) {
      return null;
    }

    const sorted = [...histogram.values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      count,
      sum,
      avg: sum / count,
      min: sorted[0],
      max: sorted[count - 1],
      p50: this.getPercentile(sorted, 50),
      p90: this.getPercentile(sorted, 90),
      p99: this.getPercentile(sorted, 99),
    };
  }

  // Timing methods
  startTimer(name: string, labels?: Record<string, string>): () => number {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.observeHistogram(name, duration, labels);
      return duration;
    };
  }

  // Record metric
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    this.metricHistory.push({
      value,
      timestamp: new Date(),
      labels,
    });

    // Trim history if needed
    if (this.metricHistory.length > this.maxHistorySize) {
      this.metricHistory = this.metricHistory.slice(-this.maxHistorySize);
    }
  }

  // Get all metrics
  getAllMetrics(): {
    counters: Counter[];
    gauges: Gauge[];
    histograms: { name: string; stats: any }[];
  } {
    return {
      counters: Array.from(this.counters.values()),
      gauges: Array.from(this.gauges.values()),
      histograms: Array.from(this.histograms.entries()).map(([key, histogram]) => ({
        name: histogram.name,
        stats: this.getHistogram(histogram.name),
      })),
    };
  }

  // Export Prometheus format
  toPrometheusFormat(): string {
    const lines: string[] = [];
    
    // Counters
    for (const counter of this.counters.values()) {
      const labels = counter.labels
        ? `{${Object.entries(counter.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
        : '';
      lines.push(`# HELP ${counter.name} ${counter.help}`);
      lines.push(`# TYPE ${counter.name} counter`);
      lines.push(`${counter.name}${labels} ${counter.value}`);
    }
    
    // Gauges
    for (const gauge of this.gauges.values()) {
      const labels = gauge.labels
        ? `{${Object.entries(gauge.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
        : '';
      lines.push(`# HELP ${gauge.name} ${gauge.help}`);
      lines.push(`# TYPE ${gauge.name} gauge`);
      lines.push(`${gauge.name}${labels} ${gauge.value}`);
    }
    
    // Histograms
    for (const histogram of this.histograms.values()) {
      const stats = this.getHistogram(histogram.name);
      if (stats) {
        lines.push(`# HELP ${histogram.name} ${histogram.help}`);
        lines.push(`# TYPE ${histogram.name} histogram`);
        lines.push(`${histogram.name}_count ${stats.count}`);
        lines.push(`${histogram.name}_sum ${stats.sum}`);
      }
    }
    
    return lines.join('\n');
  }

  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private getPercentile(sorted: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.metricHistory = [];
    logger.info('Metrics reset');
  }
}

export const metrics = new MetricsCollector();
