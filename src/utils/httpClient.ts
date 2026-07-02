import { config } from '../config/index.js';
import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'HttpClient' });

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface Response<T = any> {
  status: number;
  headers: Record<string, string>;
  data: T;
}

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(options?: {
    baseUrl?: string;
    headers?: Record<string, string>;
    timeout?: number;
  }) {
    this.baseUrl = options?.baseUrl || '';
    this.defaultHeaders = options?.headers || {};
    this.defaultTimeout = options?.timeout || 30000;
  }

  async get<T = any>(
    path: string,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>('GET', path, options);
  }

  async post<T = any>(
    path: string,
    body?: any,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>('POST', path, { ...options, body });
  }

  async put<T = any>(
    path: string,
    body?: any,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  async patch<T = any>(
    path: string,
    body?: any,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  async delete<T = any>(
    path: string,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<Response<T>> {
    const url = `${this.baseUrl}${path}`;
    const timeout = options?.timeout || this.defaultTimeout;
    const maxRetries = options?.retries || 3;
    const retryDelay = options?.retryDelay || 1000;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options?.headers,
    };

    if (options?.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseData = await response.json() as T;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        logger.debug({
          method,
          path,
          status: response.status,
          attempt,
        }, 'Request completed');

        return {
          status: response.status,
          headers: Object.fromEntries((response.headers as any).entries()),
          data: responseData,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        logger.warn({
          method,
          path,
          attempt,
          error: lastError.message,
        }, 'Request failed');

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }
}

export const httpClient = new HttpClient();
