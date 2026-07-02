# Ranking Engine

> Multi-factor ranking system for travel search results.

---

## Overview

The Ranking Engine evaluates and sorts search results based on multiple weighted factors, ensuring the most relevant and valuable results appear first.

---

## Ranking Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RANKING ENGINE                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         INPUT LAYER                                         │ │
│  │                                                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │   Scored    │  │   User      │  │   Query     │  │   Context   │     │ │
│  │  │   Results   │  │   Profile   │  │   Intent    │  │   Data      │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      SCORING LAYER                                         │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Price    │ │  Quality  │ │  Value    │ │  Location │ │  User     │  │ │
│  │  │  Score    │ │  Score    │ │  Score    │ │  Score    │ │  Score    │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      WEIGHTING LAYER                                       │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Dynamic Weight Calculator                                          │  │ │
│  │  │                                                                      │  │ │
│  │  │  Query Type Weights    User Preferences    Business Rules           │  │ │
│  │  │  ┌─────────────┐      ┌─────────────┐     ┌─────────────┐         │  │ │
│  │  │  │ budget: 0.3 │      │ price: 0.4  │     │ promo: 0.1  │         │  │ │
│  │  │  │ luxury: 0.2 │      │ quality: 0.3│     │ margin: 0.05│         │  │ │
│  │  │  │ family: 0.25│      │ location: 0.2│    │ partner: 0.1│         │  │ │
│  │  │  │ business: 0.15     │ reviews: 0.1 │     │ inventory: 0.15       │  │ │
│  │  │  └─────────────┘      └─────────────┘     └─────────────┘         │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      OUTPUT LAYER                                          │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Ranked Results with Badges                                         │  │ │
│  │  │                                                                      │  │ │
│  │  │  #1 Hotel A ─── 🏆 Best Value    Score: 95.2                       │  │ │
│  │  │  #2 Hotel B ─── 💰 Cheapest      Score: 92.8                       │  │ │
│  │  │  #3 Hotel C ─── ⭐ Top Rated     Score: 91.5                       │  │ │
│  │  │  #4 Hotel D ─── 🔥 Trending      Score: 89.3                       │  │ │
│  │  │  #5 Hotel E ─── 👔 Staff Pick    Score: 87.6                       │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Ranking Factors

### 1. Price Score

**Weight**: 0.0 - 0.4 (dynamic based on query type)

```typescript
interface PriceScore {
  // Raw price
  rawPrice: number;
  
  // Normalized price (0-100)
  normalizedPrice: number;
  
  // Price percentile
  percentile: number;
  
  // Price relative to market
  marketPosition: 'below' | 'at' | 'above';
  
  // Final price score
  score: number;
}

// Price scoring algorithm
function calculatePriceScore(
  price: number,
  marketAvg: number,
  minPrice: number,
  maxPrice: number,
  queryType: QueryType
): PriceScore {
  // Normalize price to 0-100 scale
  const normalized = 100 - ((price - minPrice) / (maxPrice - minPrice)) * 100;
  
  // Calculate market position
  const marketPosition = price < marketAvg * 0.9 
    ? 'below' 
    : price > marketAvg * 1.1 
      ? 'above' 
      : 'at';
  
  // Calculate percentile
  const percentile = (price - minPrice) / (maxPrice - minPrice) * 100;
  
  // Apply query type modifier
  const modifier = QUERY_TYPE_MODIFIERS[queryType];
  
  return {
    rawPrice: price,
    normalizedPrice: normalized,
    percentile,
    marketPosition,
    score: normalized * modifier,
  };
}

// Query type modifiers
const QUERY_TYPE_MODIFIERS = {
  budget: { price: 0.4, quality: 0.2, value: 0.4 },
  luxury: { price: 0.1, quality: 0.5, value: 0.4 },
  family: { price: 0.3, quality: 0.3, value: 0.4 },
  business: { price: 0.2, quality: 0.4, value: 0.4 },
  romantic: { price: 0.2, quality: 0.4, value: 0.4 },
};
```

---

### 2. Quality Score

**Weight**: 0.0 - 0.5 (dynamic based on query type)

