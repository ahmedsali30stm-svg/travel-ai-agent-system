# Currency Agent

## Agent ID
`agent_currency_009`

## Role
Handles currency conversion, exchange rate information, and multi-currency calculations for travel pricing.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Provide real-time exchange rates | Critical |
| 2 | Convert between currencies | Critical |
| 3 | Calculate fees and markups | High |
| 4 | Track rate history | Medium |
| 5 | Send rate alerts | Medium |
| 6 | Handle multi-currency displays | High |
| 7 | Provide rate forecasts | Low |
| 8 | Support 150+ currencies | High |
| 9 | Handle currency formatting | Medium |
| 10 | Track rate volatility | Medium |

---

## Input Schema

```yaml
CurrencyInput:
  type: object
  required:
    - request_id
    - amount
    - source_currency
    - target_currency
  properties:
    request_id:
      type: string
      format: uuid
    amount:
      type: number
      minimum: 0
    source_currency:
      type: string
      format: iso-4217
    target_currency:
      type: string
      format: iso-4217
    include_fees:
      type: boolean
      default: false
    fee_percentage:
      type: number
      default: 0
    rate_source:
      type: string
      enum: [ecb, open_exchange, xe, auto]
      default: auto
    historical_date:
      type: string
      format: date
      nullable: true
      description: For historical rates
```

---

## Output Schema

```yaml
CurrencyOutput:
  type: object
  required:
    - request_id
    - status
    - conversion
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, error]
    conversion:
      type: object
      properties:
        source_amount:
          type: number
        source_currency:
          type: string
        target_amount:
          type: number
        target_currency:
          type: string
        exchange_rate:
          type: number
        inverse_rate:
          type: number
        fees:
          type: number
        total_cost:
          type: number
        rate_timestamp:
          type: string
          format: date-time
        rate_source:
          type: string
        confidence:
          type: number
    rate_history:
      type: array
      items:
        type: object
        properties:
          date:
            type: string
            format: date
          rate:
            type: number
      nullable: true
    volatility:
      type: string
      enum: [stable, moderate, volatile]
      nullable: true
    recommendation:
      type: string
      nullable: true
```

---

## Internal State

```yaml
InternalState:
  type: object
  properties:
    rate_cache:
      type: object
    rate_history:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate currency codes | Yes |
| R002 | Amount must be >= 0 | Yes |
| R003 | Rate must be > 0 | Yes |
| R004 | Cache rates for 1 hour | Yes |
| R005 | Include rate timestamp | Yes |
| R006 | Support 150+ currencies | Yes |
| R007 | Handle formatting | Yes |
| R008 | Include inverse rate | Yes |
| R009 | Track rate source | Yes |
| R010 | Provide confidence score | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| API timeout | 2 | Linear 1s/2s | Use cached rate |
| Rate unavailable | 1 | None | Use last known |
| Primary source fail | 1 | None | Try alternative source |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Rate accuracy | 0.99 | Flag as approximate |
| Rate freshness | 1 hour | Show timestamp |
| Source reliability | 0.95 | Show source |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Rate Cache | Read/Write | 1 hour | Cache rates |
| Rate History | Read/Write | 30 days | Track history |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `exchange_rate_api` | Read | 100/min |
| `currency_database` | Read | Unlimited |
| `cache_store` | Read/Write | Unlimited |

---

## Communication Protocol

```yaml
MessageType:
  - CONVERSION_REQUEST:
      direction: inbound
  - CONVERSION_RESPONSE:
      direction: outbound
  - RATE_ALERT:
      direction: outbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| API down | Health check | Use cached rate | Alert ops |
| Rate stale | Timestamp check | Show warning | Refresh |
| Source fail | Response check | Try alternative | Log |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Rate accuracy | vs market | Within 1% |
| Response time | Latency | < 500ms |
| Currency coverage | Count | > 150 |
| Cache hit rate | Rate | > 80% |

---

## Configuration

```yaml
Configuration:
  cache_ttl_ms: 3600000
  supported_currencies: 150
  rate_source_priority:
    - ecb
    - open_exchange
    - xe
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
