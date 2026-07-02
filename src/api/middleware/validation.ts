import { Request, Response, NextFunction } from 'express';
import { createContextLogger } from '../../utils/logger.js';

const logger = createContextLogger({ component: 'ValidationMiddleware' });

interface ValidationSchema {
  body?: any;
  query?: any;
  params?: any;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: any[] = [];

    // Validate body
    if (schema.body) {
      const result = schema.body.safeParse(req.body);
      if (!result.success) {
        errors.push(...result.error.errors.map((e: any) => ({
          field: `body.${e.path.join('.')}`,
          message: e.message,
        })));
      }
    }

    // Validate query
    if (schema.query) {
      const result = schema.query.safeParse(req.query);
      if (!result.success) {
        errors.push(...result.error.errors.map((e: any) => ({
          field: `query.${e.path.join('.')}`,
          message: e.message,
        })));
      }
    }

    // Validate params
    if (schema.params) {
      const result = schema.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...result.error.errors.map((e: any) => ({
          field: `params.${e.path.join('.')}`,
          message: e.message,
        })));
      }
    }

    if (errors.length > 0) {
      logger.warn({ errors, path: req.path }, 'Validation failed');
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }

    next();
  };
};

export const sanitize = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = req.body[field]
            .trim()
            .replace(/<[^>]*>/g, '')
            .replace(/[<>]/g, '');
        }
      }
    }

    // Sanitize query
    if (req.query && typeof req.query === 'object') {
      for (const field of fields) {
        if (req.query[field] && typeof req.query[field] === 'string') {
          (req.query as any)[field] = (req.query[field] as string)
            .trim()
            .replace(/<[^>]*>/g, '')
            .replace(/[<>]/g, '');
        }
      }
    }

    next();
  };
};

export const sanitizeHtml = (req: Request, _res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '');
    }
    
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};