```typescript
interface QualityScore {
  // Star rating (1-5)
  starRating: number;
  
  // Review score (0-10)
  reviewScore: number;
  
  // Review count
  reviewCount: number;
  
  // Data completeness
  dataCompleteness: number;
  
  // Image availability
  imageAvailability: number;
  
  // Final quality score
  score: number;
}

// Quality scoring algorithm
function calculateQualityScore(
  result: SearchResult,
  weights: QualityWeights
): QualityScore {
  // Star rating score (0-100)
  const starScore = (result.rating.score / 5) * 100;
  
  // Review score (0-100)
  const reviewScore = (result.rating.normalized / 10) * 100;
  
  // Review count score (logarithmic)
  const reviewCountScore = Math.min(
    100,
    Math.log10(result.rating.reviews + 1) * 20
  );
  
  // Data completeness score
  const dataCompleteness = calculateDataCompleteness(result);
  
  // Image availability score
  const imageAvailability = Math.min(
    100,
    (result.images.length / 10) * 100
  );
  
  // Weighted average
  const score = 
    starScore * weights.starRating +
    reviewScore * weights.reviewScore +
    reviewCountScore * weights.reviewCount +
    dataCompleteness * weights.dataCompleteness +
    imageAvailability * weights.imageAvailability;
  
  return {
    starRating: result.rating.score,
    reviewScore: result.rating.normalized,
    reviewCount: result.rating.reviews,
    dataCompleteness,
    imageAvailability,
    score,
  };
}

// Data completeness calculation
function calculateDataCompleteness(result: SearchResult): number {
  const fields = [
    'name',
    'description',
    'location.address',
    'location.city',
    'location.country',
    'images',
    'amenities',
    'policies',
  ];
  
  let filled = 0;
  for (const field of fields) {
    if (getNestedValue(result, field)) {
      filled++;
    }
  }
  
  return (filled / fields.length) * 100;
}
```

---

### 3. Value Score

**Weight**: 0.0 - 0.4 (dynamic based on query type)

```typescript
interface ValueScore {
  // Price to quality ratio
  priceQualityRatio: number;
  
  // Amenities value
  amenitiesValue: number;
  
  // Location value
  locationValue: number;
  
  // Deal score
  dealScore: number;
  
  // Final value score
  score: number;
}

// Value scoring algorithm
function calculateValueScore(
  result: SearchResult,
  marketData: MarketData,
  weights: ValueWeights
): ValueScore {
  // Price to quality ratio
  const priceQualityRatio = result.rating.normalized / (result.pricing.normalized.amount / 100);
  
  // Amenities value
  const amenitiesValue = calculateAmenitiesValue(result.amenities);
  
  // Location value
  const locationValue = calculateLocationValue(
    result.location,
    marketData.popularAreas
  );
  
  // Deal score (compared to historical average)
  const dealScore = calculateDealScore(
    result.pricing.normalized.amount,
    marketData.historicalAvg
  );
  
  // Weighted average
  const score = 
    priceQualityRatio * weights.priceQualityRatio +
    amenitiesValue * weights.amenitiesValue +
    locationValue * weights.locationValue +
    dealScore * weights.dealScore;
  
  return {
    priceQualityRatio,
    amenitiesValue,
    locationValue,
    dealScore,
    score,
  };
}

// Amenities value calculation
function calculateAmenitiesValue(amenities: string[]): number {
  const HIGH_VALUE = ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'parking'];
  const MEDIUM_VALUE = ['tv', 'ac', 'minibar', 'room_service'];
  const LOW_VALUE = ['elevator', 'laundry', 'safe'];
  
  let value = 0;
  for (const amenity of amenities) {
    if (HIGH_VALUE.includes(amenity)) value += 30;
    else if (MEDIUM_VALUE.includes(amenity)) value += 15;
    else if (LOW_VALUE.includes(amenity)) value += 5;
  }
  
  return Math.min(100, value);
}

// Location value calculation
function calculateLocationValue(
  location: LocationInfo,
  popularAreas: Area[]
): number {
  // Distance to nearest popular area
  const distances = popularAreas.map(area => 
    calculateDistance(location, area)
  );
  
  const minDistance = Math.min(...distances);
  
  // Score based on distance (closer = higher score)
  if (minDistance < 1) return 100;      // < 1 km
  if (minDistance < 3) return 80;       // < 3 km
  if (minDistance < 5) return 60;       // < 5 km
  if (minDistance < 10) return 40;      // < 10 km
  return 20;                            // > 10 km
}

// Deal score calculation
function calculateDealScore(
  currentPrice: number,
  historicalAvg: number
): number {
  if (currentPrice >= historicalAvg) return 0;
  
  const discount = (historicalAvg - currentPrice) / historicalAvg;
  return Math.min(100, discount * 200);
}
```

