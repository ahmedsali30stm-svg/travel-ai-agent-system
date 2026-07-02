# Health Monitor

> Comprehensive provider health monitoring and alerting.

---

## Overview

The Health Monitor tracks provider health, detects issues, and triggers alerts to maintain system reliability.

---

## Health Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       HEALTH MONITOR ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         HEALTH CHECKS                                      │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Active   │ │  Passive  │ │  Synthetic│ │  User     │                │ │
│  │  │  Checks   │ │  Monitoring│ │  Testing  │ │  Reports  │                │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         HEALTH ANALYSIS                                    │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Status   │ │  Trend    │ │  Anomaly  │ │  Impact   │                │ │
│  │  │  Evaluation│ │  Analysis │ │  Detection│ │  Assessment│               │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         ALERTING                                           │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Alert    │ │  Alert    │ │  Alert    │ │  Alert    │                │ │
│  │  │  Generation│ │  Routing  │ │  Escalation│ │  Resolution│              │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Health Check Types

### 1. Active Health Checks

```typescript
interface ActiveHealthCheck {
  // Perform health check
  check(provider: ProviderConfig): Promise<HealthCheckResult>;
  
  // Check endpoint availability
  checkEndpoint(url: string): Promise<boolean>;
  
  // Check response time
  checkResponseTime(url: string): Promise<number>;
  
  // Check authentication
  checkAuthentication(provider: ProviderConfig): Promise<boolean>;
}

interface HealthCheckResult {
  // Provider ID
  providerId: string;
  
  // Check timestamp
  timestamp: number;
  
  // Status
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  
  // Response time
  responseTime: number;
  
  // Error info
  error?: string;
  
  // Additional metrics
  metrics: {
    availability: number;
    latency: number;
    throughput: number;
  };
}

// Active health check implementation
async function performActiveHealthCheck(
  provider: ProviderConfig
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Check endpoint
    const isAvailable = await checkEndpoint(provider.endpoint + '/health');
    
    if (!isAvailable) {
      return {
        providerId: provider.id,
        timestamp: Date.now(),
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: 'Endpoint not available',
        metrics: {
          availability: 0,
          latency: 0,
          throughput: 0,
        },
      };
    }
    
    // Check response time
    const responseTime = await checkResponseTime(provider.endpoint + '/health');
    
    // Determine status
    let status: HealthCheckResult['status'];
    if (responseTime < 1000) {
      status = 'healthy';
    } else if (responseTime < 3000) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return {
      providerId: provider.id,
      timestamp: Date.now(),
      status,
      responseTime,
      metrics: {
        availability: 1,
        latency: responseTime,
        throughput: 0,
      },
    };
  } catch (error) {
    return {
      providerId: provider.id,
      timestamp: Date.now(),
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message,
      metrics: {
        availability: 0,
        latency: 0,
        throughput: 0,
      },
    };
  }
}
```

---

### 2. Passive Monitoring

```typescript
interface PassiveMonitoring {
  // Monitor request outcomes
  monitorRequest(
    providerId: string,
    request: ProviderRequest,
    response: ProviderResponse
  ): void;
  
  // Track success rate
  trackSuccessRate(
    providerId: string,
    success: boolean
  ): void;
  
  // Track response time
  trackResponseTime(
    providerId: string,
    responseTime: number
  ): void;
  
  // Track errors
  trackError(
    providerId: string,
    error: Error
  ): void;
}

// Passive monitoring implementation
class PassiveMonitor implements PassiveMonitoring {
  private metrics: Map<string, ProviderMetrics>;
  
  constructor() {
    this.metrics = new Map();
  }
  
  monitorRequest(
    providerId: string,
    request: ProviderRequest,
    response: ProviderResponse
  ): void {
    const metrics = this.getOrCreateMetrics(providerId);
    
    // Update request count
    metrics.totalRequests++;
    
    // Update success/failure
    if (response.success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }
    
    // Update response time
    metrics.avgResponseTime = 
      (metrics.avgResponseTime * (metrics.totalRequests - 1) + response.duration) / 
      metrics.totalRequests;
    
    // Update error rate
    metrics.errorRate = metrics.failedRequests / metrics.totalRequests;
    
    // Update timestamp
    metrics.lastUpdated = Date.now();
    
    // Check for issues
    this.checkForIssues(providerId, metrics);
  }
  
  private checkForIssues(
    providerId: string,
    metrics: ProviderMetrics
  ): void {
    // Check error rate
    if (metrics.errorRate > 0.1) {
      this.triggerAlert(providerId, 'high_error_rate', metrics.errorRate);
    }
    
    // Check response time
    if (metrics.avgResponseTime > 3000) {
      this.triggerAlert(providerId, 'high_latency', metrics.avgResponseTime);
    }
  }
}
```

