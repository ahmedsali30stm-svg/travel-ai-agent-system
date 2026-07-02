# Normalization Layer

> Comprehensive data normalization for travel search results.

---

## Overview

The Normalization Layer standardizes data from multiple providers into a consistent format, ensuring accurate comparison and analysis.

---

## Normalization Components

### 1. Price Normalization

```typescript
interface PriceNormalizer {
  // Normalize price to common format
  normalize(price: PriceInfo): NormalizedPrice;
  
  // Normalize with tax inclusion
  normalizeWithTax(
    price: PriceInfo,
    includeTax: boolean
  ): NormalizedPrice;
  
  // Normalize per night
  normalizePerNight(
    price: PriceInfo,
    nights: number
  ): NormalizedPrice;
}

interface NormalizedPrice {
  // Original price
  original: {
    amount: number;
    currency: string;
  };
  
  // Normalized price
  normalized: {
    amount: number;
    currency: string;
    perNight: number;
    perPerson: number;
    total: number;
  };
  
  // Tax breakdown
  taxes: {
    included: boolean;
    amount: number;
    breakdown: TaxBreakdown;
  };
  
  // Fee breakdown
  fees: {
    amount: number;
    breakdown: FeeBreakdown;
  };
}

// Price normalization
function normalizePrice(
  price: PriceInfo,
  options: PriceNormalizationOptions
): NormalizedPrice {
  // Extract original price
  const original = {
    amount: price.amount,
    currency: price.currency,
  };
  
  // Calculate taxes
  const taxes = calculateTaxes(price, options);
  
  // Calculate fees
  const fees = calculateFees(price, options);
  
  // Calculate total
  const total = price.amount + taxes.amount + fees.amount;
  
  // Calculate per night
  const nights = options.nights || 1;
  const perNight = total / nights;
  
  // Calculate per person
  const guests = options.guests || 1;
  const perPerson = total / guests;
  
  return {
    original,
    normalized: {
      amount: total,
      currency: price.currency,
      perNight,
      perPerson,
      total,
    },
    taxes: {
      included: price.taxesIncluded,
      amount: taxes.amount,
      breakdown: taxes.breakdown,
    },
    fees: {
      amount: fees.amount,
      breakdown: fees.breakdown,
    },
  };
}

// Calculate taxes
function calculateTaxes(
  price: PriceInfo,
  options: PriceNormalizationOptions
): TaxInfo {
  if (price.taxesIncluded) {
    return {
      amount: 0,
      breakdown: {},
    };
  }
  
  const taxRate = getTaxRate(options.destination, options.taxType);
  const taxAmount = price.amount * taxRate;
  
  return {
    amount: taxAmount,
    breakdown: {
      [options.taxType || 'vat']: taxAmount,
    },
  };
}
```

---

### 2. Currency Normalization

```typescript
interface CurrencyNormalizer {
  // Normalize to target currency
  normalize(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): CurrencyNormalized;
  
  // Get exchange rate
  getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): ExchangeRate;
  
  // Batch normalize
  batchNormalize(
    amounts: CurrencyAmount[],
    toCurrency: string
  ): CurrencyNormalized[];
}

interface CurrencyNormalized {
  // Original amount
  original: {
    amount: number;
    currency: string;
  };
  
  // Normalized amount
  normalized: {
    amount: number;
    currency: string;
  };
  
  // Exchange rate info
  exchangeRate: {
    rate: number;
    timestamp: number;
    source: string;
  };
}

// Currency normalization
function normalizeCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  options: CurrencyNormalizationOptions
): CurrencyNormalized {
  // Get exchange rate
  const exchangeRate = getExchangeRate(fromCurrency, toCurrency);
  
  // Convert amount
  const normalizedAmount = amount * exchangeRate.rate;
  
  return {
    original: {
      amount,
      currency: fromCurrency,
    },
    normalized: {
      amount: normalizedAmount,
      currency: toCurrency,
    },
    exchangeRate: {
      rate: exchangeRate.rate,
      timestamp: exchangeRate.timestamp,
      source: exchangeRate.source,
    },
  };
}

// Get exchange rate
function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): ExchangeRate {
  // Check cache first
  const cached = getCachedExchangeRate(fromCurrency, toCurrency);
  if (cached) {
    return cached;
  }
  
  // Fetch from API
  const rate = fetchExchangeRate(fromCurrency, toCurrency);
  
  // Cache the result
  cacheExchangeRate(fromCurrency, toCurrency, rate);
  
  return rate;
}

// Fetch exchange rate from API
async function fetchExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<ExchangeRate> {
  const response = await fetch(
    `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
  );
  
  const data = await response.json();
  
  return {
    rate: data.rates[toCurrency],
    timestamp: Date.now(),
    source: 'exchangerate-api',
  };
}
```

---

### 3. Rating Normalization

```typescript
interface RatingNormalizer {
  // Normalize rating to 0-10 scale
  normalize(rating: RatingInfo): NormalizedRating;
  
