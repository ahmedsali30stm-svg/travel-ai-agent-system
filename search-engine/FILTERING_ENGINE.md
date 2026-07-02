# Filtering Engine

> Advanced filtering system for travel search results.

---

## Overview

The Filtering Engine applies user-defined and system-defined filters to search results, ensuring only relevant results are returned.

---

## Filter Types

### 1. Price Filter

```typescript
interface PriceFilter {
  // Price range
  min?: number;
  max?: number;
  
  // Currency
  currency: string;
  
  // Include taxes
  includeTaxes: boolean;
  
  // Price type
  priceType: 'total' | 'per_night' | 'per_person';
}

// Price filter implementation
function applyPriceFilter(
  results: SearchResult[],
  filter: PriceFilter
): SearchResult[] {
  return results.filter(result => {
    let price: number;
    
    switch (filter.priceType) {
      case 'total':
        price = result.pricing.normalized.total;
        break;
      case 'per_night':
        price = result.pricing.normalized.perNight;
        break;
      case 'per_person':
        price = result.pricing.normalized.perPerson;
        break;
    }
    
    // Apply tax filter
    if (filter.includeTaxes) {
      price += result.pricing.breakdown.taxes;
    }
    
    // Apply range filter
    if (filter.min !== undefined && price < filter.min) return false;
    if (filter.max !== undefined && price > filter.max) return false;
    
    return true;
  });
}
```

---

### 2. Star Rating Filter

```typescript
interface StarRatingFilter {
  // Star ratings to include
  ratings: number[];
  
  // Minimum rating
  minRating?: number;
  
  // Maximum rating
  maxRating?: number;
}

// Star rating filter implementation
function applyStarRatingFilter(
  results: SearchResult[],
  filter: StarRatingFilter
): SearchResult[] {
  return results.filter(result => {
    const rating = result.rating.score;
    
    // Check if rating is in allowed list
    if (filter.ratings.length > 0 && !filter.ratings.includes(rating)) {
      return false;
    }
    
    // Check minimum rating
    if (filter.minRating !== undefined && rating < filter.minRating) {
      return false;
    }
    
    // Check maximum rating
    if (filter.maxRating !== undefined && rating > filter.maxRating) {
      return false;
    }
    
    return true;
  });
}
```

---

### 3. Amenity Filter

```typescript
interface AmenityFilter {
  // Required amenities (all must be present)
  required: string[];
  
  // Optional amenities (at least one)
  optional: string[];
  
  // Excluded amenities (none should be present)
  excluded: string[];
}

// Amenity filter implementation
function applyAmenityFilter(
  results: SearchResult[],
  filter: AmenityFilter
): SearchResult[] {
  return results.filter(result => {
    const amenities = result.amenities.map(a => a.toLowerCase());
    
    // Check required amenities
    for (const required of filter.required) {
      if (!amenities.includes(required.toLowerCase())) {
        return false;
      }
    }
    
    // Check optional amenities (at least one)
    if (filter.optional.length > 0) {
      const hasOptional = filter.optional.some(optional =>
        amenities.includes(optional.toLowerCase())
      );
      if (!hasOptional) return false;
    }
    
    // Check excluded amenities
    for (const excluded of filter.excluded) {
      if (amenities.includes(excluded.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });
}
```

---

### 4. Location Filter

```typescript
interface LocationFilter {
  // Center coordinates
  center: {
    lat: number;
    lng: number;
  };
  
  // Radius in kilometers
  radius: number;
  
  // Specific areas
  areas?: string[];
  
  // Distance from center
  maxDistance?: number;
}

// Location filter implementation
function applyLocationFilter(
  results: SearchResult[],
  filter: LocationFilter
): SearchResult[] {
  return results.filter(result => {
    // Calculate distance from center
    const distance = calculateDistance(
      result.location.lat,
      result.location.lng,
      filter.center.lat,
      filter.center.lng
    );
    
    // Check radius filter
    if (distance > filter.radius) {
      return false;
    }
    
    // Check max distance filter
    if (filter.maxDistance !== undefined && distance > filter.maxDistance) {
      return false;
    }
    
    // Check area filter
    if (filter.areas && filter.areas.length > 0) {
      const inArea = filter.areas.some(area =>
        result.location.address.toLowerCase().includes(area.toLowerCase())
      );
      if (!inArea) return false;
    }
    
    return true;
  });
}

// Haversine distance calculation
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
```

---

### 5. Property Type Filter

