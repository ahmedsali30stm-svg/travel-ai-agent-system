# Google Maps Tool

## Overview

Google Maps Platform integration for geocoding, places search, directions, distance matrix, and static maps.

## Tool ID

`tool_google_maps`

## Category

Maps & Location

## Capabilities

| Capability | Description | Supported |
|------------|-------------|-----------|
| Geocoding | Address to coordinates | Yes |
| Reverse Geocoding | Coordinates to address | Yes |
| Places Search | Find places | Yes |
| Place Details | Get place info | Yes |
| Autocomplete | Address autocomplete | Yes |
| Directions | Route planning | Yes |
| Distance Matrix | Distance/duration | Yes |
| Elevation | Elevation data | Yes |
| Timezone | Timezone lookup | Yes |
| Static Maps | Map images | Yes |
| Street View | Street imagery | Yes |
| Nearby Search | Find nearby places | Yes |
| Text Search | Free-form search | Yes |

## Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| Quota Limits | Daily request limits | Caching, quota management |
| Cost | Paid API | Optimize usage |
| Rate Limits | QPS limits | Rate limiter |
| Data Freshness | May be outdated | Cross-reference |
| Coverage | Not global | Fallback to OSM |
| Attribution | Required | Include in output |

## Authentication

```yaml
Authentication:
  type: api_key
  header: key
  methods:
    - query_parameter
    - api_key_header
  notes: |
    - API key required
    - Restrict key by HTTP referrer/IP
    - Enable only needed APIs
    - Monitor usage dashboard
```

## Rate Limiting

```yaml
RateLimit:
  requests_per_second: 50
  requests_per_minute: 3000
  requests_per_hour: 100000
  daily_limit: 100000
  quota_cost:
    geocoding: 5
    places_search: 10
    place_details: 10
    directions: 10
    distance_matrix: 10
    autocomplete: 10
  notes: |
    - Different APIs have different costs
    - Batch requests reduce cost
    - Cache aggressively
```

## Retry Policy

```yaml
RetryPolicy:
  max_retries: 3
  initial_delay_ms: 1000
  max_delay_ms: 10000
  backoff_multiplier: 2
  jitter: true
  retryable_errors:
    - OVER_QUERY_LIMIT
    - REQUEST_DENIED
    - UNKNOWN_ERROR
  non_retryable_errors:
    - INVALID_REQUEST
    - ZERO_RESULTS
    - NOT_FOUND
```

## Error Codes

| Code | Description | Retryable | Action |
|------|-------------|-----------|--------|
| `OVER_QUERY_LIMIT` | Quota exceeded | Yes | Backoff |
| `REQUEST_DENIED` | Request denied | No | Check API key |
| `INVALID_REQUEST` | Invalid request | No | Fix request |
| `ZERO_RESULTS` | No results found | No | Try different query |
| `UNKNOWN_ERROR` | Server error | Yes | Retry |
| `NOT_FOUND` | Place not found | No | Try different query |
| `MAX_ROUTE_LENGTH_EXCEEDED` | Route too long | No | Split route |
| `MAX_WAYPOINTS_EXCEEDED` | Too many waypoints | No | Reduce waypoints |
| `NOT_FOUND` | Waypoint not found | No | Check waypoint |

## Input Schema

```yaml
GoogleMapsInput:
  type: object
  required:
    - operation
  properties:
    operation:
      type: string
      enum:
        - geocode
        - reverse_geocode
        - search_places
        - place_details
        - autocomplete
        - directions
        - distance_matrix
        - elevation
        - timezone
        - static_map
        - nearby_search
        - text_search
    params:
      type: object
      required_for:
        geocode: [address]
        reverse_geocode: [lat, lng]
        search_places: [query]
        place_details: [place_id]
        autocomplete: [input]
        directions: [origin, destination]
        distance_matrix: [origins, destinations]
        elevation: [locations]
        timezone: [lat, lng]
      properties:
        address:
          type: string
        lat:
          type: number
        lng:
          type: number
        query:
          type: string
        place_id:
          type: string
        input:
          type: string
        origin:
          type: string
          description: Address or coordinates
        destination:
          type: string
          description: Address or coordinates
        waypoints:
          type: array
          items:
            type: string
          nullable: true
        origins:
          type: array
          items:
            type: string
        destinations:
          type: array
          items:
            type: string
        locations:
          type: array
          items:
            type: object
            properties:
              lat:
                type: number
              lng:
                type: number
        mode:
          type: string
          enum: [driving, walking, bicycling, transit]
          default: driving
        units:
          type: string
          enum: [metric, imperial]
          default: metric
        language:
          type: string
          default: en
        region:
          type: string
          nullable: true
        radius:
          type: number
          default: 1000
        type:
          type: string
          nullable: true
          description: Place type filter
        keyword:
          type: string
          nullable: true
        opennow:
          type: boolean
          nullable: true
        minprice:
          type: integer
          nullable: true
        maxprice:
          type: integer
          nullable: true
        rankby:
          type: string
          enum: [prominence, distance]
          default: prominence
    options:
      type: object
      properties:
        timeout:
          type: integer
          default: 10000
        retries:
          type: integer
          default: 3
        cache:
          type: boolean
          default: true
        cache_ttl:
          type: integer
          default: 86400000
        fields:
          type: array
          items:
            type: string
          nullable: true
        image_size:
          type: object
          nullable: true
          properties:
            width:
              type: integer
              default: 600
            height:
              type: integer
              default: 400
```

