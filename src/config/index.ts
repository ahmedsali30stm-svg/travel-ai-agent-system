import dotenv from 'dotenv';

dotenv.config();

export const config = {
  app: {
    name: 'travel-ai-agent-system',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiVersion: process.env.API_VERSION || 'v1',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/travel_ai',
    ssl: process.env.DATABASE_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' 
      ? (() => { throw new Error('JWT_SECRET must be set in production'); })() 
      : 'dev-secret-not-for-production'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  },
  providers: {
    hotelbeds: {
      apiKey: process.env.HOTELBEDS_API_KEY || '',
      secret: process.env.HOTELBEDS_SECRET || '',
    },
    booking: {
      apiKey: process.env.BOOKING_API_KEY || '',
    },
    viator: {
      apiKey: process.env.VIATOR_API_KEY || '',
    },
    amadeus: {
      apiKey: process.env.AMADEUS_API_KEY || '',
      secret: process.env.AMADEUS_SECRET || '',
    },
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  monitoring: {
    prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  browser: {
    poolMin: parseInt(process.env.BROWSER_POOL_MIN || '3', 10),
    poolMax: parseInt(process.env.BROWSER_POOL_MAX || '20', 10),
    headless: process.env.BROWSER_HEADLESS === 'true',
  },
  search: {
    timeout: parseInt(process.env.SEARCH_TIMEOUT || '15000', 10),
    maxResults: parseInt(process.env.SEARCH_MAX_RESULTS || '50', 10),
    cacheTTL: parseInt(process.env.CACHE_TTL || '3600', 10),
  },
  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
} as const;

export type Config = typeof config;
export default config;
