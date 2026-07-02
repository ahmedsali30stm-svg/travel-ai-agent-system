# Grafana Dashboards

> Grafana dashboard configurations for the Travel AI Agent Platform.

---

## Overview

Grafana dashboards provide visualization for metrics collected by Prometheus.

---

## Dashboard: Travel AI Overview

```json
{
  "dashboard": {
    "id": null,
    "title": "Travel AI Platform Overview",
    "tags": ["travel-ai", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method)",
            "legendFormat": "{{method}}"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 }
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))",
            "legendFormat": "Error Rate"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 }
      },
      {
        "id": 3,
        "title": "Latency Percentiles",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p99"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 }
      },
      {
        "id": 4,
        "title": "Active Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "pg_stat_activity_count",
            "legendFormat": "Connections"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

---

## Dashboard: Scraper Metrics

```json
{
  "dashboard": {
    "id": null,
    "title": "Scraper Metrics",
    "tags": ["travel-ai", "scraper"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(scraper_requests_total[5m])",
            "legendFormat": "Requests/s"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 }
      },
      {
        "id": 2,
        "title": "Success Rate",
        "type": "gauge",
        "targets": [
          {
            "expr": "rate(scraper_successes_total[5m]) / rate(scraper_requests_total[5m]) * 100",
            "legendFormat": "Success %"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 }
      },
      {
        "id": 3,
        "title": "Average Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(scraper_duration_seconds_sum[5m]) / rate(scraper_duration_seconds_count[5m])",
            "legendFormat": "Duration (s)"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 }
      },
      {
        "id": 4,
        "title": "Browser Pool",
        "type": "stat",
        "targets": [
          {
            "expr": "scraper_browser_pool_available",
            "legendFormat": "Available"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

---

## Dashboard: Database Metrics

```json
{
  "dashboard": {
    "id": null,
    "title": "Database Metrics",
    "tags": ["travel-ai", "database"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Connection Count",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_activity_count",
            "legendFormat": "Connections"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 }
      },
      {
        "id": 2,
        "title": "Query Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(pg_stat_database_xact_commit[5m])",
            "legendFormat": "Queries/s"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 }
      },
      {
        "id": 3,
        "title": "Cache Hit Ratio",
        "type": "gauge",
        "targets": [
          {
            "expr": "pg_stat_database_blks_hit / pg_stat_database_blks_read * 100",
            "legendFormat": "Hit %"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 }
      },
      {
        "id": 4,
        "title": "Replication Lag",
        "type": "stat",
        "targets": [
          {
            "expr": "pg_replication_lag",
            "legendFormat": "Lag (s)"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

---

## Dashboard: Redis Metrics

```json
{
  "dashboard": {
    "id": null,
    "title": "Redis Metrics",
    "tags": ["travel-ai", "redis"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Memory Usage",
        "type": "gauge",
        "targets": [
          {
            "expr": "redis_memory_used_bytes / redis_memory_max_bytes * 100",
            "legendFormat": "Memory %"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 }
      },
      {
        "id": 2,
        "title": "Hit Rate",
        "type": "gauge",
        "targets": [
          {
            "expr": "redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) * 100",
            "legendFormat": "Hit %"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 }
      },
      {
        "id": 3,
        "title": "Command Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(redis_commands_processed_total[5m])",
            "legendFormat": "Commands/s"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 }
      },
      {
        "id": 4,
        "title": "Connected Clients",
        "type": "stat",
        "targets": [
          {
            "expr": "redis_connected_clients",
            "legendFormat": "Clients"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

---

## Dashboard Imports

```bash
# Import dashboards to Grafana
curl -X POST http://localhost:3001/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d @dashboards/overview.json

curl -X POST http://localhost:3001/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d @dashboards/scraper.json

curl -X POST http://localhost:3001/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d @dashboards/database.json

curl -X POST http://localhost:3001/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d @dashboards/redis.json
```
