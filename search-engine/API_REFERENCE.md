# API Reference

> Complete API documentation for the Search Intelligence Engine.

---

## Overview

The Search Intelligence Engine provides a comprehensive REST API for searching, filtering, and retrieving travel data from multiple providers.

---

## Base URL

```
https://api.ota-platform.com/v1/search
```

---

## Authentication

```http
Authorization: Bearer <api_key>
X-API-Key: <api_key>
```

---

## Endpoints

### 1. Search Hotels

```http
POST /search/hotels
```

**Request Body**:

```json
{
  "destination": {
    "city": "Tokyo",
    "country": "Japan",
    "lat": 35.6762,
    "lng": 139.6503
  },
  "checkin": "2024-03-15",
  "checkout": "2024-03-20",
  "guests": {
    "adults": 2,
    "children": 1,
    "rooms": 1
  },
  "filters": {
    "priceRange": {
      "min": 50,
      "max": 300,
      "currency": "USD"
    },
    "starRating": [4, 5],
    "amenities": ["wifi", "pool", "gym"],
    "cancellationPolicy": "free"
  },
  "preferences": {
    "language": "en",
    "currency": "USD",
    "nationality": "US"
  },
  "options": {
    "limit": 20,
    "offset": 0,
    "includeImages": true,
    "includeReviews": true
  }
}
```

**Response**:

```json
{
  "queryId": "q_abc123",
  "timestamp": 1710500000000,
  "duration": 1250,
  "results": [
    {
      "id": "hotel_123",
      "provider": "booking_com",
      "name": "Hotel Tokyo Imperial",
      "type": "hotel",
      "description": "Luxury hotel in central Tokyo",
      "location": {
        "address": "1-1-1 Marunouchi, Chiyoda-ku",
        "city": "Tokyo",
        "country": "Japan",
        "lat": 35.6812,
        "lng": 139.7671
      },
      "pricing": {
        "original": {
          "amount": 25000,
          "currency": "JPY"
        },
        "normalized": {
          "amount": 187.50,
          "currency": "USD",
          "perNight": 37.50,
          "total": 187.50
        },
        "breakdown": {
          "base": 15000,
          "taxes": 7500,
          "fees": 2500,
          "total": 25000
        }
      },
      "rating": {
        "score": 4.7,
        "normalized": 9.4,
        "reviews": 1250,
        "source": "booking_com"
      },
      "images": [
        {
          "url": "https://images.example.com/hotel1.jpg",
          "caption": "Hotel exterior",
          "width": 1200,
          "height": 800
        }
      ],
      "amenities": ["wifi", "pool", "gym", "spa", "restaurant"],
      "availability": {
        "available": true,
        "roomsLeft": 5,
        "lastChecked": 1710500000000
      },
      "scores": {
        "bestValue": 92.5,
        "confidence": 0.95,
        "providerTrust": 0.98
      },
      "source": {
        "provider": "booking_com",
        "url": "https://booking.com/hotel/123",
        "lastUpdated": 1710500000000
      }
    }
  ],
  "totalResults": 150,
  "metadata": {
    "providersQueried": ["booking_com", "agoda", "expedia"],
    "providersSucceeded": ["booking_com", "agoda", "expedia"],
    "providersFailed": [],
    "cacheHits": 0,
    "duplicatesRemoved": 12
  },
  "aggregations": {
    "priceRange": {
      "min": 50,
      "max": 500,
      "avg": 150
    },
    "starRatings": {
      "3": 20,
      "4": 80,
      "5": 50
    },
    "propertyTypes": {
      "hotel": 100,
      "resort": 30,
      "apartment": 20
    }
  },
  "recommendations": {
    "cheapest": "hotel_456",
    "bestValue": "hotel_123",
    "premium": "hotel_789",
    "closest": "hotel_321"
  }
}
```

---

### 2. Search Activities

```http
POST /search/activities
```

**Request Body**:

```json
{
  "destination": {
    "city": "Paris",
    "country": "France",
    "lat": 48.8566,
    "lng": 2.3522
  },
  "dateRange": {
    "start": "2024-03-15",
    "end": "2024-03-20"
  },
  "guests": {
    "adults": 2,
    "children": 0
  },
  "filters": {
    "priceRange": {
      "min": 20,
      "max": 200,
      "currency": "EUR"
    },
    "categories": ["museum", "tour", "experience"],
    "duration": {
      "min": 60,
      "max": 480
    },
    "rating": 4.0
  },
  "preferences": {
    "language": "en",
    "currency": "EUR"
  },
  "options": {
    "limit": 20,
    "offset": 0
  }
}
```

