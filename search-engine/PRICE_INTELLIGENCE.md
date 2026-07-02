# Price Intelligence

> Advanced price analysis and comparison system.

---

## Overview

The Price Intelligence module provides comprehensive price analysis, comparison, and prediction capabilities for travel products.

---

## Price Analysis Components

### 1. Price Comparison

```typescript
interface PriceComparison {
  // Compare prices across providers
  compare(
    resultId: string,
    providers: string[]
  ): PriceComparisonResult;
  
  // Get price history
  getHistory(
    resultId: string,
    days: number
  ): PriceHistory[];
  
  // Get price trends
  getTrends(
    resultId: string,
    days: number
  ): PriceTrend;
}

interface PriceComparisonResult {
  // Result ID
  resultId: string;
  
  // Prices by provider
  prices: ProviderPrice[];
  
  // Price statistics
  statistics: {
    lowest: number;
    highest: number;
    average: number;
    median: number;
    standardDeviation: number;
  };
  
  // Best deal
  bestDeal: {
    provider: string;
    price: number;
    savings: number;
    savingsPercentage: number;
  };
  
  // Price confidence
  confidence: number;
}

interface ProviderPrice {
  provider: string;
  price: number;
  currency: string;
  taxes: number;
  fees: number;
  total: number;
  lastUpdated: number;
  confidence: number;
}

// Compare prices across providers
function comparePrices(
  resultId: string,
  providers: string[]
): PriceComparisonResult {
  const prices: ProviderPrice[] = [];
  
  for (const provider of providers) {
    const price = getPriceFromProvider(resultId, provider);
    if (price) {
      prices.push(price);
    }
  }
  
  if (prices.length === 0) {
    return null;
  }
  
  const totalPrices = prices.map(p => p.total);
  
  // Calculate statistics
  const statistics = {
    lowest: Math.min(...totalPrices),
    highest: Math.max(...totalPrices),
    average: calculateAverage(totalPrices),
    median: calculateMedian(totalPrices),
    standardDeviation: calculateStandardDeviation(totalPrices),
  };
  
  // Find best deal
  const bestDeal = findBestDeal(prices, statistics);
  
  // Calculate confidence
  const confidence = calculatePriceConfidence(prices);
  
  return {
    resultId,
    prices,
    statistics,
    bestDeal,
    confidence,
  };
}
```

---

### 2. Price History

```typescript
interface PriceHistory {
  // Date
  date: string;
  
  // Price
  price: number;
  
  // Currency
  currency: string;
  
  // Provider
  provider: string;
  
  // Additional info
  metadata: {
    demand: 'high' | 'medium' | 'low';
    availability: number;
    season: string;
  };
}

// Get price history
function getPriceHistory(
  resultId: string,
  days: number
): PriceHistory[] {
  const history: PriceHistory[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Query database
  const records = queryPriceHistory(resultId, startDate, endDate);
  
  // Transform to PriceHistory format
  for (const record of records) {
    history.push({
      date: record.date,
      price: record.price,
      currency: record.currency,
      provider: record.provider,
      metadata: {
        demand: record.demand,
        availability: record.availability,
        season: record.season,
      },
    });
  }
  
  return history;
}
```

---

### 3. Price Trends

```typescript
interface PriceTrend {
  // Overall trend
  direction: 'up' | 'down' | 'stable';
  
  // Trend strength
  strength: number; // 0-1
  
  // Trend duration
  duration: number; // days
  
  // Price change
  change: {
    absolute: number;
    percentage: number;
  };
  
  // Prediction
  prediction: {
    nextDay: number;
    nextWeek: number;
    nextMonth: number;
    confidence: number;
  };
}

// Calculate price trends
function calculatePriceTrends(
  resultId: string,
  days: number
): PriceTrend {
  const history = getPriceHistory(resultId, days);
  
  if (history.length < 7) {
    return null;
  }
  
  // Extract prices
  const prices = history.map(h => h.price);
  
  // Calculate trend direction
  const direction = calculateTrendDirection(prices);
  
  // Calculate trend strength
  const strength = calculateTrendStrength(prices);
  
  // Calculate trend duration
  const duration = calculateTrendDuration(prices);
  
  // Calculate price change
  const change = calculatePriceChange(prices);
  
  // Predict future prices
  const prediction = predictFuturePrices(prices);
  
  return {
    direction,
    strength,
    duration,
    change,
    prediction,
  };
}

// Calculate trend direction
function calculateTrendDirection(prices: number[]): 'up' | 'down' | 'stable' {
  const recentPrices = prices.slice(-7);
  const olderPrices = prices.slice(-14, -7);
  
  const recentAvg = calculateAverage(recentPrices);
  const olderAvg = calculateAverage(olderPrices);
  
  const change = (recentAvg - olderAvg) / olderAvg;
  
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'stable';
}

// Calculate trend strength
function calculateTrendStrength(prices: number[]): number {
  const linearRegression = calculateLinearRegression(prices);
  const rSquared = linearRegression.rSquared;
  
  return rSquared;
}

// Predict future prices
function predictFuturePrices(prices: number[]): {
  nextDay: number;
  nextWeek: number;
  nextMonth: number;
  confidence: number;
} {
  const linearRegression = calculateLinearRegression(prices);
  const slope = linearRegression.slope;
  const intercept = linearRegression.intercept;
  
  const lastPrice = prices[prices.length - 1];
  const lastIndex = prices.length - 1;
  
  // Predict
  const nextDay = intercept + slope * (lastIndex + 1);
  const nextWeek = intercept + slope * (lastIndex + 7);
  const nextMonth = intercept + slope * (lastIndex + 30);
  
  // Calculate confidence
  const confidence = linearRegression.rSquared;
  
  return {
    nextDay,
    nextWeek,
    nextMonth,
    confidence,
  };
}
```

