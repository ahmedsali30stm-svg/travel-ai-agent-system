# QA Agent

## Agent ID
`agent_qa_012`

## Role
Performs quality assurance checks on generated content, validates links, verifies data accuracy, and ensures output meets quality standards.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Validate all links | High |
| 2 | Verify price accuracy | Critical |
| 3 | Check spelling and grammar | Medium |
| 4 | Validate formatting | High |
| 5 | Ensure data consistency | Critical |
| 6 | Check image loading | Medium |
| 7 | Validate HTML structure | High |
| 8 | Generate quality scores | Medium |
| 9 | Apply auto-fixes | Medium |
| 10 | Generate QA reports | Low |

---

## Input Schema

```yaml
QAInput:
  type: object
  required:
    - request_id
    - content_type
    - content
  properties:
    request_id:
      type: string
      format: uuid
    content_type:
      type: string
      enum: [html, markdown, email, notification]
    content:
      type: string
      description: Content to validate
    source_data:
      type: object
      nullable: true
      description: Original data for accuracy check
    checks:
      type: array
      items:
        type: string
        enum:
          - links
          - prices
          - spelling
          - formatting
          - images
          - html
          - consistency
          - accessibility
      default:
        - links
        - prices
        - spelling
        - formatting
    auto_fix:
      type: boolean
      default: true
    quality_threshold:
      type: number
      default: 0.8
      minimum: 0
      maximum: 1
```

---

## Output Schema

```yaml
QAOutput:
  type: object
  required:
    - request_id
    - status
    - qa_status
    - score
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, error]
    qa_status:
      type: string
      enum: [pass, warning, fail]
    score:
      type: number
      minimum: 0
      maximum: 100
    issues:
      type: array
      items:
        type: object
        properties:
          issue_id:
            type: string
          category:
            type: string
            enum: [link, price, spelling, format, data, image, html, accessibility]
          severity:
            type: string
            enum: [low, medium, high, critical]
          description:
            type: string
          location:
            type: string
          auto_fixable:
            type: boolean
          fix_applied:
            type: boolean
          original:
            type: string
            nullable: true
          corrected:
            type: string
            nullable: true
    fixes_applied:
      type: integer
    checks_performed:
      type: array
      items:
        type: string
    duration_ms:
      type: integer
    recommendations:
      type: array
      items:
        type: string
```

---

## Internal State

```yaml
InternalState:
  type: object
  properties:
    spell_checker:
      type: object
    link_checker:
      type: object
    html_validator:
      type: object
    quality_patterns:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate all requested checks | Yes |
| R002 | Auto-fix when enabled | Yes |
| R003 | Generate quality score | Yes |
| R004 | Report all issues found | Yes |
| R005 | Prioritize by severity | Yes |
| R006 | Include fix suggestions | Yes |
| R007 | Handle partial content | Yes |
| R008 | Support multiple formats | Yes |
| R009 | Check accessibility | Yes |
| R010 | Generate actionable reports | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Link check timeout | 1 | None | Skip link check |
| Spell check timeout | 1 | None | Skip spell check |
| HTML validation fail | 0 | N/A | Return issues |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Issue detection | 0.95 | Manual review |
| Auto-fix accuracy | 0.9 | Flag for review |
| Score accuracy | 0.9 | Recalculate |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Spell Dictionary | Read | 24 hours | Spell checking |
| Quality Patterns | Read/Write | 7 days | Learn patterns |
| Issue History | Read/Write | 30 days | Track issues |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `link_checker` | Read | 200/min |
| `spell_checker` | Read | 200/min |
| `html_validator` | Read | 100/min |
| `image_validator` | Read | 100/min |
| `auto_fixer` | Read/Write | 100/min |

---

## Communication Protocol

```yaml
MessageType:
  - QA_REQUEST:
      direction: inbound
  - QA_RESPONSE:
      direction: outbound
  - QA_REPORT:
      direction: outbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Check timeout | Timer | Skip check | Log |
| Fix failed | Error check | Flag issue | Log |
| Content invalid | Validation | Return errors | Log |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Issue detection rate | Rate | > 95% |
| Auto-fix success rate | Rate | > 80% |
| False positive rate | Rate | < 5% |
| Response time | Latency | < 2s |
| Score accuracy | vs manual | > 90% |

---

## Configuration

```yaml
Configuration:
  max_content_size_bytes: 10485760
  link_check_timeout_ms: 5000
  spell_check_timeout_ms: 3000
  quality_threshold: 0.8
  auto_fix_enabled: true
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
