# Supervisor Agent

## Agent ID
`agent_supervisor_001`

## Role
Top-level orchestration agent responsible for managing the entire agent fleet, coordinating multi-agent workflows, handling escalations, and ensuring system-wide consistency and performance.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Route incoming requests to appropriate agents | Critical |
| 2 | Coordinate multi-agent workflows | Critical |
| 3 | Monitor agent health and performance | High |
| 4 | Handle agent failures and escalations | Critical |
| 5 | Manage agent lifecycle (start, stop, restart) | High |
| 6 | Enforce system-wide policies and rate limits | High |
| 7 | Aggregate results from multiple agents | Medium |
| 8 | Maintain global context and state | High |
| 9 | Log all orchestration decisions | Medium |
| 10 | Provide system health dashboard | Low |

---

## Input Schema

```yaml
SupervisorInput:
  type: object
  required:
    - request_id
    - user_id
    - intent
    - timestamp
  properties:
    request_id:
      type: string
      format: uuid
      description: Unique request identifier
    user_id:
      type: string
      description: Authenticated user identifier
    intent:
      type: string
      enum:
        - book_flight
        - book_hotel
        - book_package
        - search_activities
        - get_weather
        - check_visa
        - get_currency
        - compare_prices
        - modify_booking
        - cancel_booking
        - get_itinerary
        - general_inquiry
      description: Classified user intent
    entities:
      type: object
      description: Extracted entities from user message
    context:
      type: object
      description: Session context
    priority:
      type: string
      enum: [low, medium, high, urgent]
      default: medium
    timeout_ms:
      type: integer
      default: 30000
      description: Maximum execution time
    metadata:
      type: object
      description: Additional metadata
```

---

## Output Schema

```yaml
SupervisorOutput:
  type: object
  required:
    - request_id
    - status
    - result
    - agents_invoked
    - duration_ms
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, failed, timeout]
    result:
      type: object
      description: Aggregated result from invoked agents
    agents_invoked:
      type: array
      items:
        type: object
        properties:
          agent_id:
            type: string
          status:
            type: string
            enum: [success, failed, timeout, skipped]
          duration_ms:
            type: integer
          error:
            type: string
            nullable: true
    duration_ms:
      type: integer
      description: Total execution time
    errors:
      type: array
      items:
        type: object
        properties:
          code:
            type: string
          message:
            type: string
          agent_id:
            type: string
          recoverable:
            type: boolean
    warnings:
      type: array
      items:
        type: string
    metadata:
      type: object
```

---

## Internal State

```yaml
InternalState:
  type: object
  properties:
    active_requests:
      type: object
      description: Map of request_id to request state
    agent_registry:
      type: object
      description: Registered agents and their status
    health_status:
      type: object
      description: Agent health metrics
    rate_limits:
      type: object
      description: Current rate limit counters
    circuit_breakers:
      type: object
      description: Circuit breaker states per agent
    metrics:
      type: object
      description: Performance metrics
```

### State Transitions

```
IDLE
  │
  ├── [request received] → ROUTING
  │
ROUTING
  │
  ├── [agent selected] → COORDINATING
  │
COORDINATING
  │
  ├── [all agents complete] → AGGREGATING
  │
AGGREGATING
  │
  ├── [results aggregated] → COMPLETE
  │
COMPLETE
  │
  ├── [cleanup] → IDLE
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Maximum 5 concurrent requests per user | Yes |
| R002 | Maximum 100 concurrent requests system-wide | Yes |
| R003 | Request timeout must not exceed 60 seconds | Yes |
| R004 | All agent calls must be logged | Yes |
| R005 | Failed agents must trigger fallback within 500ms | Yes |
| R006 | Circuit breaker opens after 5 consecutive failures | Yes |
| R007 | Circuit breaker resets after 60 seconds | Yes |
| R008 | Rate limit: 100 requests/minute per user | Yes |
| R009 | Rate limit: 1000 requests/minute system-wide | Yes |
| R010 | All responses must include request_id | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Jitter | Fallback |
|----------|-------------|---------|--------|----------|
| Agent timeout | 2 | Exponential | 100ms | Use cached result |
| Agent error (5xx) | 2 | Exponential | 200ms | Try alternative agent |
| Agent unavailable | 1 | Linear | 0ms | Skip non-critical |
| Rate limit hit | 3 | Exponential | 500ms | Queue request |
| Circuit breaker open | 0 | N/A | N/A | Return cached/error |
| Network failure | 3 | Exponential | 100ms | Retry with backoff |

### Backoff Formula

```
backoff_ms = min(base_ms * (2 ^ attempt) + jitter_ms, max_backoff_ms)

