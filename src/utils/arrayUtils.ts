import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'ArrayUtils' });

export class ArrayUtils {
  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  uniqueBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  sortByMultiple<T>(array: T[], keys: (keyof T)[], orders: ('asc' | 'desc')[] = []): T[] {
    return [...array].sort((a, b) => {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const order = orders[i] || 'asc';
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  filter<T>(array: T[], predicate: (item: T) => boolean): T[] {
    return array.filter(predicate);
  }

  find<T>(array: T[], predicate: (item: T) => boolean): T | undefined {
    return array.find(predicate);
  }

  findAll<T>(array: T[], predicate: (item: T) => boolean): T[] {
    return array.filter(predicate);
  }

  includes<T>(array: T[], value: T): boolean {
    return array.includes(value);
  }

  includesBy<T>(array: T[], key: keyof T, value: any): boolean {
    return array.some(item => item[key] === value);
  }

  remove<T>(array: T[], predicate: (item: T) => boolean): T[] {
    return array.filter(item => !predicate(item));
  }

  removeBy<T>(array: T[], key: keyof T, value: any): T[] {
    return array.filter(item => item[key] !== value);
  }

  sum<T>(array: T[], key: keyof T): number {
    return array.reduce((sum, item) => {
      const value = item[key];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  average<T>(array: T[], key: keyof T): number {
    if (array.length === 0) return 0;
    return this.sum(array, key) / array.length;
  }

  min<T>(array: T[], key: keyof T): T | undefined {
    if (array.length === 0) return undefined;
    return array.reduce((min, item) => {
      const minValue = min[key];
      const currentValue = item[key];
      return currentValue < minValue ? item : min;
    });
  }

  max<T>(array: T[], key: keyof T): T | undefined {
    if (array.length === 0) return undefined;
    return array.reduce((max, item) => {
      const maxValue = max[key];
      const currentValue = item[key];
      return currentValue > maxValue ? item : max;
    });
  }

  flatten<T>(array: (T | T[])[]): T[] {
    return array.flat() as T[];
  }

  flattenDeep<T>(array: any[]): T[] {
    return array.flat(Infinity) as T[];
  }

  compact<T>(array: (T | null | undefined | false | 0 | '')[]): T[] {
    return array.filter(Boolean) as T[];
  }

  head<T>(array: T[]): T | undefined {
    return array[0];
  }

  last<T>(array: T[]): T | undefined {
    return array[array.length - 1];
  }

  tail<T>(array: T[]): T[] {
    return array.slice(1);
  }

  initial<T>(array: T[]): T[] {
    return array.slice(0, -1);
  }

  sample<T>(array: T[]): T | undefined {
    return array[Math.floor(Math.random() * array.length)];
  }

  sampleSize<T>(array: T[], size: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, size);
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  zip<T>(...arrays: T[][]): T[][] {
    const maxLength = Math.max(...arrays.map(arr => arr.length));
    const result: T[][] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const row: T[] = [];
      for (const array of arrays) {
        row.push(array[i]);
      }
      result.push(row);
    }
    
    return result;
  }

  unzip<T>(array: T[][]): T[][] {
    const maxLength = Math.max(...array.map(arr => arr.length));
    const result: T[][] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const row: T[] = [];
      for (const arr of array) {
        if (i < arr.length) {
          row.push(arr[i]);
        }
      }
      result.push(row);
    }
    
    return result;
  }

  intersection<T>(...arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    
    return arrays.reduce((result, array) =>
      result.filter(item => array.includes(item))
    );
  }

  difference<T>(array1: T[], array2: T[]): T[] {
    return array1.filter(item => !array2.includes(item));
  }

  union<T>(...arrays: T[][]): T[] {
    return [...new Set(arrays.flat())];
  }

  without<T>(array: T[], ...values: T[]): T[] {
    return array.filter(item => !values.includes(item));
  }

  partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
    const pass: T[] = [];
    const fail: T[] = [];
    
    for (const item of array) {
      if (predicate(item)) {
        pass.push(item);
      } else {
        fail.push(item);
      }
    }
    
    return [pass, fail];
  }

  countBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((counts, item) => {
      const value = String(item[key]);
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  map<T, U>(array: T[], transform: (item: T, index: number) => U): U[] {
    return array.map(transform);
  }

  forEach<T>(array: T[], callback: (item: T, index: number) => void): void {
    array.forEach(callback);
  }

  reduce<T, U>(array: T[], reducer: (acc: U, item: T, index: number) => U, initialValue: U): U {
    return array.reduce(reducer, initialValue);
  }

  some<T>(array: T[], predicate: (item: T) => boolean): boolean {
    return array.some(predicate);
  }

  every<T>(array: T[], predicate: (item: T) => boolean): boolean {
    return array.every(predicate);
  }
}

export const arrayUtils = new ArrayUtils();