  // Normalize with review count weighting
  normalizeWeighted(
    rating: RatingInfo,
    reviewCount: number
  ): NormalizedRating;
  
  // Calculate weighted average
  calculateWeightedAverage(
    ratings: RatingInfo[]
  ): number;
}

interface NormalizedRating {
  // Original rating
  original: {
    score: number;
    maxScore: number;
    reviews: number;
  };
  
  // Normalized rating (0-10)
  normalized: {
    score: number;
    confidence: number;
  };
  
  // Rating breakdown
  breakdown: {
    overall: number;
    cleanliness: number;
    location: number;
    service: number;
    value: number;
  };
}

// Rating normalization
function normalizeRating(rating: RatingInfo): NormalizedRating {
  // Normalize to 0-10 scale
  const normalizedScore = (rating.score / rating.maxScore) * 10;
  
  // Calculate confidence based on review count
  const confidence = calculateRatingConfidence(rating.reviews);
  
  return {
    original: {
      score: rating.score,
      maxScore: rating.maxScore,
      reviews: rating.reviews,
    },
    normalized: {
      score: normalizedScore,
      confidence,
    },
    breakdown: {
      overall: normalizedScore,
      cleanliness: rating.breakdown?.cleanliness || normalizedScore,
      location: rating.breakdown?.location || normalizedScore,
      service: rating.breakdown?.service || normalizedScore,
      value: rating.breakdown?.value || normalizedScore,
    },
  };
}

// Calculate rating confidence
function calculateRatingConfidence(reviewCount: number): number {
  // Bayesian average confidence
  const minReviews = 10;
  const avgReviews = 100;
  
  if (reviewCount >= avgReviews) return 1;
  if (reviewCount < minReviews) return 0.3;
  
  return 0.3 + (0.7 * (reviewCount - minReviews)) / (avgReviews - minReviews);
}
```

---

### 4. Tax Normalization

```typescript
interface TaxNormalizer {
  // Normalize tax information
  normalize(
    price: PriceInfo,
    destination: string,
    taxType: string
  ): TaxNormalized;
  
  // Calculate tax amount
  calculateTax(
    amount: number,
    taxRate: number
  ): number;
  
  // Get applicable taxes
  getApplicableTaxes(
    destination: string,
    productType: string
  ): TaxRule[];
}

interface TaxNormalized {
  // Base price
  basePrice: number;
  
  // Tax information
  taxes: {
    total: number;
    included: boolean;
    breakdown: TaxBreakdown[];
  };
  
  // Final price
  finalPrice: number;
}

// Tax normalization
function normalizeTax(
  price: PriceInfo,
  destination: string,
  taxType: string
): TaxNormalized {
  // Get applicable tax rules
  const taxRules = getApplicableTaxes(destination, 'hotel');
  
  // Calculate total tax
  let totalTax = 0;
  const breakdown: TaxBreakdown[] = [];
  
  for (const rule of taxRules) {
    if (taxType && rule.type !== taxType) continue;
    
    const taxAmount = price.amount * rule.rate;
    totalTax += taxAmount;
    
    breakdown.push({
      type: rule.type,
      rate: rule.rate,
      amount: taxAmount,
      included: false,
    });
  }
  
  // Calculate final price
  const finalPrice = price.amount + totalTax;
  
  return {
    basePrice: price.amount,
    taxes: {
      total: totalTax,
      included: false,
      breakdown,
    },
    finalPrice,
  };
}

