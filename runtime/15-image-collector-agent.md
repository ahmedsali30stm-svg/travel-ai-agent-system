# Image Collector Agent

## Agent ID
`agent_image_collector_015`

## Role
Collects, validates, optimizes, and serves images for travel content including destinations, hotels, activities, and attractions.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Collect images from providers | Critical |
| 2 | Validate image quality | High |
| 3 | Optimize image sizes | High |
| 4 | Handle image caching | Medium |
| 5 | Provide placeholder images | Medium |
| 6 | Support multiple formats | High |
| 7 | Ensure image licensing | High |
| 8 | Handle image failures | High |
| 9 | Support responsive images | Medium |
| 10 | Generate image thumbnails | Low |

---

## Input Schema

```yaml
ImageCollectorInput:
  type: object
  required:
    - request_id
    - image_query
  properties:
    request_id:
      type: string
      format: uuid
    image_query:
      type: object
      required:
        - type
        - entity_id
      properties:
        type:
          type: string
          enum: [destination, hotel, activity, restaurant, attraction, airline]
        entity_id:
          type: string
        entity_name:
          type: string
          nullable: true
        destination:
          type: string
          nullable: true
    options:
      type: object
      properties:
        count:
          type: integer
          default: 1
          maximum: 20
        min_width:
          type: integer
          default: 800
        min_height:
          type: integer
          default: 600
        max_size_bytes:
          type: integer
          default: 2097152
        formats:
          type: array
          items:
            type: string
            enum: [jpg, png, webp]
          default:
            - jpg
            - webp
        allow_stock:
          type: boolean
          default: false
        allow_user_generated:
          type: boolean
          default: true
    fallback:
      type: object
      properties:
        use_placeholder:
          type: boolean
          default: true
        placeholder_style:
          type: string
          enum: [generic, branded, gradient]
          default: generic
```

---

## Output Schema

```yaml
ImageCollectorOutput:
  type: object
  required:
    - request_id
    - status
    - images
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, error]
    images:
      type: array
      items:
        type: object
        properties:
          image_id:
            type: string
          url:
            type: string
            format: uri
          thumbnail_url:
            type: string
            format: uri
          width:
            type: integer
          height:
            type: integer
          format:
            type: string
          size_bytes:
            type: integer
          source:
            type: string
          license:
            type: string
          attribution:
            type: string
            nullable: true
          alt_text:
            type: string
          is_placeholder:
            type: boolean
          confidence_score:
            type: number
    total_found:
      type: integer
    collection_time_ms:
      type: integer
    warnings:
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
    image_cache:
      type: object
    provider_health:
      type: object
    license_database:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate image URLs | Yes |
| R002 | Check image dimensions | Yes |
| R003 | Verify file size limits | Yes |
| R004 | Check licensing | Yes |
| R005 | Provide alt text | Yes |
| R006 | Cache images | Yes |
| R007 | Handle failures gracefully | Yes |
| R008 | Support multiple formats | Yes |
| R009 | Optimize for web | Yes |
| R010 | Include attribution | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Image load fail | 2 | Linear 1s/2s | Try alternative |
| Provider fail | 1 | None | Try next provider |
| Timeout | 1 | None | Use placeholder |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Image relevance | 0.7 | Try alternative |
| Image quality | 0.8 | Skip |
| License validity | 1.0 | Skip |
| Load success | 0.9 | Use placeholder |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Image Cache | Read/Write | 7 days | Cache images |
| Provider Health | Read/Write | 5 min | Provider status |
| License Database | Read | 30 days | License info |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `image_search_api` | Read | 200/min |
| `image_validator` | Read | 200/min |
| `image_optimizer` | Read/Write | 100/min |
| `image_cache` | Read/Write | Unlimited |
| `placeholder_generator` | Read | Unlimited |

---

## Communication Protocol

```yaml
MessageType:
  - IMAGE_REQUEST:
      direction: inbound
  - IMAGE_RESPONSE:
      direction: outbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Image not found | 404 | Use placeholder | Log |
| Load timeout | Timer | Use alternative | Log |
| License expired | Check | Skip image | Log |
| Provider down | Health | Try alternative | Alert ops |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Image found rate | Rate | > 90% |
| Image load rate | Rate | > 95% |
| Response time | Latency | < 2s |
| Placeholder usage | Rate | < 15% |
| License compliance | Rate | 100% |

---

## Configuration

```yaml
Configuration:
  image_timeout_ms: 10000
  cache_ttl_ms: 604800000
  max_images_per_query: 20
  min_image_width: 800
  min_image_height: 600
  max_image_size_bytes: 2097152
  providers:
    - name: unsplash
      priority: 1
    - name: pexels
      priority: 2
    - name: provider_direct
      priority: 3
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
