# WORKFLOW.md — Travel AI Agent Workflow

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | End-to-end travel planning workflow from client request to delivery |
| **Trigger** | Client request received via chat, API, or webhook |
| **Scope** | Full planning → search → comparison → validation → rendering → delivery |
| **Owner** | Orchestrator Agent |
| **Version** | 1.0.0 |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                              │
│                    (Chat / API / Webhook)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: CLIENT REQUEST                                         │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   Router    │  │   Session   │                              │
│  │    Agent    │  │    Agent    │                              │
│  └─────────────┘  └─────────────┘                              │
│  - Intent classification                                        │
│  - Entity extraction                                            │
│  - Session initialization                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: PLANNING                                               │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │ Orchestrator│  │   Budget    │                              │
│  │    Agent    │  │    Agent    │                              │
│  └─────────────┘  └─────────────┘                              │
│  - Decompose request                                            │
│  - Select agents                                                │
│  - Allocate budget                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ STEP 3: FLIGHT SEARCH │ │ STEP 4: HOTEL SEARCH  │ │ STEP 5: ACTIVITIES    │
│ (Parallel)            │ │ (Parallel)            │ │ (Parallel)            │
│ ┌─────────────┐       │ │ ┌─────────────┐       │ │ ┌─────────────┐       │
│ │   Flight    │       │ │ │   Hotel     │       │ │ │ Activities  │       │
│ │    Agent    │       │ │ │    Agent    │       │ │ │    Agent    │       │
│ └─────────────┘       │ │ └─────────────┘       │ │ └─────────────┘       │
│ ┌─────────────┐       │ │ ┌─────────────┐       │ │ ┌─────────────┐       │
│ │   Price     │       │ │ │   Price     │       │ │ │   Review    │       │
│ │  Monitor    │       │ │ │  Monitor    │       │ │ │    Agent    │       │
│ └─────────────┘       │ │ └─────────────┘       │ │ └─────────────┘       │
│ - Search flights      │ │ - Search hotels        │ │ - Search activities   │
│ - Compare prices      │ │ - Check availability   │ │ - Fetch reviews       │
│ - Track trends        │ │ - Track prices         │ │ - Compare options     │
└───────────┬───────────┘ └───────────┬───────────┘ └───────────┬───────────┘
            │                         │                         │
            │                    ┌────┴────┐                    │
            │                    │         │                    │
            │                    ▼         │                    │
            │       ┌────────────────────┐ │                    │
            │       │ STEP 6: TRANSSPORT │ │                    │
            │       │ ┌─────────────┐    │ │                    │
            │       │ │  Transport  │    │ │                    │
            │       │ │    Agent    │    │ │                    │
            │       │ └─────────────┘    │ │                    │
            │       │ - Airport transfer │ │                    │
            │       │ - Public transit   │ │                    │
            │       │ - Taxi/rideshare   │ │                    │
            │       └─────────┬──────────┘ │                    │
            │                 │            │                    │
            └─────────────────┼────────────┘────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: PRICE COMPARISON                                       │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   Budget    │  │  Currency   │                              │
│  │    Agent    │  │    Agent    │                              │
│  └─────────────┘  └─────────────┘                              │
│  - Aggregate costs                                              │
│  - Compare to budget                                            │
│  - Generate recommendations                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: VALIDATION                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Validate   │  │    Visa     │  │   Weather   │            │
│  │    Agent    │  │    Agent    │  │    Agent    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  - Schema validation                                            │
│  - Visa requirements                                            │
│  - Weather forecast                                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 9: CONTENT WRITING                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Template Engine                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│  - Generate itinerary                                           │
│  - Day-by-day breakdown                                        │
│  - Travel tips                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 10: HTML RENDERING                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  HTML Renderer                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  - Render responsive HTML                                       │
│  - Inline CSS                                                   │
│  - Embed images                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 11: QUALITY ASSURANCE                                     │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │  Analytics  │  │  Validate   │                              │
│  │    Agent    │  │    Agent    │                              │
│  └─────────────┘  └─────────────┘                              │
│  - Validate links                                               │
│  - Verify prices                                                │
│  - Spell check                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 12: DELIVERY                                              │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │    Notify   │  │   Profile   │                              │
│  │    Agent    │  │    Agent    │                              │
│  └─────────────┘  └─────────────┘                              │
│  - Send via channel                                             │
│  - Track delivery                                               │
│  - Update analytics                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step Summary Table

