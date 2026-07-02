# Recommendation Engine

> AI-powered recommendation system for travel search results.

---

## Overview

The Recommendation Engine uses machine learning and business logic to provide personalized recommendations to users.

---

## Recommendation Types

### 1. Best Value Recommendation

```typescript
interface BestValueRecommendation {
  // Recommended result
  result: SearchResult;
  
  // Reason for recommendation
  reasons: string[];
  
  // Confidence score
  confidence: number;
  
  // Value metrics
  valueMetrics: {
    priceEfficiency: number;
    qualityScore: number;
    amenityValue: number;
  };
}

// Best value recommendation
function findBestValue(results: SearchResult[]): BestValueRecommendation {
  if (results.length === 0) {
    return null;
  }
  
  // Calculate value score for each result
  const scored = results.map(result => ({
    result,
    valueScore: calculateValueScore(result),
    reasons: generateValueReasons(result),
  }));
  
  // Sort by value score
  scored.sort((a, b) => b.valueScore - a.valueScore);
  
  const best = scored[0];
  
  return {
    result: best.result,
    reasons: best.reasons,
    confidence: calculateRecommendationConfidence(best.result, results),
    valueMetrics: {
      priceEfficiency: calculatePriceEfficiency(best.result),
      qualityScore: best.result.rating.normalized,
      amenityValue: calculateAmenityValue(best.result.amenities),
    },
  };
}

// Value score calculation
function calculateValueScore(result: SearchResult): number {
  const priceScore = 100 - (result.pricing.normalized.amount / 10);
  const qualityScore = result.rating.normalized * 10;
  const amenityScore = calculateAmenityValue(result.amenities);
  
  return (priceScore * 0.4) + (qualityScore * 0.3) + (amenityScore * 0.3);
}

// Generate value reasons
function generateValueReasons(result: SearchResult): string[] {
  const reasons: string[] = [];
  
  if (result.pricing.normalized.amount < 100) {
    reasons.push('Great price for the quality');
  }
  
  if (result.rating.normalized >= 4.5) {
    reasons.push('Highly rated by guests');
  }
  
  if (result.amenities.length > 10) {
    reasons.push('Excellent amenities');
  }
  
  return reasons;
}
```

---

### 2. Cheapest Option Recommendation

```typescript
interface CheapestRecommendation {
  // Recommended result
  result: SearchResult;
  
  // Savings compared to average
  savings: number;
  
  // Savings percentage
  savingsPercentage: number;
  
  // Price breakdown
  priceBreakdown: {
    basePrice: number;
    taxes: number;
    fees: number;
    total: number;
  };
}

// Cheapest option recommendation
function findCheapestOption(results: SearchResult[]): CheapestRecommendation {
  if (results.length === 0) {
    return null;
  }
  
  // Sort by price
  const sorted = [...results].sort(
    (a, b) => a.pricing.normalized.amount - b.pricing.normalized.amount
  );
  
  const cheapest = sorted[0];
  const avgPrice = calculateAveragePrice(results);
  
  const savings = avgPrice - cheapest.pricing.normalized.amount;
  const savingsPercentage = (savings / avgPrice) * 100;
  
  return {
    result: cheapest,
    savings,
    savingsPercentage,
    priceBreakdown: {
      basePrice: cheapest.pricing.breakdown.base,
      taxes: cheapest.pricing.breakdown.taxes,
      fees: cheapest.pricing.breakdown.fees,
      total: cheapest.pricing.normalized.total,
    },
  };
}
```

---

### 3. Premium Choice Recommendation

