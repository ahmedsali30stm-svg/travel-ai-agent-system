# Step 10: HTML Rendering

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Renders itinerary as responsive HTML with inline CSS, images, branding |
| **Agent(s)** | HTML Renderer (primary) |
| **Criticality** | High — final output format delivered to user |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **HTML Renderer** | Primary | HTML generation, CSS inlining, image embedding, responsive design |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `itinerary` | markdown | Yes | Step 9 | Itinerary document |
| `brand_template` | string | Yes | System config | Brand HTML template |
| `images` | list | No | Asset library | Images to embed |
| `user_preferences` | object | No | Profile Agent | Display preferences |
| `colors` | object | No | System config | Brand colors |
| `logo_url` | string | No | System config | Brand logo |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `html` | string | Rendered HTML document |
| `css` | string | Inline styles |
| `image_urls` | list | Embedded image URLs |
| `file_size` | integer | Total size in bytes |
| `render_time` | integer | Render time in ms |

### HTML Structure

```html
<!DOCTYPE html>
<html lang="[language]">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Document Title]</title>
  <style>
    /* Inline CSS */
  </style>
</head>
<body>
  <header>
    <!-- Brand logo and title -->
  </header>
  
  <main>
    <section class="trip-overview">
      <!-- Trip summary -->
    </section>
    
    <section class="budget-summary">
      <!-- Cost breakdown table -->
    </section>
    
    <section class="itinerary">
      <!-- Day-by-day content -->
    </section>
    
    <section class="bookings">
      <!-- Booking references -->
    </section>
    
    <section class="tips">
      <!-- Travel tips -->
    </section>
  </main>
  
  <footer>
    <!-- Brand footer, contact info -->
  </footer>
</body>
</html>
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| HTML is valid | format | High | Re-render |
| CSS is valid | format | Medium | Use default styles |
| Images loaded | resource | Medium | Use placeholders |
| Responsive on mobile | business | High | Fix layout |
| Size < 1MB | threshold | Medium | Optimize |
| All links working | business | Medium | Remove/fix |
| Branding correct | business | High | Re-apply branding |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Render timeout | 2 | Linear 1s | Plain HTML |
| Image load failure | 1 | None | Placeholder images |
| CSS validation failure | 1 | None | Inline styles |
| Template error | 1 | None | Basic template |

### Retry Decision Tree

```
HTML Rendering Fails
    │
    ├── Render timeout?
    │   └── Yes → Retry (max 2x, linear 1s)
    │             └── Still fails? → Return plain HTML
    │
    ├── Image load fails?
    │   └── Yes → Use placeholder image (max 1 retry)
    │
    ├── CSS validation fails?
    │   └── Yes → Use inline styles
    │
    └── Template error?
        └── Yes → Use basic template
```

---

## Timing

| Metric | Target | Warning | Timeout | Critical |
|--------|--------|---------|---------|----------|
| Template render | < 2s | 3s | 5s | 8s |
| Image processing | < 1s | 2s | 3s | 5s |
| CSS inlining | < 500ms | 1s | 2s | 3s |
| **Total Step** | < 3s | 5s | 15s | 20s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Render failure | E10001 | "Generating plain text version" | Plain HTML |
| Image missing | E10002 | "Some images unavailable" | Placeholders |
| CSS error | E10003 | "Using basic styling" | Inline styles |
| Size exceeded | E10004 | "Optimizing for faster load" | Compress |

### Error Response Format

```json
{
  "error": false,
  "warning": true,
  "warning_code": "W10002",
  "message": "Some images could not be loaded. Using placeholders.",
  "html": "...",
  "file_size": 245000,
  "missing_images": 2
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| HTML Renderer Engine | Internal | Yes |
| Brand Templates | Internal | Yes |
| Image CDN | External | Yes |
| CSS Minifier | Internal | No |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| HTML validity | W3C validation | Pass |
| Mobile responsiveness | Viewport test | Pass |
| Render speed | Latency | < 3 seconds |
| File size | Size | < 1MB |
| Image load rate | Success | > 95% |
| Brand consistency | Visual check | 100% |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `html_render_started` | request_id, template_id | On start |
| `html_render_completed` | request_id, file_size, duration | On completion |
| `image_loaded` | image_url, load_time | Per image |
| `image_failed` | image_url, error | Per failure |

---

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| Rendered HTML | 5 minutes | Content change |
| Templates | 24 hours | Template update |
| Optimized images | 7 days | Image update |

---

## Notes

- Always generate responsive HTML for mobile
- Use inline CSS for email compatibility
- Compress images without quality loss
- Include print-friendly styles
- Track render performance for optimization
- Consider accessibility (WCAG 2.1)

---

*Step 10 of 12 | HTML Rendering*