---

### 3. Synthetic Testing

```typescript
interface SyntheticTesting {
  // Run synthetic test
  runTest(provider: ProviderConfig): Promise<SyntheticTestResult>;
  
  // Test search functionality
  testSearch(provider: ProviderConfig): Promise<boolean>;
  
  // Test booking functionality
  testBooking(provider: ProviderConfig): Promise<boolean>;
  
  // Test payment functionality
  testPayment(provider: ProviderConfig): Promise<boolean>;
}

interface SyntheticTestResult {
  // Test ID
  testId: string;
  
  // Provider ID
  providerId: string;
  
  // Test type
  type: 'search' | 'booking' | 'payment';
  
  // Test result
  success: boolean;
  
  // Test duration
  duration: number;
  
  // Test details
  details: {
    steps: TestStep[];
    errors: TestError[];
    warnings: TestWarning[];
  };
}

// Synthetic test implementation
async function runSyntheticTest(
  provider: ProviderConfig
): Promise<SyntheticTestResult> {
  const testId = generateTestId();
  const startTime = Date.now();
  
  try {
    // Test search
    const searchSuccess = await testSearch(provider);
    
    // Test booking
    const bookingSuccess = await testBooking(provider);
    
    // Test payment
    const paymentSuccess = await testPayment(provider);
    
    const duration = Date.now() - startTime;
    
    return {
      testId,
      providerId: provider.id,
      type: 'search',
      success: searchSuccess && bookingSuccess && paymentSuccess,
      duration,
      details: {
        steps: [
          { name: 'search', success: searchSuccess, duration: 0 },
          { name: 'booking', success: bookingSuccess, duration: 0 },
          { name: 'payment', success: paymentSuccess, duration: 0 },
        ],
        errors: [],
        warnings: [],
      },
    };
  } catch (error) {
    return {
      testId,
      providerId: provider.id,
      type: 'search',
      success: false,
      duration: Date.now() - startTime,
      details: {
        steps: [],
        errors: [{
          step: 'test',
          error: error.message,
        }],
        warnings: [],
      },
    };
  }
}
```

---

## Health Status Evaluation

```typescript
interface HealthEvaluator {
  // Evaluate provider health
  evaluate(providerId: string): HealthEvaluation;
  
  // Calculate health score
  calculateScore(metrics: ProviderMetrics): number;
  
  // Determine status
  determineStatus(score: number): HealthStatus;
  
  // Check thresholds
  checkThresholds(metrics: ProviderMetrics): ThresholdResult;
}

interface HealthEvaluation {
  // Provider ID
  providerId: string;
  
  // Health score (0-100)
  score: number;
  
  // Status
  status: HealthStatus;
  
  // Evaluation timestamp
  timestamp: number;
  
  // Threshold results
  thresholds: ThresholdResult;
  
  // Recommendations
  recommendations: string[];
}

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline';

// Health evaluation implementation
function evaluateProviderHealth(
  providerId: string,
  metrics: ProviderMetrics
): HealthEvaluation {
  // Calculate health score
  const score = calculateHealthScore(metrics);
  
  // Determine status
  const status = determineHealthStatus(score);
  
  // Check thresholds
  const thresholds = checkThresholds(metrics);
  
  // Generate recommendations
  const recommendations = generateRecommendations(score, thresholds);
  
  return {
    providerId,
    score,
    status,
    timestamp: Date.now(),
    thresholds,
    recommendations,
  };
}

// Calculate health score
function calculateHealthScore(metrics: ProviderMetrics): number {
  let score = 100;
  
  // Deduct for errors
  if (metrics.errorRate > 0.01) {
    score -= metrics.errorRate * 50;
  }
  
  // Deduct for high latency
  if (metrics.avgResponseTime > 1000) {
    score -= (metrics.avgResponseTime - 1000) / 100;
  }
  
  // Deduct for timeouts
  if (metrics.timeoutRate > 0.01) {
    score -= metrics.timeoutRate * 30;
  }
  
  return Math.max(0, Math.min(100, score));
}

// Determine health status
function determineHealthStatus(score: number): HealthStatus {
  if (score >= 90) return 'healthy';
  if (score >= 70) return 'degraded';
  if (score >= 50) return 'unhealthy';
  return 'offline';
}
```

