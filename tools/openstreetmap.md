# OpenStreetMap Tool

## Overview

Free and open-source mapping tool using OpenStreetMap data for geocoding, routing, and place search.

## Tool ID

`tool_openstreetmap`

## Category

Maps & Location

## Capabilities

| Capability | Description | Supported |
|------------|-------------|-----------|
| Geocoding | Address to coordinates | Yes |
| Reverse Geocoding | Coordinates to address | Yes |
| Place Search | Find places | Yes |
| Routing | Route planning | Yes |
| Distance Matrix | Distance/duration | Yes |
| POI Search | Points of interest | Yes |
| Address Lookup | Detailed addresses | Yes |
| Bounding Box | Area search | Yes |
| Overpass Queries | Custom queries | Yes |
| Tile Access | Map tiles | Yes |

## Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| No Commercial Use | License restrictions | Check license |
| Rate Limits | Nominatim limits | Use local data |
| Data Quality | Varies by region | Cross-reference |
| No Directions API | Limited routing | Use OSRM/Valhalla |
| Attribution | Required | Include attribution |
| No Traffic Data | Real-time unavailable | Use other sources |

## Authentication

```yaml
Authentication:
  type: none
  description: OpenStreetMap is free and open
  notes: |
    - No API key required
    - Respect usage policy
    - Rate limiting enforced
    - Attribution required
```

## Rate Limiting

```yaml
RateLimit:
  nominatim:
    requests_per_second: 1
    requests_per_minute: 60
    daily_limit: 10000
    notes: "Max 1 request/second for Nominatim"
  overpass:
    requests_per_second: 0.5
    requests_per_minute: 30
    daily_limit: 5000
  tiles:
    requests_per_second: 10
    requests_per_minute: 600
    notes: "Varies by tile server"
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
    - NETWORK_ERROR
    - TIMEOUT
    - RATE_LIMITED
  non_retryable_errors:
    - NOT_FOUND
    - INVALID_QUERY
```

## Error Codes

| Code | Description | Retryable | Action |
|------|-------------|-----------|--------|
| `NOT_FOUND` | No results | No | Try different query |
| `INVALID_QUERY` | Bad query syntax | No | Fix query |
| `RATE_LIMITED` | Too many requests | Yes | Backoff |
| `TIMEOUT` | Request timeout | Yes | Retry |
| `NETWORK_ERROR` | Connection failed | Yes | Retry |
| `SERVER_ERROR` | OSM server error | Yes | Retry |
| `OVERPASS_TIMEOUT` | Query timeout | Yes | Simplify query |

## Input Schema

```yaml
OpenStreetMapInput:
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
        - nearby_search
        - get_route
        - distance_matrix
        - overpass_query
        - get_address_details
    params:
      type: object
      properties:
        query:
          type: string
        address:
          type: string
        lat:
          type: number
        lng:
          type: number
        bbox:
          type: object
          properties:
            min_lat:
              type: number
            min_lng:
              type: number
            max_lat:
              type: number
            max_lng:
              type: number
        origin:
          type: object
          properties:
            lat:
              type: number
            lng:
              type: number
        destination:
          type: object
          properties:
            lat:
              type: number
            lng:
              type: number
        waypoints:
          type: array
          items:
            type: object
            properties:
              lat:
                type: number
              lng:
                type: number
        category:
          type: string
          description: OSM category tag
        radius:
          type: number
          default: 1000
        limit:
          type: integer
          default: 10
        format:
          type: string
          enum: [json, geojson, xml]
          default: json
        overpass_query:
          type: string
          description: Overpass QL query
    options:
      type: object
      properties:
        timeout:
          type: integer
          default: 30000
        retries:
          type: integer
          default: 3
        cache:
          type: boolean
          default: true
        cache_ttl:
          type: integer
          default: 604800000
```

## Output Schema

```yaml
OpenStreetMapOutput:
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
            display_name:
              type: string
            lat:
              type: number
            lng:
              type: number
            address:
              type: object
            boundingbox:
              type: array
        places:
          type: array
          items:
            type: object
            properties:
              osm_id:
                type: string
              name:
                type: string
              display_name:
                type: string
              lat:
                type: number
              lng:
                type: number
              type:
                type: string
              address:
                type: object
        route:
          type: object
          properties:
            distance:
              type: number
              description: meters
            duration:
              type: number
              description: seconds
            steps:
              type: array
              items:
                type: object
                properties:
                  instruction:
                    type: string
                  distance:
                    type: number
                  duration:
                    type: number
            geometry:
              type: object
              description: GeoJSON geometry
        overpass:
          type: object
          properties:
            elements:
              type: array
              items:
                type: object
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
        source:
          type: string
        attribution:
          type: string
```

## Caching

```yaml
Caching:
  enabled: true
  ttl_ms: 604800000
  max_entries: 50000
  strategy: lru
  storage: redis
  notes: |
    - Cache geocoding (7 days)
    - Cache places (1 day)
    - Cache routes (1 day)
    - OSM data changes slowly
```

## Validation

```yaml
Validation:
  input:
    - Coordinate range validation
    - Query format validation
    - Bounding box validation
    - Overpass query syntax
  output:
    - GeoJSON validation
    - Coordinate bounds validation
```

## Timeout

```yaml
Timeout:
  default_ms: 30000
  geocode_ms: 10000
  places_ms: 15000
  route_ms: 30000
  overpass_ms: 60000
  max_ms: 120000
```

## Fallback

```yaml
Fallback:
  strategy: provider_chain
  fallbacks:
    - tool: google_maps
      condition: results_insufficient
    - tool: http
      condition: api_unavailable
  notes: |
    - Fall back to Google Maps for better coverage
    - Use cached results
    - Graceful degradation
```

## Recovery

```yaml
Recovery:
  rate_limited:
    action: wait_and_retry
    wait_ms: 1000
  query_timeout:
    action: simplify_query
  server_error:
    action: retry_with_backoff
```

## Usage Examples

```typescript
// Geocode address
await tool.execute('geocode', {
  address: 'Eiffel Tower, Paris, France'
});

// Search nearby places
await tool.execute('nearby_search', {
  lat: 48.8584,
  lng: 2.2945,
  category: 'restaurant',
  radius: 500
});

// Get route
await tool.execute('get_route', {
  origin: { lat: 48.8566, lng: 2.3522 },
  destination: { lat: 48.8584, lng: 2.2945 }
});

// Overpass query
await tool.execute('overpass_query', {
  overpass_query: `
    [out:json];
    node["amenity"="hotel"](48.8,2.3,48.9,2.4);
    out body;
  `
});
```

## Configuration

```yaml
Configuration:
  nominatim_url: "https://nominatim.openstreetmap.org"
  overpass_url: "https://overpass-api.de/api"
  tile_url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  timeout: 30000
  retries: 3
  user_agent: "TravelAI/1.0"
  rate_limit:
    nominatim: 1
    overpass: 0.5
  cache:
    enabled: true
    ttl_ms: 604800000
```

## Monitoring

```yaml
Metrics:
  - osm_requests_total
  - osm_requests_duration_seconds
  - osm_errors_total
  - osm_cache_hits_total
  - osm_rate_limit_hits
```

## Attribution

```yaml
Attribution:
  required: true
  text: "© OpenStreetMap contributors"
  url: "https://www.openstreetmap.org/copyright"
  notes: |
    - Must include attribution
    - Link to OSM copyright
    - Required by OSM license
```

---

*OpenStreetMap Tool v1.0.0 | Enterprise OTA Platform*
