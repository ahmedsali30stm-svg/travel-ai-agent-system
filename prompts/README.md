# Prompts Directory

Complete prompt templates for all Travel AI Agent System operations.

## Prompt Categories

| Category | Description | Files |
|----------|-------------|-------|
| **System** | System-level prompts | `system.prompts.md` |
| **Agent** | Agent-specific prompts | `agent.prompts.md` |
| **Search** | Search operation prompts | `search.prompts.md` |
| **Booking** | Booking operation prompts | `booking.prompts.md` |
| **Content** | Content generation prompts | `content.prompts.md` |
| **Validation** | Validation prompts | `validation.prompts.md` |
| **Error** | Error handling prompts | `error.prompts.md` |

## Usage

```typescript
import { PromptTemplate } from './prompts';

const template = new PromptTemplate('hotel_search');
const prompt = template.render({
  destination: 'Dubai',
  checkin: '2025-06-01',
  checkout: '2025-06-05',
  adults: 2,
  preferences: {
    star_rating: { min: 4 },
    amenities: ['wifi', 'pool']
  }
});
```

## Template Variables

All templates use `{{variable}}` syntax for interpolation:

- `{{variable}}` - Simple variable
- `{{#if condition}}...{{/if}}` - Conditional
- `{{#each items}}...{{/each}}` - Iteration
- `{{variable | default}}` - Default value
- `{{variable | truncate:100}}` - Truncation

## Prompt Engineering Guidelines

1. **Be Specific**: Include all relevant context
2. **Structure Output**: Request JSON or specific format
3. **Handle Errors**: Include error handling instructions
4. **Validate Input**: Check all inputs before use
5. **Limit Output**: Set max tokens as needed

## Files

- `system.prompts.md` - System prompts
- `agent.prompts.md` - Agent prompts
- `search.prompts.md` - Search prompts
- `booking.prompts.md` - Booking prompts
- `content.prompts.md` - Content prompts
- `validation.prompts.md` - Validation prompts
- `error.prompts.md` - Error prompts

---

*Prompts v1.0.0 | Enterprise OTA Platform*
