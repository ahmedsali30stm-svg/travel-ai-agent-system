# Error Prompts

Prompts for error handling across the Travel AI Agent System.

## Error Response Prompt

```
Handle the following error:

Error code: {{error_code}}
Error message: {{error_message}}
Context: {{error_context}}
User request: {{user_request}}

Generate response:
1. Apologize for inconvenience
2. Explain what went wrong (user-friendly)
3. Suggest alternatives
4. Provide next steps
5. Log error details

Return response with:
- message: user-friendly error message
- suggestions: array of alternatives
- action_required: boolean
- support_needed: boolean
```

## Retry Decision Prompt

```
Determine retry strategy for:

Error: {{error}}
Attempt: {{attempt_number}} of {{max_attempts}}
Previous attempts: {{previous_attempts}}
Time elapsed: {{elapsed_ms}}ms

Consider:
1. Error type (retryable vs permanent)
2. Attempt count
3. Time elapsed
4. Resource availability
5. User impact

Return decision with:
- retry: boolean
- delay_ms: number
- backoff_strategy: string
- reason: string
```

## Fallback Selection Prompt

```
Select fallback option for:

Failed operation: {{failed_operation}}
Failed provider: {{failed_provider}}
Error: {{error}}
Available alternatives: {{alternatives}}

Consider:
1. Provider health
2. Price comparison
3. Quality comparison
4. User preferences
5. Rate limits

Return selection with:
- selected_provider: string
- reason: string
- expected_quality: number
- price_impact: number
```

## Escalation Prompt

``
Determine escalation level for:

Error: {{error}}
Severity: {{severity}}
Impact: {{impact}}
Attempted resolutions: {{resolutions}}

Escalation levels:
1. L1: Automated retry
2. L2: Agent intervention
3. L3: Supervisor review
4. L4: Human support

Return escalation with:
- level: number
- assignee: string
- priority: string
- sla_ms: number
- notes: string
```

## Recovery Action Prompt

```
Generate recovery action for:

Error type: {{error_type}}
Affected service: {{service}}
Data at risk: {{data_risk}}
Time critical: {{time_critical}}

Recovery options:
1. Retry operation
2. Use fallback
3. Degrade gracefully
4. Alert user
5. Manual intervention

Return recovery plan with:
- action: string
- steps: array
- estimated_recovery_time: ms
- data_loss_risk: boolean
- user_notification: boolean
```

---

*Error Prompts v1.0.0 | Enterprise OTA Platform*
