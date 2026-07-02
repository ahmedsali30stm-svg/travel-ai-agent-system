import { config } from '../config/index.js';
import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'ConfigValidator' });

interface ConfigSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object';
    default?: any;
    validate?: (value: any) => boolean;
    message?: string;
  };
}

export class ConfigValidator {
  private schema: ConfigSchema = {
    'NODE_ENV': {
      type: 'string',
      validate: (v) => ['development', 'production', 'test'].includes(v),
      message: 'NODE_ENV must be development, production, or test',
    },
    'PORT': {
      type: 'number',
      validate: (v) => v > 0 && v < 65536,
      message: 'PORT must be between 1 and 65535',
    },
    'DATABASE_URL': {
      required: true,
      type: 'string',
      validate: (v) => v.startsWith('postgresql://'),
      message: 'DATABASE_URL must be a valid PostgreSQL connection string',
    },
    'REDIS_URL': {
      type: 'string',
      validate: (v) => v.startsWith('redis://'),
      message: 'REDIS_URL must be a valid Redis connection string',
    },
    'JWT_SECRET': {
      required: true,
      type: 'string',
      validate: (v) => v.length >= 32,
      message: 'JWT_SECRET must be at least 32 characters',
    },
  };

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, rules] of Object.entries(this.schema)) {
      const value = process.env[key];

      // Check required
      if (rules.required && !value) {
        errors.push(`${key} is required`);
        continue;
      }

      // Skip validation if not required and not provided
      if (!value) {
        continue;
      }

      // Type check
      if (rules.type) {
        const actualType = typeof value;
        if (actualType !== rules.type) {
          errors.push(`${key} must be of type ${rules.type}`);
          continue;
        }
      }

      // Custom validation
      if (rules.validate && !rules.validate(value)) {
        errors.push(rules.message || `${key} is invalid`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getRequiredEnvVars(): string[] {
    return Object.entries(this.schema)
      .filter(([_, rules]) => rules.required)
      .map(([key]) => key);
  }

  getOptionalEnvVars(): string[] {
    return Object.entries(this.schema)
      .filter(([_, rules]) => !rules.required)
      .map(([key]) => key);
  }
}

export const configValidator = new ConfigValidator();
