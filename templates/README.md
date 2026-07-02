# Templates Directory

HTML and PDF templates for travel documents and communications.

## Template Categories

| Category | Description | Files |
|----------|-------------|-------|
| **Itinerary** | Travel itinerary templates | `itinerary/` |
| **Booking** | Booking confirmation templates | `booking/` |
| **Email** | Email templates | `email/` |
| **Invoice** | Invoice templates | `invoice/` |
| **Voucher** | Voucher templates | `voucher/` |
| **Notification** | Push notification templates | `notification/` |

## Usage

```typescript
import { TemplateEngine } from './templates';

const engine = new TemplateEngine();

// Render itinerary
const html = await engine.render('itinerary/standard', {
  itinerary: itineraryData,
  config: {
    brand_color: '#1a73e8',
    logo_url: 'https://example.com/logo.png'
  }
});

// Generate PDF
const pdf = await engine.renderPDF('invoice/standard', {
  invoice: invoiceData
});
```

## Template Variables

Templates use Handlebars syntax:

```handlebars
{{variable}}           - Simple variable
{{#if condition}}...{{/if}}  - Conditional
{{#each items}}...{{/each}}  - Iteration
{{variable | default}} - Default value
{{formatDate date}}    - Helper function
{{formatCurrency amount currency}} - Currency formatting
```

## Branding

All templates support custom branding:

```json
{
  "brand": {
    "name": "TravelAI",
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#1a73e8",
    "secondary_color": "#34a853",
    "font_family": "Arial, sans-serif"
  }
}
```

## Localization

Templates support multiple languages:

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Chinese (zh)
- Japanese (ja)
- Arabic (ar)

## Template Files

### Itinerary
- `itinerary/standard.hbs` - Standard itinerary
- `itinerary/detailed.hbs` - Detailed itinerary
- `itinerary/minimal.hbs` - Minimal itinerary

### Booking
- `booking/confirmation.hbs` - Booking confirmation
- `booking/cancellation.hbs` - Cancellation confirmation
- `booking/modification.hbs` - Modification confirmation

### Email
- `email/welcome.hbs` - Welcome email
- `email/booking_confirm.hbs` - Booking confirmation
- `email/reminder.hbs` - Travel reminder
- `email/review_request.hbs` - Review request

### Invoice
- `invoice/standard.hbs` - Standard invoice
- `invoice/group.hbs` - Group invoice

### Voucher
- `voucher/hotel.hbs` - Hotel voucher
- `voucher/activity.hbs` - Activity voucher
- `voucher/transport.hbs` - Transport voucher

---

*Templates v1.0.0 | Enterprise OTA Platform*
