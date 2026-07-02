import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'UrlParser' });

interface ParsedUrl {
  protocol: string;
  hostname: string;
  port?: string;
  pathname: string;
  search: string;
  hash: string;
  query: Record<string, string>;
}

export class UrlParser {
  parse(url: string): ParsedUrl {
    try {
      const parsed = new URL(url);
      
      const query: Record<string, string> = {};
      parsed.searchParams.forEach((value, key) => {
        query[key] = value;
      });

      return {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
        query,
      };
    } catch (error) {
      logger.error({ url, error }, 'URL parsing failed');
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  stringify(parsed: ParsedUrl): string {
    const url = new URL('http://localhost');
    
    url.protocol = parsed.protocol;
    url.hostname = parsed.hostname;
    
    if (parsed.port) {
      url.port = parsed.port;
    }
    
    url.pathname = parsed.pathname;
    
    for (const [key, value] of Object.entries(parsed.query)) {
      url.searchParams.set(key, value);
    }
    
    url.hash = parsed.hash;
    
    return url.toString();
  }

  buildQuery(params: Record<string, string | number | boolean>): string {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    
    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  parseQuery(queryString: string): Record<string, string> {
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(queryString);
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }

  resolve(base: string, relative: string): string {
    try {
      return new URL(relative, base).toString();
    } catch (error) {
      logger.error({ base, relative, error }, 'URL resolution failed');
      throw new Error(`Cannot resolve URL: ${relative}`);
    }
  }

  isAbsolute(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  normalize(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Remove default ports
      if (
        (parsed.protocol === 'http:' && parsed.port === '80') ||
        (parsed.protocol === 'https:' && parsed.port === '443')
      ) {
        parsed.port = '';
      }
      
      // Remove trailing slash
      if (parsed.pathname === '/') {
        parsed.pathname = '';
      }
      
      return parsed.toString();
    } catch (error) {
      return url;
    }
  }

  getDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return '';
    }
  }

  getOrigin(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch {
      return '';
    }
  }
}

export const urlParser = new UrlParser();
