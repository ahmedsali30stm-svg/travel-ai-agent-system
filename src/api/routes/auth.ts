import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError, UnauthorizedError } from '../middleware/errorHandler.js';
import { generateToken } from '../middleware/auth.js';
import { UserService } from '../../services/user/UserService.js';

export const authRoutes = Router();
const userService = new UserService();

// Register
authRoutes.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const registerSchema = z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      name: z.string().min(1, 'Name is required'),
    });

    const validatedData = registerSchema.parse(req.body);
    
    const user = await userService.createUser(validatedData);
    
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid registration data', error.errors));
    }
    next(error);
  }
});

// Login
authRoutes.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loginSchema = z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
    });

    const validatedData = loginSchema.parse(req.body);
    
    const user = await userService.validateCredentials(validatedData.email, validatedData.password);
    
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid login data', error.errors));
    }
    next(error);
  }
});

// Get current user
authRoutes.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This route should be protected, but for simplicity we'll add basic check
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError());
    }

    // In real implementation, verify token and get user
    res.json({
      success: true,
      data: {
        message: 'User profile endpoint - implement with auth middleware',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
authRoutes.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshSchema = z.object({
      token: z.string().min(1, 'Token is required'),
    });

    const validatedData = refreshSchema.parse(req.body);
    
    // Implement refresh token logic
    res.json({
      success: true,
      data: {
        message: 'Token refresh endpoint - implement with refresh token logic',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ValidationError('Invalid refresh data', error.errors));
    }
    next(error);
  }
});
