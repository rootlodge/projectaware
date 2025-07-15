/**
 * Simplified MariaDB Database Connection Layer for Phase 1.2
 * 
 * Core database functionality:
 * - Connection pooling
 * - Query execution
 * - Transaction management
 * - Health monitoring
 */

import mariadb, { Pool, PoolConnection } from 'mariadb';
import { logger } from '../core/logger';
import { configManager } from '../config';

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  taskQueueSize: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  timeout: number;
  charset: string;
  ssl?: boolean;
}

export interface QueryResult<T = Record<string, unknown>> {
  data: T[];
  meta: {
    affectedRows?: number;
    insertId?: number | bigint;
    warningStatus?: number;
  };
  executionTime: number;
}

export class DatabaseManager {
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  constructor() {
    this.config = this.loadDatabaseConfig();
  }

  private loadDatabaseConfig(): DatabaseConfig {
    const envConfig = configManager.getConfig();
    
    return {
      host: envConfig.database.host,
      port: envConfig.database.port,
      user: envConfig.database.username,
      password: envConfig.database.password,
      database: envConfig.database.database,
      connectionLimit: envConfig.database.poolSize || 10,
      timeout: envConfig.database.connectionTimeout || 30000,
      charset: 'utf8mb4',
      ssl: envConfig.database.ssl
    };
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing MariaDB connection pool');
      
      this.pool = mariadb.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        connectionLimit: this.config.connectionLimit,
        charset: this.config.charset,
        ssl: this.config.ssl
      });

      // Test connection
      await this.testConnection();
      
      logger.info('MariaDB connection pool initialized successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize database connection: ${errorMessage}`);
      throw new Error(`Database initialization failed: ${errorMessage}`);
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }

    const connection = await this.pool.getConnection();
    try {
      await connection.query('SELECT 1 as test');
      logger.info('Database connection test successful');
    } finally {
      connection.release();
    }
  }

  public async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    const startTime = Date.now();
    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.pool.getConnection();
      
      const result = await connection.query(sql, params);
      const executionTime = Date.now() - startTime;

      const queryResult: QueryResult<T> = {
        data: Array.isArray(result) ? result : [result],
        meta: result.meta || {},
        executionTime
      };

      logger.debug('Query executed successfully', {
        query: sql.substring(0, 100),
        executionTime,
        rowCount: queryResult.data.length
      });

      return queryResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Query execution failed: ${errorMessage}`);
      
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  public async transaction<T>(
    callback: (connection: PoolConnection) => Promise<T>
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.pool.getConnection();
      await connection.beginTransaction();
      
      const result = await callback(connection);
      
      await connection.commit();
      logger.debug('Transaction completed successfully');
      return result;
      
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
          logger.warn('Transaction rolled back due to error');
        } catch (rollbackError) {
          const rollbackMessage = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
          logger.error(`Failed to rollback transaction: ${rollbackMessage}`);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Transaction failed: ${errorMessage}`);
      throw error;
      
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  public async getConnectionStats(): Promise<ConnectionStats | null> {
    if (!this.pool) {
      return null;
    }

    return {
      totalConnections: this.pool.totalConnections(),
      activeConnections: this.pool.activeConnections(),
      idleConnections: this.pool.idleConnections(),
      taskQueueSize: this.pool.taskQueueSize()
    };
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down database connection pool');
    
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    
    logger.info('Database connection pool closed');
  }
}

export const databaseManager = new DatabaseManager();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await databaseManager.shutdown();
});

process.on('SIGINT', async () => {
  await databaseManager.shutdown();
});

export default databaseManager;