**Response**:

```json
{
  "queryId": "q_def456",
  "timestamp": 1710500000000,
  "duration": 980,
  "results": [
    {
      "id": "activity_123",
      "provider": "viator",
      "name": "Louvre Museum Skip-the-Line Tour",
      "type": "activity",
      "description": "Skip the lines and explore the Louvre with an expert guide",
      "location": {
        "address": "Rue de Rivoli, 75001 Paris",
        "city": "Paris",
        "country": "France",
        "lat": 48.8606,
        "lng": 2.3376
      },
      "pricing": {
        "original": {
          "amount": 89,
          "currency": "EUR"
        },
        "normalized": {
          "amount": 89,
          "currency": "EUR",
          "perPerson": 89,
          "total": 178
        },
        "breakdown": {
          "base": 75,
          "taxes": 9,
          "fees": 5,
          "total": 89
        }
      },
      "rating": {
        "score": 4.8,
        "normalized": 9.6,
        "reviews": 3200,
        "source": "viator"
      },
      "images": [
        {
          "url": "https://images.example.com/louvre1.jpg",
          "caption": "Louvre Museum exterior",
          "width": 1200,
          "height": 800
        }
      ],
      "duration": 180,
      "category": "museum",
      "availability": {
        "available": true,
        "spotsLeft": 10,
        "lastChecked": 1710500000000
      },
      "scores": {
        "bestValue": 94.2,
        "confidence": 0.97,
        "providerTrust": 0.99
      }
    }
  ],
  "totalResults": 85,
  "metadata": {
    "providersQueried": ["viator", "getyourguide", "klook"],
    "providersSucceeded": ["viator", "getyourguide", "klook"],
    "providersFailed": [],
    "cacheHits": 2,
    "duplicatesRemoved": 5
  }
}
```

---

### 3. Get Price Comparison

```http
GET /compare/prices/{resultId}
```

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| providers | string | Comma-separated provider IDs |
| currency | string | Target currency |
| checkin | string | Check-in date |
| checkout | string | Check-out date |

**Response**:

```json
{
  "resultId": "hotel_123",
  "comparison": {
    "prices": [
      {
        "provider": "booking_com",
        "price": 187.50,
        "currency": "USD",
        "taxes": 25.00,
        "fees": 12.50,
        "total": 225.00,
        "lastUpdated": 1710500000000,
        "confidence": 0.98
      },
      {
        "provider": "agoda",
        "price": 195.00,
        "currency": "USD",
        "taxes": 25.00,
        "fees": 15.00,
        "total": 235.00,
        "lastUpdated": 1710500000000,
        "confidence": 0.95
      }
    ],
    "statistics": {
      "lowest": 225.00,
      "highest": 235.00,
      "average": 230.00,
      "median": 230.00,
      "standardDeviation": 5.00
    },
    "bestDeal": {
      "provider": "booking_com",
      "price": 225.00,
      "savings": 10.00,
      "savingsPercentage": 4.26
    },
    "confidence": 0.96
  }
}
```

---

### 4. Get Price History

```http
GET /prices/history/{resultId}
```

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| days | number | Number of days to look back |
| currency | string | Target currency |

**Response**:

```json
{
  "resultId": "hotel_123",
  "history": [
    {
      "date": "2024-03-01",
      "price": 200.00,
      "currency": "USD",
      "provider": "booking_com"
    },
    {
      "date": "2024-03-02",
      "price": 195.00,
      "currency": "USD",
      "provider": "booking_com"
    }
  ],
  "trend": {
    "direction": "down",
    "strength": 0.75,
    "duration": 7,
    "change": {
      "absolute": -12.50,
      "percentage": -6.25
    },
    "prediction": {
      "nextDay": 185.00,
      "nextWeek": 180.00,
      "nextMonth": 175.00,
      "confidence": 0.82
    }
  }
}
```

---

### 5. Create Price Alert

```http
POST /alerts/price
```

**Request Body**:

```json
{
  "resultId": "hotel_123",
  "type": "below_target",
  "targetPrice": 200.00,
  "currency": "USD",
  "expiresIn": 604800000
}
```

