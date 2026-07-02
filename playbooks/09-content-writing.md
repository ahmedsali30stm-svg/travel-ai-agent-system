# Step 9: Content Writing

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Generates itinerary document with day-by-day breakdown, booking details, travel tips |
| **Agent(s)** | Template Engine (primary) |
| **Criticality** | High — core output delivered to user |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Template Engine** | Primary | Content generation, formatting, localization |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `all_results` | object | Yes | Steps 3-8 | All search and validation results |
| `user_preferences` | object | Yes | Profile Agent | User style preferences |
| `trip_summary` | object | Yes | Step 7 | Cost breakdown and budget |
| `visa_info` | object | No | Step 8 | Visa requirements |
| `weather_info` | object | No | Step 8 | Weather forecast |
| `language` | string | Yes | Step 1 | Output language |
| `style` | enum | No | User preference | formal, casual, detailed, brief |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `itinerary` | markdown | Full itinerary document |
| `day_summaries` | list | Per-day breakdown |
| `booking_references` | list | All booking references |
| `tips` | list | Travel tips |
| `warnings` | list | Important notes |
| `document_title` | string | Itinerary title |

### Itinerary Structure

```markdown
# [Document Title]

## Trip Overview
- Destination: [city, country]
- Dates: [start] - [end]
- Travelers: [count]
- Total Cost: [amount] [currency]

## Budget Summary
| Category | Cost | % of Total |
|----------|------|------------|
| Flights  | $XXX | XX%        |
| Hotels   | $XXX | XX%        |
| Activities| $XXX | XX%       |
| Transport| $XXX | XX%        |
| **Total**| **$XXX** | **100%** |

## Day 1: [Date]
### Morning
- [Activity/flight details]

### Afternoon
- [Activity/hotel details]

### Evening
- [Activity/dinner details]

## Day 2: [Date]
...

## Booking References
| Booking | Reference | Status |
|---------|-----------|--------|
| Flight  | ABC123    | Confirmed |
| Hotel   | XYZ789    | Confirmed |

## Travel Tips
- [Tip 1]
- [Tip 2]

## Important Notes
- [Warning 1]
- [Warning 2]
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| All sections populated | required | High | Fill with placeholder |
| Dates consistent | business | High | Flag inconsistency |
| No booking conflicts | business | Critical | Resolve conflict |
| Markdown valid | format | Medium | Reformat |
| Cost totals match | business | High | Recalculate |
| All bookings included | business | High | Add missing |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Template render failure | 1 | None | Use basic template |
| Content generation failure | 1 | None | Simplified output |
| Section generation failure | 1 | None | Skip section, add placeholder |

### Retry Decision Tree

```
Content Writing Fails
    │
    ├── Template render fails?
    │   └── Yes → Use basic template (max 1 retry)
    │
    ├── Section generation fails?
    │   └── Yes → Skip section, add "[Content unavailable]"
    │
    └── Total failure?
        └── Yes → Return raw data in simple format
```

---

## Timing

| Metric | Target | Warning | Timeout | Critical |
|--------|--------|---------|---------|----------|
| Template selection | < 50ms | 100ms | 200ms | 500ms |
| Content generation | < 2s | 4s | 5s | 8s |
| Formatting | < 500ms | 1s | 2s | 3s |
| **Total Step** | < 3s | 5s | 10s | 15s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Template unavailable | E9001 | "Generating basic itinerary..." | Use default |
| Content incomplete | E9002 | "Some sections unavailable" | Mark sections |
| Formatting error | E9003 | "Formatting issue. Showing plain text" | Plain text |
| Language unavailable | E9004 | "Showing in English" | Default language |

### Error Response Format

```json
{
  "error": false,
  "warning": true,
  "warning_code": "W9002",
  "message": "Itinerary generated with some sections unavailable",
  "itinerary": "...",
  "missing_sections": ["weather_tips", "local_events"]
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| Template Engine | Internal | Yes |
| Content Templates | Internal | Yes |
| Localization Service | Internal | No |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Itinerary completeness | All sections present | > 95% |
| Content accuracy | vs source data | > 99% |
| Formatting quality | User rating | > 4/5 |
| Language accuracy | Native speaker review | > 90% |
| Generation speed | Latency | < 3 seconds |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `content_generation_started` | request_id, template_id | On start |
| `content_generation_completed` | request_id, sections_count, duration | On completion |
| `section_generated` | section_name, word_count | Per section |
| `template_used` | template_id, language | Template selection |

---

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| Generated content | 15 minutes | Data change |
| Templates | 24 hours | Template update |
| Translations | 24 hours | Translation update |

---

## Notes

- Generate content in user's preferred language
- Include visual separators between days
- Add estimated travel time between locations
- Include emergency contacts for destination
- Track content quality metrics for improvement
- Consider user's past trip preferences

---

*Step 9 of 12 | Content Writing*