```typescript
interface PremiumRecommendation {
  // Recommended result
  result: SearchResult;
  
  // Premium features
  premiumFeatures: string[];
  
  // Luxury score
  luxuryScore: number;
  
  // Exclusivity factors
  exclusivityFactors: string[];
}

// Premium choice recommendation
function findPremiumChoice(results: SearchResult[]): PremiumRecommendation {
  if (results.length === 0) {
    return null;
  }
  
  // Calculate premium score for each result
  const scored = results.map(result => ({
    result,
    premiumScore: calculatePremiumScore(result),
    premiumFeatures: identifyPremiumFeatures(result),
    exclusivityFactors: identifyExclusivityFactors(result),
  }));
  
  // Sort by premium score
  scored.sort((a, b) => b.premiumScore - a.premiumScore);
  
  const best = scored[0];
  
  return {
    result: best.result,
    premiumFeatures: best.premiumFeatures,
    luxuryScore: best.premiumScore,
    exclusivityFactors: best.exclusivityFactors,
  };
}

// Premium score calculation
function calculatePremiumScore(result: SearchResult): number {
  let score = 0;
  
  // Star rating
  score += result.rating.score * 15;
  
  // Price (higher price = more premium)
  score += (result.pricing.normalized.amount / 100) * 20;
  
  // Amenities
  const premiumAmenities = ['spa', 'pool', 'gym', 'restaurant', 'concierge'];
  const hasPremium = result.amenities.filter(a => 
    premiumAmenities.includes(a.toLowerCase())
  ).length;
  score += hasPremium * 10;
  
  return Math.min(100, score);
}

// Identify premium features
function identifyPremiumFeatures(result: SearchResult): string[] {
  const features: string[] = [];
  
  if (result.rating.score >= 4.5) features.push('5-star rating');
  if (result.pricing.normalized.amount > 300) features.push('Luxury pricing');
  if (result.amenities.includes('spa')) features.push('Spa & wellness');
  if (result.amenities.includes('pool')) features.push('Swimming pool');
  if (result.amenities.includes('restaurant')) features.push('Fine dining');
  
  return features;
}

// Identify exclusivity factors
function identifyExclusivityFactors(result: SearchResult): string[] {
  const factors: string[] = [];
  
  if (result.rating.reviews < 50) factors.push('Exclusive boutique');
  if (result.location.address.includes('beachfront')) factors.push('Beachfront');
  if (result.location.address.includes('downtown')) factors.push('Prime downtown');
  
  return factors;
}
```

---

### 4. Closest to Center Recommendation

```typescript
interface ClosestRecommendation {
  // Recommended result
  result: SearchResult;
  
  // Distance to center
  distance: number;
  
  // Walking time estimate
  walkingTime: number;
  
  // Driving time estimate
  drivingTime: number;
  
  // Nearby attractions
  nearbyAttractions: string[];
}

// Closest to center recommendation
function findClosestToCenter(
  results: SearchResult[],
  center: { lat: number; lng: number }
): ClosestRecommendation {
  if (results.length === 0) {
    return null;
  }
  
  // Calculate distance for each result
  const withDistance = results.map(result => ({
    result,
    distance: calculateDistance(
      result.location.lat,
      result.location.lng,
      center.lat,
      center.lng
    ),
  }));
  
  // Sort by distance
  withDistance.sort((a, b) => a.distance - b.distance);
  
  const closest = withDistance[0];
  
  return {
    result: closest.result,
    distance: closest.distance,
    walkingTime: estimateWalkingTime(closest.distance),
    drivingTime: estimateDrivingTime(closest.distance),
    nearbyAttractions: findNearbyAttractions(closest.result.location),
  };
}
```

---

### 5. Trending Recommendation

```typescript
interface TrendingRecommendation {
  // Recommended result
  result: SearchResult;
  
  // Trend score
  trendScore: number;
  
  // Trend factors
  trendFactors: string[];
  
  // Recent popularity
  recentPopularity: number;
}

// Trending recommendation
function findTrending(results: SearchResult[]): TrendingRecommendation {
  if (results.length === 0) {
    return null;
  }
  
  // Calculate trend score for each result
  const scored = results.map(result => ({
    result,
    trendScore: calculateTrendScore(result),
    trendFactors: identifyTrendFactors(result),
    recentPopularity: calculateRecentPopularity(result),
  }));
  
  // Sort by trend score
  scored.sort((a, b) => b.trendScore - a.trendScore);
  
  const best = scored[0];
  
  return {
    result: best.result,
    trendScore: best.trendScore,
    trendFactors: best.trendFactors,
    recentPopularity: best.recentPopularity,
  };
}

// Trend score calculation
function calculateTrendScore(result: SearchResult): number {
  let score = 0;
  
  // Recent reviews
  const recentReviews = getRecentReviews(result.id, 30);
  score += recentReviews.length * 2;
  
  // Rating improvement
  const ratingTrend = getRatingTrend(result.id);
  if (ratingTrend > 0) score += ratingTrend * 20;
  
  // Price changes
  const priceTrend = getPriceTrend(result.id);
  if (priceTrend < 0) score += Math.abs(priceTrend) * 15;
  
  return Math.min(100, score);
}

// Identify trend factors
function identifyTrendFactors(result: SearchResult): string[] {
  const factors: string[] = [];
  
  if (result.rating.reviews > 100) factors.push('Highly reviewed');
  if (result.scores.providerTrust > 0.9) factors.push('Trusted provider');
  if (result.images.length > 20) factors.push('Well-documented');
  
  return factors;
}
```

