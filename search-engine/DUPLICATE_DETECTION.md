# Duplicate Detection

> Advanced system for detecting and merging duplicate travel results.

---

## Overview

The Duplicate Detection module identifies and merges duplicate results from multiple providers, ensuring users see unique options without redundancy.

---

## Detection Methods

### 1. Exact Match Detection

```typescript
interface ExactMatchDetector {
  // Detect exact matches
  detect(results: SearchResult[]): DuplicateGroup[];
  
  // Compare two results for exact match
  isExactMatch(result1: SearchResult, result2: SearchResult): boolean;
}

// Exact match detection
function detectExactMatches(results: SearchResult[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();
  
  for (let i = 0; i < results.length; i++) {
    if (processed.has(results[i].id)) continue;
    
    const group: DuplicateGroup = {
      id: generateId(),
      results: [results[i]],
      confidence: 1.0,
      matchType: 'exact',
    };
    
    for (let j = i + 1; j < results.length; j++) {
      if (processed.has(results[j].id)) continue;
      
      if (isExactMatch(results[i], results[j])) {
        group.results.push(results[j]);
        processed.add(results[j].id);
      }
    }
    
    if (group.results.length > 1) {
      groups.push(group);
      processed.add(results[i].id);
    }
  }
  
  return groups;
}

// Exact match comparison
function isExactMatch(
  result1: SearchResult,
  result2: SearchResult
): boolean {
  // Check name similarity
  const nameSimilarity = calculateStringSimilarity(
    result1.name.toLowerCase(),
    result2.name.toLowerCase()
  );
  
  if (nameSimilarity < 0.95) return false;
  
  // Check location similarity
  const locationSimilarity = calculateLocationSimilarity(
    result1.location,
    result2.location
  );
  
  if (locationSimilarity < 0.95) return false;
  
  // Check price similarity
  const priceSimilarity = calculatePriceSimilarity(
    result1.pricing.normalized.amount,
    result2.pricing.normalized.amount
  );
  
  if (priceSimilarity < 0.95) return false;
  
  return true;
}
```

---

### 2. Fuzzy Match Detection

```typescript
interface FuzzyMatchDetector {
  // Detect fuzzy matches
  detect(results: SearchResult[], threshold: number): DuplicateGroup[];
  
  // Calculate match score
  calculateMatchScore(
    result1: SearchResult,
    result2: SearchResult
  ): number;
}

// Fuzzy match detection
function detectFuzzyMatches(
  results: SearchResult[],
  threshold: number = 0.8
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();
  
  for (let i = 0; i < results.length; i++) {
    if (processed.has(results[i].id)) continue;
    
    const group: DuplicateGroup = {
      id: generateId(),
      results: [results[i]],
      confidence: 0,
      matchType: 'fuzzy',
    };
    
    for (let j = i + 1; j < results.length; j++) {
      if (processed.has(results[j].id)) continue;
      
      const matchScore = calculateMatchScore(results[i], results[j]);
      
      if (matchScore >= threshold) {
        group.results.push(results[j]);
        processed.add(results[j].id);
        group.confidence = Math.max(group.confidence, matchScore);
      }
    }
    
    if (group.results.length > 1) {
      groups.push(group);
      processed.add(results[i].id);
    }
  }
  
  return groups;
}

// Calculate match score
function calculateMatchScore(
  result1: SearchResult,
  result2: SearchResult
): number {
  // Name similarity (weight: 0.4)
  const nameSimilarity = calculateStringSimilarity(
    result1.name.toLowerCase(),
    result2.name.toLowerCase()
  );
  
  // Location similarity (weight: 0.3)
  const locationSimilarity = calculateLocationSimilarity(
    result1.location,
    result2.location
  );
  
  // Price similarity (weight: 0.2)
  const priceSimilarity = calculatePriceSimilarity(
    result1.pricing.normalized.amount,
    result2.pricing.normalized.amount
  );
  
  // Amenities similarity (weight: 0.1)
  const amenitiesSimilarity = calculateAmenitiesSimilarity(
    result1.amenities,
    result2.amenities
  );
  
  // Weighted average
  const matchScore = (
    nameSimilarity * 0.4 +
    locationSimilarity * 0.3 +
    priceSimilarity * 0.2 +
    amenitiesSimilarity * 0.1
  );
  
  return matchScore;
}

// String similarity (Levenshtein distance)
function calculateStringSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [];
    for (let j = 0; j <= len2; j++) {
      if (i === 0) {
        matrix[i][j] = j;
      } else if (j === 0) {
        matrix[i][j] = i;
      } else {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  
  return 1 - distance / maxLen;
}
```

