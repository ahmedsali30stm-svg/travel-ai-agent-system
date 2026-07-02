# Prompt Library

> Enterprise-grade prompt templates for all 20 travel AI agents.
> All prompts follow strict XML format for parsing reliability.

---

## Prompt Types

| Type | Purpose | Used When |
|------|---------|-----------|
| **System** | Establishes agent identity, capabilities, and behavioral boundaries | Agent initialization |
| **Task** | Defines specific work to execute with clear inputs/outputs | Task assignment |
| **Retry** | Recovery instructions when initial execution fails | Error/failure handling |
| **Validation** | Verification checks before output release | Quality gate |
| **Self Review** | Internal reflection and quality assessment | Pre-delivery check |
| **Output** | Structured response formatting and delivery | Final response |

---

## XML Format Standard

```xml
<?xml version="1.0" encoding="UTF-8"?>
<prompt id="[agent-id]_[prompt-type]" version="1.0">
  <meta>
    <agent>[agent-name]</agent>
    <type>[prompt-type]</type>
    <timeout>[seconds]</timeout>
    <retries>[count]</retries>
  </meta>
  <instructions>
    [structured instructions]
  </instructions>
  <context>
    [dynamic context variables]
  </context>
  <output>
    [expected output format]
  </output>
</prompt>
```

---

## Variable Interpolation

| Variable | Description | Example |
|----------|-------------|---------|
| `{{AGENT_ID}}` | Unique agent identifier | `agent_hotel_03` |
| `{{REQUEST_ID}}` | Unique request identifier | `req_abc123` |
| `{{SESSION_ID}}` | Session identifier | `sess_xyz789` |
| `{{TIMESTAMP}}` | ISO 8601 timestamp | `2026-07-02T10:30:00Z` |
| `{{MEMORY_KEY}}` | Memory storage key | `trip:hotel:search:latest` |
| `{{OUTPUT_SCHEMA}}` | JSON schema reference | `hotel_search_result` |
| `{{RETRY_COUNT}}` | Current retry attempt | `1`, `2`, `3` |
| `{{ERROR_MESSAGE}}` | Previous error details | `timeout after 30s` |
| `{{CONTEXT}}` | Request context data | Full context object |

---

## Prompt Registry

| Agent | File | Prompts |
|-------|------|---------|
| [01 - Supervisor](agents/01-supervisor-agent.md) | `01-supervisor-agent.md` | 6 |
| [02 - Planner](agents/02-planner-agent.md) | `02-planner-agent.md` | 6 |
| [03 - Hotel](agents/03-hotel-agent.md) | `03-hotel-agent.md` | 6 |
| [04 - Flight](agents/04-flight-agent.md) | `04-flight-agent.md` | 6 |
| [05 - Activities](agents/05-activities-agent.md) | `05-activities-agent.md` | 6 |
| [06 - Transportation](agents/06-transportation-agent.md) | `06-transportation-agent.md` | 6 |
| [07 - Visa](agents/07-visa-agent.md) | `07-visa-agent.md` | 6 |
| [08 - Weather](agents/08-weather-agent.md) | `08-weather-agent.md` | 6 |
| [09 - Currency](agents/09-currency-agent.md) | `09-currency-agent.md` | 6 |
| [10 - Price Intelligence](agents/10-price-intelligence-agent.md) | `10-price-intelligence-agent.md` | 6 |
| [11 - Validation](agents/11-validation-agent.md) | `11-validation-agent.md` | 6 |
| [12 - QA](agents/12-qa-agent.md) | `12-qa-agent.md` | 6 |
| [13 - HTML Renderer](agents/13-html-renderer-agent.md) | `13-html-renderer-agent.md` | 6 |
| [14 - PDF Generator](agents/14-pdf-generator-agent.md) | `14-pdf-generator-agent.md` | 6 |
| [15 - Image Collector](agents/15-image-collector-agent.md) | `15-image-collector-agent.md` | 6 |
| [16 - SEO Content](agents/16-seo-content-agent.md) | `16-seo-content-agent.md` | 6 |
| [17 - Research](agents/17-research-agent.md) | `17-research-agent.md` | 6 |
| [18 - Memory](agents/18-memory-agent.md) | `18-memory-agent.md` | 6 |
| [19 - Logging](agents/19-logging-agent.md) | `19-logging-agent.md` | 6 |
| [20 - Error Recovery](agents/20-error-recovery-agent.md) | `20-error-recovery-agent.md` | 6 |

