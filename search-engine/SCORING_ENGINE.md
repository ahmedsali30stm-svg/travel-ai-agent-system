# Scoring Engine

> Comprehensive scoring system for travel search results.

---

## Overview

The Scoring Engine calculates multiple scores for each search result, providing a complete evaluation of quality, value, and reliability.

---

## Score Types

### 1. Best Value Score

```typescript
interface BestValueScore {
  // Price efficiency
  priceEfficiency: number;
  
  // Quality per dollar
  qualityPerDollar: number;
  
  // Amenity value
  amenityValue: number;
  
  // Location premium
  locationPremium: number;
  
  // Overall value
  score: number;
}

// Best value calculation
function calculateBestValueScore(
  result: SearchResult,
  marketData: MarketData
): BestValueScore {
  // Price efficiency (lower price = higher score)
  const priceEfficiency = calculatePriceEfficiency(
    result.pricing.normalized.amount,
    marketData.avgPrice
  );
  
  // Quality per dollar
  const qualityPerDollar = 
    (result.rating.normalized / 10) / 
    (result.pricing.normalized.amount / 100);
  
  // Amenity value
  const amenityValue = calculateAmenityValue(result.amenities);
  
  // Location premium
  const locationPremium = calculateLocationPremium(
    result.location,
    marketData.popularAreas
  );
  
  // Overall score (0-100)
  const score = (
    priceEfficiency * 0.35 +
    qualityPerDollar * 30 +
    amenityValue * 0.20 +
    locationPremium * 0.15
  ) * 100;
  
  return {
    priceEfficiency,
    qualityPerDollar,
    amenityValue,
    locationPremium,
    score: Math.min(100, Math.max(0, score)),
  };
}

// Price efficiency calculation
function calculatePriceEfficiency(
  price: number,
  avgPrice: number
): number {
  if (price <= 0) return 0;
  
  const ratio = avgPrice / price;
  return Math.min(1, Math.max(0, ratio));
}
```

---

### 2. Confidence Score

```typescript
interface ConfidenceScore {
  // Data completeness
  dataCompleteness: number;
  
  // Source reliability
  sourceReliability: number;
  
  // Price consistency
  priceConsistency: number;
  
  // Review authenticity
  reviewAuthenticity: number;
  
  // Overall confidence
  score: number;
}

// Confidence calculation
function calculateConfidenceScore(
  result: SearchResult,
  provider: ProviderConfig
): ConfidenceScore {
  // Data completeness
  const dataCompleteness = calculateDataCompleteness(result);
  
  // Source reliability (based on provider)
  const sourceReliability = provider.trustScore;
  
  // Price consistency (compared to other providers)
  const priceConsistency = calculatePriceConsistency(
    result.pricing.normalized.amount,
    result.provider
  );
  
  // Review authenticity
  const reviewAuthenticity = calculateReviewAuthenticity(
    result.rating.reviews,
    result.rating.score
  );
  
  // Overall score
  const score = (
    dataCompleteness * 0.3 +
    sourceReliability * 0.3 +
    priceConsistency * 0.2 +
    reviewAuthenticity * 0.2
  );
  
  return {
    dataCompleteness,
    sourceReliability,
    priceConsistency,
    reviewAuthenticity,
    score,
  };
}

// Data completeness calculation
function calculateDataCompleteness(result: SearchResult): number {
  const requiredFields = [
    { field: 'name', weight: 0.15 },
    { field: 'description', weight: 0.10 },
    { field: 'location.address', weight: 0.10 },
    { field: 'location.lat', weight: 0.10 },
    { field: 'location.lng', weight: 0.10 },
    { field: 'images', weight: 0.15 },
    { field: 'amenities', weight: 0.10 },
    { field: 'policies', weight: 0.10 },
    { field: 'rating', weight: 0.10 },
  ];
  
  let completeness = 0;
  
  for (const { field, weight } of requiredFields) {
    const value = getNestedValue(result, field);
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      completeness += weight;
    }
  }
  
  return completeness;
}

// Price consistency calculation
function calculatePriceConsistency(
  price: number,
  provider: string
): number {
  // Get prices from other providers for same result
  const otherPrices = getOtherProviderPrices(result.id, provider);
  
  if (otherPrices.length === 0) return 0.5;
  
  const avgOtherPrice = otherPrices.reduce((a, b) => a + b, 0) / otherPrices.length;
  const deviation = Math.abs(price - avgOtherPrice) / avgOtherPrice;
  
  // Lower deviation = higher consistency
  return Math.max(0, 1 - deviation);
}

// Review authenticity calculation
function calculateReviewAuthenticity(
  reviewCount: number,
  avgRating: number
): number {
  // Check for suspicious patterns
  let authenticity = 0.5;
  
  // More reviews = more authentic
  if (reviewCount > 100) authenticity += 0.2;
  else if (reviewCount > 50) authenticity += 0.15;
  else if (reviewCount > 10) authenticity += 0.1;
  
  // Check for extreme ratings
  if (avgRating >= 4.5 && avgRating <= 4.8) {
    authenticity += 0.2; // Realistic high rating
  } else if (avgRating > 4.9) {
    authenticity -= 0.1; // Suspiciously perfect
  } else if (avgRating < 3.0) {
    authenticity += 0.1; // Bad but authentic
  }
  
  return Math.max(0, Math.min(1, authenticity));
}
```