| Step | Name | Primary Agent(s) | Parallel | Timeout | Retry Max |
|------|------|------------------|----------|---------|-----------|
| 1 | Client Request | Router, Session | No | 5s | 2 |
| 2 | Planning | Orchestrator, Budget | No | 10s | 1 |
| 3 | Flight Search | Flight, PriceMonitor | Yes | 15s | 3 |
| 4 | Hotel Search | Hotel, PriceMonitor | Yes | 15s | 3 |
| 5 | Activities Search | Activities, Review | Yes | 10s | 2 |
| 6 | Transportation | Transport | No | 10s | 2 |
| 7 | Price Comparison | Budget, Currency | No | 5s | 1 |
| 8 | Validation | Validate, Visa, Weather | No | 10s | 1 |
| 9 | Content Writing | Template Engine | No | 10s | 1 |
| 10 | HTML Rendering | HTML Renderer | No | 15s | 2 |
| 11 | Quality Assurance | Analytics, Validate | No | 10s | 0 |
| 12 | Delivery | Notify, Profile | No | 30s | 3 |

---

## Parallel Execution Rules

### Parallel Groups

| Group | Steps | Condition |
|-------|-------|-----------|
| **G1** | 3, 4, 5 | All start simultaneously after Step 2 |
| **G2** | 6 | Starts after Step 4 completes (needs hotel location) |

### Concurrency Limits

| Metric | Value |
|--------|-------|
| Max concurrent agents | 3 |
| Max concurrent API calls | 5 |
| Max memory per step | 256MB |
| Max output per step | 1MB |

### Synchronization Points

```
Step 2 completes
    │
    ├──→ Step 3 (start)
    ├──→ Step 4 (start)
    └──→ Step 5 (start)
            │
            ├──→ Step 4 completes ──→ Step 6 (start)
            │
            └──→ ALL of [3, 4, 5, 6] complete ──→ Step 7 (start)
```

---

## State Machine

### Workflow States

```
                    ┌──────────────┐
                    │   pending    │
                    └──────┬───────┘
                           │ start
                           ▼
                    ┌──────────────┐
              ┌─────│   running    │─────┐
              │     └──────┬───────┘     │
              │            │             │
         error│       complete      partial│
              │            │             │
              ▼            ▼             ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │  failed  │ │ complete │ │ partial  │
       └────┬─────┘ └──────────┘ └────┬─────┘
            │                         │
       retry│                    merge│
            │                         │
            ▼                         ▼
       ┌──────────┐            ┌──────────┐
       │ retrying │            │ merging  │
       └────┬─────┘            └────┬─────┘
            │                       │
            └───────────┬───────────┘
                        │
                        ▼
                 ┌────────────┐
                 │  complete  │
                 └────────────┘
```

### State Transitions

| From | To | Trigger |
|------|----|---------|
| pending | running | Workflow started |
| running | complete | All steps succeed |
| running | partial | Some steps fail (non-critical) |
| running | failed | Critical step fails |
| failed | retrying | Retry triggered |
| retrying | running | Retry attempt started |
| partial | merging | Merging partial results |
| merging | complete | Merge successful |

---

## Error Handling Strategy

### Error Levels

| Level | Name | Action | User Impact |
|-------|------|--------|-------------|
| **L1** | Retry | Automatic retry with backoff | None (transparent) |
| **L2** | Fallback | Use alternative provider/data | Warning shown |
| **L3** | Skip | Skip non-critical step | Partial result |
| **L4** | Abort | Stop workflow | Error message |

### Step Criticality

