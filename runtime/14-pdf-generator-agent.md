# PDF Generator Agent

## Agent ID
`agent_pdf_generator_014`

## Role
Generates PDF documents from HTML, markdown, or structured data for itineraries, invoices, and travel documents.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Generate PDF from HTML | Critical |
| 2 | Generate PDF from markdown | High |
| 3 | Apply formatting and styles | High |
| 4 | Include images and logos | Medium |
| 5 | Handle page breaks | High |
| 6 | Support headers/footers | Medium |
| 7 | Generate table of contents | Low |
| 8 | Support watermarks | Low |
| 9 | Optimize file size | Medium |
| 10 | Ensure print quality | High |

---

## Input Schema

```yaml
PDFGeneratorInput:
  type: object
  required:
    - request_id
    - source_type
    - source_content
  properties:
    request_id:
      type: string
      format: uuid
    source_type:
      type: string
      enum: [html, markdown, structured_data]
    source_content:
      type: string
      description: HTML, markdown, or JSON content
    template_id:
      type: string
      nullable: true
    options:
      type: object
      properties:
        page_size:
          type: string
          enum: [A4, A3, letter, legal]
          default: A4
        orientation:
          type: string
          enum: [portrait, landscape]
          default: portrait
        margins:
          type: object
          properties:
            top:
              type: string
              default: "20mm"
            bottom:
              type: string
              default: "20mm"
            left:
              type: string
              default: "15mm"
            right:
              type: string
              default: "15mm"
        header:
          type: object
          properties:
            content:
              type: string
            height:
              type: string
              default: "15mm"
        footer:
          type: object
          properties:
            content:
              type: string
            height:
              type: string
              default: "10mm"
            page_numbers:
              type: boolean
              default: true
        watermark:
          type: string
          nullable: true
        quality:
          type: string
          enum: [low, medium, high]
          default: high
        compress:
          type: boolean
          default: true
        password:
          type: string
          nullable: true
          description: Password protect PDF
    brand_config:
      type: object
      nullable: true
```

---

## Output Schema

```yaml
PDFGeneratorOutput:
  type: object
  required:
    - request_id
    - status
    - pdf_url
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, error]
    pdf_url:
      type: string
      format: uri
    file_size_bytes:
      type: integer
    page_count:
      type: integer
    generation_time_ms:
      type: integer
    metadata:
      type: object
      properties:
        title:
          type: string
        author:
          type: string
        created_at:
          type: string
          format: date-time
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
    template_cache:
      type: object
    font_cache:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate source content | Yes |
| R002 | Apply page size correctly | Yes |
| R003 | Handle page breaks | Yes |
| R004 | Include headers/footers | Yes |
| R005 | Add page numbers | Yes |
| R006 | Compress output | Yes |
| R007 | Ensure print quality | Yes |
| R008 | Handle images properly | Yes |
| R009 | Support Unicode | Yes |
| R010 | Generate metadata | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Generation timeout | 2 | Linear 2s | Simplified PDF |
| Image load fail | 1 | None | Skip image |
| Font load fail | 1 | None | Use default |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| PDF validity | 1.0 | Regenerate |
| Image quality | 0.9 | Reduce size |
| Layout accuracy | 0.95 | Adjust |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Templates | Read | 24 hours | PDF templates |
| Font Cache | Read | 7 days | Fonts |
| Generated PDFs | Read/Write | 24 hours | Cache output |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `pdf_engine` | Read/Write | 50/min |
| `html_converter` | Read | 100/min |
| `image_service` | Read | 100/min |
| `file_storage` | Read/Write | 100/min |

---

## Communication Protocol

```yaml
MessageType:
  - PDF_GENERATION_REQUEST:
      direction: inbound
  - PDF_GENERATION_RESPONSE:
      direction: outbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Generation fail | Error check | Return error | Log |
| Image fail | Load check | Skip image | Log |
| Font fail | Load check | Use default | Log |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| PDF validity | Check | 100% |
| Generation speed | Latency | < 10s |
| File size | Size | < 5MB |
| Print quality | DPI | 300 |
| Page accuracy | vs source | 100% |

---

## Configuration

```yaml
Configuration:
  generation_timeout_ms: 30000
  max_file_size_bytes: 5242880
  default_dpi: 300
  supported_fonts:
    - Arial
    - Times New Roman
    - Courier New
    - Helvetica
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