**Total: 20 agents × 6 prompts = 120 prompts**

---

## Common Prompt Sections

### System Prompt Structure
```xml
<system>
  <identity>
    <role>[agent role]</role>
    <capabilities>[list of capabilities]</capabilities>
    <limitations>[what agent cannot do]</limitations>
  </identity>
  <behavior>
    <rules>[behavioral rules]</rules>
    <constraints>[operational constraints]</constraints>
    <tone>[communication style]</tone>
  </behavior>
  <memory>
    <access>[memory permissions]</access>
    <persistence>[what to remember]</persistence>
  </memory>
  <tools>
    <allowed>[permitted tools]</allowed>
    <forbidden>[restricted tools]</forbidden>
  </tools>
</system>
```

### Task Prompt Structure
```xml
<task>
  <objective>[what to accomplish]</objective>
  <inputs>
    <required>[mandatory data]</required>
    <optional>[nice-to-have data]</optional>
  </inputs>
  <steps>
    <step order="1">[first action]</step>
    <step order="2">[second action]</step>
  </steps>
  <outputs>
    <expected>[what to produce]</expected>
    <format>[output format]</format>
    <schema>[schema reference]</schema>
  </outputs>
  <timeout>[max seconds]</timeout>
</task>
```

### Retry Prompt Structure
```xml
<retry>
  <context>
    <attempt>[retry number]</attempt>
    <max_attempts>[limit]</max_attempts>
    <previous_error>[what went wrong]</previous_error>
  </context>
  <recovery>
    <strategy>[recovery approach]</strategy>
    <alternative>[backup option]</alternative>
    <escalation>[when to escalate]</escalation>
  </recovery>
  <instructions>[what to do differently]</instructions>
</retry>
```

### Validation Prompt Structure
```xml
<validation>
  <checks>
    <check name="[check-name]">
      <description>[what to verify]</description>
      <method>[how to verify]</method>
      <pass_criteria>[success condition]</pass_criteria>
    </check>
  </checks>
  <on_failure>
    <action>[what to do if check fails]</action>
    <escalation>[when to escalate]</escalation>
  </on_failure>
</validation>
```

### Self Review Prompt Structure
```xml
<self_review>
  <criteria>
    <criterion name="[criterion-name]">
      <question>[self-assessment question]</question>
      <score_range>[1-5]</score_range>
    </criterion>
  </criteria>
  <quality_gate>
    <minimum_score>[pass threshold]</minimum_score>
    <action_on_fail>[what if below threshold]</action_on_fail>
  </quality_gate>
</self_review>
```

### Output Prompt Structure
```xml
<output>
  <format>[JSON/HTML/PDF/text]</format>
  <schema>[schema reference]</schema>
  <sections>
    <section name="[section-name]">
      <description>[what goes here]</description>
      <required>[yes/no]</required>
    </section>
  </sections>
  <metadata>
    <fields>[required metadata]</fields>
  </metadata>
</output>
```

---

## Usage

### Loading a Prompt
```python
def load_prompt(agent_id: str, prompt_type: str) -> str:
    """Load a prompt from the library."""
    file_path = f"prompts/agents/{agent_id}.md"
    prompt = read_file(file_path)
    return extract_prompt(prompt, prompt_type)
```

### Interpolating Variables
```python
def interpolate(prompt: str, variables: dict) -> str:
    """Replace template variables with actual values."""
    for key, value in variables.items():
        prompt = prompt.replace(f"{{{{{key}}}}}", str(value))
    return prompt
```

### Executing a Prompt
```python
def execute_prompt(agent_id: str, prompt_type: str, context: dict) -> str:
    """Load, interpolate, and execute a prompt."""
    prompt = load_prompt(agent_id, prompt_type)
    prompt = interpolate(prompt, context)
    return llm.complete(prompt)
```

---

## Version Control

All prompts are versioned:
- **Major**: Breaking changes to prompt structure
- **Minor**: New sections or significant additions
- **Patch**: Typo fixes, wording improvements

Current version: **1.0.0**
