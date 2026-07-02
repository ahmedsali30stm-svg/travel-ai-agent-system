# Production Environment Configuration

> Configuration for production environment with high availability and security.

---

## Overview

Production environment is designed for high availability, scalability, and security with redundant components.

---

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: travel-ai-api
  namespace: production
  labels:
    app: travel-ai
    component: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: travel-ai
      component: api
  template:
    metadata:
      labels:
        app: travel-ai
        component: api
    spec:
      containers:
        - name: api
          image: travel-ai/api:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: travel-ai-secrets
                  key: redis-url
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: travel-ai-secrets
                  key: database-url
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - travel-ai
                topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: travel-ai-api
  namespace: production
spec:
  selector:
    app: travel-ai
    component: api
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: travel-ai-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: travel-ai-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## Environment Variables

```bash
# Application
NODE_ENV=production
APP_PORT=3000
APP_HOST=0.0.0.0

# Database (from Secrets)
DATABASE_URL=${DATABASE_URL}
DATABASE_POOL_SIZE=50
DATABASE_TIMEOUT=30000
DATABASE_SSL=true

# Redis (from Secrets)
REDIS_URL=${REDIS_URL}
REDIS_PREFIX=travel_ai_prod:
REDIS_MAX_MEMORY=4gb

# Logging
LOG_LEVEL=warn
LOG_FORMAT=json
LOG_DIR=/var/log/travel-ai

# API Keys (from Secrets)
HOTELBEDS_API_KEY=${HOTELBEDS_API_KEY}
HOTELBEDS_API_SECRET=${HOTELBEDS_API_SECRET}
BOOKING_API_KEY=${BOOKING_API_KEY}
VIATOR_API_KEY=${VIATOR_API_KEY}
AMADEUS_API_KEY=${AMADEUS_API_KEY}
AMADEUS_API_SECRET=${AMADEUS_API_SECRET}

# Services (from Secrets)
WEATHER_API_KEY=${WEATHER_API_KEY}
GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
SENDGRID_API_KEY=${SENDGRID_API_KEY}

# Scraper
SCRAPER_POOL_SIZE=50
SCRAPER_TIMEOUT=30000
SCRAPER_HEADLESS=true

# Rate Limiting
RATE_LIMIT_RPS=1000
RATE_LIMIT_CONCURRENT=100

# Cache
CACHE_TTL=300
CACHE_ENABLED=true

# Security (from Secrets)
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY=24h
CORS_ORIGIN=https://travel-ai.com
ENCRYPTION_KEY=${ENCRYPTION_KEY}
```

---

## Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: travel-ai-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - travel-ai.com
        - api.travel-ai.com
      secretName: travel-ai-tls
  rules:
    - host: travel-ai.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: travel-ai-frontend
                port:
                  number: 80
    - host: api.travel-ai.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: travel-ai-api
                port:
                  number: 80
```

---

## Secrets Management

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: travel-ai-secrets
  namespace: production
type: Opaque
stringData:
  redis-url: redis://:${REDIS_PASSWORD}@redis-master:6379
  database-url: postgresql://postgres:${DB_PASSWORD}@postgres-primary:5432/travel_ai
  jwt-secret: ${JWT_SECRET}
  encryption-key: ${ENCRYPTION_KEY}
  hotelbeds-api-key: ${HOTELBEDS_API_KEY}
  hotelbeds-api-secret: ${HOTELBEDS_API_SECRET}
  booking-api-key: ${BOOKING_API_KEY}
  viator-api-key: ${VIATOR_API_KEY}
  amadeus-api-key: ${AMADEUS_API_KEY}
  amadeus-api-secret: ${AMADEUS_API_SECRET}
  weather-api-key: ${WEATHER_API_KEY}
  google-maps-api-key: ${GOOGLE_MAPS_API_KEY}
  stripe-secret-key: ${STRIPE_SECRET_KEY}
  sendgrid-api-key: ${SENDGRID_API_KEY}
```

---

## Database Configuration

