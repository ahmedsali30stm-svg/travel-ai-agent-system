# Common Prompt Utilities

> Shared prompt components, base templates, and utility functions for the prompt library.

---

## Base Templates

### Minimal System Prompt
```xml
<system>
  <identity>
    <role>{{ROLE}}</role>
    <agent_id>{{AGENT_ID}}</agent_id>
  </identity>
  <instructions>{{INSTRUCTIONS}}</instructions>
</system>
```

### Minimal Task Prompt
```xml
<task>
  <objective>{{OBJECTIVE}}</objective>
  <inputs>{{INPUTS}}</inputs>
  <outputs>{{OUTPUTS}}</outputs>
</task>
```

---

## Shared Sections

### Identity Block
```xml
<identity>
  <agent_id>{{AGENT_ID}}</agent_id>
  <name>{{AGENT_NAME}}</name>
  <role>{{ROLE}}</role>
  <version>1.0.0</version>
  <capabilities>
    {{CAPABILITIES}}
  </capabilities>
  <limitations>
    {{LIMITATIONS}}
  </limitations>
</identity>
```

### Memory Access Block
```xml
<memory>
  <access>
    <read>{{MEMORY_READ}}</read>
    <write>{{MEMORY_WRITE}}</write>
    <delete>{{MEMORY_DELETE}}</delete>
  </access>
  <persistence>
    <scope>{{MEMORY_SCOPE}}</scope>
    <ttl>{{MEMORY_TTL}}</ttl>
  </persistence>
</memory>
```

### Tool Permissions Block
```xml
<tools>
  <allowed>
    {{ALLOWED_TOOLS}}
  </allowed>
  <forbidden>
    {{FORBIDDEN_TOOLS}}
  </forbidden>
  <rate_limits>
    {{RATE_LIMITS}}
  </rate_limits>
</tools>
```

### Error Handling Block
```xml
<error_handling>
  <on_failure>
    <action>{{FAILURE_ACTION}}</action>
    <escalation>{{ESCALATION}}</escalation>
  </on_failure>
  <retries>
    <max>{{MAX_RETRIES}}</max>
    <backoff>{{BACKOFF_STRATEGY}}</backoff>
  </retries>
</error_handling>
```

### Quality Gate Block
```xml
<quality_gate>
  <checks>
    {{QUALITY_CHECKS}}
  </checks>
  <threshold>{{QUALITY_THRESHOLD}}</threshold>
  <on_failure>{{QUALITY_FAILURE_ACTION}}</on_failure>
</quality_gate>
```

---

## Validation Patterns

### Schema Validation
```xml
<validation name="schema">
  <method>json_schema</method>
  <schema>{{SCHEMA_NAME}}</schema>
  <strict>{{STRICT_MODE}}</strict>
</validation>
```

### Business Rule Validation
```xml
<validation name="business_rules">
  <method>rule_engine</method>
  <rules>
    {{BUSINESS_RULES}}
  </rules>
</validation>
```

### Data Quality Validation
```xml
<validation name="data_quality">
  <method>quality_check</method>
  <checks>
    <check name="completeness">{{COMPLETENESS_THRESHOLD}}</check>
    <check name="accuracy">{{ACCURACY_THRESHOLD}}</check>
    <check name="freshness">{{FRESHNESS_THRESHOLD}}</check>
  </checks>
</validation>
```

---

## Output Patterns

### JSON Output
```xml
<output format="json">
  <schema>{{SCHEMA}}</schema>
  <pretty_print>true</pretty_print>
  <encoding>UTF-8</encoding>
</output>
```

### HTML Output
```xml
<output format="html">
  <template>{{TEMPLATE}}</template>
  <variables>{{VARIABLES}}</variables>
  <sanitize>true</sanitize>
</output>
```

### PDF Output
```xml
<output format="pdf">
  <template>{{TEMPLATE}}</template>
  <page_size>{{PAGE_SIZE}}</page_size>
  <orientation>{{ORIENTATION}}</orientation>
</output>
```

---

## Interpolation Functions

### Required Variables
```python
REQUIRED_VARS = [
    "AGENT_ID",
    "AGENT_NAME",
    "REQUEST_ID",
    "SESSION_ID",
    "TIMESTAMP",
]
```

### Optional Variables
```python
OPTIONAL_VARS = [
    "MEMORY_KEY",
    "OUTPUT_SCHEMA",
    "RETRY_COUNT",
    "ERROR_MESSAGE",
    "CONTEXT",
    "USER_PREFERENCES",
    "PREVIOUS_RESULTS",
]
```

### Variable Defaults
```python
DEFAULTS = {
    "TIMESTAMP": lambda: datetime.utcnow().isoformat() + "Z",
    "RETRY_COUNT": "0",
    "SESSION_ID": f"sess_{uuid4().hex[:12]}",
}
```

---

## Prompt Composition

### Layering Order
1. **System Prompt** - Always first, establishes identity
2. **Context Prompt** - Request-specific data
3. **Task Prompt** - What to do
4. **Validation Prompt** - Quality checks
5. **Output Prompt** - How to format response

### Composition Function
```python
def compose_prompt(
    agent_id: str,
    prompt_type: str,
    context: dict,
    extra_sections: list[str] = None
) -> str:
    """Compose a complete prompt from library components."""
    
    # Load base prompt
    base = load_prompt(agent_id, prompt_type)
    
    # Add common sections
    sections = [base]
    sections.append(render_memory_access(context))
    sections.append(render_tool_permissions(context))
    sections.append(render_error_handling(context))
    
    # Add extra sections
    if extra_sections:
        for section in extra_sections:
            sections.append(render_section(section, context))
    
    # Wrap in XML
    return wrap_prompt(sections, context)
```

---

## Token Management

### Token Budget Allocation
```python
TOKEN_BUDGETS = {
    "system": 2000,
    "task": 1500,
    "context": 2000,
    "validation": 500,
    "output": 1000,
}
```

### Truncation Strategy
```python
def truncate_to_budget(prompt: str, budget: int) -> str:
    """Truncate prompt to fit within token budget."""
    if count_tokens(prompt) <= budget:
        return prompt
    
    # Priority: system > task > context > validation > output
    sections = parse_sections(prompt)
    result = []
    remaining = budget
    
    for section in sections:
        tokens = count_tokens(section)
        if tokens <= remaining:
            result.append(section)
            remaining -= tokens
        else:
            # Truncate this section
            result.append(truncate_section(section, remaining))
            break
    
    return "\n".join(result)
```

---

## Testing Prompts

### Test Case Format
```xml
<test_case id="tc_001">
  <input>
    <prompt_type>system</prompt_type>
    <variables>
      <AGENT_ID>agent_hotel_03</AGENT_ID>
      <AGENT_NAME>Hotel Agent</AGENT_NAME>
    </variables>
  </input>
  <expected>
    <contains>Hotel Agent</contains>
    <schema>agent_system_prompt</schema>
  </expected>
</test_case>
```

### Validation Checklist
- [ ] All required variables are present
- [ ] XML is well-formed
- [ ] Schema validates correctly
- [ ] No prompt injection vulnerabilities
- [ ] Token count within budget
- [ ] Output format matches specification
