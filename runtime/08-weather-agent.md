# Weather Agent

## Agent ID
`agent_weather_008`

## Role
Provides weather forecasts, packing recommendations, and weather alerts for travel destinations.

## Responsibilities

| # | Responsibility | Priority |
|---|----------------|----------|
| 1 | Fetch weather forecasts | Critical |
| 2 | Provide packing suggestions | High |
| 3 | Send severe weather alerts | Critical |
| 4 | Analyze weather patterns | Medium |
| 5 | Support activity-weather compatibility | Medium |
| 6 | Provide historical weather data | Low |
| 7 | Track weather changes | High |
| 8 | Support multiple destinations | High |
| 9 | Provide climate information | Medium |
| 10 | Handle weather-based recommendations | Medium |

---

## Input Schema

```yaml
WeatherInput:
  type: object
  required:
    - request_id
    - destination
    - travel_dates
  properties:
    request_id:
      type: string
      format: uuid
    destination:
      type: string
      description: City name or coordinates
    travel_dates:
      type: object
      required:
        - start
        - end
      properties:
        start:
          type: string
          format: date
        end:
          type: string
          format: date
    units:
      type: string
      enum: [metric, imperial]
      default: metric
    include_packing:
      type: boolean
      default: true
    include_alerts:
      type: boolean
      default: true
    activities:
      type: array
      items:
        type: string
      description: Planned activities for weather compatibility
```

---

## Output Schema

```yaml
WeatherOutput:
  type: object
  required:
    - request_id
    - status
    - forecast
  properties:
    request_id:
      type: string
      format: uuid
    status:
      type: string
      enum: [success, partial, error]
    destination:
      type: string
    current_weather:
      type: object
      properties:
        temperature:
          type: number
        feels_like:
          type: number
        humidity:
          type: number
        wind_speed:
          type: number
        condition:
          type: string
        icon:
          type: string
    forecast:
      type: array
      items:
        type: object
        properties:
          date:
            type: string
            format: date
          temp_high:
            type: number
          temp_low:
            type: number
          condition:
            type: string
          precipitation_chance:
            type: number
          humidity:
            type: number
          wind_speed:
            type: number
          uv_index:
            type: number
    packing_suggestions:
      type: array
      items:
        type: string
    weather_alerts:
      type: array
      items:
        type: object
        properties:
          severity:
            type: string
            enum: [low, medium, high, extreme]
          title:
            type: string
          description:
            type: string
          start_time:
            type: string
            format: date-time
          end_time:
            type: string
            format: date-time
    activity_recommendations:
      type: array
      items:
        type: object
        properties:
          activity:
            type: string
          suitability:
            type: string
            enum: [excellent, good, fair, poor]
          recommendation:
            type: string
    units:
      type: string
```

---

## Internal State

```yaml
InternalState:
  type: object
  properties:
    forecast_cache:
      type: object
    alert_cache:
      type: object
    metrics:
      type: object
```

---

## Execution Rules

| Rule | Description | Enforced |
|------|-------------|----------|
| R001 | Validate destination | Yes |
| R002 | Travel dates must be valid | Yes |
| R003 | Forecast max 16 days | Yes |
| R004 | Include current conditions | Yes |
| R005 | Cache forecasts for 3 hours | Yes |
| R006 | Include severe weather alerts | Yes |
| R007 | Provide packing suggestions | Yes |
| R008 | Support metric/imperial | Yes |
| R009 | Include UV index | Yes |
| R010 | Activity compatibility check | Yes |

---

## Retry Logic

| Scenario | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| API timeout | 2 | Linear 1s/2s | Use cached data |
| Data unavailable | 1 | None | Historical average |
| Alert fetch fail | 1 | None | Skip alerts |

---

## Confidence Score

| Metric | Threshold | Action Below |
|--------|-----------|--------------|
| Forecast accuracy (3-day) | 0.8 | Add disclaimer |
| Forecast accuracy (7-day) | 0.6 | Show range |
| Packing relevance | 0.7 | Broaden suggestions |
| Alert accuracy | 0.9 | Include source |

---

## Memory Access

| Memory Type | Access | TTL | Purpose |
|-------------|--------|-----|---------|
| Forecast Cache | Read/Write | 3 hours | Cache forecasts |
| Alert Cache | Read/Write | 30 min | Cache alerts |

---

## Tool Permissions

| Tool | Permission | Rate Limit |
|------|------------|------------|
| `weather_api` | Read | 100/min |
| `forecast_api` | Read | 100/min |
| `alert_api` | Read | 200/min |
| `cache_store` | Read/Write | Unlimited |

---

## Communication Protocol

```yaml
MessageType:
  - WEATHER_REQUEST:
      direction: inbound
  - WEATHER_RESPONSE:
      direction: outbound
  - WEATHER_ALERT:
      direction: outbound
```

---

## Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| API down | Health check | Use cached data | Alert ops |
| Forecast unavailable | Response check | Use historical | Log |
| Alert service down | Health check | Skip alerts | Log |

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| Forecast accuracy | 3-day | > 80% |
| Response time | Latency | < 2s |
| Packing relevance | User rating | > 85% |
| Alert delivery | Time | < 1 hour |

---

## Configuration

```yaml
Configuration:
  cache_ttl_ms: 10800000
  max_forecast_days: 16
  alert_check_interval_ms: 1800000
  units_default: metric
```

---

*Agent Version: 1.0.0 | Enterprise OTA Runtime*
