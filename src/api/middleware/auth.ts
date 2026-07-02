import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { UnauthorizedError } from './errorHandler.js';
import { logger } from '../../utils/logger.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'agent' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: AuthUser['role'][]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!roles.includes(req.user.role)) {
      logger.warn({
        userId: req.user.id,
        requiredRoles: roles,
        actualRole: req.user.role,
      }, 'Authorization failed');

      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};

export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};
