# Validation Prompts

Prompts for validation operations across the Travel AI Agent System.

## Input Validation Prompt

```
Validate the following input data:

Schema: {{schema_name}}
Data: {{input_data}}

Check for:
1. Required fields
2. Data types
3. Format validation
4. Range validation
5. Business rules

Return validation result with:
- valid: boolean
- errors: array of validation errors
- warnings: array of validation warnings
```

## Booking Validation Prompt

```
Validate booking request:

Booking type: {{booking_type}}
Details: {{booking_details}}

Validate:
1. Availability check
2. Price verification
3. Guest information
4. Payment details
5. Policy compliance
6. Rate limits
7. Duplicate detection

Return validation result with:
- valid: boolean
- errors: array
- warnings: array
- verified_price: number
- available: boolean
```

## Data Quality Prompt

```
Assess data quality for:

Data type: {{data_type}}
Data: {{data}}

Quality metrics:
1. Completeness
2. Accuracy
3. Consistency
4. Timeliness
5. Validity

Return quality assessment with:
- score: 0-100
- issues: array of issues
- recommendations: array of suggestions
```

## Security Validation Prompt

```
Validate security for:

Operation: {{operation}}
Data: {{data}}
User: {{user_id}}

Security checks:
1. Authentication
2. Authorization
3. Input sanitization
4. SQL injection prevention
5. XSS prevention
6. CSRF protection
7. Rate limiting

Return security validation with:
- secure: boolean
- risks: array of risks
- mitigations: array of actions
```

## Performance Validation Prompt

```
Validate performance for:

Operation: {{operation}}
Response time: {{response_time_ms}}
Payload size: {{payload_size_bytes}}

Performance targets:
- Response time: < {{target_response_time}}ms
- Payload size: < {{target_payload_size}} bytes
- Error rate: < {{target_error_rate}}%

Return performance assessment with:
- meets_targets: boolean
- metrics: object
- optimizations: array of suggestions
```

---

*Validation Prompts v1.0.0 | Enterprise OTA Platform*
