/**
 * Database Module Entry Point
 * 
 * Exports all database-related functionality for Project Aware v2.0
 */

// Core database components
export { databaseManager, DatabaseManager } from './connection';
export { migrationManager, MigrationManager } from './migrations';
export { databaseInitService, DatabaseInitializationService } from './init';

// Schema and types
export * from './schema';

// Type exports
export type {
  DatabaseConfig,
  QueryResult
} from './connection';

export type {
  Migration,
  MigrationResult
} from './migrations';

export type {
  InitializationResult
} from './init';

// Import for default export
import { databaseManager } from './connection';
import { migrationManager } from './migrations';
import { databaseInitService } from './init';

// Named export to fix anonymous default export warning
const database = {
  manager: databaseManager,
  migrations: migrationManager,
  init: databaseInitService
};

export default database;
