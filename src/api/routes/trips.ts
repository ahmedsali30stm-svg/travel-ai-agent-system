import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { TripService } from '../../services/trip/TripService.js';

export const tripRoutes = Router();
const tripService = new TripService();

// Apply auth middleware
tripRoutes.use(authenticate);

// Create a new trip
tripRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const createTripSchema = z.object({
      name: z.string().min(1).max(200),
      destination: z.string().min(1),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      travelers: z.number().min(1).max(20),
      budget: z.number().positive().optional(),
      preferences: z.record(z.any()).optional(),
    });

    const validatedData = createTripSchema.parse(req.body);
    
    const trip = await tripService.createTrip({
      ...validatedData,
      userId: req.user!.id,
    });
    
    res.status(201).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid trip data', error.errors));
    }
    next(error);
  }
});

// Get user's trips
tripRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '10' } = req.query;
    
    const trips = await tripService.getUserTrips(req.user!.id, {
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
    
    res.json({
      success: true,
      data: trips,
    });
  } catch (error) {
    next(error);
  }
});

// Get trip by ID
tripRoutes.get('/:tripId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;
    
    const trip = await tripService.getTripById(tripId, req.user!.id);
    
    if (!trip) {
      throw new NotFoundError(`Trip ${tripId} not found`);
    }
    
    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
});

// Update trip
tripRoutes.put('/:tripId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;
    
    const updateTripSchema = z.object({
      name: z.string().min(1).max(200).optional(),
      destination: z.string().min(1).optional(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      travelers: z.number().min(1).max(20).optional(),
      budget: z.number().positive().optional(),
      status: z.enum(['draft', 'planned', 'booked', 'completed', 'cancelled']).optional(),
      preferences: z.record(z.any()).optional(),
    });

    const validatedData = updateTripSchema.parse(req.body);
    
    const trip = await tripService.updateTrip(tripId, req.user!.id, validatedData);
    
    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid trip data', error.errors));
    }
    next(error);
  }
});

// Delete trip
tripRoutes.delete('/:tripId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;
    
    await tripService.deleteTrip(tripId, req.user!.id);
    
    res.json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Add item to trip
tripRoutes.post('/:tripId/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;
    
    const addItemSchema = z.object({
      type: z.enum(['hotel', 'flight', 'activity', 'transport', 'other']),
      name: z.string().min(1),
      details: z.record(z.any()),
      cost: z.number().positive().optional(),
      currency: z.string().length(3).optional(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      status: z.enum(['pending', 'reserved', 'confirmed', 'cancelled']).optional().default('pending'),
      bookingRef: z.string().optional(),
      notes: z.string().optional(),
    });

    const validatedData = addItemSchema.parse(req.body);
    
    const item = await tripService.addItem(tripId, req.user!.id, validatedData);
    
    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid item data', error.errors));
    }
    next(error);
  }
});

// Get trip itinerary
tripRoutes.get('/:tripId/itinerary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;
    
    const itinerary = await tripService.generateItinerary(tripId, req.user!.id);
    
    res.json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    next(error);
  }
});

// Get trip budget summary
tripRoutes.get('/:tripId/budget', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;
    
    const budget = await tripService.getBudgetSummary(tripId, req.user!.id);
    
    res.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
});
