import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config/index.js';
import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'Database' });

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeout?: number;
}

export class Database {
  private pool: Pool | null = null;
  private isConnected = false;

  constructor() {
    // Pool is created on connect() to allow graceful startup
  }

  async connect(): Promise<void> {
    try {
      const dbConfig = this.parseConnectionString(config.database.url);

      this.pool = new Pool({
        ...dbConfig,
        ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
        max: config.database.maxConnections || 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      this.pool.on('error', (err: Error) => {
        logger.error('Unexpected database pool error:', err);
      });

      this.pool.on('connect', () => {
        logger.debug('New database connection acquired');
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.isConnected = true;
      logger.info('Database connected');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
      }
      this.isConnected = false;
      this.pool = null;
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Database disconnection failed:', error);
    }
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.pool.query<T>(text, params);
      return result;
    } catch (error) {
      logger.error({ text, params, error }, 'Query failed');
      throw error;
    }
  }

  async transaction<T extends QueryResultRow = any>(
    callback: (query: <R extends QueryResultRow>(text: string, params?: any[]) => Promise<QueryResult<R>>) => Promise<T>
  ): Promise<T> {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }

    const client: PoolClient = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await callback(
        <R extends QueryResultRow>(text: string, params?: any[]) =>
          client.query<R>(text, params).then((res: import('pg').QueryResult<R>) => ({
            rows: res.rows,
            rowCount: res.rowCount,
            command: res.command,
            oid: res.oid,
            fields: res.fields,
          }))
      );

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) return false;
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  getPoolStats(): { total: number; idle: number; waiting: number } | null {
    if (!this.pool) return null;
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }

  private parseConnectionString(url: string): DatabaseConfig {
    const match = url.match(
      /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/
    );

    if (!match) {
      throw new Error('Invalid database connection string');
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4], 10),
      database: match[5],
    };
  }
}

export const database = new Database();
