# Content Prompts

Prompts for content generation across the Travel AI Agent System.

## Itinerary Summary Prompt

```
Generate a concise summary for this itinerary:

Destination: {{destination}}
Duration: {{nights}} nights, {{days}} days
Travelers: {{travelers}}
Total cost: {{currency}} {{total_cost}}

Highlights:
{{#each highlights}}
- {{this}}
{{/each}}

Generate:
1. Catchy title (max 60 characters)
2. Brief description (max 160 characters)
3. Key highlights (3-5 bullet points)
4. Best for (traveler type)
5. Value proposition

Return in JSON format with:
- title
- description
- highlights
- best_for
- value_proposition
```

## Destination Guide Prompt

```
Create a comprehensive destination guide for {{destination}}:

Include:
1. Overview
   - Brief description
   - Key attractions
   - Best time to visit

2. Practical Information
   - Currency
   - Language
   - Time zone
   - Visa requirements
   - Emergency numbers

3. Getting Around
   - Airport transfer
   - Public transportation
   - Taxis/Rideshares
   - Car rental

4. Accommodation
   - Popular areas
   - Price ranges
   - Recommended neighborhoods

5. Activities
   - Must-see attractions
   - Hidden gems
   - Day trips
   - Family-friendly options

6. Food & Dining
   - Local cuisine
   - Restaurant recommendations
   - Budget options
   - Fine dining

7. Safety Tips
   - Common scams
   - Safe areas
   - Health precautions

Return in structured format with clear sections.
```

## Email Template Prompt

```
Generate a {{email_type}} email for booking {{booking_id}}:

Recipient: {{recipient_name}}
Booking details:
- Hotel: {{hotel_name}}
- Dates: {{checkin}} - {{checkout}}
- Guests: {{guests}}
- Total: {{currency}} {{total_price}}

Email requirements:
- Professional tone
- Clear subject line
- Booking confirmation details
- Next steps
- Contact information
- Cancellation policy

Return in HTML format with:
- Subject line
- HTML body
- Plain text version
```

## Notification Prompt

```
Generate a {{notification_type}} notification:

User: {{user_name}}
Event: {{event}}
Booking: {{booking_id}}
Details: {{details}}

Notification requirements:
- Concise message
- Action required (if any)
- Deep link to app
- Timestamp

Return in JSON format with:
- title
- body
- action_url
- icon
- badge
- timestamp
```

## SEO Content Prompt

```
Generate SEO-optimized content for {{page_type}}:

Target keyword: {{primary_keyword}}
Secondary keywords: {{secondary_keywords}}
Target audience: {{audience}}

Content requirements:
- Title tag (max 60 characters)
- Meta description (max 160 characters)
- H1 heading
- Body content ({{word_count}} words)
- Image alt text
- Internal links

Include:
- Primary keyword in title and first paragraph
- Secondary keywords naturally throughout
- Call to action
- Structured data (if applicable)

Return in JSON format with:
- title_tag
- meta_description
- h1
- body_content
- alt_texts
- internal_links
```

---

*Content Prompts v1.0.0 | Enterprise OTA Platform*
