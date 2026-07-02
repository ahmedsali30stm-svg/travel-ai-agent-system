# System Rules

> Operational rules and guidelines for the Enterprise Travel AI Agent Platform.

---

## Agent Rules

### Rule 1: Agent Communication

```
RULE: All agent communication must use the structured message format.

MESSAGE FORMAT:
{
  "messageId": "uuid",
  "from": "agent_id",
  "to": "agent_id | broadcast",
  "type": "request | response | event | error",
  "payload": {},
  "timestamp": "ISO8601",
  "correlationId": "uuid",
  "priority": "low | normal | high | critical"
}

VIOLATION: Agent receives malformed message.
ACTION: Reject message, log error, return error response.
```

### Rule 2: Task Delegation

```
RULE: Supervisor must validate task assignment before delegation.

VALIDATION CHECKS:
1. Target agent exists
2. Target agent is available
3. Agent has required tools
4. Agent has memory access
5. No circular dependencies

VIOLATION: Task assigned to unavailable agent.
ACTION: Requeue task, notify supervisor, escalate if critical.
```

### Rule 3: Error Handling

```
RULE: All agents must implement structured error handling.

ERROR LEVELS:
- recoverable: Retry with backoff
- degraded: Continue with fallback
- critical: Halt and notify supervisor
- fatal: Halt all operations

VIOLATION: Error handling not implemented.
ACTION: Agent refuses to start, log configuration error.
```

### Rule 4: Memory Access

```
RULE: Memory operations must be atomic and consistent.

ATOMICITY:
- Write operations: All or nothing
- Read operations: Consistent snapshot
- Delete operations: Soft delete with TTL

VIOLATION: Non-atomic memory operation.
ACTION: Rollback operation, log corruption, alert monitoring.
```

### Rule 5: Rate Limiting

```
RULE: All external API calls must respect rate limits.

LIMITS:
- Hotelbeds: 100 requests/minute
- Booking.com: 60 requests/minute
- Viator: 30 requests/minute
- Amadeus: 10 requests/second

VIOLATION: Rate limit exceeded.
ACTION: Queue request, implement backoff, use cached data.
```

---

## Data Rules

### Rule 6: Data Validation

```
RULE: All data must be validated before storage.

VALIDATION LAYERS:
1. Schema validation (JSON Schema)
2. Type validation (TypeScript types)
3. Business validation (domain rules)
4. Sanitization (XSS, injection prevention)

VIOLATION: Invalid data passed to storage.
ACTION: Reject data, return validation error, log violation.
```

### Rule 7: Data Consistency

```
RULE: Data must be consistent across all storage layers.

CONSISTENCY LEVELS:
- Strong: Financial data, user credentials
- Eventual: Search results, cached data
- Weak: Analytics, metrics

VIOLATION: Inconsistent data detected.
ACTION: Trigger reconciliation, alert monitoring, queue repair.
```

### Rule 8: Data Retention

```
RULE: Data must be retained according to retention policies.

RETENTION POLICIES:
- User data: Until deletion request + 30 days
- Search history: 90 days
- Price history: 1 year
- Transaction data: 7 years
- Logs: 30 days
- Metrics: 90 days

VIOLATION: Data retained beyond policy.
ACTION: Trigger cleanup job, log compliance violation.
```

---

## Security Rules

### Rule 9: Authentication

```
RULE: All API requests must be authenticated.

AUTHENTICATION METHODS:
- JWT tokens (user sessions)
- API keys (service-to-service)
- OAuth 2.0 (third-party)
- HMAC signatures (webhooks)

VIOLATION: Unauthenticated request received.
ACTION: Reject with 401, log security event, alert if repeated.
```

### Rule 10: Authorization

```
RULE: All operations must be authorized.

AUTHORIZATION LEVELS:
- public: No auth required
- authenticated: Valid JWT required
- authorized: Valid JWT + role required
- admin: Admin role required

VIOLATION: Unauthorized operation attempted.
ACTION: Reject with 403, log security event, alert if critical.
```

### Rule 11: Data Protection

```
RULE: Sensitive data must be encrypted at rest and in transit.

ENCRYPTION STANDARDS:
- At rest: AES-256
- In transit: TLS 1.3
- Passwords: bcrypt (cost 12)
- API keys: HMAC-SHA512

VIOLATION: Unencrypted sensitive data detected.
ACTION: Stop operation, encrypt data, alert security team.
```

### Rule 12: Audit Logging

```
RULE: All security-relevant events must be audited.

AUDIT EVENTS:
- Authentication attempts
- Authorization changes
- Data access
- Configuration changes
- Security violations

VIOLATION: Audit log tampered or missing.
ACTION: Alert security team, trigger incident response.
```

---

## Performance Rules

### Rule 13: Response Time

```
RULE: All operations must meet response time targets.

TARGETS:
- API responses: p95 < 200ms
- Search queries: p95 < 2s
- Complex reports: p95 < 10s
- PDF generation: p95 < 30s

VIOLATION: Response time exceeded.
ACTION: Log performance issue, trigger optimization, alert if recurring.
```

### Rule 14: Throughput

```
RULE: System must handle required throughput.

TARGETS:
- Concurrent users: 10,000
- Requests/second: 1,000
- Searches/minute: 500
- Bookings/minute: 100

VIOLATION: Throughput below target.
ACTION: Scale horizontally, optimize bottlenecks, alert if sustained.
```

### Rule 15: Resource Usage

