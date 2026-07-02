# Schemas Directory

Complete JSON Schema definitions for all data structures in the Travel AI Agent System.

## Schema Categories

| Category | Description | Files |
|----------|-------------|-------|
| **Request** | User request schemas | `request.schema.json` |
| **Agent** | Agent communication schemas | `agent.schema.json` |
| **Memory** | Memory system schemas | `memory.schema.json` |
| **Tools** | Tool I/O schemas | `tools.schema.json` |
| **Itinerary** | Itinerary output schemas | `itinerary.schema.json` |
| **Booking** | Booking data schemas | `booking.schema.json` |
| **Validation** | Validation result schemas | `validation.schema.json` |
| **Error** | Error response schemas | `error.schema.json` |

## Usage

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formatters';

import requestSchema from './schemas/request.schema.json';
import agentSchema from './schemas/agent.schema.json';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validateRequest = ajv.compile(requestSchema);
const validateAgent = ajv.compile(agentSchema);

// Validate request
const valid = validateRequest(requestData);
if (!valid) {
  console.error(validateRequest.errors);
}
```

## Schema Files

- `request.schema.json` - Travel request validation
- `agent.schema.json` - Agent message validation
- `memory.schema.json` - Memory operations validation
- `tools.schema.json` - Tool I/O validation
- `itinerary.schema.json` - Itinerary output validation
- `booking.schema.json` - Booking data validation
- `validation.schema.json` - Validation results
- `error.schema.json` - Error responses
- `common.schema.json` - Shared definitions

---

*Schemas v1.0.0 | Enterprise OTA Platform*
