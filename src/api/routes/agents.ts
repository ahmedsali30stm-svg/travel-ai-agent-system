import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler.js';
import { AgentOrchestrator } from '../../agents/AgentOrchestrator.js';
import { authenticate } from '../middleware/auth.js';

export const agentRoutes = Router();
const orchestrator = new AgentOrchestrator();

// Apply auth middleware to all agent routes
agentRoutes.use(authenticate);

// Process a travel request
agentRoutes.post('/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestSchema = z.object({
      query: z.string().min(1, 'Query is required'),
      context: z.object({
        userId: z.string(),
        tripId: z.string().optional(),
        preferences: z.record(z.any()).optional(),
      }),
      agents: z.array(z.string()).optional(),
      options: z.object({
        parallel: z.boolean().optional().default(true),
        timeout: z.number().optional().default(30000),
      }).optional(),
    });

    const validatedData = requestSchema.parse(req.body);
    
    const result = await orchestrator.processRequest({
      ...validatedData,
      context: {
        ...validatedData.context,
        userId: req.user!.id,
      },
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid request parameters', error.errors));
    }
    next(error);
  }
});

// Get agent status
agentRoutes.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await orchestrator.getStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

// Get agent metrics
agentRoutes.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await orchestrator.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
});

// Cancel a running task
agentRoutes.post('/cancel/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    
    const result = await orchestrator.cancelTask(taskId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});
