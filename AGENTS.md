# AGENTS.md - Travel AI Agent System

## Multi-Agent Architecture Documentation

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Agent Specifications](#agent-specifications)
   - [Layer 1: Orchestration](#layer-1-orchestration)
   - [Layer 2: Core Booking](#layer-2-core-booking)
   - [Layer 3: Enrichment](#layer-3-enrichment)
   - [Layer 4: Support](#layer-4-support)
   - [Layer 5: Operations](#layer-5-operations)
4. [Communication Flow Matrix](#communication-flow-matrix)
5. [Common Errors & Solutions](#common-errors--solutions)

---

## Architecture Overview

The Travel AI Agent System is a multi-agent architecture designed to handle all aspects of travel planning, booking, and management. The system consists of **25 specialized agents** organized into **5 layers**:

| Layer | Purpose | Agents |
|-------|---------|--------|
| **L1: Orchestration** | Request routing, coordination, session management | 3 |
| **L2: Core Booking** | Primary booking services (flights, hotels, cars) | 4 |
| **L3: Enrichment** | Supplementary travel information | 5 |
| **L4: Support** | Budget, translation, currency, insurance, emergency | 5 |
| **L5: Operations** | Notifications, validation, analytics, confirmations | 8 |

### Design Principles

1. **Single Responsibility**: Each agent handles one domain
2. **Loose Coupling**: Agents communicate via defined interfaces
3. **Fault Tolerance**: Retry strategies and fallback mechanisms
4. **Stateless Processing**: Session state managed by Session Agent
5. **Idempotent Operations**: Safe retry for all booking operations

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                              │
│                              (Chat / API)                                   │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 1: ORCHESTRATION                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   01. Router    │  │ 02. Orchestrator│  │  03. Session    │            │
│  │     Agent       │──│     Agent       │──│     Agent       │            │
│  │                 │  │                 │  │                 │            │
│  │ - Intent Detect │  │ - Coordination  │  │ - User State    │            │
│  │ - Agent Route   │  │ - Aggregation   │  │ - Context Mgmt  │            │
│  │ - Priority      │  │ - Parallel Mgmt │  │ - History       │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 2: CORE BOOKING                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   04. Flight│  │   05. Hotel │  │   06. Car   │  │  07. Package│       │
│  │    Agent    │  │    Agent    │  │    Agent    │  │    Agent    │       │
│  │             │  │             │  │             │  │             │       │
│  │ - Search    │  │ - Search    │  │ - Search    │  │ - Bundle    │       │
│  │ - Compare   │  │ - Compare   │  │ - Compare   │  │ - Discount  │       │
│  │ - Book      │  │ - Book      │  │ - Book      │  │ - Book      │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 3: ENRICHMENT                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │ 08.Weather│ │ 09. Visa  │ │10.Transport│ │11.Activit.│ │12. Dining │   │
│  │   Agent   │ │   Agent   │ │   Agent   │ │   Agent   │ │   Agent   │   │
│  │           │ │           │ │           │ │           │ │           │   │
│  │ - Forecast│ │ - Require │ │ - Local   │ │ - Tours   │ │ - Reserv  │   │
│  │ - Alerts  │ │ - Apply   │ │ - Public  │ │ - Events  │ │ - Review  │   │
│  │ - Pack    │ │ - Status  │ │ - Taxi    │ │ - Tickets │ │ - dietary │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 4: SUPPORT                                    │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │13. Budget │ │14.Translate│ │15. Currency│ │16.Insurance│ │17.Emergen.│   │
│  │   Agent   │ │   Agent   │ │   Agent   │ │   Agent   │ │   Agent   │   │
│  │           │ │           │ │           │ │           │ │           │   │
│  │ - Calc    │ │ - Realtime│ │ - Rate    │ │ - Quote   │ │ - SOS     │   │
│  │ - Track   │ │ - Offline │ │ - Convert │ │ - Compare │ │ - Nearest │   │
│  │ - Alert   │ │ - 50+ Lang│ │ - History │ │ - Purchase│ │ - Notify  │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 5: OPERATIONS                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │18. Notify │ │19. Validate│ │20. Analyt.│ │21. Booking│ │22. Cancel │   │
│  │   Agent   │ │   Agent   │ │   Agent   │ │  Confirm  │ │   Agent   │   │
│  │           │ │           │ │           │ │   Agent   │ │           │   │
│  │ - Push    │ │ - Schema  │ │ - Track   │ │ - Verify  │ │ - Policy  │   │
│  │ - Email   │ │ - Business│ │ - Report  │ │ - Receipt │ │ - Refund  │   │
│  │ - SMS     │ │ - Sanitize│ │ - Predict │ │ - Update  │ │ - Penalty │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                                │
│  │23. Profile│ │24. Review │ │25. Price  │                                │
│  │   Agent   │ │   Agent   │ │ Monitor   │                                │
│  │           │ │           │ │   Agent   │                                │
│  │ - Prefs   │ │ - Collect │ │ - Track   │                                │
│  │ - History │ │ - Moderate│ │ - Alert   │                                │
│  │ - Personal│ │ - Reward  │ │ - Predict │                                │
│  └───────────┘ └───────────┘ └───────────┘                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Specifications

### Layer 1: Orchestration

---

## 01. Router Agent

### Purpose
The Router Agent is the entry point of the system. It analyzes user intent, detects the primary domain of the request, and routes it to the appropriate agent(s).

### Inputs
- User message (text or voice transcript)
- Session context (from Session Agent)
- Conversation history (last 5 messages)

### Outputs
- `target_agent_id`: ID of the primary agent to handle the request
- `secondary_agents`: List of additional agents to involve
- `intent_confidence`: Confidence score (0-1)
- `priority`: Request priority (low/medium/high/urgent)
- `extracted_entities`: Key entities from the message

### Responsibilities
- Intent classification (booking, inquiry, modification, cancellation)
- Entity extraction (dates, locations, preferences, budget)
- Agent selection based on intent and context
- Priority assignment based on urgency signals
- Fallback routing when confidence is low

### Allowed Tools
- `nlp_intent_classifier`
- `entity_extractor`
- `agent_registry_lookup`
- `session_context_reader`

### Forbidden Actions
- Cannot modify booking data directly
- Cannot communicate with external APIs
- Cannot store user data
- Cannot make financial decisions
- Cannot bypass validation agents

### Communication Flow
```
User Message → Router Agent
    ↓
[Intent Analysis]
    ↓
Router → Session Agent (get context)
    ↓
Router → Agent Registry (find match)
    ↓
Router → Orchestrator Agent (route request)
    ↓
[If low confidence] → Router → User (clarification)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: Classification confidence < 0.6
- **Backoff**: Linear (1s, 2s)
- **Fallback**: Route to Orchestrator for manual handling

### Validation Rules
- Input must not be empty
- Input must be < 10,000 characters
- Session ID must be valid
- Intent confidence must be > 0.4 to proceed

### Success Criteria
- Intent correctly classified (> 85% accuracy)
- Correct agent selected
- Response time < 200ms
- Zero false routing for critical intents (booking, cancellation)

---

## 02. Orchestrator Agent

### Purpose
The Orchestrator Agent coordinates multi-agent workflows, manages parallel execution, aggregates results, and ensures coherent responses from multiple agents.

### Inputs
- Routing decision from Router Agent
- User request details
- List of agents to coordinate
- Execution constraints (timeout, priority)

### Outputs
- Aggregated response from all agents
- Execution status per agent
- Total execution time
- Recommendations summary

### Responsibilities
- Decompose complex requests into sub-tasks
- Manage parallel agent execution
- Handle agent failures and timeouts
- Aggregate and deduplicate results
- Format coherent final response
- Manage cross-agent dependencies

### Allowed Tools
- `parallel_executor`
- `result_aggregator`
- `timeout_manager`
- `error_handler`
- `response_formatter`

### Forbidden Actions
- Cannot override agent business logic
- Cannot directly access external APIs
- Cannot modify agent configurations
- Cannot bypass security validations
- Cannot make decisions outside orchestration scope

### Communication Flow
```
Orchestrator ← Router Agent (routing decision)
    ↓
Orchestrator → [Agent A, Agent B, Agent C] (parallel)
    ↓
[Wait for responses / timeout]
    ↓
Orchestrator ← Agent A (result)
Orchestrator ← Agent B (result)
Orchestrator ← Agent C (result)
    ↓
Orchestrator [Aggregation & Formatting]
    ↓
Orchestrator → Session Agent (update context)
    ↓
Orchestrator → User (final response)
```

### Retry Strategy
- **Max Retries**: 3 per sub-agent
- **Retry On**: Timeout, 5xx errors, partial results
- **Backoff**: Exponential (1s, 2s, 4s)
- **Fallback**: Return partial results with warning

### Validation Rules
- All required agents must respond or timeout
- Aggregated response must be < 50,000 characters
- Execution time must be < 30 seconds
- All agent responses must pass schema validation

### Success Criteria
- All agents executed successfully
- Response is coherent and complete
- Total execution time < 10 seconds
- User receives actionable information

---

## 03. Session Agent

### Purpose
The Session Agent manages user sessions, maintains conversation state, tracks user context, and provides session history for other agents.

### Inputs
- Session ID
- User ID
- Context update requests
- History queries

### Outputs
- Current session state
- User context object
- Conversation history
- Session metadata

### Responsibilities
- Create and manage user sessions
- Store and retrieve conversation context
- Maintain user preferences within session
- Handle session expiration and renewal
- Provide context window for other agents
- Track multi-turn conversations

### Allowed Tools
- `session_store` (Redis/Memory)
- `context_serializer`
- `history_manager`
- `ttl_manager`

### Forbidden Actions
- Cannot modify booking data
- Cannot access external APIs
- Cannot persist data beyond session scope
- Cannot share session data across users
- Cannot bypass rate limits

### Communication Flow
```
[Any Agent] → Session Agent (get/set context)
    ↓
Session Agent [Read/Write to Store]
    ↓
Session Agent → [Requesting Agent] (context data)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: Store unavailable, serialization error
- **Backoff**: Linear (500ms, 1s)
- **Fallback**: Use in-memory session state

### Validation Rules
- Session ID format: `sess_[a-zA-Z0-9]{32}`
- Context size < 100KB
- History limited to last 50 messages
- TTL between 15 minutes and 24 hours

### Success Criteria
- Context retrieval < 50ms
- Zero data loss during session
- Accurate conversation history
- Proper session cleanup on expiry

---

### Layer 2: Core Booking

---

## 04. Flight Agent

### Purpose
The Flight Agent handles all flight-related operations including search, comparison, booking, and modifications.

### Inputs
- Origin airport/city code
- Destination airport/city code
- Travel dates (departure, return)
- Number of passengers
- Class preference (economy, business, first)
- Budget constraints
- Airline preferences

### Outputs
- Flight search results (sorted by relevance)
- Price comparison matrix
- Booking confirmation
- E-ticket reference
- Change/cancellation status

### Responsibilities
- Search available flights across multiple providers
- Compare prices, schedules, and airlines
- Apply filters (stops, times, airlines)
- Execute booking with provider
- Handle seat selection
- Manage booking modifications
- Process cancellations

### Allowed Tools
- `flight_search_api` (Amadeus, Skyscanner, etc.)
- `price_comparison_engine`
- `booking_executor`
- `seat_selector`
- `availability_checker`

### Forbidden Actions
- Cannot book without user confirmation
- Cannot exceed budget without approval
- Cannot share payment data
- Cannot bypass airline rules
- Cannot modify other agent's bookings

### Communication Flow
```
Orchestrator → Flight Agent (search request)
    ↓
Flight Agent → Flight Search API (query)
    ↓
Flight Agent ← Flight Search API (results)
    ↓
Flight Agent → Budget Agent (price validation)
    ↓
Flight Agent ← Budget Agent (approved/rejected)
    ↓
Flight Agent → User (results + recommendation)
    ↓
[User confirms] → Flight Agent → Booking API
    ↓
Flight Agent → BookingConfirm Agent (confirmation)
    ↓
Flight Agent → Notify Agent (e-ticket delivery)
```

### Retry Strategy
- **Max Retries**: 3
- **Retry On**: API timeout, partial results, rate limit
- **Backoff**: Exponential (2s, 4s, 8s)
- **Fallback**: Search alternative provider

### Validation Rules
- Airport codes must be valid IATA codes
- Dates must be in future (departure) and after departure (return)
- Passengers: 1-9 adults, 0-8 infants
- Budget must be positive number
- Date range < 365 days

### Success Criteria
- Search results returned < 5 seconds
- Price accuracy (within 2% of final)
- Booking success rate > 98%
- Zero duplicate bookings

---

## 05. Hotel Agent

### Purpose
The Hotel Agent manages hotel search, comparison, booking, and modification operations.

### Inputs
- Destination city/area
- Check-in date
- Check-out date
- Number of rooms
- Number of guests
- Star rating preference
- Amenity requirements
- Budget per night

### Outputs
- Hotel search results
- Room availability
- Price breakdown
- Booking confirmation
- Cancellation policy

### Responsibilities
- Search hotels by destination and dates
- Filter by amenities, rating, location
- Compare prices across providers
- Execute room bookings
- Handle special requests (early check-in, late checkout)
- Manage room upgrades

### Allowed Tools
- `hotel_search_api` (Booking.com, Hotels.com, etc.)
- `room_availability_checker`
- `booking_executor`
- `amenity_filter`
- `price_calculator`

### Forbidden Actions
- Cannot book without confirmation
- Cannot promise unavailable amenities
- Cannot override hotel policies
- Cannot access payment details
- Cannot modify flight bookings

### Communication Flow
```
Orchestrator → Hotel Agent (search request)
    ↓
Hotel Agent → Hotel Search API (query)
    ↓
Hotel Agent ← Hotel Search API (results)
    ↓
Hotel Agent → Budget Agent (nightly rate check)
    ↓
Hotel Agent → User (results + photos + reviews)
    ↓
[User confirms] → Hotel Agent → Booking API
    ↓
Hotel Agent → BookingConfirm Agent
    ↓
Hotel Agent → Notify Agent (confirmation email)
```

### Retry Strategy
- **Max Retries**: 3
- **Retry On**: API timeout, room sold out, price change
- **Backoff**: Exponential (2s, 4s, 8s)
- **Fallback**: Search alternative provider or nearby hotels

### Validation Rules
- Check-in must be today or future
- Check-out must be after check-in
- Rooms: 1-10
- Guests per room: 1-6
- Stay duration < 90 nights

### Success Criteria
- Results returned < 5 seconds
- Room availability accuracy > 99%
- Price match guarantee
- Booking success rate > 97%

---

## 06. Car Agent

### Purpose
The Car Agent handles vehicle rental search, comparison, and booking operations.

### Inputs
- Pickup location
- Drop-off location
- Pickup date/time
- Drop-off date/time
- Vehicle type (economy, SUV, luxury)
- Driver age
- Insurance requirements

### Outputs
- Available vehicle options
- Rental quotes
- Booking confirmation
- Rental terms
- Add-on options

### Responsibilities
- Search rental cars by location and dates
- Filter by vehicle type and features
- Compare rental companies
- Execute reservations
- Handle add-ons (GPS, child seat, insurance)
- Manage one-way rentals

### Allowed Tools
- `car_rental_api` (Hertz, Avis, etc.)
- `vehicle_comparator`
- `booking_executor`
- `insurance_calculator`
- `location_finder`

### Forbidden Actions
- Cannot book without driver confirmation
- Cannot override age restrictions
- Cannot share driver license data
- Cannot modify flight/hotel bookings
- Cannot promise vehicle availability

### Communication Flow
```
Orchestrator → Car Agent (search request)
    ↓
Car Agent → Car Rental API (query)
    ↓
Car Agent ← Car Rental API (results)
    ↓
Car Agent → Budget Agent (daily rate check)
    ↓
Car Agent → User (vehicle options)
    ↓
[User confirms] → Car Agent → Rental API
    ↓
Car Agent → BookingConfirm Agent
    ↓
Car Agent → Notify Agent (voucher delivery)
```

### Retry Strategy
- **Max Retries**: 3
- **Retry On**: API timeout, vehicle unavailable
- **Backoff**: Exponential (2s, 4s, 8s)
- **Fallback**: Search alternative rental company

### Validation Rules
- Driver age >= 21 (varies by provider)
- Pickup date must be future
- Drop-off after pickup
- Rental duration < 90 days
- Valid location format

### Success Criteria
- Results returned < 5 seconds
- Vehicle availability accuracy > 98%
- Price accuracy > 95%
- Booking success rate > 96%

---

## 07. Package Agent

### Purpose
The Package Agent creates and manages bundled travel packages (flight + hotel + car combinations).

### Inputs
- Destination
- Travel dates
- Number of travelers
- Package components requested
- Budget
- Preferences

### Outputs
- Package options with bundled pricing
- Savings comparison (vs individual booking)
- Package booking confirmation
- Itinerary summary

### Responsibilities
- Search bundled packages from providers
- Calculate savings vs individual bookings
- Create custom packages from components
- Apply package discounts
- Manage package modifications
- Handle package cancellations

### Allowed Tools
- `package_search_api`
- `savings_calculator`
- `bundle_creator`
- `price_aggregator`
- `package_booking_executor`

### Forbidden Actions
- Cannot create misleading savings claims
- Cannot book partial packages without disclosure
- Cannot exceed budget without approval
- Cannot modify individual component policies
- Cannot bypass package terms

### Communication Flow
```
Orchestrator → Package Agent (search request)
    ↓
Package Agent → Flight Agent (flight options)
Package Agent → Hotel Agent (hotel options)
Package Agent → Car Agent (car options)
    ↓
Package Agent → Package API (bundled search)
    ↓
Package Agent [Calculate Savings]
    ↓
Package Agent → User (package options)
    ↓
[User confirms] → Package Agent → All Component APIs
    ↓
Package Agent → BookingConfirm Agent
    ↓
Package Agent → Notify Agent
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: Component unavailable, price mismatch
- **Backoff**: Linear (3s, 6s)
- **Fallback**: Offer alternative package composition

### Validation Rules
- All components must be available
- Savings must be accurately calculated
- Package total <= individual total
- All components share same dates
- Valid for all travelers

### Success Criteria
- Package search < 10 seconds
- Savings calculation accurate
- All components booked atomically
- User satisfaction with package value

---

### Layer 3: Enrichment

---

## 08. Weather Agent

### Purpose
The Weather Agent provides weather forecasts, packing recommendations, and weather alerts for travel destinations.

### Inputs
- Destination city/coordinates
- Travel dates
- Activity preferences
- Packing preferences

### Outputs
- Daily weather forecast
- Temperature range
- Precipitation probability
- Packing suggestions
- Weather alerts

### Responsibilities
- Fetch weather forecasts for destination
- Analyze weather patterns for travel dates
- Generate packing recommendations
- Provide activity-weather compatibility
- Send severe weather alerts

### Allowed Tools
- `weather_api` (OpenWeatherMap, etc.)
- `forecast_analyzer`
- `packing_recommender`
- `alert_monitor`

### Forbidden Actions
- Cannot predict weather beyond 16 days
- Cannot modify travel plans
- Cannot access user location without permission
- Cannot share API keys
- Cannot make safety decisions

### Communication Flow
```
Orchestrator → Weather Agent (forecast request)
    ↓
Weather Agent → Weather API (query)
    ↓
Weather Agent [Analyze & Package]
    ↓
Weather Agent → Orchestrator (weather data)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: API timeout, data unavailable
- **Backoff**: Linear (1s, 2s)
- **Fallback**: Return historical average data

### Validation Rules
- Location must be valid
- Dates within forecast range
- Response must include disclaimer
- Alerts must be clearly marked

### Success Criteria
- Forecast accuracy > 80% (3-day)
- Response time < 2 seconds
- Packing suggestions relevant
- Alerts delivered within 1 hour

---

## 09. Visa Agent

### Purpose
The Visa Agent provides visa requirements, application guidance, and document checklists for international travel.

### Inputs
- Traveler nationality
- Destination country
- Travel purpose
- Travel duration
- Transit countries

### Outputs
- Visa requirements
- Application checklist
- Processing time estimates
- Embassy/consulate locations
- Fee information

### Responsibilities
- Check visa requirements by nationality
- Generate document checklists
- Estimate processing times
- Provide application guidance
- Track visa status (if integrated)

### Allowed Tools
- `visa_requirements_db`
- `embassy_locator`
- `document_checker`
- `processing_time_estimator`

### Forbidden Actions
- Cannot guarantee visa approval
- Cannot submit applications
- Cannot access passport data
- Cannot provide legal advice
- Cannot bypass immigration rules

### Communication Flow
```
Orchestrator → Visa Agent (requirements request)
    ↓
Visa Agent → Visa DB (query)
    ↓
Visa Agent [Generate Requirements]
    ↓
Visa Agent → Orchestrator (visa info)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: DB unavailable, incomplete data
- **Backoff**: Linear (1s, 2s)
- **Fallback**: Provide general guidance with disclaimer

### Validation Rules
- Nationality must be valid ISO country code
- Destination must be valid country
- Purpose must be valid enum
- Response must include disclaimer

### Success Criteria
- Requirements accuracy > 95%
- Response time < 2 seconds
- Checklist completeness > 90%
- User finds info helpful

---

## 10. Transport Agent

### Purpose
The Transport Agent handles ground transportation options including public transit, taxis, rideshares, and transfers.

### Inputs
- Current location
- Destination location
- Number of passengers
- Luggage count
- Time constraints
- Budget preferences
- Accessibility needs

### Outputs
- Transport options (transit, taxi, rideshare)
- Estimated costs
- Travel time estimates
- Booking options
- Route maps

### Responsibilities
- Find public transit routes
- Compare taxi/rideshare prices
- Book airport transfers
- Provide walking/cycling directions
- Handle multi-modal journeys

### Allowed Tools
- `transit_api` (Google Maps, Citymapper)
- `rideshare_api` (Uber, Lyft)
- `taxi_booking_api`
- `route_calculator`
- `price_estimator`

### Forbidden Actions
- Cannot guarantee availability
- Cannot set transport prices
- Cannot modify flight/hotel bookings
- Cannot access driver data
- Cannot override local regulations

### Communication Flow
```
Orchestrator → Transport Agent (route request)
    ↓
Transport Agent → Transit API (query)
Transport Agent → Rideshare API (query)
    ↓
Transport Agent [Compare Options]
    ↓
Transport Agent → User (transport options)
    ↓
[User selects] → Transport Agent → Booking API
    ↓
Transport Agent → Notify Agent (booking confirmation)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: API timeout, no routes found
- **Backoff**: Linear (1s, 2s)
- **Fallback**: Provide alternative transport modes

### Validation Rules
- Locations must be valid coordinates
- Passengers > 0
- Time must be future (or now for immediate)
- Budget must be positive

### Success Criteria
- Results returned < 3 seconds
- Price accuracy > 90%
- Route accuracy > 95%
- User books transport > 30% of time

---

## 11. Activities Agent

### Purpose
The Activities Agent discovers and recommends local activities, tours, attractions, and experiences.

### Inputs
- Destination
- Travel dates
- Interests/preferences
- Budget
- Group size
- Duration preferences
- Accessibility needs

### Outputs
- Activity recommendations
- Booking options
- Review summaries
- Pricing information
- Schedule suggestions

### Responsibilities
- Search local activities and attractions
- Filter by interests and constraints
- Compare prices and reviews
- Handle ticket bookings
- Create activity itineraries
- Manage group bookings

### Allowed Tools
- `activities_api` (Viator, GetYourGuide, etc.)
- `attraction_db`
- `review_aggregator`
- `ticket_booking_api`
- `itinerary_builder`

### Forbidden Actions
- Cannot guarantee availability
- Cannot modify main bookings
- Cannot access personal data
- Cannot promise specific outcomes
- Cannot bypass age restrictions

### Communication Flow
```
Orchestrator → Activities Agent (search request)
    ↓
Activities Agent → Activities API (query)
    ↓
Activities Agent → Review Agent (get reviews)
    ↓
Activities Agent [Filter & Rank]
    ↓
Activities Agent → User (activity options)
    ↓
[User selects] → Activities Agent → Ticket API
    ↓
Activities Agent → BookingConfirm Agent
    ↓
Activities Agent → Notify Agent
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: API timeout, no results
- **Backoff**: Linear (1s, 2s)
- **Fallback**: Suggest alternative activities

### Validation Rules
- Destination must be valid
- Dates within availability range
- Group size > 0
- Budget >= 0

### Success Criteria
- Results returned < 3 seconds
- Recommendation relevance > 80%
- Booking success rate > 95%
- User satisfaction > 4/5

---

## 12. Dining Agent

### Purpose
The Dining Agent discovers restaurants, handles reservations, and provides dining recommendations.

### Inputs
- Location
- Cuisine preferences
- Dietary restrictions
- Price range
- Date/time
- Party size
- Ambiance preferences

### Outputs
- Restaurant recommendations
- Reservation options
- Menu highlights
- Review summaries
- Dietary compliance info

### Responsibilities
- Search restaurants by criteria
- Check availability and make reservations
- Filter by dietary requirements
- Provide cuisine recommendations
- Handle special occasion requests
- Manage reservation modifications

### Allowed Tools
- `restaurant_api` (Yelp, OpenTable, etc.)
- `menu_analyzer`
- `reservation_api`
- `dietary_checker`
- `review_aggregator`

### Forbidden Actions
- Cannot guarantee table availability
- Cannot modify menu items
- Cannot access payment data
- Cannot override restaurant policies
- Cannot make medical dietary claims

### Communication Flow
```
Orchestrator → Dining Agent (search request)
    ↓
Dining Agent → Restaurant API (query)
    ↓
Dining Agent → Dietary Checker (filter)
    ↓
Dining Agent → User (restaurant options)
    ↓
[User selects] → Dining Agent → Reservation API
    ↓
Dining Agent → BookingConfirm Agent
    ↓
Dining Agent → Notify Agent
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: API timeout, no availability
- **Backoff**: Linear (1s, 2s)
- **Fallback**: Suggest alternative restaurants

### Validation Rules
- Location must be valid
- Date/time must be future
- Party size: 1-20
- Price range must be valid enum

### Success Criteria
- Results returned < 3 seconds
- Reservation success rate > 90%
- Dietary filter accuracy > 95%
- User satisfaction > 4/5

---

### Layer 4: Support

---

## 13. Budget Agent

### Purpose
The Budget Agent manages travel budgets, tracks expenses, provides cost estimates, and alerts on overspending.

### Inputs
- Total budget
- Trip components
- Currency
- Spending history
- Alert thresholds

### Outputs
- Cost breakdown by category
- Budget utilization percentage
- Remaining budget
- Overspending alerts
- Savings recommendations

### Responsibilities
- Calculate total trip costs
- Track spending across components
- Compare actual vs budget
- Generate cost breakdowns
- Provide savings tips
- Send budget alerts

### Allowed Tools
- `price_aggregator`
- `budget_calculator`
- `expense_tracker`
- `alert_manager`
- `savings_recommender`

### Forbidden Actions
- Cannot modify booking prices
- Cannot access payment methods
- Cannot make purchasing decisions
- Cannot override user budget
- Cannot share financial data

### Communication Flow
```
[Any Booking Agent] → Budget Agent (price check)
    ↓
Budget Agent → Price Aggregator (get total)
    ↓
Budget Agent [Budget Analysis]
    ↓
Budget Agent → [Requesting Agent] (approved/rejected)
    ↓
[If alert needed] → Budget Agent → Notify Agent
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: Price data unavailable
- **Backoff**: Linear (500ms, 1s)
- **Fallback**: Use cached prices with warning

### Validation Rules
- Budget must be positive
- Currency must be valid ISO code
- Alerts must have valid threshold
- Spending history must be chronological

### Success Criteria
- Price calculation accuracy > 99%
- Alert delivery < 1 minute
- Budget tracking real-time
- User informed of all changes

---

## 14. Translate Agent

### Purpose
The Translate Agent provides real-time translation services for travel communications.

### Inputs
- Text to translate
- Source language
- Target language
- Context (travel phrases, menus, signs)
- Formality level

### Outputs
- Translated text
- Pronunciation guide
- Cultural context
- Alternative translations
- Confidence score

### Responsibilities
- Translate text between 50+ languages
- Provide travel-specific translations
- Handle menu/sign translations
- Offer pronunciation guides
- Suggest cultural alternatives
- Maintain translation quality

### Allowed Tools
- `translation_api` (Google Translate, DeepL)
- `phrase_database`
- `pronunciation_engine`
- `cultural_adapter`

### Forbidden Actions
- Cannot guarantee translation accuracy
- Cannot translate illegal content
- Cannot store translation history
- Cannot override cultural norms
- Cannot provide legal translations

### Communication Flow
```
[Any Agent] → Translate Agent (translation request)
    ↓
Translate Agent → Translation API (translate)
    ↓
Translate Agent [Enhance with context]
    ↓
Translate Agent → [Requesting Agent] (translated text)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: API timeout, language not supported
- **Backoff**: Linear (500ms, 1s)
- **Fallback**: Provide basic translation with disclaimer

### Validation Rules
- Text must not be empty
- Languages must be supported
- Text length < 5,000 characters
- No sensitive content

### Success Criteria
- Translation quality > 90%
- Response time < 1 second
- Travel phrase accuracy > 95%
- User understands translation

---

## 15. Currency Agent

### Purpose
The Currency Agent handles currency conversion, exchange rate information, and multi-currency calculations.

### Inputs
- Amount
- Source currency
- Target currency
- Exchange rate source preference

### Outputs
- Converted amount
- Exchange rate
- Rate timestamp
- Historical trends
- Fee estimates

### Responsibilities
- Provide real-time exchange rates
- Convert between currencies
- Calculate fees and markups
- Track rate history
- Send rate alerts
- Handle multi-currency displays

### Allowed Tools
- `exchange_rate_api`
- `currency_converter`
- `rate_history_db`
- `fee_calculator`
- `alert_manager`

### Forbidden Actions
- Cannot execute currency trades
- Cannot guarantee exchange rates
- Cannot access bank accounts
- Cannot modify pricing
- Cannot provide investment advice

### Communication Flow
```
[Any Agent] → Currency Agent (conversion request)
    ↓
Currency Agent → Exchange Rate API (get rate)
    ↓
Currency Agent [Calculate with fees]
    ↓
Currency Agent → [Requesting Agent] (converted amount)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: API timeout, rate unavailable
- **Backoff**: Linear (500ms, 1s)
- **Fallback**: Use cached rate with timestamp

### Validation Rules
- Amount must be positive
- Currencies must be valid ISO codes
- Rate must be > 0
- Timestamp must be recent (< 1 hour)

### Success Criteria
- Rate accuracy > 99%
- Response time < 500ms
- Conversion calculation correct
- Fee estimates within 5%

---

## 16. Insurance Agent

### Purpose
The Insurance Agent provides travel insurance quotes, compares policies, and manages insurance purchases.

### Inputs
- Traveler age(s)
- Destination
- Trip cost
- Trip duration
- Coverage requirements
- Pre-existing conditions

### Outputs
- Insurance quotes
- Policy comparisons
- Coverage details
- Purchase confirmation
- Claims information

### Responsibilities
- Search insurance providers
- Compare coverage options
- Calculate premiums
- Handle policy purchases
- Provide claims guidance
- Manage policy modifications

### Allowed Tools
- `insurance_api`
- `quote_comparator`
- `coverage_analyzer`
- `purchase_executor`
- `claims_database`

### Forbidden Actions
- Cannot guarantee claims approval
- Cannot provide medical advice
- Cannot access medical records
- Cannot modify policy terms
- Cannot process claims

### Communication Flow
```
Orchestrator → Insurance Agent (quote request)
    ↓
Insurance Agent → Insurance API (search)
    ↓
Insurance Agent [Compare & Analyze]
    ↓
Insurance Agent → User (policy options)
    ↓
[User selects] → Insurance Agent → Purchase API
    ↓
Insurance Agent → BookingConfirm Agent
    ↓
Insurance Agent → Notify Agent (policy docs)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: API timeout, no quotes
- **Backoff**: Linear (2s, 4s)
- **Fallback**: Provide general insurance guidance

### Validation Rules
- Age must be valid (0-120)
- Destination must be valid
- Trip cost must be positive
- Duration must be > 0

### Success Criteria
- Quotes returned < 5 seconds
- Price accuracy > 95%
- Coverage comparison accurate
- Purchase success rate > 98%

---

## 17. Emergency Agent

### Purpose
The Emergency Agent handles travel emergencies, provides critical assistance, and coordinates emergency responses.

### Inputs
- Emergency type (medical, legal, lost documents, etc.)
- Current location
- Traveler information
- Severity level

### Outputs
- Emergency contacts
- Nearest assistance locations
- Step-by-step guidance
- Embassy information
- Insurance claim instructions

### Responsibilities
- Provide emergency contact numbers
- Locate nearest hospitals/embassies
- Guide through emergency procedures
- Coordinate with insurance
- Send emergency notifications
- Track emergency resolution

### Allowed Tools
- `emergency_database`
- `location_finder`
- `contact_directory`
- `notification_system`
- `embassy_api`

### Forbidden Actions
- Cannot dispatch emergency services
- Cannot provide medical treatment
- Cannot guarantee outcomes
- Cannot access real-time emergency data
- Cannot override local authorities

### Communication Flow
```
[User/Any Agent] → Emergency Agent (emergency report)
    ↓
Emergency Agent [Assess Severity]
    ↓
Emergency Agent → Location Finder (nearest help)
    ↓
Emergency Agent → User (emergency guidance)
    ↓
Emergency Agent → Notify Agent (emergency alerts)
    ↓
Emergency Agent → Insurance Agent (claim start)
```

### Retry Strategy
- **Max Retries**: 5 (critical)
- **Retry On**: Any failure
- **Backoff**: Immediate (0s, 1s, 2s, 3s, 5s)
- **Fallback**: Provide emergency hotline numbers

### Validation Rules
- Emergency type must be valid enum
- Location must be provided
- Response must include disclaimer
- Must escalate severe cases

### Success Criteria
- Response time < 30 seconds
- Correct emergency contacts provided
- User receives actionable guidance
- Emergency tracked to resolution

---

### Layer 5: Operations

---

## 18. Notify Agent

### Purpose
The Notify Agent manages all user notifications across multiple channels (push, email, SMS).

### Inputs
- Notification type
- Recipient user ID
- Message content
- Priority level
- Channel preference
- Delivery time

### Outputs
- Delivery status per channel
- Notification ID
- Delivery timestamp
- Read status

### Responsibilities
- Send push notifications
- Send email notifications
- Send SMS messages
- Manage notification preferences
- Handle delivery failures
- Track notification analytics

### Allowed Tools
- `push_notification_api`
- `email_service_api`
- `sms_api`
- `preference_manager`
- `delivery_tracker`

### Forbidden Actions
- Cannot send spam
- Cannot bypass user preferences
- Cannot access message content beyond scope
- Cannot modify notification rules
- Cannot send without permission

### Communication Flow
```
[Any Agent] → Notify Agent (notification request)
    ↓
Notify Agent → Preference Manager (check prefs)
    ↓
Notify Agent [Format for channel]
    ↓
Notify Agent → Channel API (send)
    ↓
Notify Agent → Delivery Tracker (monitor)
    ↓
Notify Agent → [Requesting Agent] (delivery status)
```

### Retry Strategy
- **Max Retries**: 3
- **Retry On**: Delivery failure
- **Backoff**: Exponential (1m, 5m, 15m)
- **Fallback**: Try alternative channel

### Validation Rules
- User ID must be valid
- Message must not be empty
- Channel must be enabled for user
- Priority must be valid enum

### Success Criteria
- Delivery rate > 95%
- Delivery time < 30 seconds (push)
- Delivery time < 5 minutes (email)
- User satisfaction with notifications

---

## 19. Validate Agent

### Purpose
The Validate Agent ensures data integrity by validating all inputs and outputs across the system.

### Inputs
- Data payload
- Validation schema
- Validation rules
- Context

### Outputs
- Validation result (pass/fail)
- List of validation errors
- Sanitized data
- Confidence score

### Responsibilities
- Validate data schemas
- Check business rules
- Sanitize user inputs
- Detect anomalies
- Prevent data corruption
- Enforce data quality

### Allowed Tools
- `schema_validator`
- `business_rule_engine`
- `sanitizer`
- `anomaly_detector`
- `data_quality_checker`

### Forbidden Actions
- Cannot modify business logic
- Cannot bypass validation rules
- Cannot approve invalid data
- Cannot access external APIs
- Cannot make business decisions

### Communication Flow
```
[Any Agent] → Validate Agent (validation request)
    ↓
Validate Agent [Schema Validation]
    ↓
Validate Agent [Business Rules]
    ↓
Validate Agent [Sanitization]
    ↓
Validate Agent → [Requesting Agent] (result)
```

### Retry Strategy
- **Max Retries**: 1
- **Retry On**: Never (validation is deterministic)
- **Backoff**: N/A
- **Fallback**: Return validation errors

### Validation Rules
- Schema must be provided
- Rules must be complete
- Data must be serializable
- Context must include all required fields

### Success Criteria
- Validation accuracy > 99.9%
- Response time < 100ms
- Zero false positives
- All critical data validated

---

## 20. Analytics Agent

### Purpose
The Analytics Agent tracks system performance, user behavior, and generates insights for optimization.

### Inputs
- Event data
- User interactions
- System metrics
- Query parameters

### Outputs
- Analytics reports
- Performance metrics
- User behavior insights
- Trend analysis
- Recommendations

### Responsibilities
- Track user interactions
- Monitor system performance
- Generate usage reports
- Analyze conversion funnels
- Identify optimization opportunities
- Predict demand patterns

### Allowed Tools
- `event_tracker`
- `metrics_aggregator`
- `report_generator`
- `trend_analyzer`
- `prediction_engine`

### Forbidden Actions
- Cannot access personal user data
- Cannot modify system behavior
- Cannot share raw data
- Cannot make autonomous changes
- Cannot bypass privacy regulations

### Communication Flow
```
[Any Agent] → Analytics Agent (track event)
    ↓
Analytics Agent → Event Store (save)
    ↓
[Periodic] → Analytics Agent [Aggregate]
    ↓
Analytics Agent → Report Generator (create report)
    ↓
Analytics Agent → Dashboard (display)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: Event store unavailable
- **Backoff**: Linear (1s, 2s)
- **Fallback**: Queue events for later processing

### Validation Rules
- Events must have required fields
- Metrics must be numeric
- Reports must be generated on schedule
- Data retention must comply with regulations

### Success Criteria
- Event tracking accuracy > 99%
- Report generation on time
- Insights actionable
- Performance monitoring real-time

---

## 21. BookingConfirm Agent

### Purpose
The BookingConfirm Agent handles booking confirmations, generates receipts, and updates booking status.

### Inputs
- Booking reference
- Booking details
- Provider confirmation
- User information

### Outputs
- Confirmation number
- Receipt/invoice
- Booking summary
- Cancellation policy
- Next steps

### Responsibilities
- Generate confirmation numbers
- Create receipts and invoices
- Update booking status
- Store booking records
- Handle confirmation disputes
- Provide booking history

### Allowed Tools
- `confirmation_generator`
- `receipt_creator`
- `booking_database`
- `status_manager`
- `dispute_handler`

### Forbidden Actions
- Cannot modify booking terms
- Cannot access payment details
- Cannot guarantee availability
- Cannot override provider policies
- Cannot create false confirmations

### Communication Flow
```
[Booking Agent] → BookingConfirm Agent (confirmation request)
    ↓
BookingConfirm Agent → Confirmation Generator (create)
    ↓
BookingConfirm Agent → Booking Database (store)
    ↓
BookingConfirm Agent → Receipt Creator (generate)
    ↓
BookingConfirm Agent → [Booking Agent] (confirmation)
    ↓
BookingConfirm Agent → Notify Agent (send confirmation)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: Database unavailable, generation error
- **Backoff**: Linear (1s, 2s)
- **Fallback**: Store pending confirmation

### Validation Rules
- Booking reference must be unique
- All required fields must be present
- Confirmation number format valid
- Receipt must include all required items

### Success Criteria
- Confirmation generated < 5 seconds
- Receipt accuracy > 99%
- Booking record stored securely
- User receives confirmation promptly

---

## 22. Cancel Agent

### Purpose
The Cancel Agent handles booking cancellations, refund processing, and penalty calculations.

### Inputs
- Booking reference
- Cancellation reason
- Cancellation time
- User information

### Outputs
- Cancellation status
- Refund amount
- Penalty fees
- Cancellation confirmation
- Refund timeline

### Responsibilities
- Process cancellation requests
- Calculate penalties and refunds
- Apply cancellation policies
- Handle refund processing
- Manage dispute escalations
- Track cancellation metrics

### Allowed Tools
- `cancellation_api`
- `penalty_calculator`
- `refund_processor`
- `policy_database`
- `dispute_manager`

### Forbidden Actions
- Cannot override cancellation policies
- Cannot guarantee refund amounts
- Cannot access payment systems directly
- Cannot process instant refunds
- Cannot modify provider terms

### Communication Flow
```
[User/Any Agent] → Cancel Agent (cancellation request)
    ↓
Cancel Agent → Booking Database (get booking)
    ↓
Cancel Agent → Policy Database (get policy)
    ↓
Cancel Agent → Penalty Calculator (calculate)
    ↓
Cancel Agent → User (cancellation details)
    ↓
[User confirms] → Cancel Agent → Cancellation API
    ↓
Cancel Agent → Refund Processor (initiate refund)
    ↓
Cancel Agent → BookingConfirm Agent (update status)
    ↓
Cancel Agent → Notify Agent (cancellation confirmation)
```

### Retry Strategy
- **Max Retries**: 3
- **Retry On**: API timeout, refund processing error
- **Backoff**: Exponential (2s, 4s, 8s)
- **Fallback**: Queue for manual processing

### Validation Rules
- Booking reference must exist
- Booking must be in cancellable state
- Cancellation reason must be provided
- Refund amount must be calculated

### Success Criteria
- Cancellation processed < 30 seconds
- Penalty calculation accurate
- Refund initiated within 24 hours
- User informed of all details

---

## 23. Profile Agent

### Purpose
The Profile Agent manages user profiles, preferences, and personalization data.

### Inputs
- User ID
- Profile updates
- Preference changes
- Travel history

### Outputs
- User profile
- Preferences
- Travel history
- Recommendations
- Personalization scores

### Responsibilities
- Store and retrieve user profiles
- Manage travel preferences
- Track travel history
- Generate personalized recommendations
- Handle privacy settings
- Manage loyalty programs

### Allowed Tools
- `profile_database`
- `preference_manager`
- `history_tracker`
- `recommendation_engine`
- `privacy_manager`

### Forbidden Actions
- Cannot share profile data
- Cannot modify without consent
- Cannot access sensitive data
- Cannot bypass privacy settings
- Cannot sell user data

### Communication Flow
```
[User/Any Agent] → Profile Agent (profile request)
    ↓
Profile Agent → Profile Database (get/update)
    ↓
Profile Agent [Apply Preferences]
    ↓
Profile Agent → [Requesting Agent] (profile data)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: Database unavailable
- **Backoff**: Linear (500ms, 1s)
- **Fallback**: Use session profile

### Validation Rules
- User ID must be valid
- Updates must be authorized
- Privacy settings must be respected
- Data retention must comply

### Success Criteria
- Profile access < 100ms
- Data accuracy > 99%
- Privacy compliance 100%
- Personalization relevance > 80%

---

## 24. Review Agent

### Purpose
The Review Agent manages travel reviews, ratings, and feedback collection.

### Inputs
- Entity ID (hotel, restaurant, activity)
- Review content
- Rating
- User ID

### Outputs
- Aggregated ratings
- Review summaries
- Sentiment analysis
- Review credibility score
- Response recommendations

### Responsibilities
- Collect user reviews
- Aggregate ratings from sources
- Analyze review sentiment
- Detect fake reviews
- Generate review summaries
- Moderate review content

### Allowed Tools
- `review_database`
- `sentiment_analyzer`
- `aggregator`
- `moderator`
- `credibility_checker`

### Forbidden Actions
- Cannot fabricate reviews
- Cannot delete legitimate reviews
- Cannot access private reviews
- Cannot bypass moderation
- Cannot guarantee review accuracy

### Communication Flow
```
[User/Activities Agent] → Review Agent (review request)
    ↓
Review Agent → Review Database (fetch)
    ↓
Review Agent → Sentiment Analyzer (analyze)
    ↓
Review Agent → Aggregator (combine)
    ↓
Review Agent → [Requesting Agent] (review data)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: Database unavailable
- **Backoff**: Linear (1s, 2s)
- **Fallback**: Return cached reviews

### Validation Rules
- Entity ID must exist
- Rating must be 1-5
- Review must not be empty
- User must be authenticated

### Success Criteria
- Review accuracy > 95%
- Sentiment analysis > 85% accuracy
- Fake review detection > 90%
- Response time < 2 seconds

---

## 25. PriceMonitor Agent

### Purpose
The PriceMonitor Agent tracks price changes, alerts users to deals, and predicts price trends.

### Inputs
- Item type (flight, hotel, car)
- Origin/destination
- Dates
- Current price
- Alert thresholds

### Outputs
- Price history
- Trend analysis
- Price alerts
- Predictions
- Deal recommendations

### Responsibilities
- Track price changes over time
- Send price drop alerts
- Predict price movements
- Identify deals and discounts
- Compare historical prices
- Provide booking timing recommendations

### Allowed Tools
- `price_tracker`
- `trend_analyzer`
- `alert_manager`
- `prediction_engine`
- `deal_finder`

### Forbidden Actions
- Cannot guarantee price predictions
- Cannot access real-time market data
- Cannot modify prices
- Cannot make purchase decisions
- Cannot share competitor data

### Communication Flow
```
[Booking Agent] → PriceMonitor Agent (track price)
    ↓
PriceMonitor Agent → Price Database (store)
    ↓
PriceMonitor Agent → Trend Analyzer (analyze)
    ↓
[If alert triggered] → PriceMonitor Agent → Notify Agent
    ↓
PriceMonitor Agent → [Booking Agent] (price data)
```

### Retry Strategy
- **Max Retries**: 2
- **Retry On**: Database unavailable
- **Backoff**: Linear (1s, 2s)
- **Fallback**: Use cached price data

### Validation Rules
- Price must be positive
- Dates must be valid
- Alert threshold must be reasonable
- Prediction confidence must be provided

### Success Criteria
- Price tracking accuracy > 99%
- Alert delivery < 5 minutes
- Prediction accuracy > 70%
- User finds deals valuable

---

## Communication Flow Matrix

### Agent-to-Agent Communication

| From ↓ / To → | Router | Orchestr. | Session | Flight | Hotel | Car | Package | Weather | Visa | Transport | Activities | Dining | Budget | Translate | Currency | Insurance | Emergency | Notify | Validate | Analytics | BookConf | Cancel | Profile | Review | PriceMon |
|----------------|--------|-----------|---------|--------|-------|-----|---------|---------|------|-----------|------------|--------|--------|-----------|----------|-----------|-----------|--------|----------|-----------|----------|--------|---------|--------|----------|
| **Router** | - | ✓ | ✓ | | | | | | | | | | | | | | | | | | | | | | |
| **Orchestrator** | | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | | | ✓ | | | | | | | |
| **Session** | ✓ | ✓ | - | | | | | | | | | | | | | | | | | | | | | | |
| **Flight** | | ✓ | | - | | | | | | | | | ✓ | | | | | ✓ | ✓ | ✓ | ✓ | | | | ✓ |
| **Hotel** | | ✓ | | | - | | | | | | | | ✓ | | | | | ✓ | ✓ | ✓ | ✓ | | | | ✓ |
| **Car** | | ✓ | | | | - | | | | ✓ | | | ✓ | | | | | ✓ | ✓ | ✓ | ✓ | | | | ✓ |
| **Package** | | ✓ | | ✓ | ✓ | ✓ | - | | | | | | ✓ | | | | | ✓ | ✓ | ✓ | ✓ | | | | ✓ |
| **Weather** | | ✓ | | | | | | - | | | ✓ | | | | | | | | | | | | | | |
| **Visa** | | ✓ | | | | | | | - | | | | | | | | | | | | | | | | |
| **Transport** | | ✓ | | | | | | | | - | | | ✓ | | | | | ✓ | | | | | | | |
| **Activities** | | ✓ | | | | | | | | | - | | ✓ | | | | | ✓ | ✓ | | ✓ | | | ✓ | |
| **Dining** | | ✓ | | | | | | | | | | - | ✓ | | | | | ✓ | ✓ | | ✓ | | | ✓ | |
| **Budget** | | | | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ | ✓ | - | | | | | | | | | | | | |
| **Translate** | | | | | | | | | | | | | | - | | | | | | | | | | | |
| **Currency** | | | | | | | | | | | | | ✓ | | - | | | | | | | | | | |
| **Insurance** | | ✓ | | | | | | | | | | | | | | - | | ✓ | | | | | | | |
| **Emergency** | | ✓ | | | | | | | | | | | | | | ✓ | - | ✓ | | | | | | | |
| **Notify** | | | | | | | | | | | | | | | | | | - | | | | | | | |
| **Validate** | | | | | | | | | | | | | | | | | | | - | | | | | | |
| **Analytics** | | | | | | | | | | | | | | | | | | | | - | | | | | |
| **BookingConfirm** | | | | ✓ | ✓ | ✓ | ✓ | | | | ✓ | ✓ | | | | | | ✓ | | | - | ✓ | | | |
| **Cancel** | | ✓ | | ✓ | ✓ | ✓ | ✓ | | | | ✓ | ✓ | | | | | | ✓ | | | ✓ | - | | | |
| **Profile** | | | ✓ | | | | | | | | | | | | | | | | | | | | - | | |
| **Review** | | | | | | | | | | | ✓ | ✓ | | | | | | | | | | | | - | |
| **PriceMonitor** | | | | ✓ | ✓ | ✓ | ✓ | | | | | | | | | | | ✓ | | | | | | | - |

### Communication Protocols

| Protocol | Use Case | Timeout | Retry |
|----------|----------|---------|-------|
| **Synchronous** | Quick queries, validations | 5s | 2 |
| **Asynchronous** | Long-running tasks | 30s | 3 |
| **Event-based** | Notifications, alerts | 10s | 5 |
| **Batch** | Analytics, reporting | 60s | 2 |

---

## Common Errors & Solutions

### Error Categories

| Category | Error Type | Impact | Recovery |
|----------|------------|--------|----------|
| **Network** | API Timeout | High | Retry with backoff |
| **Network** | Connection Refused | High | Fallback provider |
| **Data** | Invalid Input | Medium | Validate & retry |
| **Data** | Schema Mismatch | Medium | Reformat & retry |
| **Business** | Availability Changed | Low | Search alternatives |
| **Business** | Price Changed | Low | Notify user |
| **System** | Agent Unavailable | High | Route to fallback |
| **System** | Database Down | Critical | Queue & alert |

### Error Handling Flow

```
Agent Error Detected
    ↓
[Classify Error]
    ↓
┌─────────────┬─────────────┬─────────────┐
│ Retryable   │ Degradable  │ Critical    │
│     ↓       │     ↓       │     ↓       │
│  Retry N    │ Fallback    │ Escalate    │
│     ↓       │     ↓       │     ↓       │
│ Success?    │ Partial OK? │ Notify User │
│  Y → Continue│ Y → Warn   │ Log & Alert │
│  N → Next   │ N → Escalate│             │
└─────────────┴─────────────┴─────────────┘
```

### Common Error Messages

| Error Code | Message | Solution |
|------------|---------|----------|
| `E001` | Agent timeout | Retry or use fallback |
| `E002` | Invalid input | Validate and retry |
| `E003` | API rate limited | Wait and retry |
| `E004` | Service unavailable | Use alternative provider |
| `E005` | Data not found | Expand search criteria |
| `E006` | Booking failed | Check availability |
| `E007` | Payment declined | Verify payment info |
| `E008` | Session expired | Refresh session |
| `E009` | Validation failed | Fix data and retry |
| `E010` | Network error | Check connectivity |

---

## Appendix: Agent ID Reference

| ID | Agent Name | Layer | Status |
|----|------------|-------|--------|
| 01 | Router Agent | Orchestration | Active |
| 02 | Orchestrator Agent | Orchestration | Active |
| 03 | Session Agent | Orchestration | Active |
| 04 | Flight Agent | Core Booking | Active |
| 05 | Hotel Agent | Core Booking | Active |
| 06 | Car Agent | Core Booking | Active |
| 07 | Package Agent | Core Booking | Active |
| 08 | Weather Agent | Enrichment | Active |
| 09 | Visa Agent | Enrichment | Active |
| 10 | Transport Agent | Enrichment | Active |
| 11 | Activities Agent | Enrichment | Active |
| 12 | Dining Agent | Enrichment | Active |
| 13 | Budget Agent | Support | Active |
| 14 | Translate Agent | Support | Active |
| 15 | Currency Agent | Support | Active |
| 16 | Insurance Agent | Support | Active |
| 17 | Emergency Agent | Support | Active |
| 18 | Notify Agent | Operations | Active |
| 19 | Validate Agent | Operations | Active |
| 20 | Analytics Agent | Operations | Active |
| 21 | BookingConfirm Agent | Operations | Active |
| 22 | Cancel Agent | Operations | Active |
| 23 | Profile Agent | Support | Active |
| 24 | Review Agent | Operations | Active |
| 25 | PriceMonitor Agent | Support | Active |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-01 | Initial architecture with 25 agents |

---

*Last Updated: 2026-07-01*
*Architecture Version: 1.0.0*