---

### 4. Location Score

**Weight**: 0.0 - 0.3 (dynamic based on query type)

```typescript
interface LocationScore {
  // Distance to destination
  distanceToDestination: number;
  
  // Distance to attractions
  distanceToAttractions: number;
  
  // Distance to transportation
  distanceToTransport: number;
  
  // Neighborhood safety
  neighborhoodSafety: number;
  
  // Final location score
  score: number;
}

// Location scoring algorithm
function calculateLocationScore(
  result: SearchResult,
  query: ParsedQuery,
  weights: LocationWeights
): LocationScore {
  // Distance to destination center
  const distanceToDestination = calculateDistance(
    result.location,
    query.enrichedLocation.coordinates
  );
  
  // Distance to attractions
  const distanceToAttractions = calculateAvgDistanceToAttractions(
    result.location,
    query.enrichedLocation.popularAreas
  );
  
  // Distance to transportation
  const distanceToTransport = calculateDistanceToTransport(
    result.location
  );
  
  // Neighborhood safety (from external data)
  const neighborhoodSafety = getNeighborhoodSafety(
    result.location.lat,
    result.location.lng
  );
  
  // Convert distances to scores (closer = higher)
  const distanceScore = Math.max(0, 100 - distanceToDestination * 5);
  const attractionScore = Math.max(0, 100 - distanceToAttractions * 3);
  const transportScore = Math.max(0, 100 - distanceToTransport * 10);
  
  // Weighted average
  const score = 
    distanceScore * weights.distanceToDestination +
    attractionScore * weights.distanceToAttractions +
    transportScore * weights.distanceToTransport +
    neighborhoodSafety * weights.neighborhoodSafety;
  
  return {
    distanceToDestination,
    distanceToAttractions,
    distanceToTransport,
    neighborhoodSafety,
    score,
  };
}
```

---

### 5. User Score

**Weight**: 0.0 - 0.2 (based on user profile)

```typescript
interface UserScore {
  // Provider preference match
  providerPreference: number;
  
  // Amenity preference match
  amenityPreference: number;
  
  // Style preference match
  stylePreference: number;
  
  // History match
  historyMatch: number;
  
  // Final user score
  score: number;
}

// User scoring algorithm
function calculateUserScore(
  result: SearchResult,
  user: UserProfile,
  weights: UserWeights
): UserScore {
  // Provider preference
  const providerPreference = user.preferredProviders.includes(result.provider)
    ? 100
    : 50;
  
  // Amenity preference
  const amenityPreference = calculateAmenityMatch(
    result.amenities,
    user.preferredAmenities
  );
  
  // Style preference
  const stylePreference = calculateStyleMatch(
    result,
    user.preferredStyle
  );
  
  // History match
  const historyMatch = calculateHistoryMatch(
    result,
    user.bookingHistory
  );
  
  // Weighted average
  const score = 
    providerPreference * weights.providerPreference +
    amenityPreference * weights.amenityPreference +
    stylePreference * weights.stylePreference +
    historyMatch * weights.historyMatch;
  
  return {
    providerPreference,
    amenityPreference,
    stylePreference,
    historyMatch,
    score,
  };
}
```

---

## Weight Calculation

### Dynamic Weight System