```
RULE: Resource usage must stay within limits.

LIMITS:
- CPU: < 80% average
- Memory: < 85% average
- Disk: < 90% usage
- Network: < 70% bandwidth

VIOLATION: Resource usage exceeded.
ACTION: Trigger auto-scaling, optimize usage, alert if critical.
```

---

## Availability Rules

### Rule 16: Uptime

```
RULE: System must maintain required uptime.

TARGETS:
- Overall: 99.9% (8.76 hours downtime/year)
- Critical paths: 99.99% (52.56 minutes downtime/year)
- Scheduled maintenance: < 4 hours/month

VIOLATION: Uptime below target.
ACTION: Trigger incident response, notify stakeholders, post-mortem required.
```

### Rule 17: Redundancy

```
RULE: Critical components must have redundancy.

REDUNDANCY:
- Database: Primary + replica
- Cache: Redis cluster (3 nodes)
- API: Load balanced (min 2 instances)
- Storage: S3 with cross-region replication

VIOLATION: Single point of failure detected.
ACTION: Alert infrastructure team, create remediation ticket.
```

### Rule 18: Backup

```
RULE: Critical data must be backed up regularly.

BACKUP SCHEDULE:
- Database: Daily + WAL streaming
- Configuration: Daily
- User uploads: Real-time replication
- Logs: Daily archival

VIOLATION: Backup failed or missing.
ACTION: Alert operations team, trigger manual backup, investigate failure.
```

---

## Compliance Rules

### Rule 19: GDPR

```
RULE: System must comply with GDPR requirements.

REQUIREMENTS:
- Data minimization
- Purpose limitation
- Right to access
- Right to erasure
- Data portability
- Consent management

VIOLATION: GDPR compliance breach.
ACTION: Alert legal team, halt affected operations, document incident.
```

### Rule 20: PCI DSS

```
RULE: Payment data must comply with PCI DSS.

REQUIREMENTS:
- No card data storage
- Tokenization for payments
- Encrypted transmission
- Access logging

VIOLATION: PCI DSS compliance breach.
ACTION: Alert security team, halt payment processing, contact acquirer.
```

### Rule 21: SOC 2

```
RULE: System must maintain SOC 2 compliance.

REQUIREMENTS:
- Access controls
- Monitoring
- Incident response
- Change management
- Risk assessment

VIOLATION: SOC 2 control failure.
ACTION: Document incident, remediate control, notify auditor if required.
```

---

## Operational Rules

### Rule 22: Deployment

```
RULE: All deployments must follow the deployment process.

PROCESS:
1. Code review approved
2. Tests passing
3. Security scan clean
4. Staging validation
5. Canary deployment
6. Full rollout

VIOLATION: Deployment process bypassed.
ACTION: Rollback deployment, document violation, require retraining.
```

### Rule 23: Incident Response

```
RULE: All incidents must follow the incident response process.

PROCESS:
1. Detection
2. Triage
3. Containment
4. Remediation
5. Recovery
6. Post-mortem

VIOLATION: Incident response process not followed.
ACTION: Document deviation, require process training, update runbooks.
```

### Rule 24: Change Management

```
RULE: All changes must follow the change management process.

PROCESS:
1. Change request
2. Impact analysis
3. Approval
4. Implementation
5. Verification
6. Documentation

VIOLATION: Change made without approval.
ACTION: Revert change, document violation, require approval training.
```

---

## Monitoring Rules

### Rule 25: Alerting

```
RULE: All critical conditions must trigger alerts.

ALERT LEVELS:
- Info: Informational, no action needed
- Warning: Potential issue, investigate
- Error: Issue requiring action
- Critical: Immediate action required
- Emergency: System-wide impact

VIOLATION: Critical alert not triggered.
ACTION: Review alert configuration, update thresholds, test alerting.
```

### Rule 26: Logging

```
RULE: All significant events must be logged.

LOG LEVELS:
- DEBUG: Detailed debug information
- INFO: General operational events
- WARN: Unexpected but non-critical
- ERROR: Failure requiring attention
- FATAL: System crash or data corruption

VIOLATION: Missing or incomplete logs.
ACTION: Update logging configuration, backfill if possible, review code.
```

### Rule 27: Metrics

```
RULE: All key metrics must be collected and monitored.

REQUIRED METRICS:
- Request rate
- Error rate
- Response time
- Resource utilization
- Business metrics

VIOLATION: Metrics collection gap detected.
ACTION: Update instrumentation, validate data, review dashboards.
```

---

## Code Rules

### Rule 28: Code Quality

```
RULE: All code must meet quality standards.

STANDARDS:
- Type safety (TypeScript strict mode)
- Test coverage (>80%)
- Documentation (JSDoc/TSDoc)
- Linting (ESLint)
- Formatting (Prettier)

VIOLATION: Code quality standards not met.
ACTION: Block merge, require fixes, update standards if needed.
```

### Rule 29: Dependencies

```
RULE: All dependencies must be approved and monitored.

PROCESS:
1. Security scan (npm audit)
2. License compatibility
3. Maintenance status
4. Performance impact
5. Security team approval

VIOLATION: Unapproved dependency added.
ACTION: Remove dependency, require approval, document exception if needed.
```

### Rule 30: API Design

```
RULE: All APIs must follow the API design guidelines.

GUIDELINES:
- RESTful design
- Consistent naming
- Proper versioning
- Comprehensive documentation
- Error handling

VIOLATION: API design guidelines not followed.
ACTION: Block merge, require redesign, update guidelines if needed.
```