---

### 4. Price Alerts

```typescript
interface PriceAlert {
  // Alert ID
  id: string;
  
  // User ID
  userId: string;
  
  // Result ID
  resultId: string;
  
  // Alert type
  type: 'price_drop' | 'price_increase' | 'below_target' | 'back_in_stock';
  
  // Target price
  targetPrice?: number;
  
  // Threshold
  threshold?: number; // percentage
  
  // Status
  status: 'active' | 'triggered' | 'expired';
  
  // Created at
  createdAt: number;
  
  // Expires at
  expiresAt: number;
}

// Create price alert
function createPriceAlert(
  userId: string,
  resultId: string,
  type: PriceAlert['type'],
  targetPrice?: number,
  threshold?: number
): PriceAlert {
  const alert: PriceAlert = {
    id: generateId(),
    userId,
    resultId,
    type,
    targetPrice,
    threshold,
    status: 'active',
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  
  savePriceAlert(alert);
  return alert;
}

// Check price alerts
function checkPriceAlerts(resultId: string, currentPrice: number): PriceAlert[] {
  const alerts = getActiveAlerts(resultId);
  const triggered: PriceAlert[] = [];
  
  for (const alert of alerts) {
    if (shouldTriggerAlert(alert, currentPrice)) {
      triggered.push(alert);
      triggerAlert(alert, currentPrice);
    }
  }
  
  return triggered;
}

// Should trigger alert
function shouldTriggerAlert(alert: PriceAlert, currentPrice: number): boolean {
  switch (alert.type) {
    case 'price_drop':
      return currentPrice < alert.targetPrice;
    case 'price_increase':
      return currentPrice > alert.targetPrice;
    case 'below_target':
      return currentPrice < alert.targetPrice;
    case 'back_in_stock':
      return checkAvailability(alert.resultId);
    default:
      return false;
  }
}
```

---

## Price Normalization

```typescript
interface PriceNormalizer {
  // Normalize prices to common currency
  normalizeCurrency(
    prices: Price[],
    targetCurrency: string
  ): NormalizedPrice[];
  
  // Normalize prices to per-night basis
  normalizePerNight(
    prices: Price[],
    nights: number
  ): NormalizedPrice[];
  
  // Normalize prices to per-person basis
  normalizePerPerson(
    prices: Price[],
    guests: number
  ): NormalizedPrice[];
  
  // Normalize prices including taxes
  normalizeIncludingTaxes(
    prices: Price[]
  ): NormalizedPrice[];
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
    basis: 'total' | 'per_night' | 'per_person';
    taxesIncluded: boolean;
  };
  
  // Conversion info
  conversion: {
    rate: number;
    timestamp: number;
    source: string;
  };
}

// Normalize currency
function normalizeCurrency(
  prices: Price[],
  targetCurrency: string
): NormalizedPrice[] {
  return prices.map(price => {
    const rate = getExchangeRate(price.currency, targetCurrency);
    const normalizedAmount = price.amount * rate;
    
    return {
      original: {
        amount: price.amount,
        currency: price.currency,
      },
      normalized: {
        amount: normalizedAmount,
        currency: targetCurrency,
        basis: 'total',
        taxesIncluded: price.taxesIncluded,
      },
      conversion: {
        rate,
        timestamp: Date.now(),
        source: 'exchangerate-api',
      },
    };
  });
}

// Normalize per night
function normalizePerNight(
  prices: Price[],
  nights: number
): NormalizedPrice[] {
  return prices.map(price => {
    const perNightAmount = price.amount / nights;
    
    return {
      original: {
        amount: price.amount,
        currency: price.currency,
      },
      normalized: {
        amount: perNightAmount,
        currency: price.currency,
        basis: 'per_night',
        taxesIncluded: price.taxesIncluded,
      },
      conversion: {
        rate: 1,
        timestamp: Date.now(),
        source: 'calculation',
      },
    };
  });
}
```

