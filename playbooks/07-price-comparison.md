# Step 7: Price Comparison

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Aggregates all costs, compares to budget, calculates savings, provides recommendations |
| **Agent(s)** | Budget Agent (primary), Currency Agent (support) |
| **Criticality** | Critical — determines if trip is feasible within budget |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Budget Agent** | Primary | Cost aggregation, budget analysis, savings recommendations |
| **Currency Agent** | Support | Currency conversion, exchange rate lookup |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `flights_cost` | decimal | Yes | Step 3 | Total flight cost |
| `hotel_cost` | decimal | Yes | Step 4 | Total hotel cost |
| `activities_cost` | decimal | Yes | Step 5 | Total activity cost |
| `transport_cost` | decimal | Yes | Step 6 | Total transport cost |
| `user_budget` | decimal | Yes | User/Budget Agent | Total budget |
| `currency` | string | Yes | User preference | Preferred currency |
| `trip_duration` | integer | Yes | Step 1 | Number of days |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `total_cost` | decimal | Sum of all costs |
| `budget_status` | enum | under, at, over |
| `breakdown` | object | Cost per category |
| `savings` | decimal | Amount under/over budget |
| `recommendations` | list | Cost-saving suggestions |
| `currency_conversion` | object | Converted amounts |
| `daily_average` | decimal | Average cost per day |

### Breakdown Schema

```yaml
breakdown:
  flights:
    amount: decimal
    percentage: decimal
    per_person: decimal
  hotels:
    amount: decimal
    percentage: decimal
    per_night: decimal
  activities:
    amount: decimal
    percentage: decimal
    per_person: decimal
  transport:
    amount: decimal
    percentage: decimal
  total:
    amount: decimal
    currency: string
    converted: decimal
    converted_currency: string
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| All costs are numeric | type | Critical | Return error |
| Costs >= 0 | range | Critical | Return error |
| Currency is valid ISO | format | High | Use default (USD) |
| Budget > 0 | threshold | Medium | Skip budget check |
| Sum matches total | business | High | Recalculate |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Currency API failure | 1 | None | Use cached rate |
| Cost aggregation failure | 1 | None | Manual calculation |
| Exchange rate unavailable | 1 | None | Show in original currency |

### Retry Decision Tree

```
Price Comparison Fails
    │
    ├── Currency API fails?
    │   └── Yes → Use cached exchange rate (max 1 retry)
    │
    ├── Cost aggregation fails?
    │   └── Yes → Manual sum calculation
    │
    └── Exchange rate unavailable?
        └── Yes → Show all prices in original currencies
```

---

## Timing

| Metric | Target | Warning | Timeout | Critical |
|--------|--------|---------|---------|----------|
| Cost aggregation | < 100ms | 200ms | 500ms | 1s |
| Currency conversion | < 200ms | 500ms | 1s | 2s |
| Recommendation gen | < 300ms | 500ms | 1s | 2s |
| **Total Step** | < 500ms | 1s | 5s | 10s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Invalid cost data | E7001 | "Error calculating costs" | Return error |
| Budget exceeded | E7002 | "Trip exceeds budget by ${amount}" | Show options |
| Currency unavailable | E7003 | "Showing prices in original currencies" | Skip conversion |
| Calculation error | E7004 | "Recalculating costs..." | Retry once |

### Budget Status Response

```json
{
  "budget_status": "over",
  "total_cost": 2450,
  "budget": 2000,
  "savings_needed": 450,
  "recommendations": [
    {
      "category": "hotels",
      "current": 1200,
      "suggestion": "Consider 3-star hotel",
      "potential_savings": 300
    },
    {
      "category": "flights",
      "current": 800,
      "suggestion": "Book 2 weeks in advance",
      "potential_savings": 200
    }
  ]
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| Budget Agent | Internal | Yes |
| Currency Agent | Internal | Yes |
| Exchange Rate API | External | Yes |
| Price Cache (Redis) | Internal | Yes |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Price calculation accuracy | vs manual | > 99% |
| Currency conversion accuracy | vs market rate | Within 1% |
| Recommendation relevance | User rating | > 80% |
| Response time | Latency | < 500ms |
| Budget status accuracy | Correct status | 100% |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `price_comparison_started` | request_id, categories | On start |
| `price_comparison_completed` | request_id, total_cost, budget_status | On completion |
| `budget_exceeded` | request_id, amount_over | When over budget |
| `recommendation_shown` | request_id, recommendations_count | When recommendations shown |

---

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| Exchange rates | 1 hour | Rate change > 1% |
| Cost calculations | 5 minutes | Price update |
| Recommendations | 15 minutes | Budget change |

---

## Notes

- Always show cost breakdown by category
- Include per-person and per-night calculations
- Provide actionable savings recommendations
- Show price comparison vs market average when possible
- Track budget accuracy for future predictions

---

*Step 7 of 12 | Price Comparison*