---

### 3. Provider Trust Score

```typescript
interface ProviderTrustScore {
  // Historical reliability
  reliability: number;
  
  // Data accuracy
  accuracy: number;
  
  // Response time
  responsiveness: number;
  
  // Customer satisfaction
  satisfaction: number;
  
  // Overall trust
  score: number;
}

// Provider trust calculation
function calculateProviderTrustScore(
  provider: string,
  metrics: ProviderMetrics
): ProviderTrustScore {
  // Historical reliability
  const reliability = metrics.successRate;
  
  // Data accuracy
  const accuracy = calculateDataAccuracy(provider);
  
  // Response time
  const responsiveness = calculateResponsiveness(
    metrics.avgResponseTime
  );
  
  // Customer satisfaction
  const satisfaction = metrics.customerSatisfaction;
  
  // Overall score
  const score = (
    reliability * 0.35 +
    accuracy * 0.30 +
    responsiveness * 0.15 +
    satisfaction * 0.20
  );
  
  return {
    reliability,
    accuracy,
    responsiveness,
    satisfaction,
    score,
  };
}

// Data accuracy calculation
function calculateDataAccuracy(provider: string): number {
  const providerData = PROVIDER_DATA[provider];
  
  if (!providerData) return 0.5;
  
  return providerData.accuracy;
}

// Response time calculation
function calculateResponsiveness(avgResponseTime: number): number {
  if (avgResponseTime < 500) return 1.0;
  if (avgResponseTime < 1000) return 0.9;
  if (avgResponseTime < 2000) return 0.8;
  if (avgResponseTime < 3000) return 0.7;
  if (avgResponseTime < 5000) return 0.6;
  return 0.5;
}
```

---

### 4. Overall Score

```typescript
interface OverallScore {
  // Component scores
  bestValue: BestValueScore;
  confidence: ConfidenceScore;
  providerTrust: ProviderTrustScore;
  
  // Weighted components
  weightedBestValue: number;
  weightedConfidence: number;
  weightedProviderTrust: number;
  
  // Final score
  score: number;
  
  // Grade
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
}

// Overall score calculation
function calculateOverallScore(
  result: SearchResult,
  provider: ProviderConfig,
  weights: ScoreWeights
): OverallScore {
  // Calculate component scores
  const bestValue = calculateBestValueScore(result, marketData);
  const confidence = calculateConfidenceScore(result, provider);
  const providerTrust = calculateProviderTrustScore(
    result.provider,
    provider.metrics
  );
  
  // Calculate weighted components
  const weightedBestValue = bestValue.score * weights.bestValue;
  const weightedConfidence = confidence.score * weights.confidence;
  const weightedProviderTrust = providerTrust.score * weights.providerTrust;
  
  // Calculate final score
  const score = weightedBestValue + weightedConfidence + weightedProviderTrust;
  
  // Assign grade
  const grade = assignGrade(score);
  
  return {
    bestValue,
    confidence,
    providerTrust,
    weightedBestValue,
    weightedConfidence,
    weightedProviderTrust,
    score,
    grade,
  };
}

// Grade assignment
function assignGrade(score: number): OverallScore['grade'] {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 60) return 'D';
  return 'F';
}
```

---

## Score Weights

