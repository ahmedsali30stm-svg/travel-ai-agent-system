import type { HotelResult, SearchParams } from './types.js';
import { createContextLogger } from '../../utils/logger.js';

const logger = createContextLogger({ component: 'SelectionManager' });

export interface DecisionSummary {
  totalScore: number;
  recommendation: string;
  rank: number;
  totalCandidates: number;
}

export interface HotelSelection {
  id: string;
  hotel: HotelResult;
  searchParams: SearchParams;
  decisionSummary: DecisionSummary;
  createdAt: string;
}

export class SelectionManager {
  private selections = new Map<string, HotelSelection>();

  create(params: {
    hotel: HotelResult;
    searchParams: SearchParams;
    rank: number;
    totalCandidates: number;
    totalScore: number;
    recommendation: string;
  }): HotelSelection {
    const id = `sel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const selection: HotelSelection = {
      id,
      hotel: params.hotel,
      searchParams: params.searchParams,
      decisionSummary: {
        totalScore: params.totalScore,
        recommendation: params.recommendation,
        rank: params.rank,
        totalCandidates: params.totalCandidates,
      },
      createdAt: new Date().toISOString(),
    };

    this.selections.set(id, selection);
    logger.info({ selectionId: id, hotel: params.hotel.name }, 'Hotel selection created');
    return selection;
  }

  get(id: string): HotelSelection | undefined {
    return this.selections.get(id);
  }

  delete(id: string): boolean {
    return this.selections.delete(id);
  }

  list(since?: string): HotelSelection[] {
    const all = Array.from(this.selections.values());
    if (since) {
      return all.filter((s) => s.createdAt >= since);
    }
    return all;
  }

  count(): number {
    return this.selections.size;
  }
}

export const selectionManager = new SelectionManager();