---

## Recommendation Engine Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       RECOMMENDATION ENGINE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         INPUT LAYER                                         │ │
│  │                                                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │   Ranked    │  │   User      │  │   Query     │  │   Market    │     │ │
│  │  │   Results   │  │   Profile   │  │   Context   │  │   Data      │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      ANALYSIS LAYER                                        │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  User     │ │  Price    │ │  Quality  │ │  Location │ │  Trend    │  │ │
│  │  │  Analysis │ │  Analysis │ │  Analysis │ │  Analysis │ │  Analysis │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      RECOMMENDATION LAYER                                  │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Best     │ │  Cheapest │ │  Premium  │ │  Closest  │ │  Trending │  │ │
│  │  │  Value    │ │  Option   │ │  Choice   │ │  to Center│ │  Now      │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      OUTPUT LAYER                                          │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Personalized Recommendations                                       │  │ │
│  │  │                                                                      │  │ │
│  │  │  🏆 Best Value: Hotel A                                             │  │ │
│  │  │     Why: Best price-quality ratio, highly rated                    │  │ │
│  │  │                                                                      │  │ │
│  │  │  💰 Cheapest: Hotel B                                               │  │ │
│  │  │     Why: 30% below average price, still good quality               │  │ │
│  │  │                                                                      │  │ │
│  │  │  ⭐ Premium: Hotel C                                                 │  │ │
│  │  │     Why: 5-star, luxury amenities, exclusive location              │  │ │
│  │  │                                                                      │  │ │
│  │  │  📍 Closest: Hotel D                                                 │  │ │
│  │  │     Why: 500m from center, walking distance to attractions          │  │ │
│  │  │                                                                      │  │ │
│  │  │  🔥 Trending: Hotel E                                                │  │ │
│  │  │     Why: Rapidly improving ratings, popular with travelers          │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## User Profile Analysis

```typescript
interface UserProfileAnalyzer {
  // Analyze user preferences
  analyzePreferences(user: UserProfile): UserPreferences;
  
  // Predict user needs
  predictNeeds(query: SearchQuery, history: BookingHistory[]): UserNeeds;
  
  // Calculate user similarity
  calculateSimilarity(
    user1: UserProfile,
    user2: UserProfile
  ): number;
}

interface UserPreferences {
  // Price sensitivity
  priceSensitivity: number; // 0-1
  
  // Quality preference
  qualityPreference: number; // 0-1
  
  // Location preference
  locationPreference: number; // 0-1
  
  // Amenity preferences
  amenityPreferences: string[];
  
  // Style preferences
  stylePreferences: string[];
}

// Analyze user preferences
function analyzePreferences(user: UserProfile): UserPreferences {
  const history = user.bookingHistory || [];
  
  // Calculate price sensitivity
  const avgPrice = calculateAverageBookingPrice(history);
  const priceSensitivity = 1 - (avgPrice / 500);
  
  // Calculate quality preference
  const avgRating = calculateAverageBookingRating(history);
  const qualityPreference = avgRating / 5;
  
  // Calculate location preference
  const locationPreference = calculateLocationPreference(history);
  
  // Extract amenity preferences
  const amenityPreferences = extractAmenityPreferences(history);
  
  // Extract style preferences
  const stylePreferences = extractStylePreferences(history);
  
  return {
    priceSensitivity,
    qualityPreference,
    locationPreference,
    amenityPreferences,
    stylePreferences,
  };
}

// Predict user needs
function predictNeeds(
  query: SearchQuery,
  history: BookingHistory[]
): UserNeeds {
  // Analyze query intent
  const intent = analyzeQueryIntent(query);
  
  // Analyze historical patterns
  const patterns = analyzeHistoricalPatterns(history);
  
  // Predict needs
  return {
    primaryNeeds: predictPrimaryNeeds(intent, patterns),
    secondaryNeeds: predictSecondaryNeeds(intent, patterns),
    implicitNeeds: predictImplicitNeeds(intent, patterns),
  };
}
```