---

## Price Intelligence Dashboard

```typescript
interface PriceIntelligenceDashboard {
  // Get dashboard data
  getDashboardData(
    destination: string,
    dates: DateRange
  ): DashboardData;
}

interface DashboardData {
  // Price overview
  overview: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    priceTrend: 'up' | 'down' | 'stable';
    priceChangePercent: number;
  };
  
  // Price distribution
  distribution: {
    budget: number; // percentage
    midRange: number;
    luxury: number;
    ultraLuxury: number;
  };
  
  // Price by provider
  byProvider: ProviderPriceSummary[];
  
  // Price by star rating
  byStarRating: StarRatingPriceSummary[];
  
  // Price by area
  byArea: AreaPriceSummary[];
  
  // Price predictions
  predictions: {
    nextWeek: number;
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
  
  // Best time to book
  bestTimeToBook: {
    daysInAdvance: number;
    dayOfWeek: string;
    timeOfDay: string;
    confidence: number;
  };
}

// Get dashboard data
function getDashboardData(
  destination: string,
  dates: DateRange
): DashboardData {
  // Get price data
  const priceData = getPriceData(destination, dates);
  
  // Calculate overview
  const overview = calculateOverview(priceData);
  
  // Calculate distribution
  const distribution = calculateDistribution(priceData);
  
  // Calculate by provider
  const byProvider = calculateByProvider(priceData);
  
  // Calculate by star rating
  const byStarRating = calculateByStarRating(priceData);
  
  // Calculate by area
  const byArea = calculateByArea(priceData);
  
  // Calculate predictions
  const predictions = calculatePredictions(priceData);
  
  // Calculate best time to book
  const bestTimeToBook = calculateBestTimeToBook(destination, dates);
  
  return {
    overview,
    distribution,
    byProvider,
    byStarRating,
    byArea,
    predictions,
    bestTimeToBook,
  };
}
```

---

## Price Confidence Score

```typescript
interface PriceConfidence {
  // Calculate confidence in price
  calculate(
    price: number,
    provider: string,
    result: SearchResult
  ): ConfidenceScore;
}

interface ConfidenceScore {
  // Overall confidence
  score: number; // 0-1
  
  // Confidence factors
  factors: {
    dataFreshness: number;
    providerReliability: number;
    priceConsistency: number;
    marketConditions: number;
    historicalAccuracy: number;
  };
  
  // Confidence level
  level: 'high' | 'medium' | 'low';
}

// Calculate price confidence
function calculatePriceConfidence(
  price: number,
  provider: string,
  result: SearchResult
): ConfidenceScore {
  // Data freshness (how recently was the price updated)
  const dataFreshness = calculateDataFreshness(result.lastUpdated);
  
  // Provider reliability
  const providerReliability = getProviderReliability(provider);
  
  // Price consistency (compared to other providers)
  const priceConsistency = calculatePriceConsistency(price, result.id);
  
  // Market conditions
  const marketConditions = calculateMarketConditions(result.location);
  
  // Historical accuracy
  const historicalAccuracy = calculateHistoricalAccuracy(provider);
  
  // Overall score
  const score = (
    dataFreshness * 0.25 +
    providerReliability * 0.25 +
    priceConsistency * 0.2 +
    marketConditions * 0.15 +
    historicalAccuracy * 0.15
  );
  
  // Determine level
  let level: ConfidenceScore['level'];
  if (score >= 0.8) level = 'high';
  else if (score >= 0.6) level = 'medium';
  else level = 'low';
  
  return {
    score,
    factors: {
      dataFreshness,
      providerReliability,
      priceConsistency,
      marketConditions,
      historicalAccuracy,
    },
    level,
  };
}
```

---

## Price Intelligence Configuration

```yaml
priceIntelligence:
  # Enable price intelligence
  enabled: true
  
  # Data sources
  dataSources:
    - name: exchangerate-api
      url: https://api.exchangerate-api.com
      apiKey: ${EXCHANGE_RATE_API_KEY}
    - name: hotelbeds
      url: https://api.hotelbeds.com
      apiKey: ${HOTELBEDS_API_KEY}
  
  # Cache settings
  cache:
    priceTtl: 300000 # 5 minutes
    historyTtl: 3600000 # 1 hour
    predictionTtl: 86400000 # 1 day
  
  # Alert settings
  alerts:
    enabled: true
    maxAlertsPerUser: 10
    alertExpiry: 604800000 # 7 days
  
  # Prediction settings
  predictions:
    enabled: true
    minDataPoints: 30
    maxPredictionDays: 90
    confidenceThreshold: 0.7
  
  # Normalization settings
  normalization:
    defaultCurrency: USD
    includeTaxes: true
    normalizePerNight: true
```