---

## Alerting System

```typescript
interface AlertManager {
  // Generate alert
  generateAlert(
    providerId: string,
    type: AlertType,
    severity: AlertSeverity,
    message: string
  ): Alert;
  
  // Send alert
  sendAlert(alert: Alert): Promise<void>;
  
  // Escalate alert
  escalateAlert(alertId: string): Promise<void>;
  
  // Resolve alert
  resolveAlert(alertId: string): Promise<void>;
}

interface Alert {
  // Alert ID
  id: string;
  
  // Provider ID
  providerId: string;
  
  // Alert type
  type: AlertType;
  
  // Severity
  severity: AlertSeverity;
  
  // Message
  message: string;
  
  // Timestamp
  timestamp: number;
  
  // Status
  status: 'active' | 'acknowledged' | 'resolved';
  
  // Escalation level
  escalationLevel: number;
}

type AlertType = 
  | 'high_error_rate'
  | 'high_latency'
  | 'timeout'
  | 'authentication_failure'
  | 'rate_limit_exceeded'
  | 'service_unavailable';

type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Alert generation
function generateAlert(
  providerId: string,
  type: AlertType,
  severity: AlertSeverity,
  message: string
): Alert {
  return {
    id: generateAlertId(),
    providerId,
    type,
    severity,
    message,
    timestamp: Date.now(),
    status: 'active',
    escalationLevel: 0,
  };
}

// Alert routing
async function routeAlert(alert: Alert): Promise<void> {
  // Determine recipients based on severity
  const recipients = getAlertRecipients(alert.severity);
  
  // Send alert to recipients
  for (const recipient of recipients) {
    await sendAlertToRecipient(alert, recipient);
  }
}

// Alert escalation
async function escalateAlert(alertId: string): Promise<void> {
  const alert = getAlert(alertId);
  
  if (!alert) {
    return;
  }
  
  // Increase escalation level
  alert.escalationLevel++;
  
  // Get escalation recipients
  const recipients = getEscalationRecipients(alert.escalationLevel);
  
  // Send escalation alert
  for (const recipient of recipients) {
    await sendEscalationAlert(alert, recipient);
  }
}
```

---

## Health Monitor Configuration

```yaml
healthMonitor:
  # Enable health monitoring
  enabled: true
  
  # Active health checks
  activeChecks:
    enabled: true
    interval: 30000 # 30 seconds
    timeout: 5000
    retries: 3
  
  # Passive monitoring
  passiveMonitoring:
    enabled: true
    sampleRate: 0.1 # 10% of requests
  
  # Synthetic testing
  syntheticTesting:
    enabled: true
    interval: 300000 # 5 minutes
    tests:
      - search
      - booking
      - payment
  
  # Health evaluation
  evaluation:
    healthyThreshold: 90
    degradedThreshold: 70
    unhealthyThreshold: 50
  
  # Alerting
  alerting:
    enabled: true
    channels:
      - type: email
        enabled: true
        recipients:
          - ops@example.com
      - type: slack
        enabled: true
        webhook: ${SLACK_WEBHOOK}
      - type: pagerduty
        enabled: false
        apiKey: ${PAGERDUTY_API_KEY}
    
    escalation:
      low:
        delay: 300000 # 5 minutes
        recipients: ['ops@example.com']
      medium:
        delay: 120000 # 2 minutes
        recipients: ['ops@example.com', 'lead@example.com']
      high:
        delay: 60000 # 1 minute
        recipients: ['ops@example.com', 'lead@example.com', 'manager@example.com']
      critical:
        delay: 0
        recipients: ['ops@example.com', 'lead@example.com', 'manager@example.com', 'cto@example.com']
```