```typescript
interface ScoreWeights {
  bestValue: number;
  confidence: number;
  providerTrust: number;
}

// Default weights
const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  bestValue: 0.5,
  confidence: 0.3,
  providerTrust: 0.2,
};

// Query type specific weights
const QUERY_TYPE_SCORE_WEIGHTS: Record<QueryType, ScoreWeights> = {
  hotel_search: {
    bestValue: 0.5,
    confidence: 0.3,
    providerTrust: 0.2,
  },
  activity_search: {
    bestValue: 0.4,
    confidence: 0.35,
    providerTrust: 0.25,
  },
  flight_search: {
    bestValue: 0.6,
    confidence: 0.25,
    providerTrust: 0.15,
  },
};
```

---

## Score Normalization

```typescript
interface ScoreNormalizer {
  normalize(scores: number[]): number[];
  zScoreNormalize(scores: number[]): number[];
  minMaxNormalize(scores: number[]): number[];
  percentileNormalize(scores: number[]): number[];
}

// Min-max normalization
function minMaxNormalize(scores: number[]): number[] {
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;
  
  if (range === 0) return scores.map(() => 0.5);
  
  return scores.map(score => (score - min) / range);
}

// Z-score normalization
function zScoreNormalize(scores: number[]): number[] {
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return scores.map(() => 0);
  
  return scores.map(score => (score - mean) / stdDev);
}

// Percentile normalization
function percentileNormalize(scores: number[]): number[] {
  const sorted = [...scores].sort((a, b) => a - b);
  
  return scores.map(score => {
    const index = sorted.indexOf(score);
    return index / (sorted.length - 1);
  });
}
```

---

## Score Caching

```typescript
interface ScoreCache {
  // Cache key structure
  key: {
    resultId: string;
    queryHash: string;
    timestamp: number;
  };
  
  // Cache value
  value: {
    scores: OverallScore;
    ttl: number;
  };
}

// Cache configuration
const SCORE_CACHE_CONFIG = {
  ttl: 300000, // 5 minutes
  maxSize: 10000,
  strategy: 'lru',
};

// Cache lookup
function getCachedScore(
  resultId: string,
  queryHash: string
): OverallScore | null {
  const key = `${resultId}:${queryHash}`;
  const cached = scoreCache.get(key);
  
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    scoreCache.delete(key);
    return null;
  }
  
  return cached.scores;
}

// Cache update
function setCachedScore(
  resultId: string,
  queryHash: string,
  scores: OverallScore
): void {
  const key = `${resultId}:${queryHash}`;
  
  scoreCache.set(key, {
    scores,
    timestamp: Date.now(),
    ttl: SCORE_CACHE_CONFIG.ttl,
  });
}
```

---

## Score Aggregation

```typescript
interface ScoreAggregator {
  // Aggregate scores from multiple sources
  aggregate(scores: ScoredResult[]): AggregatedScore;
  
  // Calculate average score
  average(scores: number[]): number;
  
  // Calculate weighted average
  weightedAverage(scores: number[], weights: number[]): number;
  
  // Calculate median
  median(scores: number[]): number;
}

// Aggregate scores
function aggregateScores(results: ScoredResult[]): AggregatedScore {
  const scores = results.map(r => r.scores.overall.score);
  
  return {
    average: average(scores),
    median: median(scores),
    min: Math.min(...scores),
    max: Math.max(...scores),
    stdDev: standardDeviation(scores),
    distribution: calculateDistribution(scores),
  };
}

// Average calculation
function average(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// Median calculation
function median(scores: number[]): number {
  if (scores.length === 0) return 0;
  
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// Standard deviation calculation
function standardDeviation(scores: number[]): number {
  const avg = average(scores);
  const squareDiffs = scores.map(score => Math.pow(score - avg, 2));
  const avgSquareDiff = average(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

// Distribution calculation
function calculateDistribution(scores: number[]): ScoreDistribution {
  const distribution: ScoreDistribution = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0,
  };
  
  for (const score of scores) {
    if (score <= 20) distribution['0-20']++;
    else if (score <= 40) distribution['21-40']++;
    else if (score <= 60) distribution['41-60']++;
    else if (score <= 80) distribution['61-80']++;
    else distribution['81-100']++;
  }
  
  return distribution;
}
```

---

## Scoring Configuration

```yaml
scoring:
  # Score weights
  weights:
    bestValue: 0.5
    confidence: 0.3
    providerTrust: 0.2
  
  # Score thresholds
  thresholds:
    excellent: 90
    good: 80
    average: 70
    below_average: 60
    poor: 0
  
  # Cache settings
  cache:
    enabled: true
    ttl: 300000
    maxSize: 10000
  
  # Normalization
  normalization:
    method: min-max
    min: 0
    max: 100
```
