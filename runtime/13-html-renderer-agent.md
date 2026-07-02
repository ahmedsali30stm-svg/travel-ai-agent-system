# HTML Renderer Agent

## Agent ID
`agent_html_renderer_013`

## Role
Renders travel itineraries and content as responsive HTML documents with inline CSS, images, and branding.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Render HTML from markdown | Critical |
| 2 | Apply responsive design | High |
| 3 | Inline CSS styles | High |
| 4 | Embed images | Medium |
| 5 | Apply branding | High |
| 6 | Optimize for email | Medium |
| 7 | Support dark mode | Low |
| 8 | Handle print styles | Low |
| 9 | Ensure accessibility | High |
| 10 | Optimize file size | Medium |

---

## Input Schema

```yaml
HTMLRendererInput:
  type: object
  required:
    - request_id
    - content
    - template_type
  properties:
    request_id:
      type: string
      format: uuid
    content:
      type: object
      description: Content to render
    template_type:
      type: string
      enum: [itinerary, confirmation, invoice, email, notification]
    template_id:
      type: string
      nullable: true
    brand_config:
      type: object
      properties:
        logo_url:
          type: string
          format: uri
        primary_color:
          type: string
          pattern: ^#[0-9A-Fa-f]{6}$
        secondary_color:
          type: string
          pattern: ^#[0-9A-Fa-f]{6}$
        font_family:
          type: string
    language:
      type: string
      default: en
    rtl:
      type: boolean
      default: false
    images:
      type: array
      items:
        type: object
        properties:
          url:
            type: string
            format: uri
          alt:
            type: string
          position:
            type: string
      nullable: true
    options:
      type: object
      properties:
        inline_css:
          type: boolean
          default: true
        responsive:
          type: boolean
          default: true
        dark_mode:
          type: boolean
          default: false
        print_friendly:
          type: boolean
          default: false
        minify:
          type: boolean
          default: true
```

---

## Output Schema

```yaml
HTMLRendererOutput:
  type: object
  required:
    - request_id
    - status
    - html
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, error]
    html:
      type: string
      description: Rendered HTML document
    css:
      type: string
      nullable: true
      description: Separate CSS if not inlined
    file_size_bytes:
      type: integer
    render_time_ms:
      type: integer
    warnings:
      type: array
      items:
        type: string
    metadata:
      type: object
      properties:
        images_loaded:
          type: integer
        images_failed:
          type: integer
        responsive_test:
          type: boolean
        accessibility_score:
          type: number
```

---

## Internal State

```yaml
InternalState:
  type: object
  properties:
    templates:
      type: object
    css_cache:
      type: object
    image_cache:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Generate valid HTML5 | Yes |
| R002 | Inline CSS when requested | Yes |
| R003 | Ensure responsive design | Yes |
| R004 | Handle RTL languages | Yes |
| R005 | Include viewport meta | Yes |
| R006 | Support dark mode | Yes |
| R007 | Optimize image loading | Yes |
| R008 | Minify output | Yes |
| R009 | Include alt text | Yes |
| R010 | Ensure accessibility | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Render timeout | 2 | Linear 1s | Plain HTML |
| Image load fail | 1 | None | Placeholder |
| CSS error | 1 | None | Inline styles |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| HTML validity | 1.0 | Re-render |
| Responsive test | 0.95 | Fix layout |
| Accessibility score | 0.8 | Add attributes |
| Image load rate | 0.9 | Use placeholders |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Templates | Read | 24 hours | HTML templates |
| CSS Cache | Read/Write | 24 hours | Cached CSS |
| Image Cache | Read/Write | 7 days | Cached images |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `template_engine` | Read | 100/min |
| `html_validator` | Read | 100/min |
| `image_service` | Read | 200/min |
| `css_minifier` | Read | Unlimited |
| `html_minifier` | Read | Unlimited |

---

## Communication Protocol

```yaml
MessageType:
  - RENDER_REQUEST:
      direction: inbound
  - RENDER_RESPONSE:
      direction: outbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Render fail | Error check | Return plain HTML | Log |
| Image fail | Load check | Use placeholder | Log |
| CSS error | Validation | Use inline | Log |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| HTML validity | W3C check | Pass |
| Responsive test | Viewport | Pass |
| Render speed | Latency | < 3s |
| File size | Size | < 1MB |
| Accessibility | WCAG | AA |

---

## Configuration

```yaml
Configuration:
  render_timeout_ms: 15000
  max_file_size_bytes: 1048576
  image_timeout_ms: 5000
  default_font: Arial, sans-serif
  default_primary_color: "#1a73e8"
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
