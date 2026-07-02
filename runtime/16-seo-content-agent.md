# SEO Content Agent

## Agent ID
`agent_seo_content_016`

## Role
Generates SEO-optimized content for travel itineraries including meta descriptions, titles, structured data, and keyword optimization.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Generate meta titles | Critical |
| 2 | Generate meta descriptions | Critical |
| 3 | Create structured data | High |
| 4 | Optimize keywords | High |
| 5 | Generate Open Graph tags | Medium |
| 6 | Create Twitter Card tags | Medium |
| 7 | Validate SEO scores | High |
| 8 | Suggest improvements | Medium |
| 9 | Handle multilingual SEO | Medium |
| 10 | Generate canonical URLs | Low |

---

## Input Schema

```yaml
SEOContentInput:
  type: object
  required:
    - request_id
    - content
    - target_type
  properties:
    request_id:
      type: string
      format: uuid
    content:
      type: object
      description: Travel content to optimize
    target_type:
      type: string
      enum: [itinerary, destination, hotel, activity, landing_page]
    language:
      type: string
      default: en
    target_keywords:
      type: array
      items:
        type: string
      nullable: true
    target_audience:
      type: string
      enum: [families, couples, solo, business, luxury, budget]
      nullable: true
    options:
      type: object
      properties:
        max_title_length:
          type: integer
          default: 60
        max_description_length:
          type: integer
          default: 160
        include_structured_data:
          type: boolean
          default: true
        include_open_graph:
          type: boolean
          default: true
        include_twitter_card:
          type: boolean
          default: false
        keyword_density:
          type: number
          default: 0.02
          minimum: 0.01
          maximum: 0.05
        target_url:
          type: string
          format: uri
          nullable: true

---

## Output Schema

```yaml
SEOContentOutput:
  type: object
  required:
    - request_id
    - status
    - seo_data
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, error]
    seo_data:
      type: object
      properties:
        title:
          type: string
        meta_description:
          type: string
        keywords:
          type: array
          items:
            type: string
        structured_data:
          type: object
          nullable: true
        open_graph:
          type: object
          properties:
            title:
              type: string
            description:
              type: string
            image:
              type: string
              format: uri
            url:
              type: string
              format: uri
            type:
              type: string
          nullable: true
        twitter_card:
          type: object
          properties:
            card:
              type: string
            title:
              type: string
            description:
              type: string
            image:
              type: string
              format: uri
          nullable: true
        canonical_url:
          type: string
          format: uri
          nullable: true
        seo_score:
          type: number
          minimum: 0
          maximum: 100
        readability_score:
          type: number
          minimum: 0
          maximum: 100
        keyword_analysis:
          type: object
          properties:
            primary_keyword:
              type: string
            keyword_density:
              type: number
            keyword_placement:
              type: array
              items:
                type: string
            missing_keywords:
              type: array
              items:
                type: string
        recommendations:
          type: array
          items:
            type: object
            properties:
              category:
                type: string
              suggestion:
                type: string
              priority:
                type: string
                enum: [high, medium, low]
        generation_time_ms:
          type: integer
```

---

## Internal State

```yaml
InternalState:
  type: object
  properties:
    keyword_database:
      type: object
    seo_rules:
      type: object
    analytics_cache:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Generate unique titles | Yes |
| R002 | Include target keywords | Yes |
| R003 | Follow character limits | Yes |
| R004 | Create valid structured data | Yes |
| R005 | Include all required meta tags | Yes |
| R006 | Validate SEO score | Yes |
| R007 | Provide improvement suggestions | Yes |
| R008 | Support multilingual content | Yes |
| R009 | Handle duplicate content | Yes |
| R010 | Generate canonical URLs | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Generation timeout | 1 | None | Basic SEO |
| Score below threshold | 1 | None | Add keywords |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| SEO score | 80 | Add keywords |
| Readability score | 70 | Simplify |
| Keyword density | 0.01-0.05 | Adjust |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Keyword Database | Read | 7 days | Keyword data |
| SEO Rules | Read | 30 days | SEO guidelines |
| Analytics Cache | Read/Write | 24 hours | Performance data |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `seo_analyzer` | Read | 100/min |
| `keyword_researcher` | Read | 100/min |
| `structured_data_generator` | Read | 100/min |
| `content_analyzer` | Read | 100/min |

---

## Communication Protocol

```yaml
MessageType:
  - SEO_REQUEST:
      direction: inbound
  - SEO_RESPONSE:
      direction: outbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Generation fail | Error check | Return basic SEO | Log |
| Score low | Threshold | Add keywords | Log |
| Invalid data | Validation | Fix issues | Log |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| SEO score | Score | > 80 |
| Readability score | Score | > 70 |
| Title uniqueness | Rate | 100% |
| Keyword inclusion | Rate | > 90% |
| Response time | Latency | < 3s |

---

## Configuration

```yaml
Configuration:
  seo_timeout_ms: 10000
  min_seo_score: 80
  min_readability_score: 70
  max_title_length: 60
  max_description_length: 160
  keyword_density_range:
    min: 0.01
    max: 0.05
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
