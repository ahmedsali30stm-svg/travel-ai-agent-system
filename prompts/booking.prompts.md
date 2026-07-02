# Booking Prompts

Prompts for booking operations across the Travel AI Agent System.

## Hotel Booking Prompt

```
Create a hotel booking with the following details:

Hotel: {{hotel_name}} ({{hotel_id}})
Check-in: {{checkin}}
Check-out: {{checkout}}
Rooms: {{rooms}}
Guests: {{guests}}

Guest Information:
- Name: {{guest_name}}
- Email: {{guest_email}}
- Phone: {{guest_phone}}
- Nationality: {{nationality}}

Payment:
- Method: {{payment_method}}
- Currency: {{currency}}

Special Requests:
{{#each special_requests}}
- {{this}}
{{/each}}

Validate:
- Hotel availability
- Room configuration
- Guest information
- Payment details
- Cancellation policy

Return booking confirmation with:
- booking_id
- confirmation_code
- total_price
- cancellation_policy
- next_steps
```

## Flight Booking Prompt

```
Create a flight booking with the following details:

Flight: {{airline}} {{flight_number}}
Route: {{origin}} → {{destination}}
Departure: {{departure_date}} {{departure_time}}
Arrival: {{arrival_date}} {{arrival_time}}
Cabin class: {{cabin_class}}

Passengers:
{{#each passengers}}
- {{this.name}} ({{this.type}})
{{/each}}

Payment:
- Method: {{payment_method}}
- Currency: {{currency}}

Add-ons:
- Seat selection: {{seat_selection}}
- Extra baggage: {{extra_baggage}}
- Travel insurance: {{travel_insurance}}

Validate:
- Flight availability
- Seat availability
- Passenger information
- Payment details
- Visa requirements

Return booking confirmation with:
- booking_id
- pnr_code
- e_ticket_number
- total_price
- itinerary
- next_steps
```

## Activity Booking Prompt

```
Create an activity booking with the following details:

Activity: {{activity_name}} ({{activity_id}})
Date: {{date}}
Time: {{time}}
Travelers: {{travelers}}

Participant Information:
{{#each participants}}
- {{this.name}} ({{this.type}})
{{/each}}

Payment:
- Method: {{payment_method}}
- Currency: {{currency}}

Options:
{{#each options}}
- {{this.name}}: {{this.value}}
{{/each}}

Validate:
- Activity availability
- Participant information
- Payment details
- Age restrictions
- Physical requirements

Return booking confirmation with:
- booking_id
- voucher_code
- meeting_point
- meeting_time
- total_price
- what_to_bring
- next_steps
```

## Booking Modification Prompt

```
Modify existing booking {{booking_id}}:

Modification type: {{modification_type}}
New details:
{{#each changes}}
- {{this.field}}: {{this.old_value}} → {{this.new_value}}
{{/each}}

Reason: {{reason}}

Validate:
- Modification eligibility
- Availability for new dates
- Price difference
- Cancellation policy
- Modification fees

Return modification confirmation with:
- booking_id
- modification_id
- updated_details
- price_difference
- new_total
- next_steps
```

## Booking Cancellation Prompt

```
Cancel booking {{booking_id}}:

Reason: {{reason}}
Refund preference: {{refund_preference}}

Validate:
- Cancellation eligibility
- Cancellation policy
- Refund amount
- Cancellation fees
- Processing time

Return cancellation confirmation with:
- booking_id
- cancellation_id
- refund_amount
- refund_method
- processing_time
- confirmation_email
```

---

*Booking Prompts v1.0.0 | Enterprise OTA Platform*
