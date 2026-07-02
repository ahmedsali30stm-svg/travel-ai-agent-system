import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, 'NOT_FOUND', `${resource}${id ? ` with id ${id}` : ''} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super(502, 'EXTERNAL_SERVICE_ERROR', `${service}: ${message}`, details);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn({
      err,
      requestId: req.headers['x-request-id'],
      path: req.path,
      method: req.method,
    }, `Application error: ${err.message}`);

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(config.app.env === 'development' && { details: err.details }),
      },
    });
  }

  // Unexpected errors
  logger.error({
    err,
    requestId: req.headers['x-request-id'],
    path: req.path,
    method: req.method,
  }, 'Unexpected error');

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.app.env === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    },
  });
};

import { config } from '../../config/index.js';