---

### 3. Semantic Match Detection

```typescript
interface SemanticMatchDetector {
  // Detect semantic matches
  detect(results: SearchResult[]): DuplicateGroup[];
  
  // Calculate semantic similarity
  calculateSemanticSimilarity(
    result1: SearchResult,
    result2: SearchResult
  ): number;
}

// Semantic match detection
function detectSemanticMatches(
  results: SearchResult[]
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();
  
  for (let i = 0; i < results.length; i++) {
    if (processed.has(results[i].id)) continue;
    
    const group: DuplicateGroup = {
      id: generateId(),
      results: [results[i]],
      confidence: 0,
      matchType: 'semantic',
    };
    
    for (let j = i + 1; j < results.length; j++) {
      if (processed.has(results[j].id)) continue;
      
      const semanticSimilarity = calculateSemanticSimilarity(
        results[i],
        results[j]
      );
      
      if (semanticSimilarity >= 0.85) {
        group.results.push(results[j]);
        processed.add(results[j].id);
        group.confidence = Math.max(group.confidence, semanticSimilarity);
      }
    }
    
    if (group.results.length > 1) {
      groups.push(group);
      processed.add(results[i].id);
    }
  }
  
  return groups;
}

// Calculate semantic similarity
function calculateSemanticSimilarity(
  result1: SearchResult,
  result2: SearchResult
): number {
  // Extract features
  const features1 = extractFeatures(result1);
  const features2 = extractFeatures(result2);
  
  // Calculate cosine similarity
  const cosineSimilarity = calculateCosineSimilarity(features1, features2);
  
  return cosineSimilarity;
}

// Extract features from result
function extractFeatures(result: SearchResult): FeatureVector {
  return {
    name: extractNameFeatures(result.name),
    location: extractLocationFeatures(result.location),
    amenities: extractAmenityFeatures(result.amenities),
    price: extractPriceFeatures(result.pricing),
    rating: extractRatingFeatures(result.rating),
  };
}
```

---

## Duplicate Merging