```typescript
interface PropertyTypeFilter {
  // Property types to include
  types: string[];
  
  // Property types to exclude
  excluded: string[];
}

// Property type filter implementation
function applyPropertyTypeFilter(
  results: SearchResult[],
  filter: PropertyTypeFilter
): SearchResult[] {
  return results.filter(result => {
    const propertyType = result.type.toLowerCase();
    
    // Check included types
    if (filter.types.length > 0) {
      const isIncluded = filter.types.some(type =>
        propertyType.includes(type.toLowerCase())
      );
      if (!isIncluded) return false;
    }
    
    // Check excluded types
    if (filter.excluded.length > 0) {
      const isExcluded = filter.excluded.some(type =>
        propertyType.includes(type.toLowerCase())
      );
      if (isExcluded) return false;
    }
    
    return true;
  });
}
```

---

### 6. Meal Plan Filter

```typescript
interface MealPlanFilter {
  // Meal plans to include
  plans: string[];
  
  // Include breakfast
  includeBreakfast: boolean;
  
  // Include all-inclusive
  includeAllInclusive: boolean;
}

// Meal plan filter implementation
function applyMealPlanFilter(
  results: SearchResult[],
  filter: MealPlanFilter
): SearchResult[] {
  return results.filter(result => {
    const mealPlans = result.mealPlans || [];
    
    // Check included plans
    if (filter.plans.length > 0) {
      const hasPlan = filter.plans.some(plan =>
        mealPlans.some(mp => mp.toLowerCase().includes(plan.toLowerCase()))
      );
      if (!hasPlan) return false;
    }
    
    // Check breakfast
    if (filter.includeBreakfast) {
      const hasBreakfast = mealPlans.some(mp =>
        mp.toLowerCase().includes('breakfast')
      );
      if (!hasBreakfast) return false;
    }
    
    // Check all-inclusive
    if (filter.includeAllInclusive) {
      const hasAllInclusive = mealPlans.some(mp =>
        mp.toLowerCase().includes('all inclusive')
      );
      if (!hasAllInclusive) return false;
    }
    
    return true;
  });
}
```

---

### 7. Cancellation Policy Filter

```typescript
interface CancellationFilter {
  // Free cancellation only
  freeCancellation: boolean;
  
  // Cancellation deadline (days before check-in)
  deadline?: number;
  
  // Refundable only
  refundableOnly: boolean;
}

// Cancellation filter implementation
function applyCancellationFilter(
  results: SearchResult[],
  filter: CancellationFilter
): SearchResult[] {
  return results.filter(result => {
    const policy = result.policies?.cancellation;
    
    // Check free cancellation
    if (filter.freeCancellation) {
      if (!policy?.free) return false;
    }
    
    // Check deadline
    if (filter.deadline !== undefined) {
      if (policy?.deadlineDays === undefined) return false;
      if (policy.deadlineDays < filter.deadline) return false;
    }
    
    // Check refundable
    if (filter.refundableOnly) {
      if (!policy?.refundable) return false;
    }
    
    return true;
  });
}
```

---

### 8. Review Score Filter

```typescript
interface ReviewFilter {
  // Minimum review score
  minScore?: number;
  
  // Minimum review count
  minReviews?: number;
  
  // Review sources
  sources?: string[];
}

// Review filter implementation
function applyReviewFilter(
  results: SearchResult[],
  filter: ReviewFilter
): SearchResult[] {
  return results.filter(result => {
    const rating = result.rating;
    
    // Check minimum score
    if (filter.minScore !== undefined) {
      if (rating.normalized < filter.minScore) return false;
    }
    
    // Check minimum reviews
    if (filter.minReviews !== undefined) {
      if (rating.reviews < filter.minReviews) return false;
    }
    
    // Check review sources
    if (filter.sources && filter.sources.length > 0) {
      const hasSource = filter.sources.some(source =>
        rating.source.toLowerCase().includes(source.toLowerCase())
      );
      if (!hasSource) return false;
    }
    
    return true;
  });
}
```

---

### 9. Availability Filter

```typescript
interface AvailabilityFilter {
  // Available only
  availableOnly: boolean;
  
  // Rooms left threshold
  roomsLeft?: number;
  
  // Last minute availability
  lastMinute?: boolean;
}

// Availability filter implementation
function applyAvailabilityFilter(
  results: SearchResult[],
  filter: AvailabilityFilter
): SearchResult[] {
  return results.filter(result => {
    const availability = result.availability;
    
    // Check available only
    if (filter.availableOnly) {
      if (!availability.available) return false;
    }
    
    // Check rooms left
    if (filter.roomsLeft !== undefined) {
      if (availability.roomsLeft === undefined) return false;
      if (availability.roomsLeft < filter.roomsLeft) return false;
    }
    
    // Check last minute
    if (filter.lastMinute) {
      const lastChecked = Date.now() - availability.lastChecked;
      if (lastChecked > 300000) return false; // 5 minutes
    }
    
    return true;
  });
}
```

