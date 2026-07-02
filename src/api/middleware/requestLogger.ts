import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  // Add requestId to request
  req.headers['x-request-id'] = requestId;
  
  // Log request
  logger.info({
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  }, 'Incoming request');

  // Capture original end
  const originalEnd = res.end;
  
  res.end = function(chunk: any, ...args: any[]) {
    const duration = Date.now() - start;
    
    logger.info({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    }, 'Request completed');

    return originalEnd.apply(this, [chunk, ...args] as any);
  };

  next();
};

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
