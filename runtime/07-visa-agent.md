# Visa Agent

## Agent ID
`agent_visa_007`

## Role
Provides visa requirements, application guidance, document checklists, and embassy information for international travel.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Check visa requirements | Critical |
| 2 | Generate document checklists | High |
| 3 | Estimate processing times | High |
| 4 | Provide embassy locations | Medium |
| 5 | Track visa status | Medium |
| 6 | Handle transit visa requirements | High |
| 7 | Provide application guidance | Medium |
| 8 | Track visa policy changes | High |
| 9 | Support multiple nationalities | Critical |
| 10 | Provide fee information | High |

---

## Input Schema

```yaml
VisaInput:
  type: object
  required:
    - request_id
    - nationality
    - destination
    - travel_purpose
    - travel_dates
  properties:
    request_id:
      type: string
      format: uuid
    nationality:
      type: string
      description: ISO 3166-1 alpha-2 country code
    destination:
      type: string
      description: ISO 3166-1 alpha-2 country code
    travel_purpose:
      type: string
      enum:
        - tourism
        - business
        - transit
        - study
        - work
        - medical
        - diplomatic
    travel_dates:
      type: object
      required:
        - entry_date
        - exit_date
      properties:
        entry_date:
          type: string
          format: date
        exit_date:
          type: string
          format: date
    transit_countries:
      type: array
      items:
        type: string
      description: Countries transit through
    passport_expiry:
      type: string
      format: date
    previous_visas:
      type: array
      items:
        type: object
    special_circumstances:
      type: array
      items:
        type: string
```

---

## Output Schema

```yaml
VisaOutput:
  type: object
  required:
    - request_id
    - status
    - visa_required
    - requirements
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, error]
    visa_required:
      type: boolean
    visa_type:
      type: string
      nullable: true
    requirements:
      type: object
      properties:
        documents:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              required:
                type: boolean
              description:
                type: string
              template_url:
                type: string
                format: uri
                nullable: true
        processing_time:
          type: object
          properties:
            standard:
              type: string
            expedited:
              type: string
              nullable: true
        fees:
          type: object
          properties:
            standard:
              type: number
            expedited:
              type: number
              nullable: true
            currency:
              type: string
        application_url:
          type: string
          format: uri
          nullable: true
        embassy:
          type: object
          properties:
            name:
              type: string
            address:
              type: string
            phone:
              type: string
            email:
              type: string
            website:
              type: string
              format: uri
    transit_visa_required:
      type: boolean
      nullable: true
    transit_requirements:
      type: object
      nullable: true
    warnings:
      type: array
      items:
        type: string
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
    visa_database:
      type: object
    policy_cache:
      type: object
    embassy_database:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate nationality code | Yes |
| R002 | Validate destination code | Yes |
| R003 | Check transit visa requirements | Yes |
| R004 | Verify passport validity (6+ months) | Yes |
| R005 | Include all required documents | Yes |
| R006 | Provide accurate processing times | Yes |
| R007 | Include embassy contact info | Yes |
| R008 | Cache results for 24 hours | Yes |
| R009 | Track policy changes | Yes |
| R010 | Support multiple languages | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| API timeout | 1 | None | Use cached data |
| Database unavailable | 1 | None | Provide general guidance |
| Embassy data unavailable | 1 | None | Skip embassy info |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Requirement accuracy | 0.95 | Add disclaimer |
| Processing time accuracy | 0.8 | Show range |
| Document completeness | 0.95 | Include note |
| Fee accuracy | 0.9 | Show "approximate" |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Visa Database | Read | 24 hours | Visa requirements |
| Policy Cache | Read/Write | 24 hours | Cache policies |
| Embassy Database | Read | 7 days | Embassy info |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `visa_database` | Read | Unlimited |
| `embassy_database` | Read | Unlimited |
| `policy_checker` | Read | 100/min |
| `cache_store` | Read/Write | Unlimited |

---

## Communication Protocol

```yaml
MessageType:
  - VISA_CHECK_REQUEST:
      direction: inbound
  - VISA_CHECK_RESPONSE:
      direction: outbound
  - POLICY_UPDATE:
      direction: inbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Database unavailable | Connection check | Use cached data | Alert ops |
| Policy changed | Version check | Update cache | Notify users |
| Embassy data stale | Timestamp check | Refresh data | Log |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Requirement accuracy | Rate | > 95% |
| Response time | Latency | < 2s |
| Document completeness | Rate | > 98% |
| User satisfaction | Rating | > 4.3/5 |

---

## Configuration

```yaml
Configuration:
  cache_ttl_ms: 86400000
  passport_validity_months: 6
  supported_nationalities: 200
  supported_destinations: 200
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
