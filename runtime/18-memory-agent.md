# Memory Agent

## Agent ID
`agent_memory_018`

## Role
Manages shared memory operations including read, write, search, and synchronization across all agents.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Read from memory | Critical |
| 2 | Write to memory | Critical |
| 3 | Search memory | High |
| 4 | Synchronize memory | High |
| 5 | Handle conflicts | High |
| 6 | Manage TTLs | Medium |
| 7 | Compress old data | Medium |
| 8 | Archive historical data | Low |
| 9 | Generate memory reports | Low |
| 10 | Ensure data consistency | Critical |

---

## Input Schema

```yaml
MemoryInput:
  type: object
  required:
    - request_id
    - operation
    - memory_type
  properties:
    request_id:
      type: string
      format: uuid
    operation:
      type: string
      enum: [read, write, search, delete, sync, list_keys]
    memory_type:
      type: string
      enum: [shared, conversation, user, session, cache]
    key:
      type: string
      nullable: true
      description: Memory key for read/write
    value:
      type: object
      nullable: true
      description: Value for write operation
    query:
      type: string
      nullable: true
      description: Search query
    filters:
      type: object
      nullable: true
      properties:
        namespace:
          type: string
        tags:
          type: array
          items:
            type: string
        ttl_min:
          type: integer
        created_after:
          type: string
          format: date-time
        created_before:
          type: string
          format: date-time
    options:
      type: object
      properties:
        limit:
          type: integer
          default: 100
        offset:
          type: integer
          default: 0
        order:
          type: string
          enum: [asc, desc]
          default: desc
        include_metadata:
          type: boolean
          default: false
        namespace:
          type: string
          nullable: true
```

---

## Output Schema

```yaml
MemoryOutput:
  type: object
  required:
    - request_id
    - status
    - operation
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, error]
    operation:
      type: string
      enum: [read, write, search, delete, sync, list_keys]
    data:
      type: object
      nullable: true
      description: Response data depends on operation
    metadata:
      type: object
      properties:
        total_count:
          type: integer
        returned_count:
          type: integer
        has_more:
          type: boolean
        latency_ms:
          type: integer
        cache_hit:
          type: boolean
    errors:
      type: array
      items:
        type: object
        properties:
          key:
            type: string
          error_type:
            type: string
          message:
            type: string
```

---

## Internal State

```yaml
InternalState:
  type: object
  properties:
    redis_client:
      type: object
    local_cache:
      type: object
    sync_status:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate operations | Yes |
| R002 | Handle TTLs correctly | Yes |
| R003 | Manage namespaces | Yes |
| R004 | Handle conflicts | Yes |
| R005 | Ensure consistency | Yes |
| R006 | Compress large values | Yes |
| R007 | Handle failures gracefully | Yes |
| R008 | Log all operations | Yes |
| R009 | Rate limit requests | Yes |
| R010 | Clean expired data | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Redis fail | 3 | Exponential 1s/2s/4s | Local cache |
| Timeout | 1 | None | Return error |
| Conflict | 1 | None | Return conflict |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Operation success | 0.99 | Alert |
| Cache hit rate | 0.8 | Optimize cache |
| Sync success | 0.99 | Alert |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| All Types | Read/Write | Configurable | Full access |
| Metrics | Read/Write | 24 hours | Performance |
| Sync Status | Read/Write | 5 minutes | Sync state |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `redis` | Read/Write | Unlimited |
| `local_cache` | Read/Write | Unlimited |
| `compression_service` | Read/Write | 100/min |
| `cleanup_service` | Read/Write | 10/min |

---

## Communication Protocol

```yaml
MessageType:
  - MEMORY_REQUEST:
      direction: inbound
  - MEMORY_RESPONSE:
      direction: outbound
  - MEMORY_SYNC_REQUEST:
      direction: inbound
  - MEMORY_SYNC_RESPONSE:
      direction: outbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Redis fail | Health check | Use local cache | Alert ops |
| Conflict detected | Version check | Return conflict | Log |
| Timeout | Timer | Return error | Log |
| Data corruption | Validation | Return error | Alert ops |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Operation success | Rate | > 99% |
| Read latency | Latency | < 5ms |
| Write latency | Latency | < 10ms |
| Cache hit rate | Rate | > 80% |
| Data consistency | Rate | 100% |

---

## Configuration

```yaml
Configuration:
  redis_host: localhost
  redis_port: 6379
  redis_password: null
  redis_db: 0
  default_ttl_ms: 3600000
  max_key_size_bytes: 1048576
  max_value_size_bytes: 5242880
  cleanup_interval_ms: 3600000
  compression_threshold_bytes: 10240
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
