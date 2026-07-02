# Environment Configurations

> Configuration files for development, staging, and production environments.

---

## Overview

This directory contains environment-specific configurations for the Enterprise Travel AI Agent Platform.

---

## Environments

| Environment | File | Purpose |
|-------------|------|---------|
| Development | `development.md` | Local development and testing |
| Staging | `staging.md` | Pre-production validation |
| Production | `production.md` | Live production environment |

---

## Environment Comparison

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Nodes** | 1 | 2 | 3+ |
| **Database** | Single | Single | HA Cluster |
| **Cache** | Single | Single | Redis Cluster |
| **Load Balancer** | None | Nginx | AWS ALB + Nginx |
| **Monitoring** | Basic | Full | Full + Alerting |
| **Backup** | None | Daily | Hourly |
| **SSL** | Self-signed | Let's Encrypt | Let's Encrypt + WAF |
| **Rate Limiting** | Relaxed | Moderate | Strict |
| **Logging** | Debug | Info | Warn |

---

## Resource Allocation

| Resource | Development | Staging | Production |
|----------|-------------|---------|------------|
| **CPU** | 2 cores | 4 cores | 16+ cores |
| **Memory** | 4 GB | 8 GB | 32+ GB |
| **Storage** | 50 GB | 200 GB | 1+ TB |
| **Network** | Local | VPC | Multi-AZ |

---

## Deployment Process

### Development
```bash
# Start local environment
docker-compose up -d

# View logs
docker-compose logs -f api-gateway

# Stop environment
docker-compose down
```

### Staging
```bash
# Deploy to staging
kubectl apply -f k8s/staging/

# Verify deployment
kubectl get pods -n staging

# View logs
kubectl logs -f deployment/travel-ai-api -n staging
```

### Production
```bash
# Deploy to production
kubectl apply -f k8s/production/

# Verify deployment
kubectl get pods -n production

# View logs
kubectl logs -f deployment/travel-ai-api -n production
```

---

## Environment Variables

### Required Secrets

| Secret | Description | Environment |
|--------|-------------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | All |
| `REDIS_URL` | Redis connection string | All |
| `JWT_SECRET` | JWT signing secret | All |
| `ENCRYPTION_KEY` | Data encryption key | Staging, Production |
| `HOTELBEDS_API_KEY` | Hotelbeds API key | All |
| `HOTELBEDS_API_SECRET` | Hotelbeds API secret | All |
| `BOOKING_API_KEY` | Booking.com API key | All |
| `VIATOR_API_KEY` | Viator API key | All |
| `AMADEUS_API_KEY` | Amadeus API key | All |
| `AMADEUS_API_SECRET` | Amadeus API secret | All |
| `WEATHER_API_KEY` | Weather API key | All |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | All |
| `STRIPE_SECRET_KEY` | Stripe secret key | All |
| `SENDGRID_API_KEY` | SendGrid API key | All |

### Optional Secrets

| Secret | Description | Environment |
|--------|-------------|-------------|
| `PROXY_URL_BRIGHTDATA` | BrightData proxy URL | Production |
| `PROXY_USER_BRIGHTDATA` | BrightData proxy user | Production |
| `PROXY_PASS_BRIGHTDATA` | BrightData proxy password | Production |
| `PAGERDUTY_SERVICE_KEY` | PagerDuty service key | Production |
| `SLACK_WEBHOOK` | Slack webhook URL | Staging, Production |

---

## Monitoring Endpoints

| Endpoint | Development | Staging | Production |
|----------|-------------|---------|------------|
| API Health | http://localhost:3000/health | https://staging.travel-ai.com/health | https://travel-ai.com/health |
| Prometheus | http://localhost:9090 | https://staging.travel-ai.com:9090 | Internal only |
| Grafana | http://localhost:3001 | https://staging.travel-ai.com:3001 | Internal only |

---

## Security Notes

### Development
- Use test/sandbox API keys only
- No SSL required (local only)
- Relaxed rate limiting

### Staging
- Use sandbox API keys
- SSL required
- Moderate rate limiting
- Basic WAF rules

### Production
- Use production API keys only
- SSL required (TLS 1.3)
- Strict rate limiting
- Full WAF rules
- DDoS protection
- Regular security audits

---

## Backup Schedule

| Component | Development | Staging | Production |
|-----------|-------------|---------|------------|
| Database | None | Daily | Hourly |
| Redis | None | Daily | Hourly |
| Configuration | None | Daily | Daily |
| Logs | None | Weekly | Real-time |
| Files | None | Daily | Real-time |

---

## Disaster Recovery

| Metric | Development | Staging | Production |
|--------|-------------|---------|------------|
| RPO | N/A | 24h | 1h |
| RTO | N/A | 4h | 1h |
| Backup Location | Local | S3 (same region) | S3 (cross-region) |
| Failover | Manual | Manual | Automatic |
