import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler.js';
import { SearchService } from '../../services/search/SearchService.js';

export const searchRoutes = Router();
const searchService = new SearchService();

// Search validation schema
const searchSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  guests: z.number().min(1).max(20),
  rooms: z.number().min(1).max(10).optional().default(1),
  budget: z.number().positive().optional(),
  preferences: z.object({
    stars: z.number().min(1).max(5).optional(),
    amenities: z.array(z.string()).optional(),
    mealPlan: z.enum(['room_only', 'breakfast', 'half_board', 'full_board', 'all_inclusive']).optional(),
    cancellationPolicy: z.enum(['free', 'non_refundable', 'flexible']).optional(),
  }).optional(),
  providers: z.array(z.string()).optional(),
  sortBy: z.enum(['price', 'rating', 'distance', 'popularity']).optional().default('relevance'),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(20),
});

// Search hotels
searchRoutes.post('/hotels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = searchSchema.parse(req.body);
    
    const results = await searchService.searchHotels(validatedData);
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid search parameters', error.errors));
    }
    next(error);
  }
});

// Search activities
searchRoutes.post('/activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activitySchema = z.object({
      destination: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      category: z.enum(['adventure', 'cultural', 'relaxation', 'entertainment', 'nature']).optional(),
      budget: z.number().positive().optional(),
      duration: z.enum(['half_day', 'full_day', 'multi_day']).optional(),
      travelers: z.number().min(1).max(20),
    });

    const validatedData = activitySchema.parse(req.body);
    
    const results = await searchService.searchActivities(validatedData);
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid activity search parameters', error.errors));
    }
    next(error);
  }
});

// Get search suggestions
searchRoutes.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const suggestions = await searchService.getSuggestions(query);
    
    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

// Get price calendar
searchRoutes.get('/price-calendar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { destination, checkIn, checkOut } = req.query;
    
    if (!destination || !checkIn || !checkOut) {
      return next(new ValidationError('Missing required parameters'));
    }

    const calendar = await searchService.getPriceCalendar(
      destination as string,
      checkIn as string,
      checkOut as string
    );
    
    res.json({
      success: true,
      data: calendar,
    });
  } catch (error) {
    next(error);
  }
});