// Get applicable taxes
function getApplicableTaxes(
  destination: string,
  productType: string
): TaxRule[] {
  const rules: TaxRule[] = [];
  
  // VAT rules
  const vatRate = getVatRate(destination);
  if (vatRate > 0) {
    rules.push({
      type: 'vat',
      rate: vatRate,
      name: 'VAT',
    });
  }
  
  // Tourism tax rules
  const tourismTax = getTourismTax(destination);
  if (tourismTax > 0) {
    rules.push({
      type: 'tourism_tax',
      rate: tourismTax,
      name: 'Tourism Tax',
    });
  }
  
  // Service tax rules
  const serviceTax = getServiceTax(destination);
  if (serviceTax > 0) {
    rules.push({
      type: 'service_tax',
      rate: serviceTax,
      name: 'Service Tax',
    });
  }
  
  return rules;
}
```

---

### 5. Image Verification

```typescript
interface ImageVerifier {
  // Verify image exists and is accessible
  verify(imageUrl: string): ImageVerification;
  
  // Batch verify images
  batchVerify(imageUrls: string[]): ImageVerification[];
  
  // Get image metadata
  getMetadata(imageUrl: string): ImageMetadata;
}

interface ImageVerification {
  // Image URL
  url: string;
  
  // Verification result
  valid: boolean;
  
  // Image metadata
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
  
  // Error info
  error?: string;
}

// Image verification
function verifyImage(imageUrl: string): ImageVerification {
  try {
    // Check if image is accessible
    const response = await fetch(imageUrl, { method: 'HEAD' });
    
    if (!response.ok) {
      return {
        url: imageUrl,
        valid: false,
        error: `HTTP ${response.status}`,
      };
    }
    
    // Get content type
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return {
        url: imageUrl,
        valid: false,
        error: 'Not an image',
      };
    }
    
    // Get image metadata
    const metadata = getImageMetadata(imageUrl);
    
    return {
      url: imageUrl,
      valid: true,
      metadata,
    };
  } catch (error) {
    return {
      url: imageUrl,
      valid: false,
      error: error.message,
    };
  }
}
```

---

## Normalization Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      NORMALIZATION PIPELINE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         INPUT LAYER                                         │ │
│  │                                                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │   Raw       │  │   Provider  │  │   User      │  │   Market    │     │ │
│  │  │   Data      │  │   Config    │  │   Preferences│  │   Data      │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      NORMALIZATION LAYER                                   │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Price    │ │  Currency │ │  Rating   │ │  Tax      │ │  Image    │  │ │
│  │  │  Normalize│ │  Normalize│ │  Normalize│ │  Normalize│ │  Verify   │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      VALIDATION LAYER                                      │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │ │
│  │  │  Data     │ │  Schema   │ │  Business │ │  Quality  │                │ │
│  │  │  Validate │ │  Validate │ │  Rules    │ │  Check    │                │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      OUTPUT LAYER                                          │ │
│  │                                                                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Normalized Results                                                 │  │ │
│  │  │                                                                      │  │ │
│  │  │  All prices in USD                                                  │  │ │
│  │  │  All ratings on 0-10 scale                                          │  │ │
│  │  │  All taxes calculated                                               │  │ │
│  │  │  All images verified                                                │  │ │
│  │  │                                                                      │  │ │
│  │  │  Ready for comparison and ranking                                   │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Normalization Configuration

```yaml
normalization:
  # Enable normalization
  enabled: true
  
  # Price normalization
  price:
    defaultCurrency: USD
    includeTaxes: true
    normalizePerNight: true
    normalizePerPerson: false
  
  # Currency normalization
  currency:
    primaryCurrency: USD
    supportedCurrencies:
      - USD
      - EUR
      - GBP
      - JPY
      - AUD
      - CAD
    exchangeRateSource: exchangerate-api
    cacheTtl: 3600000 # 1 hour
  
  # Rating normalization
  rating:
    targetScale: 10
    minReviews: 5
    confidenceThreshold: 0.6
  
  # Tax normalization
  tax:
    defaultTaxType: vat
    includeServiceTax: true
    includeTourismTax: true
  
  # Image verification
  image:
    enabled: true
    timeout: 5000
    maxRetries: 3
    allowedFormats:
      - jpg
      - jpeg
      - png
      - webp
```
