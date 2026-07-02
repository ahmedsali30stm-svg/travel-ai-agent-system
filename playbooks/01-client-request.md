# Step 1: Client Request

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Entry point. Parses user input, classifies intent, extracts entities, initializes session |
| **Agent(s)** | Router Agent (primary), Session Agent (support) |
| **Criticality** | Critical — workflow cannot proceed without this step |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Router Agent** | Primary | Intent classification, entity extraction, priority assignment |
| **Session Agent** | Support | Session creation, context initialization, history setup |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `message` | string | Yes | User | Raw user message (text or voice transcript) |
| `session_id` | string | No | User/System | Existing session ID (if returning user) |
| `user_id` | string | Yes | Auth system | Authenticated user identifier |
| `timestamp` | datetime | Yes | System | Request timestamp (ISO 8601) |
| `channel` | enum | Yes | System | Input channel: chat, api, webhook |
| `locale` | string | No | User/Browser | User locale (e.g., en-US, fr-FR) |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `request_id` | string | Unique request identifier (UUID) |
| `intent` | enum | Classified intent: booking, inquiry, modification, cancellation |
| `intent_confidence` | float | Confidence score (0.0 - 1.0) |
| `entities` | object | Extracted entities (see schema below) |
| `priority` | enum | Request priority: low, medium, high, urgent |
| `session` | object | Session context object |
| `language` | string | Detected language (ISO 639-1) |

### Entities Schema

```yaml
entities:
  origin: string          # IATA code or city name
  destination: string     # IATA code or city name
  departure_date: date    # YYYY-MM-DD
  return_date: date       # YYYY-MM-DD (optional for one-way)
  passengers: integer     # Number of travelers
  class: enum             # economy, business, first
  budget: decimal         # Budget amount (if specified)
  currency: string        # ISO 4217 currency code
  preferences: object     # Any additional preferences
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| `message` non-empty | required | Critical | Return error: "Message required" |
| `message` < 10,000 chars | length | Warning | Truncate to 10,000 chars + warn |
| `session_id` format valid | format | Medium | Create new session |
| `user_id` exists | business | Critical | Return error: "Authentication required" |
| `intent_confidence` > 0.4 | threshold | Medium | Ask user for clarification |
| `timestamp` is valid datetime | format | Low | Use current time |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| NLP service timeout | 2 | Linear 1s | Use cached intent model |
| Entity extraction failure | 1 | None | Manual entity extraction |
| Session creation failure | 2 | Linear 500ms | In-memory session |
| Language detection failure | 1 | None | Default to en-US |
| Complete NLP failure | 0 | None | Return "unable to understand" error |

### Retry Decision Tree

```
NLP Call Fails
    │
    ├── Is timeout?
    │   ├── Yes → Retry (max 2x, linear 1s backoff)
    │   │         └── Still fails? → Use cached model
    │   └── No → Continue
    │
    ├── Is 5xx error?
    │   ├── Yes → Retry (max 2x, linear 1s backoff)
    │   │         └── Still fails? → Use cached model
    │   └── No → Continue
    │
    └── Is 4xx error?
        └── Yes → Do not retry, return error
```

---

## Timing

| Metric | Target | Warning | Timeout | Critical |
|--------|--------|---------|---------|----------|
| Intent classification | < 500ms | 1s | 2s | 5s |
| Entity extraction | < 300ms | 500ms | 1s | 2s |
| Session initialization | < 100ms | 200ms | 500ms | 1s |
| Language detection | < 100ms | 200ms | 500ms | 1s |
| **Total Step** | < 1s | 2s | 5s | 10s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Empty message | E1001 | "Please provide a message" | Return error |
| Message too long | E1002 | "Message truncated to 10,000 characters" | Truncate + warn |
| Invalid session | E1003 | "Starting new session" | Create new session |
| Low confidence | E1004 | "I didn't understand. Can you rephrase?" | Ask clarification |
| NLP service down | E1005 | "Service temporarily unavailable. Please try again." | Return error |
| Auth required | E1006 | "Please log in to continue" | Return error |

### Error Response Format

```json
{
  "error": true,
  "error_code": "E1004",
  "message": "I didn't understand. Can you rephrase?",
  "suggestions": [
    "I want to book a flight to Paris",
    "Find hotels in Tokyo",
    "What's the weather in London?"
  ],
  "request_id": "req_abc123",
  "timestamp": "2026-07-01T22:00:00Z"
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| NLP Service | External | Yes |
| Session Store (Redis) | Internal | Yes |
| Auth Service | External | Yes |
| Language Detection | External | No |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Intent correctly classified | Accuracy | > 85% |
| Correct agent selected | Accuracy | > 90% |
| Response time | Latency | < 200ms |
| Zero false routing | Critical intents | 100% |
| Session created successfully | Success rate | > 99% |
| Entity extraction accuracy | F1 score | > 80% |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `client_request_received` | request_id, user_id, timestamp | On entry |
| `intent_classified` | intent, confidence, entities | After classification |
| `session_initialized` | session_id, user_id | After session creation |
| `client_request_completed` | request_id, duration, status | On completion |

---

## Notes

- Always respond in user's detected language
- Log all intents for analytics and model improvement
- Track entity extraction accuracy for NLP tuning
- Cache intent model for fallback scenarios
- Consider A/B testing different NLP providers

---

*Step 1 of 12 | Client Request*
