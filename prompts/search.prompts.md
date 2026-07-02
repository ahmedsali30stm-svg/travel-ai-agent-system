# Search Prompts

Prompts for search operations across the Travel AI Agent System.

## Hotel Search Prompt

```
Search for hotels in {{destination}} with the following criteria:

Check-in: {{checkin}}
Check-out: {{checkout}}
Guests: {{adults}} adults, {{children}} children
Rooms: {{rooms}}

Preferences:
- Star rating: {{min_stars}}-{{max_stars}} stars
- Price range: {{currency}} {{min_price}} - {{max_price}}
- Amenities: {{amenities}}
- Board type: {{board_type}}
- Location: {{location_preference}}

Sort by: {{sort_by}}
Limit: {{limit}}
Offset: {{offset}}

Return results in JSON format with:
- hotel_id
- name
- address
- star_rating
- review_score
- price_from
- amenities
- photos
```

## Flight Search Prompt

```
Search for flights with the following criteria:

From: {{origin}}
To: {{destination}}
Departure: {{departure_date}}
Return: {{return_date}}
Passengers: {{passengers}}
Cabin class: {{cabin_class}}

Preferences:
- Airlines: {{airlines}}
- Direct flights only: {{direct_only}}
- Max stops: {{max_stops}}
- Departure time: {{departure_time}}
- Price range: {{currency}} {{min_price}} - {{max_price}}

Sort by: {{sort_by}}
Limit: {{limit}}

Return results in JSON format with:
- flight_id
- airline
- flight_number
- departure
- arrival
- duration
- stops
- price
```

## Activity Search Prompt

```
Search for activities in {{destination}} with the following criteria:

Date: {{date}}
Travelers: {{travelers}}
Category: {{category}}

Preferences:
- Price range: {{currency}} {{min_price}} - {{max_price}}
- Duration: {{min_duration}} - {{max_duration}} minutes
- Rating: {{min_rating}}+
- Instant confirmation: {{instant_confirmation}}
- Skip the line: {{skip_the_line}}

Sort by: {{sort_by}}
Limit: {{limit}}
Offset: {{offset}}

Return results in JSON format with:
- activity_id
- title
- description
- duration
- price_from
- rating
- review_count
- photos
```

## Destination Search Prompt

```
Search for destinations matching: {{query}}

Include:
- Popular destinations
- Trending destinations
- Seasonal recommendations
- Budget-friendly options

Filter by:
- Region: {{region}}
- Climate: {{climate}}
- Budget: {{budget_level}}
- Travel style: {{travel_style}}

Return results in JSON format with:
- destination_id
- name
- country
- region
- highlights
- best_time_to_visit
- average_budget
```

## Price Comparison Prompt

```
Compare prices for {{item_type}}:

{{item_name}}
Location: {{location}}
Dates: {{start_date}} - {{end_date}}

Compare across providers:
{{#each providers}}
- {{this.name}}: {{this.price}}
{{/each}}

Include:
- Price differences
- Value comparison
- Hidden fees
- Cancellation policies
- Booking conditions

Return results in JSON format with:
- provider_comparison
- best_value
- price_range
- recommendations
```

---

*Search Prompts v1.0.0 | Enterprise OTA Platform*
