import {
  type HotelResult,
  type SearchParams,
} from './types.js';
import { createContextLogger } from '../../utils/logger.js';

const logger = createContextLogger({ component: 'DecisionEngine' });

export interface DecisionScore {
  total: number;
  price: number;
  rating: number;
  popularity: number;
  amenities: number;
  cancellation: number;
}

export type RecommendationLabel =
  | 'best_value'
  | 'top_rated'
  | 'budget_friendly'
  | 'premium'
  | 'balanced';

export interface RankedHotel extends HotelResult {
  scores: DecisionScore;
  recommendation: RecommendationLabel;
}

export interface DecisionResult {
  ranked: RankedHotel[];
  best: RankedHotel | null;
  summary: {
    totalCandidates: number;
    topScore: number;
    averagePrice: number;
    recommendation: string;
  };
}

interface DecisionParams {
  budget?: number;
  preferences?: SearchParams['preferences'];
}

export class DecisionEngine {
  rank(
    results: HotelResult[],
    params: DecisionParams = {}
  ): DecisionResult {
    if (results.length === 0) {
      return {
        ranked: [],
        best: null,
        summary: {
          totalCandidates: 0,
          topScore: 0,
          averagePrice: 0,
          recommendation: 'No results to evaluate.',
        },
      };
    }

    const ranked: RankedHotel[] = results.map((hotel) => {
      const scores = this.computeScores(hotel, params);
      const recommendation = this.labelRecommendation(scores, hotel);
      return { ...hotel, scores, recommendation };
    });

    ranked.sort((a, b) => b.scores.total - a.scores.total);

    const averagePrice =
      ranked.reduce((s, r) => s + r.pricePerNight, 0) / ranked.length;

    let recommendationText: string;
    const best = ranked[0];
    if (!best) {
      recommendationText = 'No recommendation available.';
    } else {
      recommendationText = this.buildRecommendationText(best, ranked.length);
    }

    return {
      ranked,
      best: best ?? null,
      summary: {
        totalCandidates: ranked.length,
        topScore: best?.scores.total ?? 0,
        averagePrice: Math.round(averagePrice * 100) / 100,
        recommendation: recommendationText,
      },
    };
  }

  private computeScores(
    hotel: HotelResult,
    params: DecisionParams
  ): DecisionScore {
    const budget = params.budget ?? 500;

    const priceScore = this.scorePrice(hotel.pricePerNight, budget);
    const ratingScore = this.scoreRating(hotel.rating);
    const popularityScore = this.scorePopularity(hotel.reviewCount);
    const amenitiesScore = this.scoreAmenities(
      hotel.amenities ?? [],
      params.preferences?.amenities ?? []
    );
    const cancellationScore = this.scoreCancellation(
      hotel.cancellationPolicy?.type
    );

    const weights = { price: 0.30, rating: 0.25, popularity: 0.15, amenities: 0.15, cancellation: 0.15 };
    const total =
      priceScore * weights.price +
      ratingScore * weights.rating +
      popularityScore * weights.popularity +
      amenitiesScore * weights.amenities +
      cancellationScore * weights.cancellation;

    return {
      total: Math.round(total * 100) / 100,
      price: Math.round(priceScore * 100) / 100,
      rating: Math.round(ratingScore * 100) / 100,
      popularity: Math.round(popularityScore * 100) / 100,
      amenities: Math.round(amenitiesScore * 100) / 100,
      cancellation: Math.round(cancellationScore * 100) / 100,
    };
  }

  private scorePrice(price: number, budget: number): number {
    if (price <= 0) return 0;
    if (budget <= 0) return Math.max(0, 1 - price / 1000);
    if (price <= budget * 0.5) return 1;
    if (price <= budget * 0.8) return 0.8;
    if (price <= budget) return 0.6;
    return Math.max(0, 0.4 - (price - budget) / budget);
  }

  private scoreRating(rating: number): number {
    return Math.min(1, Math.max(0, rating / 5));
  }

  private scorePopularity(reviewCount: number): number {
    return Math.min(1, Math.log10(reviewCount + 1) / 4);
  }

  private scoreAmenities(
    hotelAmenities: string[],
    preferredAmenities: string[]
  ): number {
    if (preferredAmenities.length === 0) return 0.5;
    const matched = preferredAmenities.filter((p) =>
      hotelAmenities.some((a) => a.toLowerCase().includes(p.toLowerCase()))
    ).length;
    return matched / preferredAmenities.length;
  }

  private scoreCancellation(
    type: string | undefined
  ): number {
    switch (type) {
      case 'free': return 1;
      case 'partial_refund': return 0.6;
      case 'non_refundable': return 0;
      default: return 0.3;
    }
  }

  private labelRecommendation(
    scores: DecisionScore,
    hotel: HotelResult
  ): RecommendationLabel {
    if (scores.rating >= 0.9 && scores.price >= 0.6) return 'best_value';
    if (scores.rating >= 0.85) return 'top_rated';
    if (scores.price >= 0.85) return 'budget_friendly';
    if (scores.rating >= 0.7 && scores.price >= 0.3 && scores.amenities >= 0.7) return 'premium';
    return 'balanced';
  }

  private buildRecommendationText(
    best: RankedHotel,
    totalCandidates: number
  ): string {
    const labelMap: Record<RecommendationLabel, string> = {
      best_value: 'best value for money',
      top_rated: 'highest rated',
      budget_friendly: 'most budget-friendly',
      premium: 'best premium option',
      balanced: 'best balanced option',
    };

    return (
      `Recommended: ${best.name} (${labelMap[best.recommendation]}, ` +
      `score ${best.scores.total}) among ${totalCandidates} candidates. ` +
      `$${best.pricePerNight}/night, ${best.rating}/5 rating from ${best.reviewCount} reviews.`
    );
  }
}

export const decisionEngine = new DecisionEngine();
