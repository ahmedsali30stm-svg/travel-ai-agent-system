import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler.js';
import { SearchService } from '../../services/search/SearchService.js';
import { decisionEngine } from '../../services/search/DecisionEngine.js';
import { selectionManager } from '../../services/search/SelectionManager.js';
import { templateEngine } from '../../services/template/TemplateEngine.js';
import { SearchParams } from '../../services/search/types.js';
import { createContextLogger } from '../../utils/logger.js';

const logger = createContextLogger({ component: 'HotelRoutes' });

export const hotelRoutes = Router();

const searchService = new SearchService();

// Validation schema for ranking
const rankSchema = z.object({
  destination: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().min(1).max(20),
  rooms: z.number().min(1).max(10).optional().default(1),
  budget: z.number().positive().optional(),
  preferences: z.object({
    stars: z.number().min(1).max(5).optional(),
    amenities: z.array(z.string()).optional(),
  }).optional(),
});

// Decision Engine: rank hotel results by user preferences
hotelRoutes.post('/rank', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = rankSchema.parse(req.body);

    const searchParams: SearchParams = {
      destination: validated.destination,
      checkIn: validated.checkIn,
      checkOut: validated.checkOut,
      guests: validated.guests,
      rooms: validated.rooms ?? 1,
      budget: validated.budget,
      preferences: {
        amenities: validated.preferences?.amenities,
      },
    };

    const results = await searchService.searchHotels(searchParams as any);
    const hotels: any[] = results?.results ?? [];

    if (hotels.length === 0) {
      return res.json({
        success: true,
        data: {
          decision: decisionEngine.rank([], { budget: validated.budget }),
        },
      });
    }

    const decision = decisionEngine.rank(hotels, {
      budget: validated.budget,
      preferences: searchParams.preferences,
    });

    res.json({
      success: true,
      data: {
        decision,
        searchParams,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid rank parameters', error.errors));
    }
    next(error);
  }
});

// Validation schema for selection
const selectSchema = z.object({
  hotelId: z.string().min(1),
  destination: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().min(1).max(20),
  rooms: z.number().min(1).max(10).optional().default(1),
  budget: z.number().positive().optional(),
  preferences: z.object({
    stars: z.number().min(1).max(5).optional(),
    amenities: z.array(z.string()).optional(),
  }).optional(),
  rank: z.number().min(0).optional().default(1),
  totalCandidates: z.number().min(0).optional().default(0),
  totalScore: z.number().min(0).max(1).optional().default(0),
  recommendation: z.string().optional().default(''),
});

// Select a hotel and create a selection record
hotelRoutes.post('/select', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = selectSchema.parse(req.body);

    const searchParams: SearchParams = {
      destination: validated.destination,
      checkIn: validated.checkIn,
      checkOut: validated.checkOut,
      guests: validated.guests,
      rooms: validated.rooms ?? 1,
      budget: validated.budget,
    };

    const results = await searchService.searchHotels(searchParams as any);
    const hotels: any[] = results?.results ?? [];

    if (hotels.length === 0) {
      return next(new ValidationError('No hotels found for selection'));
    }

    const hotel = hotels.find((h: any) => h.id === validated.hotelId);
    if (!hotel) {
      return next(new ValidationError(`Hotel not found: ${validated.hotelId}`));
    }

    const selection = selectionManager.create({
      hotel,
      searchParams,
      rank: validated.rank,
      totalCandidates: validated.totalCandidates || hotels.length,
      totalScore: validated.totalScore,
      recommendation: validated.recommendation || 'Selected manually',
    });

    res.json({
      success: true,
      data: { selection },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid selection parameters', error.errors));
    }
    next(error);
  }
});

// Get a selection by ID
hotelRoutes.get('/selection/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const selection = selectionManager.get(req.params.id);
    if (!selection) {
      return next(new ValidationError(`Selection not found: ${req.params.id}`));
    }

    res.json({
      success: true,
      data: { selection },
    });
  } catch (error) {
    next(error);
  }
});

