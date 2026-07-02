# Research Agent

## Agent ID
`agent_research_017`

## Role
Conducts deep research on destinations, attractions, local customs, and travel recommendations using multiple sources.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Research destinations | Critical |
| 2 | Find attractions | High |
| 3 | Discover local customs | High |
| 4 | Identify hidden gems | Medium |
| 5 | Verify information | Critical |
| 6 | Compile recommendations | High |
| 7 | Handle multiple sources | Medium |
| 8 | Validate data accuracy | Critical |
| 9 | Support multiple languages | Medium |
| 10 | Generate research reports | Low |

---

## Input Schema

```yaml
ResearchInput:
  type: object
  required:
    - request_id
    - research_type
    - query
  properties:
    request_id:
      type: string
      format: uuid
    research_type:
      type: string
      enum: [destination, attractions, customs, restaurants, hidden_gems, safety, transportation]
    query:
      type: object
      required:
        - destination
      properties:
        destination:
          type: string
        country:
          type: string
          nullable: true
        interests:
          type: array
          items:
            type: string
          nullable: true
        travel_style:
          type: string
          enum: [budget, mid_range, luxury]
          nullable: true
        duration_days:
          type: integer
          nullable: true
    options:
      type: object
      properties:
        max_results:
          type: integer
          default: 20
        min_quality_score:
          type: number
          default: 0.7
        include_reviews:
          type: boolean
          default: true
        include_photos:
          type: boolean
          default: false
        sources:
          type: array
          items:
            type: string
            enum: [tripadvisor, yelp, google, lonely_planet,TripAdvisor,local_guides]
          nullable: true
        language:
          type: string
          default: en
        freshness_days:
          type: integer
          default: 365
```

---

## Output Schema

```yaml
ResearchOutput:
  type: object
  required:
    - request_id
    - status
    - research_results
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, error]
    research_results:
      type: object
      properties:
        destination_summary:
          type: object
          properties:
            name:
              type: string
            country:
              type: string
            description:
              type: string
            best_time_to_visit:
              type: string
            average_budget:
              type: object
            safety_rating:
              type: number
            family_friendly:
              type: boolean
        attractions:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              type:
                type: string
              description:
                type: string
              rating:
                type: number
              review_count:
                type: integer
              price_range:
                type: string
              recommended_duration:
                type: string
              tips:
                type: array
                items:
                  type: string
        local_customs:
          type: array
          items:
            type: object
            properties:
              category:
                type: string
              custom:
                type: string
              importance:
                type: string
                enum: [must_know, recommended, optional]
        hidden_gems:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              description:
                type: string
              why_special:
                type: string
        practical_info:
          type: object
          properties:
            currency:
              type: string
            language:
              type: string
            time_zone:
              type: string
            emergency_numbers:
              type: object
            visa_requirements:
              type: string
            health_restrictions:
              type: array
              items:
                type: string
        source_count:
          type: integer
        confidence_score:
          type: number
        research_time_ms:
          type: integer
```

---

## Internal State

```yaml
InternalState:
  type: object
  properties:
    source_cache:
      type: object
    quality_index:
      type: object
    provider_health:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Verify information across sources | Yes |
| R002 | Prioritize recent information | Yes |
| R003 | Include diverse perspectives | Yes |
| R004 | Handle conflicting information | Yes |
| R005 | Validate data accuracy | Yes |
| R006 | Include practical details | Yes |
| R007 | Support multiple languages | Yes |
| R008 | Rate source quality | Yes |
| R009 | Provide confidence scores | Yes |
| R010 | Handle missing information gracefully | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Source timeout | 1 | None | Skip source |
| Provider fail | 2 | Linear 1s/2s | Try alternative |
| Rate limit hit | 1 | Exponential 5s | Wait and retry |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Source quality | 0.7 | Flag low quality |
| Data freshness | 0.8 | Note outdated |
| Information accuracy | 0.9 | Verify manually |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Source Cache | Read/Write | 24 hours | Cache results |
| Quality Index | Read/Write | 7 days | Source quality |
| Provider Health | Read/Write | 5 min | Provider status |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `web_search_api` | Read | 100/min |
| `travel_api` | Read | 100/min |
| `review_api` | Read | 100/min |
| `news_api` | Read | 50/min |
| `local_database` | Read | Unlimited |

---

## Communication Protocol

```yaml
MessageType:
  - RESEARCH_REQUEST:
      direction: inbound
  - RESEARCH_RESPONSE:
      direction: outbound
  - RESEARCH_PROGRESS:
      direction: outbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Source timeout | Timer | Skip source | Log |
| Provider fail | Health check | Try alternative | Alert ops |
| Data conflict | Validation | Note discrepancy | Log |
| Rate limit | Error check | Wait and retry | Log |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Information accuracy | Rate | > 90% |
| Source diversity | Count | > 3 |
| Research completion | Rate | > 95% |
| Response time | Latency | < 15s |
| User satisfaction | Rating | > 4.0 |

---

## Configuration

```yaml
Configuration:
  research_timeout_ms: 30000
  max_concurrent_sources: 5
  min_sources_for_accuracy: 3
  cache_ttl_ms: 86400000
  quality_threshold: 0.7
  freshness_threshold_days: 365
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