## Output Schema

```yaml
GoogleMapsOutput:
  type: object
  required:
    - success
    - operation
  properties:
    success:
      type: boolean
    operation:
      type: string
    data:
      type: object
      nullable: true
      properties:
        geocode:
          type: object
          properties:
            formatted_address:
              type: string
            location:
              type: object
              properties:
                lat:
                  type: number
                lng:
                  type: number
            bounds:
              type: object
            address_components:
              type: array
              items:
                type: object
        places:
          type: array
          items:
            type: object
            properties:
              place_id:
                type: string
              name:
                type: string
              address:
                type: string
              location:
                type: object
              rating:
                type: number
              types:
                type: array
              photos:
                type: array
              opening_hours:
                type: object
        place_details:
          type: object
          properties:
            place_id:
              type: string
            name:
              type: string
            address:
              type: string
            phone:
              type: string
            website:
              type: string
            rating:
              type: number
            reviews:
              type: array
            photos:
              type: array
        directions:
          type: object
          properties:
            routes:
              type: array
              items:
                type: object
                properties:
                  summary:
                    type: string
                  distance:
                    type: object
                  duration:
                    type: object
                  steps:
                    type: array
        distance_matrix:
          type: object
          properties:
            origins:
              type: array
            destinations:
              type: array
            rows:
              type: array
        static_map_url:
          type: string
          format: uri
    error:
      type: object
      nullable: true
      properties:
        code:
          type: string
        message:
          type: string
    metadata:
      type: object
      properties:
        duration_ms:
          type: integer
        quota_cost:
          type: integer
        quota_remaining:
          type: integer
```

## Caching

```yaml
Caching:
  enabled: true
  ttl_ms: 86400000
  max_entries: 100000
  strategy: lru
  storage: redis
  invalidation:
    - manual
    - ttl_expiry
  notes: |
    - Cache geocoding results (24h)
    - Cache place details (1h)
    - Cache directions (1h)
    - Cache distance matrix (1h)
```

## Validation

```yaml
Validation:
  input:
    - Operation validation
    - Coordinate range validation (-90 to 90, -180 to 180)
    - Address format validation
    - Place ID format validation
  output:
    - Response structure validation
    - Coordinate bounds validation
```

## Timeout

```yaml
Timeout:
  default_ms: 10000
  geocode_ms: 5000
  places_ms: 10000
  directions_ms: 15000
  distance_matrix_ms: 15000
  static_map_ms: 10000
  max_ms: 30000
```

## Fallback

```yaml
Fallback:
  strategy: provider_chain
  fallbacks:
    - tool: openstreetmap
      condition: quota_exceeded
    - tool: http
      condition: api_unavailable
  notes: |
    - Fall back to OpenStreetMap
    - Use cached results
    - Graceful degradation
```

## Recovery

```yaml
Recovery:
  quota_exceeded:
    action: use_fallback
    alert: true
  api_key_invalid:
    action: alert_ops
    critical: true
  rate_limited:
    action: exponential_backoff
    max_wait_ms: 60000
```

## Usage Examples

```typescript
// Geocode address
await tool.execute('geocode', {
  address: 'Burj Khalifa, Dubai, UAE'
});

// Search places
await tool.execute('search_places', {
  query: 'hotels near Dubai Mall',
  type: 'hotel',
  radius: 5000
});

// Get directions
await tool.execute('directions', {
  origin: 'Dubai Airport',
  destination: 'Burj Khalifa',
  mode: 'driving'
});

// Distance matrix
await tool.execute('distance_matrix', {
  origins: ['Dubai Airport', 'Dubai Marina'],
  destinations: ['Burj Khalifa', 'Palm Jumeirah'],
  mode: 'driving'
});
```

## Configuration

```yaml
Configuration:
  api_key: "${GOOGLE_MAPS_API_KEY}"
  base_url: "https://maps.googleapis.com"
  timeout: 10000
  retries: 3
  cache:
    enabled: true
    ttl_ms: 86400000
  rate_limit:
    requests_per_second: 50
    daily_limit: 100000
  apis:
    geocoding: true
    places: true
    directions: true
    distance_matrix: true
    static_maps: true
    elevation: true
    timezone: true
```

## Monitoring

```yaml
Metrics:
  - google_maps_requests_total
  - google_maps_requests_duration_seconds
  - google_maps_quota_used
  - google_maps_quota_remaining
  - google_maps_errors_total
  - google_maps_cost_usd
```

## Pricing

```yaml
Pricing:
  geocoding: "$5.00 / 1000 requests"
  places_search: "$32.00 / 1000 requests"
  place_details: "$17.00 / 1000 requests"
  directions: "$10.00 / 1000 requests"
  distance_matrix: "$5.00 / 1000 elements"
  static_maps: "$2.00 / 1000 requests"
  notes: |
    - First $200/month free
    - Volume discounts available
    - Monitor costs dashboard
```

---

*Google Maps Tool v1.0.0 | Enterprise OTA Platform*