// List all selections
hotelRoutes.get('/selections', (_req: Request, res: Response) => {
  const selections = selectionManager.list();
  res.json({
    success: true,
    data: { selections, count: selectionManager.count() },
  });
});

// Generate HTML quotation for a selection
hotelRoutes.get('/quotation/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const selection = selectionManager.get(req.params.id);
    if (!selection) {
      return next(new ValidationError(`Selection not found: ${req.params.id}`));
    }

    const checkIn = new Date(selection.searchParams.checkIn);
    const checkOut = new Date(selection.searchParams.checkOut);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000));
    const total = selection.hotel.pricePerNight * nights + (selection.hotel.taxesAndFees ?? 0);

    const html = await templateEngine.render('booking/quotation', {
      selection: JSON.parse(JSON.stringify(selection)),
      hotel: JSON.parse(JSON.stringify(selection.hotel)),
      searchParams: selection.searchParams,
      nights,
      total,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      data: { html, selectionId: selection.id },
    });
  } catch (error) {
    next(error);
  }
});

// Export PDF quotation for a selection
hotelRoutes.get('/quotation/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const selection = selectionManager.get(req.params.id);
    if (!selection) {
      return next(new ValidationError(`Selection not found: ${req.params.id}`));
    }

    const checkIn = new Date(selection.searchParams.checkIn);
    const checkOut = new Date(selection.searchParams.checkOut);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000));
    const total = selection.hotel.pricePerNight * nights + (selection.hotel.taxesAndFees ?? 0);

    const pdf = await templateEngine.renderPDF('booking/quotation', {
      selection: JSON.parse(JSON.stringify(selection)),
      hotel: JSON.parse(JSON.stringify(selection.hotel)),
      searchParams: selection.searchParams,
      nights,
      total,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quotation-${selection.id}.pdf"`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

// Full pipeline: search → rank → select → quotation HTML
hotelRoutes.post('/pipeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = rankSchema.parse(req.body);

    const searchParams: SearchParams = {
      destination: validated.destination,
      checkIn: validated.checkIn,
      checkOut: validated.checkOut,
      guests: validated.guests,
      rooms: validated.rooms ?? 1,
      budget: validated.budget,
      preferences: {
        amenities: validated.preferences?.amenities,
      },
    };

    const results = await searchService.searchHotels(searchParams as any);
    const hotels: any[] = results?.results ?? [];

    if (hotels.length === 0) {
      return res.json({
        success: true,
        data: {
          stage: 'search',
          message: 'No hotels found',
          hotels: [],
          decision: null,
          selection: null,
          html: null,
        },
      });
    }

    const decision = decisionEngine.rank(hotels, {
      budget: validated.budget,
      preferences: searchParams.preferences,
    });

    if (!decision.best) {
      return res.json({
        success: true,
        data: {
          stage: 'decision',
          message: 'Could not determine best hotel',
          hotels,
          decision,
          selection: null,
          html: null,
        },
      });
    }

    const selection = selectionManager.create({
      hotel: decision.best,
      searchParams,
      rank: 1,
      totalCandidates: decision.ranked.length,
      totalScore: decision.best.scores.total,
      recommendation: decision.summary.recommendation,
    });

    const checkIn = new Date(selection.searchParams.checkIn);
    const checkOut = new Date(selection.searchParams.checkOut);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000));
    const total = selection.hotel.pricePerNight * nights + (selection.hotel.taxesAndFees ?? 0);

    const html = await templateEngine.render('booking/quotation', {
      selection: JSON.parse(JSON.stringify(selection)),
      hotel: JSON.parse(JSON.stringify(selection.hotel)),
      searchParams: selection.searchParams,
      nights,
      total,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      data: {
        stage: 'complete',
        message: 'Pipeline completed successfully',
        hotels: decision.ranked.slice(0, 5),
        decision: {
          best: decision.best,
          summary: decision.summary,
        },
        selection,
        html,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid pipeline parameters', error.errors));
    }
    next(error);
  }
});
