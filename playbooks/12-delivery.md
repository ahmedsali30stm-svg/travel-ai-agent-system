# Step 12: Delivery

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Delivers final itinerary to user via preferred channel, logs analytics, updates profile |
| **Agent(s)** | Notify Agent (primary), Profile Agent (support) |
| **Criticality** | Critical — final step; user must receive output |

---

## Agent(s)

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Notify Agent** | Primary | Multi-channel delivery, delivery tracking, retry logic |
| **Profile Agent** | Support | Profile update, trip history, preference learning |

---

## Inputs

| Input | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| `html` | string | Yes | Step 10 | Rendered HTML document |
| `user_id` | string | Yes | Step 1 | User identifier |
| `delivery_channel` | enum | Yes | User preference | email, sms, push, in_app |
| `trip_id` | string | Yes | Step 2 | Trip identifier |
| `user_email` | string | No | User profile | Email address |
| `user_phone` | string | No | User profile | Phone number |
| `subject` | string | No | System | Email/notification subject |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `delivery_status` | enum | sent, failed, pending |
| `delivery_id` | string | Delivery tracking ID |
| `notification_sent` | boolean | Whether notification sent |
| `profile_updated` | boolean | Whether profile updated |
| `delivery_time` | integer | Delivery time in ms |

### Delivery Result Schema

```yaml
delivery:
  delivery_id: string
  trip_id: string
  user_id: string
  channel: enum
  status: enum          # sent, failed, pending, queued
  timestamp: datetime
  delivery_time_ms: integer
  metadata:
    message_id: string  # Provider message ID
    provider: string    # Delivery provider
    cost: decimal       # Delivery cost (if applicable)
```

---

## Validations

| Rule | Type | Level | Action on Fail |
|------|------|-------|----------------|
| User ID valid | required | Critical | Return error |
| Channel enabled | business | High | Use fallback channel |
| Content ready | business | Critical | Queue for retry |
| Size within limits | business | High | Compress/summarize |
| Email format valid | format | High | Use fallback channel |
| Phone format valid | format | Medium | Use fallback channel |

### Channel Limits

| Channel | Max Size | Format | Fallback |
|---------|----------|--------|----------|
| Email | 10MB | HTML | SMS summary |
| SMS | 1600 chars | Text | Push notification |
| Push | 4KB | JSON | In-app message |
| In-app | Unlimited | HTML | - |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| Email send failure | 3 | Exponential 1s/2s/4s | Try SMS |
| SMS send failure | 2 | Linear 1s | Try push notification |
| Push notification failure | 2 | Linear 1s | Try email |
| Profile update failure | 1 | None | Queue for later |

### Retry Decision Tree

```
Delivery Fails
    │
    ├── Email fails?
    │   ├── Retry (max 3x, exponential 1s/2s/4s)
    │   └── Still fails? → Try SMS
    │
    ├── SMS fails?
    │   ├── Retry (max 2x, linear 1s)
    │   └── Still fails? → Try push notification
    │
    ├── Push fails?
    │   ├── Retry (max 2x, linear 1s)
    │   └── Still fails? → Try email (different provider)
    │
    └── All channels fail?
        └── Queue for manual retry + alert support
```

### Channel Fallback Chain

```
Primary: Email
    │
    ├── fails → Secondary: SMS
    │              │
    │              ├── fails → Tertiary: Push Notification
    │              │              │
    │              │              └── fails → In-app message
    │              │
    │              └── succeeds → Complete
    │
    └── succeeds → Complete
```

---

## Timing

| Metric | Target | Warning | Timeout | Critical |
|--------|--------|---------|---------|----------|
| Email delivery | < 5s | 10s | 30s | 60s |
| SMS delivery | < 3s | 5s | 15s | 30s |
| Push notification | < 2s | 5s | 10s | 20s |
| Profile update | < 500ms | 1s | 2s | 5s |
| **Total Step** | < 10s | 20s | 30s | 60s |

---

## Error Handling

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Invalid user | E12001 | "User not found" | Return error |
| Channel disabled | E12002 | "Channel unavailable. Trying alternative..." | Use fallback |
| Content too large | E12003 | "Content optimized for delivery" | Compress |
| All channels fail | E12004 | "Delivery queued. Will retry shortly." | Queue |
| Profile update fail | E12005 | "Trip saved. Profile update pending." | Queue |

### Delivery Status Response

```json
{
  "delivery_status": "sent",
  "delivery_id": "del_abc123",
  "channel": "email",
  "delivery_time_ms": 2450,
  "notification_sent": true,
  "profile_updated": true,
  "fallback_used": false
}
```

---

## Dependencies

| Dependency | Type | Required |
|------------|------|----------|
| Notify Agent | Internal | Yes |
| Profile Agent | Internal | Yes |
| Email Provider (SendGrid) | External | Yes |
| SMS Provider (Twilio) | External | Fallback |
| Push Provider (Firebase) | External | Fallback |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Delivery success rate | Primary channel | > 95% |
| Overall delivery rate | Including fallbacks | > 99% |
| Delivery speed | Latency | < 10 seconds |
| Profile update success | Success rate | > 99% |
| User satisfaction | Rating | > 4/5 |

---

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `delivery_started` | request_id, channel | On start |
| `delivery_completed` | request_id, channel, duration | On completion |
| `delivery_failed` | request_id, channel, error | On failure |
| `fallback_used` | request_id, from_channel, to_channel | On fallback |
| `profile_updated` | user_id, trip_id | After profile update |

---

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| Delivery status | 1 hour | Status change |
| User preferences | 24 hours | Preference update |
| Provider health | 5 minutes | Status change |

---

## Post-Delivery Actions

| Action | Agent | Timing |
|--------|-------|--------|
| Update trip history | Profile Agent | Immediate |
| Learn preferences | Profile Agent | Immediate |
| Track delivery metrics | Analytics Agent | Immediate |
| Send follow-up (optional) | Notify Agent | 24 hours later |
| Request feedback | Notify Agent | 48 hours later |

---

## Notes

- Always respect user's delivery preferences
- Log delivery metrics for reliability tracking
- Track channel effectiveness for optimization
- Consider time zones for delivery timing
- Include unsubscribe option for notifications
- Support multiple delivery channels simultaneously if requested

---

*Step 12 of 12 | Delivery*
