/**
 * Project Aware v2.0 - Comprehensive Logging System
 * 
 * Advanced logging infrastructure supporting:
 * - Structured logging
 * - Plugin activity tracking
 * - Security audit trails
 * - Performance monitoring
 * - Multiple output destinations
 * - Log rotation and retention
 */

import { configManager } from '@/lib/config';
import { LoggingConfig } from '@/lib/types/config';
import * as fs from 'fs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'system' | 'plugin' | 'api' | 'security' | 'database' | 'user';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, unknown>;
  pluginId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  stackTrace?: string;
  performance?: {
    duration: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface LogOptions {
  pluginId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  includeStackTrace?: boolean;
  category?: LogCategory;
}

export interface LogDestination {
  write(entry: LogEntry): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

/**
 * Console Log Destination
 */
class ConsoleDestination implements LogDestination {
  async write(entry: LogEntry): Promise<void> {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const category = entry.category.toUpperCase().padEnd(8);
    
    let message = `[${timestamp}] ${level} ${category} ${entry.message}`;
    
    if (entry.pluginId) {
      message += ` [Plugin: ${entry.pluginId}]`;
    }
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      message += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }
    
    if (entry.performance) {
      message += `\n  Performance: ${entry.performance.duration}ms, Memory: ${entry.performance.memoryUsage}MB`;
    }
    
    if (entry.stackTrace) {
      message += `\n  Stack: ${entry.stackTrace}`;
    }

    switch (entry.level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'debug':
        console.debug(message);
        break;
    }
  }
}

/**
 * File Log Destination
 */
class FileDestination implements LogDestination {
  private stream: fs.WriteStream | null = null;
  private currentFile: string = '';
  
  constructor(private baseFilename: string) {}
  
  async write(entry: LogEntry): Promise<void> {
    const filename = this.getLogFilename();
    
    if (filename !== this.currentFile) {
      await this.rotateLogFile(filename);
    }
    
    const logLine = JSON.stringify(entry) + '\n';
    
    if (this.stream) {
      this.stream.write(logLine);
    }
  }
  
  private getLogFilename(): string {
    const date = new Date().toISOString().split('T')[0];
    return `${this.baseFilename}-${date}.log`;
  }
  
  private async rotateLogFile(newFilename: string): Promise<void> {
    if (this.stream) {
      this.stream.end();
    }
    
    this.currentFile = newFilename;
    
    // In a real implementation, you'd use fs.createWriteStream
    // For now, we'll simulate it
    console.log(`Log file rotated to: ${newFilename}`);
  }
  
  async flush(): Promise<void> {
    if (this.stream) {
      // WriteStream doesn't have flush method, use write callback instead
      return new Promise((resolve, reject) => {
        this.stream!.write('', (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  }
  
  async close(): Promise<void> {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
  }
}

/**
 * Database Log Destination
 */
class DatabaseDestination implements LogDestination {
  async write(entry: LogEntry): Promise<void> {
    // In a real implementation, this would write to the database
    // For now, we'll simulate the database write
    console.log(`Database log: ${entry.level} - ${entry.message}`);
  }
}

/**
 * Remote Log Destination (for cloud logging services)
 */
class RemoteDestination implements LogDestination {
  constructor(private endpoint: string, private apiKey: string) {}
  
  async write(entry: LogEntry): Promise<void> {
    try {
      // In a real implementation, this would send to a remote logging service
      console.log(`Remote log to ${this.endpoint}: ${entry.level} - ${entry.message}`);
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send log to remote destination:', error);
      console.log(`Fallback log: ${entry.level} - ${entry.message}`);
    }
  }
}

/**
 * Main Logger Class
 */
class Logger {
  private destinations: LogDestination[] = [];
  private config: LoggingConfig;
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.config = configManager.get('logging');
    this.initializeDestinations();
    this.startPeriodicFlush();
  }
  
  private initializeDestinations(): void {
    if (this.config.console) {
      this.destinations.push(new ConsoleDestination());
    }
    
    if (this.config.file) {
      this.destinations.push(new FileDestination('app'));
    }
    
    if (this.config.database) {
      this.destinations.push(new DatabaseDestination());
    }
    
    if (this.config.remote) {
      const endpoint = process.env.LOG_REMOTE_ENDPOINT || '';
      const apiKey = process.env.LOG_REMOTE_API_KEY || '';
      if (endpoint) {
        this.destinations.push(new RemoteDestination(endpoint, apiKey));
      }
    }
  }
  
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }
  
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= configLevelIndex;
  }
  
  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) return;
    
    const promises = this.destinations.map(destination => 
      destination.write(entry).catch(error => 
        console.error(`Log destination error:`, error)
      )
    );
    
    await Promise.all(promises);
  }
  
  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, unknown>,
    options?: {
      pluginId?: string;
      userId?: string;
      sessionId?: string;
      requestId?: string;
      error?: Error;
      performance?: LogEntry['performance'];
    }
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata
    };
    
    if (options) {
      if (options.pluginId) entry.pluginId = options.pluginId;
      if (options.userId) entry.userId = options.userId;
      if (options.sessionId) entry.sessionId = options.sessionId;
      if (options.requestId) entry.requestId = options.requestId;
      if (options.performance) entry.performance = options.performance;
      if (options.error) {
        entry.stackTrace = options.error.stack;
        if (!entry.metadata) entry.metadata = {};
        entry.metadata.errorName = options.error.name;
        entry.metadata.errorMessage = options.error.message;
      }
    }
    
    return entry;
  }
  
  // Public Logging Methods
  public debug(message: string, metadata?: Record<string, unknown>, options?: LogOptions): void {
    const entry = this.createLogEntry('debug', 'system', message, metadata, options);
    this.writeLog(entry);
  }
  
  public info(message: string, metadata?: Record<string, unknown>, options?: LogOptions): void {
    const entry = this.createLogEntry('info', 'system', message, metadata, options);
    this.writeLog(entry);
  }
  
  public warn(message: string, metadata?: Record<string, unknown>, options?: LogOptions): void {
    const entry = this.createLogEntry('warn', 'system', message, metadata, options);
    this.writeLog(entry);
  }
  
  public error(message: string, error?: Error, metadata?: Record<string, unknown>, options?: LogOptions): void {
    const entry = this.createLogEntry('error', 'system', message, metadata, { ...options, error });
    this.writeLog(entry);
  }
  
  // Category-Specific Logging Methods
  public plugin(level: LogLevel, pluginId: string, message: string, metadata?: Record<string, unknown>): void {
    if (!this.config.plugins.activities && level !== 'error') return;
    
    const entry = this.createLogEntry(level, 'plugin', message, metadata, { pluginId });
    this.writeLog(entry);
  }
  
  public security(level: LogLevel, message: string, metadata?: Record<string, unknown>, options?: LogOptions): void {
    if (!this.config.plugins.security) return;
    
    const entry = this.createLogEntry(level, 'security', message, metadata, options);
    this.writeLog(entry);
  }
  
  public api(level: LogLevel, message: string, metadata?: Record<string, unknown>, options?: LogOptions): void {
    const entry = this.createLogEntry(level, 'api', message, metadata, options);
    this.writeLog(entry);
  }
  
  public database(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createLogEntry(level, 'database', message, metadata);
    this.writeLog(entry);
  }
  
  public user(level: LogLevel, userId: string, message: string, metadata?: Record<string, unknown>, options?: LogOptions): void {
    const entry = this.createLogEntry(level, 'user', message, metadata, { ...options, userId });
    this.writeLog(entry);
  }
  
  // Performance Logging
  public performance(
    message: string, 
    duration: number, 
    metadata?: Record<string, unknown>,
    options?: LogOptions
  ): void {
    if (!this.config.plugins.performance) return;
    
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const performance = {
      duration,
      memoryUsage,
      cpuUsage: process.cpuUsage().user / 1000 // Convert to ms
    };
    
    const entry = this.createLogEntry('info', 'system', message, metadata, { ...options, performance });
    this.writeLog(entry);
  }
  
  // Plugin Activity Tracking
  public pluginStarted(pluginId: string, metadata?: Record<string, unknown>): void {
    this.plugin('info', pluginId, 'Plugin started', metadata);
  }
  
  public pluginStopped(pluginId: string, metadata?: Record<string, unknown>): void {
    this.plugin('info', pluginId, 'Plugin stopped', metadata);
  }
  
  public pluginError(pluginId: string, error: Error, metadata?: Record<string, unknown>): void {
    this.plugin('error', pluginId, `Plugin error: ${error.message}`, metadata);
  }
  
  public pluginAction(pluginId: string, action: string, metadata?: Record<string, unknown>): void {
    this.plugin('debug', pluginId, `Plugin action: ${action}`, metadata);
  }
  
  // Security Audit Logging
  public securityEvent(event: string, userId?: string, metadata?: Record<string, unknown>): void {
    this.security('warn', `Security event: ${event}`, metadata, { userId });
  }
  
  public authSuccess(userId: string, method: string, metadata?: Record<string, unknown>): void {
    this.security('info', `Authentication successful: ${method}`, metadata, { userId });
  }
  
  public authFailure(reason: string, metadata?: Record<string, unknown>): void {
    this.security('warn', `Authentication failed: ${reason}`, metadata);
  }
  
  public unauthorizedAccess(resource: string, userId?: string, metadata?: Record<string, unknown>): void {
    this.security('error', `Unauthorized access attempt: ${resource}`, metadata, { userId });
  }
  
  // Utility Methods
  public flush(): void {
    const promises = this.destinations
      .filter(dest => dest.flush)
      .map(dest => dest.flush!().catch(error => 
        console.error('Flush error:', error)
      ));
    
    Promise.all(promises);
  }
  
  public async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    await this.flush();
    
    const promises = this.destinations
      .filter(dest => dest.close)
      .map(dest => dest.close!().catch(error => 
        console.error('Close error:', error)
      ));
    
    await Promise.all(promises);
  }
  
  // Configuration Management
  public updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize destinations if needed
    this.destinations = [];
    this.initializeDestinations();
  }
  
  public getConfig(): LoggingConfig {
    return { ...this.config };
  }
}

