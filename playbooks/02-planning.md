# Step 2: Planning

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Decomposes request into sub-tasks, selects agents, allocates budget, creates execution plan |
| **Agent(s)** | Orchestrator Agent (primary), Budget Agent (support) |
| **Criticality** | Critical — workflow cannot proceed without a valid plan |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Orchestrator Agent** | Primary | Request decomposition, agent selection, plan generation |
| **Budget Agent** | Support | Budget validation, allocation, cost estimation |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `request_id` | string | Yes | Step 1 | Unique request identifier |
| `intent` | enum | Yes | Step 1 | Classified intent |
| `entities` | object | Yes | Step 1 | Extracted entities |
| `user_profile` | object | Yes | Profile Agent | User preferences and history |
| `budget` | object | Yes | User/Budget Agent | Budget constraints |
| `session` | object | Yes | Step 1 | Session context |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `plan_id` | string | Unique plan identifier (UUID) |
| `steps` | list | Ordered list of execution steps |
| `agents` | list | Agents to invoke per step |
| `budget_allocation` | object | Budget per category |
| `estimated_duration` | integer | Total estimated seconds |
| `parallel_groups` | list | Groups of parallel steps |
| `fallback_options` | object | Alternative plans if primary fails |

### Plan Schema

```yaml
plan:
  plan_id: string
  request_id: string
  steps:
    - step_id: string
      name: string
      agent: string
      parallel_group: string | null
      timeout: integer
      retry_max: integer
      dependencies: list[string]
  budget_allocation:
    flights: decimal
    hotels: decimal
    activities: decimal
    transport: decimal
    buffer: decimal
  estimated_duration: integer
  fallback_options:
    skip_activities: boolean
    skip_transport: boolean
    alternative_providers: list[string]
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| All required entities present | required | Critical | Request missing info from user |
| Budget > 0 | threshold | High | Use default budget (destination avg) |
| Departure date is future | business | Critical | Return date error |
| Return date > departure date | business | High | Return date error |
| Destination is valid | business | Critical | Return destination error |
| At least 1 agent selected | business | Critical | Return "cannot fulfill" |
| Budget allocation sums to total | business | Medium | Recalculate allocation |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Profile fetch failure | 1 | None | Use default profile |
| Budget calculation failure | 1 | None | Skip budget check |
| Plan generation failure | 1 | None | Use simplified plan |
| Agent registry unavailable | 1 | Linear 2s | Use cached agent list |

### Retry Decision Tree

```
Plan Generation Fails
    │
    ├── Profile fetch fails?
    │   └── Yes → Use default profile, retry once
    │
    ├── Budget calculation fails?
    │   └── Yes → Skip budget check, continue
    │
    ├── Agent registry unavailable?
    │   └── Yes → Use cached agent list (max 1 retry)
    │
    └── Plan generation fails?
        └── Yes → Generate simplified plan (flight + hotel only)
```

---

## Timing

| Metric | Target | Warning | Timeout | Critical |
|--------|--------|---------|---------|----------|
| Profile lookup | < 100ms | 200ms | 500ms | 1s |
| Budget calculation | < 200ms | 500ms | 1s | 2s |
| Plan generation | < 500ms | 1s | 2s | 5s |
| Agent selection | < 100ms | 200ms | 500ms | 1s |
| **Total Step** | < 1s | 3s | 10s | 15s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Missing entities | E2001 | "I need a few more details..." | Request info |
| Invalid dates | E2002 | "The travel dates seem invalid" | Return error |
| Budget exceeded | E2003 | "This exceeds your budget. Here are alternatives..." | Show options |
| No agents available | E2004 | "Service temporarily unavailable" | Return error |
| Plan generation failed | E2005 | "Let me try a simpler approach..." | Simplify plan |

### Error Response Format

```json
{
  "error": false,
  "warning": true,
  "warning_code": "W2003",
  "message": "This trip exceeds your budget of $2,000. Here are some alternatives:",
  "plan": {
    "total_cost": 2450,
    "suggestions": [
      "Consider a 3-star hotel instead of 4-star",
      "Book in advance for 15% savings",
      "Alternative dates: 1 week later saves $300"
    ]
  },
  "request_id": "req_abc123"
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| Profile Agent | Internal | Yes |
| Budget Agent | Internal | Yes |
| User Profile Store | Internal | Yes |
| Agent Registry | Internal | Yes |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Plan generated successfully | Success rate | > 99% |
| All required agents selected | Accuracy | 100% |
| Budget allocation valid | Accuracy | > 99% |
| Estimated duration accurate | Within 50% of actual | > 80% |
| Fallback plan available | Coverage | 100% |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `plan_generated` | plan_id, request_id, steps_count | After plan creation |
| `budget_allocated` | plan_id, allocations | After budget calc |
| `agent_selected` | plan_id, agent_name, role | Per agent selection |
| `plan_completed` | plan_id, duration, status | After planning done |

---

## Notes

- Plan must be idempotent (safe to retry)
- Log all planning decisions for optimization
- Track planning accuracy vs actual execution
- Cache common plans for similar requests
- Consider user's past choices in planning

---

*Step 2 of 12 | Planning*