Where:
  base_ms = 1000
  max_backoff_ms = 30000
  jitter_ms = random(0, 1000)
```

---

## Confidence Score

```yaml
ConfidenceScoring:
  type: object
  properties:
    intent_classification:
      type: object
      properties:
        threshold:
          type: number
          default: 0.7
        action_below_threshold:
          type: string
          enum: [ask_clarification, use_default, reject]
          default: ask_clarification
    agent_selection:
      type: object
      properties:
        threshold:
          type: number
          default: 0.8
        fallback_agent:
          type: string
          default: general_agent
    result_quality:
      type: object
      properties:
        minimum_confidence:
          type: number
          default: 0.6
        retry_below_threshold:
          type: boolean
          default: true
```

### Confidence Thresholds

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Intent classification | 0.7 | Ask clarification |
| Agent selection | 0.8 | Use fallback agent |
| Result quality | 0.6 | Retry with alternative |
| Entity extraction | 0.6 | Request user input |
| Price confidence | 0.9 | Flag as estimate |

---

## Memory Access

| Memory Type | Access Level | TTL | Scope |
|-------------|--------------|-----|-------|
| Session Memory | Read/Write | 1 hour | Per session |
| User Profile | Read | 24 hours | Per user |
| Agent Registry | Read/Write | 5 minutes | Global |
| Health Metrics | Read/Write | 1 minute | Global |
| Rate Limit Counters | Read/Write | 1 minute | Per user/global |
| Circuit Breaker State | Read/Write | 60 seconds | Per agent |
| Cache (search results) | Read/Write | 5-30 min | Per query |
| Audit Log | Write only | 90 days | Global |

### Memory Operations

```yaml
MemoryOperations:
  - operation: get_context
    description: Retrieve session context
    latency_target: 10ms
    
  - operation: set_context
    description: Update session context
    latency_target: 10ms
    
  - operation: get_agent_health
    description: Get agent health status
    latency_target: 5ms
    
  - operation: update_metrics
    description: Update performance metrics
    latency_target: 5ms
    
  - operation: log_audit
    description: Write audit log entry
    latency_target: 20ms
```

---

## Tool Permissions

| Tool | Permission | Rate Limit | Timeout |
|------|------------|------------|---------|
| `agent_registry` | Read/Write | Unlimited | 1s |
| `health_monitor` | Read | Unlimited | 1s |
| `rate_limiter` | Read/Write | Unlimited | 100ms |
| `circuit_breaker` | Read/Write | Unlimited | 100ms |
| `cache_store` | Read/Write | 1000/min | 500ms |
| `audit_logger` | Write | Unlimited | 200ms |
| `metrics_collector` | Write | Unlimited | 100ms |
| `notification_service` | Read | 100/min | 2s |
| `session_store` | Read/Write | Unlimited | 100ms |
| `user_profile_store` | Read | 100/min | 500ms |

### Forbidden Tools

| Tool | Reason |
|------|--------|
| `database_direct` | Must use API layer |
| `external_api` | Must use agent wrappers |
| `file_system` | Must use storage service |
| `payment_gateway` | Must use booking agent |

---

## Communication Protocol

### Inbound Messages

```yaml
InboundMessage:
  type: object
  required:
    - message_id
    - type
    - source
    - payload
  properties:
    message_id:
      type: string
      format: uuid
    type:
      type: string
      enum:
        - user_request
        - agent_response
        - agent_error
        - health_check
        - system_event
    source:
      type: string
      description: Agent ID or "user"
    payload:
      type: object
    timestamp:
      type: string
      format: date-time
    correlation_id:
      type: string
      format: uuid