// Performance monitoring utilities
export class PerformanceTimer {
  private startTime: number;
  private startMemory: number;
  
  constructor(private logger: Logger, private operation: string) {
    this.startTime = performance.now();
    this.startMemory = process.memoryUsage().heapUsed;
  }
  
  public end(metadata?: Record<string, unknown>): void {
    const duration = performance.now() - this.startTime;
    this.logger.performance(
      `Operation completed: ${this.operation}`,
      duration,
      metadata
    );
  }
}

// Request ID tracking utility
export class RequestTracker {
  private static requestId = 0;
  
  public static generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestId}`;
  }
  
  public static withRequestId<T>(requestId: string, fn: () => T): T {
    // In a real implementation, this would use AsyncLocalStorage
    // to track request context through async operations
    return fn();
  }
}

// Singleton logger instance
export const logger = new Logger();

// Convenience functions
export const log = {
  debug: (message: string, metadata?: Record<string, unknown>, options?: LogOptions) => logger.debug(message, metadata, options),
  info: (message: string, metadata?: Record<string, unknown>, options?: LogOptions) => logger.info(message, metadata, options),
  warn: (message: string, metadata?: Record<string, unknown>, options?: LogOptions) => logger.warn(message, metadata, options),
  error: (message: string, error?: Error, metadata?: Record<string, unknown>, options?: LogOptions) => logger.error(message, error, metadata, options),
  
  plugin: (level: LogLevel, pluginId: string, message: string, metadata?: Record<string, unknown>) => logger.plugin(level, pluginId, message, metadata),
  security: (level: LogLevel, message: string, metadata?: Record<string, unknown>, options?: LogOptions) => logger.security(level, message, metadata, options),
  api: (level: LogLevel, message: string, metadata?: Record<string, unknown>, options?: LogOptions) => logger.api(level, message, metadata, options),
  database: (level: LogLevel, message: string, metadata?: Record<string, unknown>) => logger.database(level, message, metadata),
  user: (level: LogLevel, userId: string, message: string, metadata?: Record<string, unknown>, options?: LogOptions) => logger.user(level, userId, message, metadata, options),
  
  performance: (message: string, duration: number, metadata?: Record<string, unknown>, options?: LogOptions) => logger.performance(message, duration, metadata, options),
  timer: (operation: string) => new PerformanceTimer(logger, operation)
};

export default logger;