```typescript
interface DuplicateMerger {
  // Merge duplicate groups
  merge(groups: DuplicateGroup[]): MergedResult[];
  
  // Merge two results
  mergeResults(
    result1: SearchResult,
    result2: SearchResult
  ): SearchResult;
  
  // Select best result from group
  selectBest(results: SearchResult[]): SearchResult;
}

// Merge duplicate groups
function mergeDuplicateGroups(groups: DuplicateGroup[]): MergedResult[] {
  return groups.map(group => {
    // Select best result as base
    const base = selectBestResult(group.results);
    
    // Merge all results
    const merged = mergeAllResults(base, group.results);
    
    // Calculate merged confidence
    const confidence = calculateMergedConfidence(group.results);
    
    return {
      id: merged.id,
      result: merged,
      providers: group.results.map(r => r.provider),
      confidence,
      duplicateCount: group.results.length - 1,
    };
  });
}

// Select best result
function selectBestResult(results: SearchResult[]): SearchResult {
  // Score each result
  const scored = results.map(result => ({
    result,
    score: calculateResultScore(result),
  }));
  
  // Sort by score
  scored.sort((a, b) => b.score - a.score);
  
  return scored[0].result;
}

// Calculate result score
function calculateResultScore(result: SearchResult): number {
  let score = 0;
  
  // Data completeness
  score += calculateDataCompleteness(result) * 30;
  
  // Image availability
  score += Math.min(100, result.images.length * 10) * 20;
  
  // Rating
  score += result.rating.normalized * 10 * 20;
  
  // Review count
  score += Math.min(100, result.rating.reviews / 10) * 15;
  
  // Price competitiveness
  score += calculatePriceCompetitiveness(result) * 15;
  
  return score;
}

// Merge all results
function mergeAllResults(
  base: SearchResult,
  duplicates: SearchResult[]
): SearchResult {
  const merged = { ...base };
  
  // Merge images
  merged.images = mergeImages(base.images, duplicates);
  
  // Merge amenities
  merged.amenities = mergeAmenities(base.amenities, duplicates);
  
  // Merge policies
  merged.policies = mergePolicies(base.policies, duplicates);
  
  // Merge pricing (use best price)
  merged.pricing = mergePricing(base.pricing, duplicates);
  
  // Merge ratings (use highest review count)
  merged.rating = mergeRatings(base.rating, duplicates);
  
  return merged;
}

// Merge images
function mergeImages(
  baseImages: ImageInfo[],
  duplicates: SearchResult[]
): ImageInfo[] {
  const allImages = [...baseImages];
  
  for (const duplicate of duplicates) {
    for (const image of duplicate.images) {
      if (!allImages.some(img => img.url === image.url)) {
        allImages.push(image);
      }
    }
  }
  
  return allImages;
}

// Merge amenities
function mergeAmenities(
  baseAmenities: string[],
  duplicates: SearchResult[]
): string[] {
  const allAmenities = new Set(baseAmenities);
  
  for (const duplicate of duplicates) {
    for (const amenity of duplicate.amenities) {
      allAmenities.add(amenity);
    }
  }
  
  return Array.from(allAmenities);
}
```

---

## Duplicate Detection Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DUPLICATE DETECTION PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         INPUT LAYER                                         │ │
│  │                                                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                       │ │
│  │  │   Raw       │  │   Provider  │  │   Quality   │                       │ │
│  │  │   Results   │  │   Metadata  │  │   Scores    │                       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                       │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      DETECTION LAYER                                       │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Exact    │ │  Fuzzy    │ │  Semantic │ │  Location │                │ │
│  │  │  Match    │ │  Match    │ │  Match    │ │  Match    │                │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      MERGING LAYER                                         │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Select   │ │  Merge    │ │  Resolve  │ │  Validate │                │ │
│  │  │  Best     │ │  Data     │ │  Conflicts│ │  Result   │                │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      OUTPUT LAYER                                          │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Merged Results                                                     │  │ │
│  │  │                                                                      │  │ │
│  │  │  Hotel A (Booking.com, Agoda, Expedia)                              │  │ │
│  │  │     → 3 duplicates merged, 15 images, 250 reviews                  │  │ │
│  │  │                                                                      │  │ │
│  │  │  Hotel B (Hotels.com, Trip.com)                                     │  │ │
│  │  │     → 2 duplicates merged, 8 images, 120 reviews                   │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Duplicate Detection Configuration

```yaml
duplicateDetection:
  # Enable duplicate detection
  enabled: true
  
  # Detection thresholds
  thresholds:
    exact: 0.95
    fuzzy: 0.8
    semantic: 0.85
    location: 0.9
  
  # Matching weights
  weights:
    name: 0.4
    location: 0.3
    price: 0.2
    amenities: 0.1
  
  # Merge settings
  merge:
    selectBest: true
    mergeImages: true
    mergeAmenities: true
    mergePolicies: true
    useLowestPrice: true
    useHighestRating: true
  
  # Performance settings
  performance:
    maxComparisons: 10000
    parallelProcessing: true
    cacheResults: true
    cacheTtl: 300000 # 5 minutes
```