---

### 10. Provider Filter

```typescript
interface ProviderFilter {
  // Include only these providers
  include?: string[];
  
  // Exclude these providers
  exclude?: string[];
  
  // Trusted providers only
  trustedOnly: boolean;
  
  // Minimum trust score
  minTrustScore?: number;
}

// Provider filter implementation
function applyProviderFilter(
  results: SearchResult[],
  filter: ProviderFilter
): SearchResult[] {
  return results.filter(result => {
    // Check included providers
    if (filter.include && filter.include.length > 0) {
      if (!filter.include.includes(result.provider)) return false;
    }
    
    // Check excluded providers
    if (filter.exclude && filter.exclude.length > 0) {
      if (filter.exclude.includes(result.provider)) return false;
    }
    
    // Check trusted only
    if (filter.trustedOnly) {
      const provider = getProviderConfig(result.provider);
      if (!provider || !provider.trusted) return false;
    }
    
    // Check minimum trust score
    if (filter.minTrustScore !== undefined) {
      const provider = getProviderConfig(result.provider);
      if (!provider || provider.trustScore < filter.minTrustScore) {
        return false;
      }
    }
    
    return true;
  });
}
```

---

## Filter Pipeline

```typescript
interface FilterPipeline {
  // Add filter to pipeline
  addFilter(filter: Filter): FilterPipeline;
  
  // Remove filter from pipeline
  removeFilter(filterId: string): FilterPipeline;
  
  // Apply all filters
  apply(results: SearchResult[]): SearchResult[];
  
  // Get filter statistics
  getStats(): FilterStats;
}

// Filter pipeline implementation
class FilterPipelineImpl implements FilterPipeline {
  private filters: Filter[] = [];
  private stats: FilterStats = {
    totalFilters: 0,
    totalRemoved: 0,
    filterCounts: {},
  };
  
  addFilter(filter: Filter): FilterPipeline {
    this.filters.push(filter);
    this.stats.totalFilters++;
    return this;
  }
  
  removeFilter(filterId: string): FilterPipeline {
    this.filters = this.filters.filter(f => f.id !== filterId);
    this.stats.totalFilters--;
    return this;
  }
  
  apply(results: SearchResult[]): SearchResult[] {
    let filtered = [...results];
    const initialCount = filtered.length;
    
    for (const filter of this.filters) {
      const beforeCount = filtered.length;
      filtered = this.applyFilter(filtered, filter);
      const removed = beforeCount - filtered.length;
      
      this.stats.filterCounts[filter.id] = removed;
      this.stats.totalRemoved += removed;
    }
    
    return filtered;
  }
  
  private applyFilter(
    results: SearchResult[],
    filter: Filter
  ): SearchResult[] {
    switch (filter.type) {
      case 'price':
        return applyPriceFilter(results, filter as PriceFilter);
      case 'starRating':
        return applyStarRatingFilter(results, filter as StarRatingFilter);
      case 'amenity':
        return applyAmenityFilter(results, filter as AmenityFilter);
      case 'location':
        return applyLocationFilter(results, filter as LocationFilter);
      case 'propertyType':
        return applyPropertyTypeFilter(results, filter as PropertyTypeFilter);
      case 'mealPlan':
        return applyMealPlanFilter(results, filter as MealPlanFilter);
      case 'cancellation':
        return applyCancellationFilter(results, filter as CancellationFilter);
      case 'review':
        return applyReviewFilter(results, filter as ReviewFilter);
      case 'availability':
        return applyAvailabilityFilter(results, filter as AvailabilityFilter);
      case 'provider':
        return applyProviderFilter(results, filter as ProviderFilter);
      default:
        return results;
    }
  }
  
  getStats(): FilterStats {
    return this.stats;
  }
}
```

---

## Filter Configuration

```yaml
filtering:
  # Default filters
  defaults:
    availability:
      availableOnly: true
    provider:
      trustedOnly: false
    review:
      minScore: 3.0
      minReviews: 5
  
  # Filter presets
  presets:
    budget:
      price:
        max: 100
      starRating:
        ratings: [2, 3]
      amenities:
        required: ['wifi']
    
    luxury:
      starRating:
        minRating: 4
      amenities:
        required: ['pool', 'spa', 'gym']
    
    family:
      amenities:
        required: ['pool', 'wifi']
        excluded: ['bar']
      propertyType:
        types: ['hotel', 'resort', 'apartment']
    
    business:
      amenities:
        required: ['wifi', 'gym', 'business_center']
      location:
        maxDistance: 5
  
  # Maximum filters
  limits:
    maxFilters: 20
    maxFilterValues: 100
```
