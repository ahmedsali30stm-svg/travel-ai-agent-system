# Validation Agent

## Agent ID
`agent_validation_011`

## Role
Ensures data integrity by validating all inputs and outputs across the system, checking schemas, business rules, and data quality.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Validate data schemas | Critical |
| 2 | Check business rules | Critical |
| 3 | Sanitize user inputs | High |
| 4 | Detect anomalies | High |
| 5 | Prevent data corruption | Critical |
| 6 | Enforce data quality | High |
| 7 | Validate API responses | High |
| 8 | Check data consistency | Medium |
| 9 | Monitor data drift | Medium |
| 10 | Generate validation reports | Low |

---

## Input Schema

```yaml
ValidationInput:
  type: object
  required:
    - request_id
    - data
    - schema_type
  properties:
    request_id:
      type: string
      format: uuid
    data:
      type: object
      description: Data to validate
    schema_type:
      type: string
      enum:
        - user_request
        - flight_result
        - hotel_result
        - activity_result
        - booking_request
        - booking_response
        - payment_request
        - itinerary
        - custom
    schema_id:
      type: string
      nullable: true
      description: Custom schema ID
    validation_rules:
      type: array
      items:
        type: object
        nullable: true
    strict_mode:
      type: boolean
      default: false
    context:
      type: object
      nullable: true
```

---

## Output Schema

```yaml
ValidationOutput:
  type: object
  required:
    - request_id
    - status
    - is_valid
    - result
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, error]
    is_valid:
      type: boolean
    result:
      type: object
      properties:
        errors:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              code:
                type: string
              message:
                type: string
              severity:
                type: string
                enum: [error, warning, info]
              path:
                type: string
        warnings:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              code:
                type: string
              message:
                type: string
        sanitized_data:
          type: object
          nullable: true
        confidence_score:
          type: number
        validation_time_ms:
          type: integer
    metadata:
      type: object
```

---

## Internal State

```yaml
InternalState:
  type: object
  properties:
    schemas:
      type: object
    validation_cache:
      type: object
    anomaly_detector:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate against schema | Yes |
| R002 | Check required fields | Yes |
| R003 | Validate data types | Yes |
| R004 | Check field constraints | Yes |
| R005 | Validate business rules | Yes |
| R006 | Sanitize string inputs | Yes |
| R007 | Validate date formats | Yes |
| R008 | Check numeric ranges | Yes |
| R009 | Validate enum values | Yes |
| R010 | Cache validation results | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Schema load fail | 1 | None | Use default schema |
| Validation timeout | 1 | None | Skip validation |
| Cache fail | 0 | N/A | Validate directly |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Schema match | 1.0 | Reject |
| Business rule compliance | 0.95 | Flag warnings |
| Data quality score | 0.8 | Request correction |
| Anomaly detection | 0.7 | Investigate |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Schemas | Read | 24 hours | Validation schemas |
| Validation Cache | Read/Write | 1 hour | Cache results |
| Anomaly Patterns | Read/Write | 7 days | Learn patterns |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `schema_validator` | Read | Unlimited |
| `business_rule_engine` | Read | Unlimited |
| `sanitizer` | Read | Unlimited |
| `anomaly_detector` | Read | 100/min |
| `cache_store` | Read/Write | Unlimited |

---

## Communication Protocol

```yaml
MessageType:
  - VALIDATION_REQUEST:
      direction: inbound
  - VALIDATION_RESPONSE:
      direction: outbound
  - SCHEMA_UPDATE:
      direction: inbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Schema invalid | Validation check | Return errors | Fix schema |
| Data corrupt | Validation check | Reject data | Request re-send |
| Anomaly detected | Detection check | Flag for review | Investigate |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Validation accuracy | Rate | > 99.9% |
| Response time | Latency | < 100ms |
| False positive rate | Rate | < 1% |
| Schema coverage | Rate | 100% |

---

## Configuration

```yaml
Configuration:
  cache_ttl_ms: 3600000
  strict_mode_default: false
  max_data_size_bytes: 10485760
  validation_timeout_ms: 5000
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