```yaml
# PostgreSQL HA
postgresql:
  primary:
    host: postgres-primary
    port: 5432
    database: travel_ai
    pool:
      min: 10
      max: 50
    timeout: 30000
    ssl: true
    
  replicas:
    - host: postgres-replica-1
      port: 5432
    - host: postgres-replica-2
      port: 5432
      
  backup:
    enabled: true
    schedule: "0 2 * * *"
    retention: 30
    s3Bucket: travel-ai-prod-backups
    
  monitoring:
    enabled: true
    metrics: true
```

---

## Redis Configuration

```yaml
# Redis Cluster
redis:
  cluster:
    - host: redis-node-1
      port: 6379
    - host: redis-node-2
      port: 6379
    - host: redis-node-3
      port: 6379
    
  prefix: travel_ai_prod:
  ttl: 300
  maxRetries: 3
  retryDelayOnFailover: 300
  maxMemory: 4gb
  evictionPolicy: allkeys-lru
  
  sentinel:
    enabled: true
    master: mymaster
    sentinels:
      - host: sentinel-1
        port: 26379
      - host: sentinel-2
        port: 26379
      - host: sentinel-3
        port: 26379
```

---

## Scraper Configuration

```yaml
scraper:
  poolSize: 50
  timeout: 30000
  headless: true
  
  browserPool:
    min: 10
    max: 100
    maxAge: 3600000
    maxRequests: 5000
    
  proxy:
    enabled: true
    strategy: smart
    healthCheckInterval: 10000
    providers:
      - name: brightdata
        url: ${PROXY_URL_BRIGHTDATA}
        username: ${PROXY_USER_BRIGHTDATA}
        password: ${PROXY_PASS_BRIGHTDATA}
      - name: smartproxy
        url: ${PROXY_URL_SMARTPROXY}
        username: ${PROXY_USER_SMARTPROXY}
        password: ${PROXY_PASS_SMARTPROXY}
        
  rateLimiter:
    requestsPerSecond: 100
    maxConcurrent: 50
    
  session:
    storagePath: /var/lib/travel-ai/sessions
    encrypt: true
    encryptionKey: ${ENCRYPTION_KEY}
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
    retention: 30d
    
  grafana:
    enabled: true
    port: 3001
    dashboards:
      - travel-ai-overview
      - scraper-metrics
      - api-metrics
      - database-metrics
      - infrastructure-metrics
      
  alerts:
    enabled: true
    channels:
      - type: pagerduty
        serviceKey: ${PAGERDUTY_SERVICE_KEY}
      - type: slack
        webhook: ${SLACK_WEBHOOK}
        channel: "#alerts-production"
      - type: email
        recipients:
          - oncall@travel-ai.com
          - engineering@travel-ai.com
          
  tracing:
    enabled: true
    provider: jaeger
    endpoint: http://jaeger:14268/api/traces
    sampleRate: 0.1
```

---

## Backup Configuration

```yaml
backup:
  database:
    enabled: true
    schedule: "0 2 * * *"
    retention: 30
    s3Bucket: travel-ai-prod-backups
    s3Region: us-east-1
    
  redis:
    enabled: true
    schedule: "0 3 * * *"
    retention: 7
    s3Bucket: travel-ai-prod-backups
    
  configuration:
    enabled: true
    schedule: "0 1 * * *"
    retention: 90
    s3Bucket: travel-ai-prod-backups
    
  disasterRecovery:
    enabled: true
    rpo: 1h
    rto: 4h
    crossRegion: true
```

---

## Security Configuration

```yaml
security:
  tls:
    enabled: true
    minVersion: TLSv1.3
    
  waf:
    enabled: true
    rules:
      - sql-injection
      - xss
      - path-traversal
      - rate-limiting
      
  ddos:
    enabled: true
    provider: cloudflare
    
  vulnerabilityScanning:
    enabled: true
    schedule: "0 0 * * *"
    
  penetrationTesting:
    enabled: true
    schedule: "0 0 1 * *"
    
  compliance:
    pciDss: true
    gdpr: true
    soc2: true
```
