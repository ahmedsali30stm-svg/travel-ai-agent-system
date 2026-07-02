# Planner Agent

## Agent ID
`agent_planner_002`

## Role
Decomposes complex travel requests into executable task sequences, manages dependencies between tasks, allocates resources, and generates optimized execution plans.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Decompose user requests into sub-tasks | Critical |
| 2 | Identify task dependencies | Critical |
| 3 | Generate execution plans | Critical |
| 4 | Optimize for cost and time | High |
| 5 | Allocate budget across categories | High |
| 6 | Handle multi-city/complex itineraries | High |
| 7 | Manage plan versioning | Medium |
| 8 | Provide plan alternatives | Medium |
| 9 | Validate plan feasibility | Critical |
| 10 | Track plan execution progress | High |

---

## Input Schema

```yaml
PlannerInput:
  type: object
  required:
    - request_id
    - intent
    - entities
  properties:
    request_id:
      type: string
      format: uuid
    intent:
      type: string
    entities:
      type: object
      required:
        - destination
      properties:
        origin:
          type: string
        destination:
          type: string
        departure_date:
          type: string
          format: date
        return_date:
          type: string
          format: date
        passengers:
          type: integer
          minimum: 1
          maximum: 20
        budget:
          type: object
          properties:
            amount:
              type: number
            currency:
              type: string
              format: iso-4217
        preferences:
          type: object
    user_profile:
      type: object
    constraints:
      type: object
      properties:
        max_duration_hours:
          type: number
        max_budget:
          type: number
        required_services:
          type: array
          items:
            type: string
        excluded_services:
          type: array
          items:
            type: string
    context:
      type: object
```

---

## Output Schema

```yaml
PlannerOutput:
  type: object
  required:
    - plan_id
    - status
    - tasks
    - estimated_duration_ms
    - estimated_cost
  properties:
    plan_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [ready, needs_info, infeasible]
    tasks:
      type: array
      items:
        $ref: '#/TaskDefinition'
    estimated_duration_ms:
      type: integer
    estimated_cost:
      type: object
      properties:
        total:
          type: number
        breakdown:
          type: object
        currency:
          type: string
    alternatives:
      type: array
      items:
        type: object
    warnings:
      type: array
      items:
        type: string
    metadata:
      type: object

TaskDefinition:
  type: object
  required:
    - task_id
    - agent_id
    - action
    - order
  properties:
    task_id:
      type: string
    agent_id:
      type: string
      enum:
        - agent_flight_004
        - agent_hotel_003
        - agent_activities_005
        - agent_transportation_006
        - agent_visa_007
        - agent_weather_008
        - agent_currency_009
        - agent_price_intelligence_010
        - agent_validation_011
        - agent_qa_012
        - agent_html_renderer_013
        - agent_pdf_generator_014
        - agent_image_collector_015
        - agent_seo_content_016
        - agent_research_017
    action:
      type: string
    parameters:
      type: object
    dependencies:
      type: array
      items:
        type: string
    timeout_ms:
      type: integer
      default: 15000
    retry_max:
      type: integer
      default: 2
    priority:
      type: string
      enum: [low, medium, high, critical]
      default: medium
    parallel_group:
      type: string
      nullable: true
    conditions:
      type: array
      items:
        type: object
        properties:
          field:
            type: string
          operator:
            type: string
            enum: [eq, ne, gt, lt, gte, lte, in, not_in]
          value:
            type: any
```

---

## Internal State

```yaml
InternalState:
  type: object
  properties:
    active_plans:
      type: object
      description: Map of plan_id to plan state
    plan_templates:
      type: object
      description: Common plan templates
    execution_history:
      type: array
      description: Recent plan executions
    cost_estimates:
      type: object
      description: Cached cost estimates
    dependency_graph:
      type: object
      description: Task dependency graph
```

### State Machine

