# Staging Environment Configuration

> Configuration for staging environment (pre-production testing).

---

## Overview

Staging environment mirrors production with reduced resources for pre-production validation.

---

## Docker Compose

```yaml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=staging
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/travel_ai
      - LOG_LEVEL=info
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
    depends_on:
      - redis
      - postgres
    networks:
      - travel-ai-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    networks:
      - travel-ai-network

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=travel_ai
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
    networks:
      - travel-ai-network

  # Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - api-gateway
    networks:
      - travel-ai-network

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - travel-ai-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - travel-ai-network

volumes:
  redis-data:
  postgres-data:
  grafana-data:

networks:
  travel-ai-network:
    driver: bridge
```

---

## Environment Variables

```bash
# Application
NODE_ENV=staging
APP_PORT=3000
APP_HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/travel_ai
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000
DATABASE_SSL=false

# Redis
REDIS_URL=redis://redis:6379
REDIS_PREFIX=travel_ai_staging:
REDIS_MAX_MEMORY=512mb

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_DIR=/var/log/travel-ai

# API Keys (sandbox)
HOTELBEDS_API_KEY=${HOTELBEDS_API_KEY}
HOTELBEDS_API_SECRET=${HOTELBEDS_API_SECRET}
BOOKING_API_KEY=${BOOKING_API_KEY}
VIATOR_API_KEY=${VIATOR_API_KEY}
AMADEUS_API_KEY=${AMADEUS_API_KEY}
AMADEUS_API_SECRET=${AMADEUS_API_SECRET}

# Services
WEATHER_API_KEY=${WEATHER_API_KEY}
GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
STRIPE_SECRET_KEY=sk_test_xxx
SENDGRID_API_KEY=SG.test_xxx

# Scraper
SCRAPER_POOL_SIZE=10
SCRAPER_TIMEOUT=30000
SCRAPER_HEADLESS=true

# Rate Limiting
RATE_LIMIT_RPS=50
RATE_LIMIT_CONCURRENT=20

# Cache
CACHE_TTL=300
CACHE_ENABLED=true

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY=24h
CORS_ORIGIN=https://staging.travel-ai.com
ENCRYPTION_KEY=${ENCRYPTION_KEY}
```

---

## Nginx Configuration

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        least_conn;
        server api-gateway:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name staging.travel-ai.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name staging.travel-ai.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            proxy_pass http://api/health;
        }

        location /metrics {
            proxy_pass http://api/metrics;
        }
    }
}
```

---

## API Configuration

```yaml
api:
  port: 3000
  host: 0.0.0.0
  
  rateLimit:
    windowMs: 60000
    max: 500
    
  cors:
    origin: https://staging.travel-ai.com
    methods: [GET, POST, PUT, DELETE]
    credentials: true
    
  logging:
    level: info
    format: json
```

---

## Database Configuration

```yaml
database:
  url: postgresql://postgres:${DB_PASSWORD}@postgres:5432/travel_ai
  pool:
    min: 5
    max: 20
  timeout: 30000
  ssl: false
  logging: false
  migrations:
    auto: true
```

---

## Redis Configuration

```yaml
redis:
  url: redis://redis:6379
  prefix: travel_ai_staging:
  ttl: 300
  maxRetries: 3
  retryDelayOnFailover: 300
  maxMemory: 512mb
  evictionPolicy: allkeys-lru
```

---

## Scraper Configuration

```yaml
scraper:
  poolSize: 10
  timeout: 30000
  headless: true
  
  browserPool:
    min: 3
    max: 15
    maxAge: 3600000
    maxRequests: 1000
    
  proxy:
    enabled: true
    strategy: smart
    healthCheckInterval: 30000
    
  rateLimiter:
    requestsPerSecond: 20
    maxConcurrent: 10
    
  session:
    storagePath: /var/lib/travel-ai/sessions
    encrypt: true
    maxAge: 86400000
```

---

## Monitoring Configuration

```yaml
monitoring:
  prometheus:
    enabled: true
    port: 9090
    scrapeInterval: 15s
    
  grafana:
    enabled: true
    port: 3001
    dashboards:
      - travel-ai-overview
      - scraper-metrics
      - api-metrics
      - database-metrics
      
  alerts:
    enabled: true
    channels:
      - type: slack
        webhook: ${SLACK_WEBHOOK}
      - type: email
        recipients:
          - ops@travel-ai.com
```

---

## Backup Configuration

```yaml
backup:
  database:
    enabled: true
    schedule: "0 2 * * *" # Daily at 2 AM
    retention: 7
    s3Bucket: travel-ai-staging-backups
    
  redis:
    enabled: true
    schedule: "0 3 * * *" # Daily at 3 AM
    retention: 3
```