**Response**:

```json
{
  "alertId": "alert_789",
  "resultId": "hotel_123",
  "type": "below_target",
  "targetPrice": 200.00,
  "currency": "USD",
  "status": "active",
  "createdAt": 1710500000000,
  "expiresAt": 1711104800000
}
```

---

### 6. Get Recommendations

```http
GET /recommendations/{destination}
```

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| checkin | string | Check-in date |
| checkout | string | Check-out date |
| guests | number | Number of guests |
| type | string | Recommendation type |

**Response**:

```json
{
  "destination": "Tokyo",
  "recommendations": {
    "bestValue": {
      "resultId": "hotel_123",
      "name": "Hotel Tokyo Imperial",
      "reasons": [
        "Best price-quality ratio",
        "Highly rated by guests",
        "Excellent amenities"
      ],
      "confidence": 0.95,
      "valueMetrics": {
        "priceEfficiency": 0.92,
        "qualityScore": 9.4,
        "amenityValue": 85
      }
    },
    "cheapest": {
      "resultId": "hotel_456",
      "name": "Tokyo Budget Hotel",
      "savings": 150.00,
      "savingsPercentage": 45.5
    },
    "premium": {
      "resultId": "hotel_789",
      "name": "The Ritz-Carlton Tokyo",
      "premiumFeatures": [
        "5-star rating",
        "Luxury amenities",
        "Prime location"
      ],
      "luxuryScore": 98
    },
    "trending": {
      "resultId": "hotel_321",
      "name": "Shinjuku Grand Hotel",
      "trendScore": 85,
      "trendFactors": [
        "Rapidly improving ratings",
        "Popular with travelers"
      ]
    }
  }
}
```

---

### 7. Get Provider Status

```http
GET /providers/status
```

**Response**:

```json
{
  "providers": [
    {
      "id": "booking_com",
      "name": "Booking.com",
      "status": "healthy",
      "healthScore": 98,
      "metrics": {
        "totalRequests": 15000,
        "successfulRequests": 14700,
        "failedRequests": 300,
        "avgResponseTime": 850,
        "errorRate": 0.02
      },
      "lastChecked": 1710500000000
    },
    {
      "id": "agoda",
      "name": "Agoda",
      "status": "healthy",
      "healthScore": 95,
      "metrics": {
        "totalRequests": 12000,
        "successfulRequests": 11400,
        "failedRequests": 600,
        "avgResponseTime": 920,
        "errorRate": 0.05
      },
      "lastChecked": 1710500000000
    }
  ],
  "summary": {
    "total": 12,
    "healthy": 10,
    "degraded": 1,
    "unhealthy": 1,
    "offline": 0
  }
}
```

---

### 8. Get Search Statistics

```http
GET /stats/search
```

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date |
| endDate | string | End date |
| granularity | string | Hour, day, week, month |

**Response**:

```json
{
  "period": {
    "start": "2024-03-01",
    "end": "2024-03-15"
  },
  "statistics": {
    "totalSearches": 150000,
    "uniqueUsers": 45000,
    "avgResultsPerSearch": 25,
    "avgResponseTime": 1200,
    "cacheHitRate": 0.72,
    "errorRate": 0.015,
    "topDestinations": [
      { "destination": "Tokyo", "searches": 15000 },
      { "destination": "Paris", "searches": 12000 },
      { "destination": "New York", "searches": 10000 }
    ],
    "topProviders": [
      { "provider": "booking_com", "queries": 120000, "successRate": 0.98 },
      { "provider": "agoda", "queries": 100000, "successRate": 0.95 }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": {
      "field": "checkin",
      "issue": "Check-in date must be today or later"
    }
  }
}
```

### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}
```

### 429 Rate Limited

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "requestId": "req_abc123"
  }
}
```

---

## Rate Limits

| Tier | Requests/Second | Requests/Minute | Daily Limit |
|------|-----------------|-----------------|-------------|
| Free | 1 | 30 | 1000 |
| Basic | 10 | 300 | 10000 |
| Pro | 50 | 1500 | 50000 |
| Enterprise | 100 | 3000 | 100000 |

---

## SDKs

- JavaScript/TypeScript: `@ota-platform/search-sdk`
- Python: `ota-platform-search`
- Go: `ota-platform-search-go`
- Java: `ota-platform-search-java`