```
IDLE
  │
  ├── [request received] → ANALYZING
  │
ANALYZING
  │
  ├── [entities complete] → DECOMPOSING
  ├── [entities incomplete] → REQUESTING_INFO
  │
REQUESTING_INFO
  │
  ├── [info received] → ANALYZING
  │
DECOMPOSING
  │
  ├── [tasks generated] → OPTIMIZING
  │
OPTIMIZING
  │
  ├── [plan optimized] → VALIDATING
  │
VALIDATING
  │
  ├── [plan valid] → READY
  ├── [plan invalid] → DECOMPOSING (retry)
  │
READY
  │
  ├── [plan delivered] → TRACKING
  │
TRACKING
  │
  ├── [all tasks complete] → COMPLETE
  ├── [task failed] → RECOVERING
  │
RECOVERING
  │
  ├── [recovery successful] → TRACKING
  ├── [recovery failed] → FAILED
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Maximum 20 tasks per plan | Yes |
| R002 | Maximum 3 parallel task groups | Yes |
| R003 | Plan must have valid dependencies (no cycles) | Yes |
| R004 | Budget allocation must sum to total budget | Yes |
| R005 | Critical tasks cannot be skipped | Yes |
| R006 | Plan must complete within timeout | Yes |
| R007 | All tasks must have valid agent assignments | Yes |
| R008 | Dependencies must reference existing tasks | Yes |
| R009 | Parallel tasks must not have dependencies | Yes |
| R010 | Plan alternatives must be provided when cost > budget | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Planning timeout | 1 | None | Simplified plan |
| Dependency cycle detected | 0 | N/A | Return error |
| Budget calculation failure | 1 | Linear 1s | Use estimates |
| Task generation failure | 1 | None | Reduce scope |
| Optimization failure | 0 | N/A | Use default order |

---

## Confidence Score

```yaml
ConfidenceScoring:
  entity_coverage:
    description: Percentage of required entities present
    threshold: 0.8
    action_below: request_missing_info
  plan_feasibility:
    description: Likelihood plan can execute successfully
    threshold: 0.7
    action_below: provide_alternatives
  cost_confidence:
    description: Confidence in cost estimates
    threshold: 0.6
    action_below: flag_as_estimate
  dependency_validity:
    description: All dependencies resolvable
    threshold: 1.0
    action_below: reject_plan
```

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Session Context | Read | 1 hour | User session data |
| User Profile | Read | 24 hours | Preferences, history |
| Plan Templates | Read | 24 hours | Common plans |
| Cost Estimates | Read/Write | 1 hour | Price data |
| Execution History | Read/Write | 7 days | Past plans |
| Task Definitions | Read/Write | 1 hour | Current plan |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `plan_store` | Read/Write | Unlimited |
| `cost_estimator` | Read | 100/min |
| `dependency_validator` | Read | Unlimited |
| `template_engine` | Read | 100/min |
| `budget_calculator` | Read | 100/min |
| `optimization_engine` | Read | 50/min |
| `session_store` | Read | Unlimited |
| `user_profile_store` | Read | 100/min |

---

## Communication Protocol

### Message Types

```yaml
MessageType:
  - PLAN_REQUEST:
      description: Request to create a plan
      direction: inbound
  - PLAN_RESPONSE:
      description: Created plan
      direction: outbound
  - TASK_UPDATE:
      description: Task execution update
      direction: inbound
  - PLAN_MODIFICATION:
      description: Modify existing plan
      direction: inbound
  - PLAN_STATUS:
      description: Current plan status
      direction: outbound
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/plans` | Create new plan |
| GET | `/plans/{plan_id}` | Get plan details |
| PUT | `/plans/{plan_id}` | Update plan |
| DELETE | `/plans/{plan_id}` | Cancel plan |
| POST | `/plans/{plan_id}/execute` | Start execution |
| GET | `/plans/{plan_id}/status` | Get execution status |

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Invalid entities | Schema check | Request missing info | Prompt user |
| Infeasible plan | Validation | Return alternatives | Adjust constraints |
| Task dependency error | Graph validation | Remove invalid deps | Recalculate |
| Budget exceeded | Cost check | Warn user | Suggest cheaper options |
| Timeout | Timer | Return partial plan | Extend timeout |
| Optimization failure | Error | Use default order | Log, continue |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Plan generation success | Rate | > 98% |
| Plan feasibility | Rate | > 95% |
| Plan generation time | Latency | < 2s |
| Cost estimate accuracy | vs actual | Within 15% |
| User plan acceptance | Rate | > 80% |
| Task completion rate | Rate | > 95% |

---

## Configuration

```yaml
Configuration:
  max_tasks_per_plan: 20
  max_parallel_groups: 3
  max_plan_duration_ms: 60000
  default_task_timeout_ms: 15000
  budget_buffer_percentage: 10
  cost_estimate_confidence: 0.7
  enable_optimization: true
  enable_alternatives: true
  max_alternatives: 3
  plan_ttl_ms: 3600000
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
