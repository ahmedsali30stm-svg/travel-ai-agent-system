# Step 11: Quality Assurance

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Validates final output: links, prices, spelling, formatting, completeness |
| **Agent(s)** | Analytics Agent (primary), Validate Agent (support) |
| **Criticality** | Medium — ensures quality; can be skipped with warning |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Analytics Agent** | Primary | Quality checks, scoring, issue detection |
| **Validate Agent** | Support | Data validation, link checking |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `html` | string | Yes | Step 10 | Rendered HTML document |
| `all_results` | object | Yes | Steps 3-8 | All search and validation results |
| `original_request` | object | Yes | Step 1 | Original user request |
| `itinerary` | markdown | Yes | Step 9 | Source itinerary content |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `qa_status` | enum | pass, fail, warning |
| `issues` | list | Problems found |
| `score` | float | Quality score (0-100) |
| `fixes_applied` | list | Auto-fixes applied |
| `checks_performed` | list | All checks run |

### QA Issue Schema

```yaml
issue:
  issue_id: string
  category: enum          # link, price, spelling, format, data, brand
  severity: enum          # low, medium, high, critical
  description: string
  location: string        # element/section identifier
  auto_fixable: boolean
  fix_applied: boolean
  original: string        # original value (if applicable)
  corrected: string       # corrected value (if applicable)
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| No broken links | business | High | Remove/fix links |
| Prices match results | business | High | Update prices |
| Dates are correct | business | Critical | Flag for review |
| Spelling check | quality | Medium | Auto-correct |
| No missing sections | business | High | Add placeholders |
| Branding consistent | business | Medium | Re-apply branding |
| All images load | business | Medium | Use placeholders |
| Total cost correct | business | Critical | Recalculate |

### QA Check Matrix

| Check | Category | Severity | Auto-Fix | Timeout |
|-------|----------|----------|----------|---------|
| Link validation | link | High | Remove | 3s |
| Price verification | price | Critical | Update | 2s |
| Date consistency | data | Critical | Flag | 1s |
| Spell check | spelling | Medium | Correct | 3s |
| Section completeness | format | High | Placeholder | 1s |
| Image loading | link | Medium | Placeholder | 2s |
| Brand consistency | brand | Medium | Re-apply | 1s |
| Cost totals | price | Critical | Recalculate | 1s |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| QA check failure | 0 | None | Return issues |
| Auto-fix failure | 0 | None | Flag for manual |
| Link check timeout | 1 | None | Skip link check |
| Spell check timeout | 1 | None | Skip spell check |

### Retry Decision Tree

```
QA Check Fails
    │
    ├── Link check fails?
    │   └── Yes → Remove broken links (no retry)
    │
    ├── Price check fails?
    │   └── Yes → Update prices from source data
    │
    ├── Spell check fails?
    │   └── Yes → Skip spell check (non-critical)
    │
    └── Total QA failure?
        └── Yes → Return raw issues, skip QA
```

---

## Timing

| Metric | Target | Warning | Timeout | Critical |
|--------|--------|---------|---------|----------|
| Link validation | < 1s | 2s | 3s | 5s |
| Price verification | < 500ms | 1s | 2s | 3s |
| Spell check | < 1s | 2s | 3s | 5s |
| Section check | < 500ms | 1s | 2s | 3s |
| **Total Step** | < 2s | 4s | 10s | 15s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Critical issues found | E11001 | "Issues found. Regenerating..." | Return to Step 9 |
| Auto-fix failed | E11002 | "Some issues require manual review" | Flag issues |
| QA timeout | E11003 | "QA check timed out. Proceeding with caution" | Skip QA |
| All checks pass | - | "Quality check passed" | Continue |

### QA Report Format

```json
{
  "qa_status": "warning",
  "score": 87,
  "issues": [
    {
      "category": "link",
      "severity": "medium",
      "description": "Image placeholder used for: activity_photo.jpg",
      "auto_fixable": true,
      "fix_applied": true
    },
    {
      "category": "spelling",
      "severity": "low",
      "description": "Typo: 'resturant' → 'restaurant'",
      "auto_fixable": true,
      "fix_applied": true
    }
  ],
  "fixes_applied": 5,
  "checks_performed": 8
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| Analytics Agent | Internal | Yes |
| Validate Agent | Internal | Yes |
| Link Checker | Internal | Yes |
| Spell Checker | Internal | Yes |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Issue detection rate | Accuracy | > 95% |
| Auto-fix success rate | Fix rate | > 80% |
| False positive rate | Errors | < 5% |
| QA speed | Latency | < 2 seconds |
| Score accuracy | vs manual review | > 90% |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `qa_started` | request_id, checks_count | On start |
| `qa_completed` | request_id, score, issues_count | On completion |
| `issue_found` | issue_id, category, severity | Per issue |
| `fix_applied` | issue_id, fix_type | Per fix |

---

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| QA results | 15 minutes | Content change |
| Spell check dictionary | 24 hours | Dictionary update |
| Link status | 1 hour | Link change |

---

## Notes

- Log all QA scores for quality improvement
- Track common issues for pattern detection
- Build issue pattern database for auto-fix
- Consider adding accessibility checks (WCAG)
- Include performance metrics in QA report

---

*Step 11 of 12 | Quality Assurance*