```typescript
interface WeightCalculator {
  calculateWeights(
    query: ParsedQuery,
    user: UserProfile,
    context: SearchContext
  ): RankingWeights;
}

interface RankingWeights {
  price: number;
  quality: number;
  value: number;
  location: number;
  user: number;
}

// Dynamic weight calculation
function calculateWeights(
  query: ParsedQuery,
  user: UserProfile,
  context: SearchContext
): RankingWeights {
  // Base weights by query type
  const baseWeights = QUERY_TYPE_WEIGHTS[query.metadata.queryType];
  
  // Adjust for user preferences
  const userAdjusted = adjustForUserPreferences(baseWeights, user);
  
  // Adjust for context
  const contextAdjusted = adjustForContext(userAdjusted, context);
  
  // Normalize to sum to 1
  return normalizeWeights(contextAdjusted);
}

// Query type base weights
const QUERY_TYPE_WEIGHTS = {
  hotel_search: {
    budget: { price: 0.4, quality: 0.2, value: 0.3, location: 0.08, user: 0.02 },
    luxury: { price: 0.1, quality: 0.5, value: 0.2, location: 0.15, user: 0.05 },
    family: { price: 0.3, quality: 0.3, value: 0.25, location: 0.1, user: 0.05 },
    business: { price: 0.15, quality: 0.4, value: 0.2, location: 0.2, user: 0.05 },
    romantic: { price: 0.15, quality: 0.45, value: 0.2, location: 0.15, user: 0.05 },
  },
  activity_search: {
    adventure: { price: 0.2, quality: 0.3, value: 0.3, location: 0.15, user: 0.05 },
    cultural: { price: 0.15, quality: 0.4, value: 0.25, location: 0.15, user: 0.05 },
    family: { price: 0.25, quality: 0.35, value: 0.25, location: 0.1, user: 0.05 },
    luxury: { price: 0.1, quality: 0.5, value: 0.2, location: 0.15, user: 0.05 },
  },
};

// User preference adjustment
function adjustForUserPreferences(
  weights: RankingWeights,
  user: UserProfile
): RankingWeights {
  const adjusted = { ...weights };
  
  // Increase price weight if user is price-sensitive
  if (user.priceSensitivity > 0.7) {
    adjusted.price *= 1.3;
  }
  
  // Increase quality weight if user values quality
  if (user.qualityPreference > 0.7) {
    adjusted.quality *= 1.3;
  }
  
  // Increase location weight if user has location preferences
  if (user.hasLocationPreference) {
    adjusted.location *= 1.3;
  }
  
  return adjusted;
}

// Context adjustment
function adjustForContext(
  weights: RankingWeights,
  context: SearchContext
): RankingWeights {
  const adjusted = { ...weights };
  
  // Adjust for seasonality
  if (context.season === 'peak') {
    adjusted.value *= 1.2;
  }
  
  // Adjust for market conditions
  if (context.marketCondition === 'high') {
    adjusted.price *= 1.1;
  }
  
  // Adjust for competition
  if (context.competitionLevel === 'high') {
    adjusted.value *= 1.1;
  }
  
  return adjusted;
}

// Normalize weights to sum to 1
function normalizeWeights(weights: RankingWeights): RankingWeights {
  const sum = 
    weights.price + 
    weights.quality + 
    weights.value + 
    weights.location + 
    weights.user;
  
  return {
    price: weights.price / sum,
    quality: weights.quality / sum,
    value: weights.value / sum,
    location: weights.location / sum,
    user: weights.user / sum,
  };
}
```

---

## Final Score Calculation

```typescript
interface FinalScore {
  // Component scores
  priceScore: number;
  qualityScore: number;
  valueScore: number;
  locationScore: number;
  userScore: number;
  
  // Weighted scores
  weightedPrice: number;
  weightedQuality: number;
  weightedValue: number;
  weightedLocation: number;
  weightedUser: number;
  
  // Final score
  overallScore: number;
  
  // Confidence
  confidence: number;
}

// Final score calculation
function calculateFinalScore(
  result: SearchResult,
  weights: RankingWeights,
  query: ParsedQuery,
  user: UserProfile | null,
  context: SearchContext
): FinalScore {
  // Calculate component scores
  const priceScore = calculatePriceScore(
    result.pricing.normalized.amount,
    context.marketData.avgPrice,
    context.marketData.minPrice,
    context.marketData.maxPrice,
    query.metadata.queryType
  );
  
  const qualityScore = calculateQualityScore(result, QUALITY_WEIGHTS);
  
  const valueScore = calculateValueScore(
    result,
    context.marketData,
    VALUE_WEIGHTS
  );
  
  const locationScore = calculateLocationScore(
    result,
    query,
    LOCATION_WEIGHTS
  );
  
  const userScore = user 
    ? calculateUserScore(result, user, USER_WEIGHTS)
    : { score: 50 };
  
  // Calculate weighted scores
  const weightedPrice = priceScore.score * weights.price;
  const weightedQuality = qualityScore.score * weights.quality;
  const weightedValue = valueScore.score * weights.value;
  const weightedLocation = locationScore.score * weights.location;
  const weightedUser = userScore.score * weights.user;
  
  // Calculate overall score
  const overallScore = 
    weightedPrice + 
    weightedQuality + 
    weightedValue + 
    weightedLocation + 
    weightedUser;
  
  // Calculate confidence
  const confidence = calculateConfidence(
    result,
    priceScore,
    qualityScore,
    valueScore
  );
  
  return {
    priceScore: priceScore.score,
    qualityScore: qualityScore.score,
    valueScore: valueScore.score,
    locationScore: locationScore.score,
    userScore: userScore.score,
    weightedPrice,
    weightedQuality,
    weightedValue,
    weightedLocation,
    weightedUser,
    overallScore,
    confidence,
  };
}

// Confidence calculation
function calculateConfidence(
  result: SearchResult,
  priceScore: PriceScore,
  qualityScore: QualityScore,
  valueScore: ValueScore
): number {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence with more data
  if (qualityScore.reviewCount > 100) confidence += 0.15;
  else if (qualityScore.reviewCount > 50) confidence += 0.1;
  else if (qualityScore.reviewCount > 10) confidence += 0.05;
  
  // Increase confidence with complete data
  confidence += qualityScore.dataCompleteness * 0.1;
  
  // Increase confidence with images
  confidence += qualityScore.imageAvailability * 0.1;
  
  // Decrease confidence for extreme prices
  if (priceScore.marketPosition === 'below') confidence -= 0.05;
  if (priceScore.marketPosition === 'above') confidence -= 0.05;
  
  return Math.max(0, Math.min(1, confidence));
}
```

