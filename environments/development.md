# Development Environment Configuration

> Configuration for local development environment.

---

## Overview

Development environment is designed for local development and testing with minimal resource requirements.

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
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/travel_ai
      - LOG_LEVEL=debug
    volumes:
      - ./src:/app/src
      - ./logs:/app/logs
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
    command: redis-server --appendonly yes
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
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
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
      - GF_SECURITY_ADMIN_PASSWORD=admin
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
NODE_ENV=development
APP_PORT=3000
APP_HOST=localhost

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/travel_ai
DATABASE_POOL_SIZE=5
DATABASE_TIMEOUT=30000

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=travel_ai_dev:

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty
LOG_DIR=./logs

# API Keys (test/sandbox)
HOTELBEDS_API_KEY=test_key
HOTELBEDS_API_SECRET=test_secret
BOOKING_API_KEY=test_key
VIATOR_API_KEY=test_key
AMADEUS_API_KEY=test_key
AMADEUS_API_SECRET=test_secret

# Services
WEATHER_API_KEY=test_key
GOOGLE_MAPS_API_KEY=test_key
STRIPE_SECRET_KEY=sk_test_xxx
SENDGRID_API_KEY=SG.test_xxx

# Scraper
SCRAPER_POOL_SIZE=3
SCRAPER_TIMEOUT=30000
SCRAPER_HEADLESS=true

# Rate Limiting
RATE_LIMIT_RPS=10
RATE_LIMIT_CONCURRENT=5

# Cache
CACHE_TTL=300
CACHE_ENABLED=true

# Security
JWT_SECRET=dev_secret_key
JWT_EXPIRY=24h
CORS_ORIGIN=http://localhost:3000
```

---

## API Configuration

```yaml
api:
  port: 3000
  host: localhost
  
  rateLimit:
    windowMs: 60000
    max: 100
    
  cors:
    origin: http://localhost:3000
    methods: [GET, POST, PUT, DELETE]
    credentials: true
    
  logging:
    level: debug
    format: pretty
```

---

## Database Configuration

```yaml
database:
  url: postgresql://postgres:postgres@localhost:5432/travel_ai
  pool:
    min: 2
    max: 10
  timeout: 30000
  ssl: false
  logging: true
```

---

## Redis Configuration

```yaml
redis:
  url: redis://localhost:6379
  prefix: travel_ai_dev:
  ttl: 300
  maxRetries: 3
  retryDelayOnFailover: 300
```

---

## Scraper Configuration

```yaml
scraper:
  poolSize: 3
  timeout: 30000
  headless: true
  
  browserPool:
    min: 1
    max: 5
    maxAge: 3600000
    maxRequests: 500
    
  proxy:
    enabled: false
    strategy: round-robin
    
  rateLimiter:
    requestsPerSecond: 5
    maxConcurrent: 3
    
  session:
    storagePath: ./sessions
    encrypt: false
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
      
  alerts:
    enabled: false
```

---

## Development Tools

```yaml
devTools:
  hotReload: true
  sourceMaps: true
  debugger: true
  profiler: true
  
  testing:
    framework: jest
    coverage: true
    threshold: 80
    
  linting:
    eslint: true
    prettier: true
    typecheck: true
```
