# Step 8: Validation

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Validates all data, checks visa requirements, fetches weather, generates warnings |
| **Agent(s)** | Validate Agent (primary), Visa Agent (support), Weather Agent (support) |
| **Criticality** | High — ensures data integrity and compliance |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Validate Agent** | Primary | Schema validation, business rule checks, data integrity |
| **Visa Agent** | Support | Visa requirements, document checklists |
| **Weather Agent** | Support | Weather forecasts, packing suggestions |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `all_results` | object | Yes | Steps 3-6 | All search results |
| `user_profile` | object | Yes | Profile Agent | User preferences and info |
| `destination` | string | Yes | Step 1 entities | Destination country/city |
| `travel_dates` | object | Yes | Step 1 entities | Start and end dates |
| `nationality` | string | Yes | User profile | Traveler nationality |
| `passport_expiry` | date | No | User profile | Passport expiration date |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `validation_status` | enum | pass, warning, fail |
| `visa_requirements` | object | Visa info for destination |
| `weather_forecast` | object | Weather for travel dates |
| `warnings` | list | Issues found |
| `recommendations` | list | Suggestions based on validation |
| `document_checklist` | list | Required documents |

### Validation Result Schema

```yaml
validation:
  status: enum          # pass, warning, fail
  checks:
    - name: string
      status: enum      # pass, warning, fail
      message: string
      details: object
  visa:
    required: boolean
    type: string
    processing_time: string
    documents: list[string]
  weather:
    forecast: list[object]
    packing_suggestions: list[string]
    alerts: list[string]
  warnings:
    - code: string
      message: string
      severity: enum    # low, medium, high, critical
      action: string
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| All required fields present | required | Critical | Return error |
| Schema validation passes | schema | Critical | Return error |
| Visa requirements checked | business | High | Warn user |
| Weather data available | business | Medium | Skip weather |
| Passport valid 6+ months | business | High | Warn user |
| Travel insurance required | business | Medium | Recommend insurance |

### Validation Checks

| Check | Type | Required | Failure Action |
|-------|------|----------|----------------|
| Schema validation | Technical | Yes | Return errors |
| Date consistency | Business | Yes | Flag conflict |
| Price validation | Business | Yes | Recalculate |
| Visa requirements | Business | Yes | Provide guidance |
| Weather forecast | Business | No | Skip |
| Passport validity | Business | Yes | Warn user |
| Travel advisories | Business | No | Warn user |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Visa API failure | 1 | None | Provide general guidance |
| Weather API failure | 1 | None | Skip weather section |
| Schema validation failure | 0 | None | Return specific errors |
| Travel advisory API failure | 1 | None | Skip advisory |

### Retry Decision Tree

```
Validation Fails
    │
    ├── Visa API fails?
    │   └── Yes → Provide general guidance ("Check embassy website")
    │
    ├── Weather API fails?
    │   └── Yes → Skip weather section, continue
    │
    ├── Schema validation fails?
    │   └── Yes → Return specific errors for fix
    │
    └── Travel advisory fails?
        └── Yes → Skip advisory, note in output
```

---

## Timing

| Metric | Target | Warning | Timeout | Critical |
|--------|--------|---------|---------|----------|
| Schema validation | < 100ms | 200ms | 500ms | 1s |
| Visa check | < 1s | 2s | 3s | 5s |
| Weather fetch | < 1s | 2s | 3s | 5s |
| Travel advisory | < 1s | 2s | 3s | 5s |
| **Total Step** | < 2s | 5s | 10s | 15s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Schema validation fails | E8001 | "Data validation error: {details}" | Return errors |
| Visa unavailable | E8002 | "Check visa requirements at embassy" | Provide guidance |
| Weather unavailable | E8003 | "Weather forecast unavailable" | Skip section |
| Passport expired | E8004 | "Your passport expires before travel" | Warn user |
| Travel advisory | E8005 | "Travel advisory: {details}" | Warn user |

### Warning Response Format

```json
{
  "validation_status": "warning",
  "warnings": [
    {
      "code": "W8004",
      "severity": "high",
      "message": "Your passport expires on 2026-09-15, less than 6 months after travel",
      "action": "Renew passport before travel"
    }
  ],
  "visa": {
    "required": true,
    "type": "Tourist visa",
    "processing_time": "2-3 weeks",
    "documents": ["Passport", "Flight booking", "Hotel confirmation", "Bank statement"]
  },
  "weather": {
    "forecast": [...],
    "packing_suggestions": ["Light clothing", "Umbrella", "Sunscreen"]
  }
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| Validate Agent | Internal | Yes |
| Visa Agent | Internal | Yes |
| Weather Agent | Internal | Yes |
| Visa Requirements DB | Internal | Yes |
| Weather API (OpenWeather) | External | Yes |
| Travel Advisory API | External | No |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Schema validation accuracy | Correct rejections | > 99% |
| Visa requirements accuracy | Correct info | > 95% |
| Weather forecast accuracy | 3-day accuracy | > 80% |
| Response time | Latency | < 2 seconds |
| Warning relevance | User rating | > 85% |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `validation_started` | request_id, checks_count | On start |
| `validation_completed` | request_id, status, warnings_count | On completion |
| `visa_checked` | destination, nationality, required | After visa check |
| `weather_fetched` | destination, forecast_days | After weather fetch |
| `warning_generated` | code, severity, action | Per warning |

---

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| Visa requirements | 24 hours | Policy change |
| Weather forecast | 3 hours | New forecast available |
| Travel advisories | 6 hours | Advisory change |
| Schema definitions | 24 hours | Schema update |

---

## Notes

- Always include document checklist for international travel
- Provide actionable recommendations for each warning
- Cache visa requirements to reduce API calls
- Weather data should include packing suggestions
- Log validation results for compliance auditing

---

*Step 8 of 12 | Validation*
