import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'StringUtils' });

export class StringUtils {
  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  camelCase(text: string): string {
    return text
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }

  snakeCase(text: string): string {
    return text
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  kebabCase(text: string): string {
    return this.snakeCase(text).replace(/_/g, '-');
  }

  pascalCase(text: string): string {
    const camel = this.camelCase(text);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  truncate(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - suffix.length) + suffix;
  }

  capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  titleCase(text: string): string {
    return text
      .toLowerCase()
      .replace(/(?:^|\s)\S/g, char => char.toUpperCase());
  }

  stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }

  unescapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
    };
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, char => map[char]);
  }

  truncateWords(text: string, wordCount: number, suffix = '...'): string {
    const words = text.split(/\s+/);
    if (words.length <= wordCount) {
      return text;
    }
    return words.slice(0, wordCount).join(' ') + suffix;
  }

  countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  generateRandomString(length: number, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generateId(prefix = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
  }

  isEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  isAlphanumeric(text: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(text);
  }

  isNumeric(text: string): boolean {
    return /^\d+$/.test(text);
  }

  padLeft(text: string, length: number, char = ' '): string {
    return text.padStart(length, char);
  }

  padRight(text: string, length: number, char = ' '): string {
    return text.padEnd(length, char);
  }

  removeWhitespace(text: string): string {
    return text.replace(/\s/g, '');
  }

  collapseWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  wrap(text: string, maxLength: number): string {
    const lines: string[] = [];
    let currentLine = '';
    
    const words = text.split(/\s+/);
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxLength) {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  }

  highlight(text: string, query: string): string {
    if (!query) {
      return text;
    }
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  extractNumbers(text: string): number[] {
    const matches = text.match(/\d+\.?\d*/g);
    return matches ? matches.map(Number) : [];
  }

  extractEmails(text: string): string[] {
    const regex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
    return text.match(regex) || [];
  }

  extractUrls(text: string): string[] {
    const regex = /https?:\/\/[^\s]+/g;
    return text.match(regex) || [];
  }
}

export const stringUtils = new StringUtils();