---

## Market Data Analysis

```typescript
interface MarketDataAnalyzer {
  // Analyze market trends
  analyzeTrends(destination: string, dates: DateRange): MarketTrends;
  
  // Calculate price index
  calculatePriceIndex(
    destination: string,
    dates: DateRange
  ): PriceIndex;
  
  // Predict price changes
  predictPriceChanges(
    destination: string,
    dates: DateRange
  ): PricePrediction;
}

interface MarketTrends {
  // Price trends
  priceDirection: 'up' | 'down' | 'stable';
  priceChangePercent: number;
  
  // Demand trends
  demandLevel: 'high' | 'medium' | 'low';
  demandTrend: 'increasing' | 'decreasing' | 'stable';
  
  // Supply trends
  availabilityLevel: 'high' | 'medium' | 'low';
  availabilityTrend: 'increasing' | 'decreasing' | 'stable';
}

// Analyze market trends
function analyzeTrends(
  destination: string,
  dates: DateRange
): MarketTrends {
  // Get historical data
  const historicalData = getHistoricalData(destination);
  
  // Get current data
  const currentData = getCurrentData(destination, dates);
  
  // Analyze trends
  return {
    priceDirection: calculatePriceDirection(historicalData, currentData),
    priceChangePercent: calculatePriceChangePercent(historicalData, currentData),
    demandLevel: calculateDemandLevel(currentData),
    demandTrend: calculateDemandTrend(historicalData, currentData),
    availabilityLevel: calculateAvailabilityLevel(currentData),
    availabilityTrend: calculateAvailabilityTrend(historicalData, currentData),
  };
}
```

---

## Collaborative Filtering

```typescript
interface CollaborativeFilter {
  // Find similar users
  findSimilarUsers(
    userId: string,
    limit: number
  ): SimilarUser[];
  
  // Get recommendations from similar users
  getCollaborativeRecommendations(
    userId: string,
    query: SearchQuery
  ): CollaborativeRecommendation[];
}

interface SimilarUser {
  userId: string;
  similarity: number;
  commonBookings: number;
}

// Find similar users
function findSimilarUsers(
  userId: string,
  limit: number
): SimilarUser[] {
  const userBookings = getUserBookings(userId);
  const allUsers = getAllUsers();
  
  const similarities = allUsers
    .filter(user => user.id !== userId)
    .map(user => ({
      userId: user.id,
      similarity: calculateUserSimilarity(userBookings, user.bookings),
      commonBookings: countCommonBookings(userBookings, user.bookings),
    }))
    .filter(s => s.similarity > 0.5)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
  
  return similarities;
}

// Get collaborative recommendations
function getCollaborativeRecommendations(
  userId: string,
  query: SearchQuery
): CollaborativeRecommendation[] {
  const similarUsers = findSimilarUsers(userId, 10);
  
  // Get bookings from similar users
  const similarBookings = similarUsers.flatMap(user => 
    getUserBookings(user.userId)
  );
  
  // Filter by query relevance
  const relevantBookings = similarBookings.filter(booking =>
    isRelevantToQuery(booking, query)
  );
  
  // Score and rank
  const recommendations = scoreCollaborativeRecommendations(
    relevantBookings,
    similarUsers
  );
  
  return recommendations.slice(0, 5);
}
```

---

## Recommendation Configuration

```yaml
recommendation:
  # Enable/disable recommendations
  enabled: true
  
  # Recommendation types
  types:
    bestValue:
      enabled: true
      weight: 0.3
    cheapest:
      enabled: true
      weight: 0.25
    premium:
      enabled: true
      weight: 0.2
    closest:
      enabled: true
      weight: 0.15
    trending:
      enabled: true
      weight: 0.1
  
  # Minimum thresholds
  thresholds:
    minConfidence: 0.6
    minResults: 3
    minScore: 0.5
  
  # Personalization
  personalization:
    enabled: true
    minBookings: 3
    maxSimilarUsers: 10
  
  # Market data
  marketData:
    enabled: true
    updateInterval: 3600000 # 1 hour
    cacheTtl: 300000 # 5 minutes
```