---

## Badge Assignment

```typescript
interface BadgeAssignment {
  assignBadges(
    results: ScoredResult[],
    rankings: RankedResult[]
  ): RankedResult[];
}

// Badge assignment logic
function assignBadges(
  results: ScoredResult[],
  rankings: RankedResult[]
): RankedResult[] {
  // Find cheapest
  const cheapest = findCheapest(results);
  
  // Find best value
  const bestValue = findBestValue(results);
  
  // Find top rated
  const topRated = findTopRated(results);
  
  // Find most reviewed
  const mostReviewed = findMostReviewed(results);
  
  // Find staff picks
  const staffPicks = findStaffPicks(results);
  
  // Find trending
  const trending = findTrending(results);
  
  // Assign badges
  return rankings.map(result => ({
    ...result,
    badges: {
      cheapest: result.id === cheapest.id,
      bestValue: result.id === bestValue.id,
      topRated: result.id === topRated.id,
      mostReviewed: result.id === mostReviewed.id,
      staffPick: staffPicks.includes(result.id),
      trending: trending.includes(result.id),
    },
  }));
}

// Find cheapest
function findCheapest(results: ScoredResult[]): ScoredResult {
  return results.reduce((min, result) => 
    result.pricing.normalized.amount < min.pricing.normalized.amount 
      ? result 
      : min
  );
}

// Find best value
function findBestValue(results: ScoredResult[]): ScoredResult {
  return results.reduce((best, result) => 
    result.scores.value > best.scores.value 
      ? result 
      : best
  );
}

// Find top rated
function findTopRated(results: ScoredResult[]): ScoredResult {
  return results.reduce((best, result) => 
    result.rating.normalized > best.rating.normalized 
      ? result 
      : best
  );
}

// Find most reviewed
function findMostReviewed(results: ScoredResult[]): ScoredResult {
  return results.reduce((best, result) => 
    result.rating.reviews > best.rating.reviews 
      ? result 
      : best
  );
}

// Find staff picks
function findStaffPicks(results: ScoredResult[]): string[] {
  return results
    .filter(result => result.scores.confidence > 0.8)
    .slice(0, 3)
    .map(result => result.id);
}

// Find trending
function findTrending(results: ScoredResult[]): string[] {
  return results
    .filter(result => result.scores.providerTrust > 0.9)
    .slice(0, 3)
    .map(result => result.id);
}
```

---

## Ranking Configuration

```yaml
ranking:
  # Weights
  weights:
    # Default weights
    default:
      price: 0.25
      quality: 0.25
      value: 0.25
      location: 0.15
      user: 0.10
    
    # Query type specific weights
    queryTypes:
      budget:
        price: 0.4
        quality: 0.2
        value: 0.3
        location: 0.08
        user: 0.02
      luxury:
        price: 0.1
        quality: 0.5
        value: 0.2
        location: 0.15
        user: 0.05
  
  # Score thresholds
  thresholds:
    minScore: 0.3
    highScore: 0.8
    premiumScore: 0.9
  
  # Badge thresholds
  badges:
    cheapest: true
    bestValue:
      minScore: 0.8
    topRated:
      minRating: 4.5
    mostReviewed:
      minReviews: 100
    staffPick:
      minConfidence: 0.8
    trending:
      minProviderTrust: 0.9
```
