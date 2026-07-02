import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'ObjectUtils' });

export class ObjectUtils {
  pick<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  omit<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result as Omit<T, K>;
  }

  pickBy<T extends Record<string, any>>(
    obj: T,
    predicate: (value: any, key: string) => boolean
  ): Partial<T> {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (predicate(value, key)) {
        (result as any)[key] = value;
      }
    }
    return result;
  }

  omitBy<T extends Record<string, any>>(
    obj: T,
    predicate: (value: any, key: string) => boolean
  ): Partial<T> {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!predicate(value, key)) {
        (result as any)[key] = value;
      }
    }
    return result;
  }

  merge<T extends Record<string, any>>(...objects: Partial<T>[]): T {
    return Object.assign({}, ...objects) as T;
  }

  deepMerge<T extends Record<string, any>>(...objects: Partial<T>[]): T {
    const result: any = {};
    
    for (const obj of objects) {
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = this.deepMerge(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
    }
    
    return result as T;
  }

  clone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.clone(item)) as T;
    }
    
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, this.clone(value)])
    ) as T;
  }

  deepClone<T>(obj: T): T {
    if (typeof structuredClone === 'function') {
      return structuredClone(obj);
    }
    
    return JSON.parse(JSON.stringify(obj));
  }

  isEqual<T>(obj1: T, obj2: T): boolean {
    if (obj1 === obj2) return true;
    if (obj1 === null || obj2 === null) return false;
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') {
      return obj1 === obj2;
    }
    
    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
      return false;
    }
    
    const keys1 = Object.keys(obj1 as any);
    const keys2 = Object.keys(obj2 as any);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    for (const key of keys1) {
      if (!this.isEqual((obj1 as any)[key], (obj2 as any)[key])) {
        return false;
      }
    }
    
    return true;
  }

  isEmpty(obj: any): boolean {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }

  isPlainObject(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) return false;
    const proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
  }

  mapValues<T extends Record<string, any>, U>(
    obj: T,
    transform: (value: any, key: string) => U
  ): Record<string, U> {
    const result: Record<string, U> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = transform(value, key);
    }
    return result;
  }

  mapKeys<T extends Record<string, any>>(
    obj: T,
    transform: (key: string, value: any) => string
  ): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = transform(key, value);
      result[newKey] = value;
    }
    return result;
  }

  invert(obj: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[value] = key;
    }
    return result;
  }

  flatten(obj: Record<string, any>, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
    
    return result;
  }

  unflatten(obj: Record<string, any>): Record<string, any> {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const keys = key.split('.');
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }
      
      current[keys[keys.length - 1]] = value;
    }
    
    return result;
  }

  get(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current === undefined ? defaultValue : current;
  }

  set(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  has(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }
    
    return true;
  }

  toPairs<T>(obj: Record<string, T>): [string, T][] {
    return Object.entries(obj);
  }

  fromPairs<T>(pairs: [string, T][]): Record<string, T> {
    return Object.fromEntries(pairs);
  }

  entries<T>(obj: Record<string, T>): [string, T][] {
    return Object.entries(obj);
  }

  keys(obj: any): string[] {
    return Object.keys(obj);
  }

  values<T>(obj: Record<string, T>): T[] {
    return Object.values(obj);
  }

  size(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    if (typeof obj === 'string' || Array.isArray(obj)) return obj.length;
    if (typeof obj === 'object') return Object.keys(obj).length;
    return 0;
  }

  transform<T extends Record<string, any>, U>(
    obj: T,
    reducer: (acc: U, value: any, key: string) => U,
    initialValue: U
  ): U {
    return Object.entries(obj).reduce(
      (acc, [key, value]) => reducer(acc, value, key),
      initialValue
    );
  }
}

export const objectUtils = new ObjectUtils();