```

### Outbound Messages

```yaml
OutboundMessage:
  type: object
  required:
    - message_id
    - type
    - target
    - payload
  properties:
    message_id:
      type: string
      format: uuid
    type:
      type: string
      enum:
        - agent_request
        - agent_response
        - user_response
        - system_command
    target:
      type: string
      description: Agent ID or "user"
    payload:
      type: object
    timestamp:
      type: string
      format: date-time
    correlation_id:
      type: string
      format: uuid
    ttl:
      type: integer
      default: 30000
      description: Time to live in ms
```

### Message Flow

```
User Request
    │
    ▼
Supervisor Agent
    │
    ├──→ Validate Request
    │         │
    │         ▼
    │    Rate Limit Check
    │         │
    │         ▼
    │    Intent Classification
    │         │
    │         ▼
    │    Agent Selection
    │         │
    │         ▼
    │    ┌────┴────┐
    │    │         │
    │    ▼         ▼
    │  Agent A   Agent B  (parallel)
    │    │         │
    │    └────┬────┘
    │         │
    │         ▼
    │    Result Aggregation
    │         │
    │         ▼
    │    Quality Check
    │         │
    │         ▼
    │    Response Formatting
    │
    ▼
User Response
```

---

## Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|----------|
| Agent timeout | 30s timeout | Return partial result | Log, alert, cache result |
| Agent crash | Health check fail | Route to fallback | Restart agent, alert ops |
| Agent error | 5xx response | Retry, then fallback | Log, circuit breaker |
| Network failure | Connection error | Retry with backoff | Alert ops if persistent |
| Rate limit | 429 response | Queue request | Monitor rate usage |
| Circuit breaker open | State check | Return cached/error | Wait for reset |
| Memory exhaustion | Memory check | Evict old data | Alert ops, scale up |
| Invalid response | Schema validation | Retry with agent | Log, alert if repeated |

### Escalation Matrix

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| Critical | Immediate | Page on-call engineer |
| High | 5 minutes | Alert team lead |
| Medium | 15 minutes | Log ticket |
| Low | 1 hour | Include in daily report |

---

## Success Criteria

| Criterion | Metric | Target | Measurement |
|-----------|--------|--------|-------------|
| Request success rate | % completed | > 95% | Daily |
| Average response time | Latency | < 5s | Per request |
| P95 response time | Latency | < 15s | Per request |
| P99 response time | Latency | < 30s | Per request |
| Agent availability | Uptime | > 99.9% | Per agent |
| Error recovery rate | % recovered | > 90% | Daily |
| User satisfaction | Rating | > 4.5/5 | Per session |
| System throughput | Requests/min | > 100 | System-wide |

---

## Configuration

```yaml
Configuration:
  max_concurrent_requests: 100
  max_concurrent_per_user: 5
  default_timeout_ms: 30000
  max_timeout_ms: 60000
  rate_limit_per_user: 100
  rate_limit_system: 1000
  circuit_breaker_threshold: 5
  circuit_breaker_reset_ms: 60000
  cache_ttl_ms: 300000
  log_level: info
  metrics_interval_ms: 10000
  health_check_interval_ms: 5000
  max_retry_attempts: 3
  retry_base_delay_ms: 1000
  retry_max_delay_ms: 30000
```

---

## Monitoring

### Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `supervisor_requests_total` | Counter | intent, status | Total requests |
| `supervisor_request_duration_seconds` | Histogram | intent | Request duration |
| `supervisor_agents_invoked_total` | Counter | agent_id, status | Agent invocations |
| `supervisor_agent_duration_seconds` | Histogram | agent_id | Agent duration |
| `supervisor_errors_total` | Counter | error_type, agent_id | Errors |
| `supervisor_retries_total` | Counter | agent_id | Retry attempts |
| `supervisor_circuit_breaker_state` | Gauge | agent_id | Circuit state |
| `supervisor_rate_limit_hits_total` | Counter | user_id | Rate limit hits |
| `supervisor_active_requests` | Gauge | - | Active requests |

### Dashboards

| Dashboard | Panels |
|-----------|--------|
| **Overview** | Request rate, success rate, avg latency |
| **Agent Health** | Per-agent availability, error rates |
| **Performance** | Latency distribution, throughput |
| **Errors** | Error rate, error types, recovery |

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
