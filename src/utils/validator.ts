import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'Validator' });

interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

interface ValidationResult {
  valid: boolean;
  errors: { field: string; message: string }[];
}

export class Validator {
  private rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  validate(data: Record<string, any>): ValidationResult {
    const errors: { field: string; message: string }[] = [];

    for (const rule of this.rules) {
      const value = data[rule.field];
      const error = this.validateField(rule, value);
      if (error) {
        errors.push({ field: rule.field, message: error });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateField(rule: ValidationRule, value: any): string | null {
    // Check required
    if (rule.required && (value === undefined || value === null)) {
      return `${rule.field} is required`;
    }

    // Skip validation if value is not provided and not required
    if (value === undefined || value === null) {
      return null;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        return this.validateString(rule, value);
      case 'number':
        return this.validateNumber(rule, value);
      case 'boolean':
        return this.validateBoolean(rule, value);
      case 'array':
        return this.validateArray(rule, value);
      case 'object':
        return this.validateObject(rule, value);
      case 'date':
        return this.validateDate(rule, value);
      default:
        return null;
    }
  }

  private validateString(rule: ValidationRule, value: any): string | null {
    if (typeof value !== 'string') {
      return `${rule.field} must be a string`;
    }

    if (rule.min !== undefined && value.length < rule.min) {
      return `${rule.field} must be at least ${rule.min} characters`;
    }

    if (rule.max !== undefined && value.length > rule.max) {
      return `${rule.field} must be at most ${rule.max} characters`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return `${rule.field} has invalid format`;
    }

    if (rule.enum && !rule.enum.includes(value)) {
      return `${rule.field} must be one of: ${rule.enum.join(', ')}`;
    }

    if (rule.custom) {
      const result = rule.custom(value);
      if (typeof result === 'string') {
        return result;
      }
      if (!result) {
        return `${rule.field} is invalid`;
      }
    }

    return null;
  }

  private validateNumber(rule: ValidationRule, value: any): string | null {
    if (typeof value !== 'number' || isNaN(value)) {
      return `${rule.field} must be a number`;
    }

    if (rule.min !== undefined && value < rule.min) {
      return `${rule.field} must be at least ${rule.min}`;
    }

    if (rule.max !== undefined && value > rule.max) {
      return `${rule.field} must be at most ${rule.max}`;
    }

    if (rule.enum && !rule.enum.includes(value)) {
      return `${rule.field} must be one of: ${rule.enum.join(', ')}`;
    }

    if (rule.custom) {
      const result = rule.custom(value);
      if (typeof result === 'string') {
        return result;
      }
      if (!result) {
        return `${rule.field} is invalid`;
      }
    }

    return null;
  }

  private validateBoolean(rule: ValidationRule, value: any): string | null {
    if (typeof value !== 'boolean') {
      return `${rule.field} must be a boolean`;
    }

    if (rule.custom) {
      const result = rule.custom(value);
      if (typeof result === 'string') {
        return result;
      }
      if (!result) {
        return `${rule.field} is invalid`;
      }
    }

    return null;
  }

  private validateArray(rule: ValidationRule, value: any): string | null {
    if (!Array.isArray(value)) {
      return `${rule.field} must be an array`;
    }

    if (rule.min !== undefined && value.length < rule.min) {
      return `${rule.field} must have at least ${rule.min} items`;
    }

    if (rule.max !== undefined && value.length > rule.max) {
      return `${rule.field} must have at most ${rule.max} items`;
    }

    if (rule.custom) {
      const result = rule.custom(value);
      if (typeof result === 'string') {
        return result;
      }
      if (!result) {
        return `${rule.field} is invalid`;
      }
    }

    return null;
  }

  private validateObject(rule: ValidationRule, value: any): string | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return `${rule.field} must be an object`;
    }

    if (rule.custom) {
      const result = rule.custom(value);
      if (typeof result === 'string') {
        return result;
      }
      if (!result) {
        return `${rule.field} is invalid`;
      }
    }

    return null;
  }

  private validateDate(rule: ValidationRule, value: any): string | null {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `${rule.field} must be a valid date`;
    }

    if (rule.min !== undefined) {
      const minDate = new Date(rule.min);
      if (date < minDate) {
        return `${rule.field} must be after ${minDate.toISOString()}`;
      }
    }

    if (rule.max !== undefined) {
      const maxDate = new Date(rule.max);
      if (date > maxDate) {
        return `${rule.field} must be before ${maxDate.toISOString()}`;
      }
    }

    if (rule.custom) {
      const result = rule.custom(date);
      if (typeof result === 'string') {
        return result;
      }
      if (!result) {
        return `${rule.field} is invalid`;
      }
    }

    return null;
  }

  reset(): this {
    this.rules = [];
    return this;
  }
}

// Common validators
export const validators = {
  email: new Validator().addRule({
    field: 'email',
    type: 'string',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  }),

  password: new Validator().addRule({
    field: 'password',
    type: 'string',
    required: true,
    min: 8,
    max: 100,
  }),

  date: new Validator().addRule({
    field: 'date',
    type: 'string',
    required: true,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
  }),

  positiveNumber: new Validator().addRule({
    field: 'value',
    type: 'number',
    required: true,
    min: 0,
  }),
};
