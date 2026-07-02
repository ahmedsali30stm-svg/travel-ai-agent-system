import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';
import { createContextLogger } from '../../utils/logger.js';

const logger = createContextLogger({ component: 'AuthMiddleware' });

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'agent' | 'admin';
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
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

      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

export const requirePermission = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.every(p => userPermissions.includes(p));

    if (!hasPermission) {
      logger.warn({
        userId: req.user.id,
        requiredPermissions: permissions,
        actualPermissions: userPermissions,
      }, 'Permission check failed');

      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = decoded;
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, permissions: user.permissions },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

export const generateRefreshToken = (user: AuthUser): string => {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: '30d' }
  );
};

export const verifyRefreshToken = (token: string): { id: string } | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; type: string };
    if (decoded.type !== 'refresh') {
      return null;
    }
    return { id: decoded.id };
  } catch {
    return null;
  }
};