| Step | Criticality | Error Level | Fallback Available |
|------|-------------|-------------|-------------------|
| 1 | Critical | L4 | No |
| 2 | Critical | L4 | No |
| 3 | High | L1 → L2 → L3 | Yes (cached data) |
| 4 | High | L1 → L2 → L3 | Yes (cached data) |
| 5 | Medium | L1 → L2 → L3 | Yes (skip activities) |
| 6 | Medium | L1 → L2 → L3 | Yes (skip transport) |
| 7 | Critical | L1 → L4 | No |
| 8 | High | L1 → L2 | Yes (partial validation) |
| 9 | High | L1 → L2 | Yes (simplified content) |
| 10 | High | L1 → L2 | Yes (plain HTML) |
| 11 | Medium | L1 → L3 | Yes (skip QA) |
| 12 | Critical | L1 → L2 → L4 | Yes (fallback channel) |

---

## Timeout Matrix

| Step | Warning | Timeout | Critical | Action on Timeout |
|------|---------|---------|----------|-------------------|
| 1 | 3s | 5s | 10s | Abort workflow |
| 2 | 7s | 10s | 15s | Abort workflow |
| 3 | 10s | 15s | 20s | Use cached results |
| 4 | 10s | 15s | 20s | Use cached results |
| 5 | 7s | 10s | 15s | Skip activities |
| 6 | 7s | 10s | 15s | Skip transport |
| 7 | 3s | 5s | 10s | Use last known values |
| 8 | 7s | 10s | 15s | Partial validation |
| 9 | 7s | 10s | 15s | Simplified content |
| 10 | 10s | 15s | 20s | Plain HTML |
| 11 | 7s | 10s | 15s | Skip QA |
| 12 | 20s | 30s | 60s | Queue for retry |

---

## Performance Targets

### End-to-End Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Total workflow (P50) | < 45s | > 60s |
| Total workflow (P95) | < 80s | > 100s |
| Total workflow (P99) | < 120s | > 150s |
| Success rate | > 95% | < 90% |
| Partial completion rate | < 10% | > 20% |

### Per-Step Targets

| Step | P50 | P95 | P99 |
|------|-----|-----|-----|
| 1 | 500ms | 1s | 2s |
| 2 | 700ms | 1.5s | 3s |
| 3 | 3s | 5s | 8s |
| 4 | 3s | 5s | 8s |
| 5 | 2s | 4s | 6s |
| 6 | 2s | 4s | 6s |
| 7 | 300ms | 1s | 2s |
| 8 | 1.5s | 3s | 5s |
| 9 | 2s | 4s | 6s |
| 10 | 2s | 4s | 6s |
| 11 | 1.5s | 3s | 5s |
| 12 | 3s | 8s | 15s |

---

## Monitoring

### Prometheus Metrics

| Metric | Type | Labels |
|--------|------|--------|
| `workflow_started_total` | Counter | intent, priority |
| `workflow_completed_total` | Counter | status, duration_bucket |
| `workflow_step_duration_seconds` | Histogram | step_name |
| `workflow_step_errors_total` | Counter | step_name, error_type |
| `workflow_agent_calls_total` | Counter | agent_name, status |
| `workflow_agent_latency_seconds` | Histogram | agent_name |
| `workflow_cache_hits_total` | Counter | cache_type |
| `workflow_cache_misses_total` | Counter | cache_type |
| `workflow_active_workflows` | Gauge | - |

### Grafana Dashboards

| Dashboard | Panels |
|-----------|--------|
| **Workflow Overview** | Active workflows, success rate, avg duration |
| **Step Performance** | Per-step latency, error rates, throughput |
| **Agent Health** | Agent call rates, error rates, latency |
| **Cache Performance** | Hit rates, miss rates, eviction rates |
| **Error Analysis** | Error distribution, retry rates, fallback usage |

### Alert Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| HighErrorRate | error_rate > 5% for 5m | Warning |
| WorkflowTimeout | p99_duration > 150s for 5m | Critical |
| AgentDown | agent_unavailable > 1m | Critical |
| CacheLowHitRate | hit_rate < 50% for 15m | Warning |
| RetryStorm | retry_rate > 20% for 5m | Warning |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-01 | Initial workflow with 12 steps |

---

*Last Updated: 2026-07-01*
*Workflow Version: 1.0.0*
