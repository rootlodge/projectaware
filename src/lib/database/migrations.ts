/**
 * Database Migration System for Project Aware v2.0
 * 
 * Features:
 * - Schema versioning and migration tracking
 * - Rollback capabilities
 * - Seed data management
 * - Multi-tenant schema support
 * - MariaDB optimization
 */

import { databaseManager } from './connection';
import { logger } from '../core/logger';

export interface Migration {
  version: string;
  description: string;
  up: string[];
  down: string[];
  timestamp: Date;
}

export interface MigrationHistoryEntry {
  id: number;
  version: string;
  description: string;
  applied_at: Date;
  checksum: string;
}

export interface MigrationResult {
  success: boolean;
  version: string;
  executedQueries: string[];
  errors: string[];
  duration: number;
}

export class MigrationManager {
  private migrations: Migration[] = [];

  constructor() {
    this.loadMigrations();
  }

  // ================================
  // MIGRATION DEFINITIONS
  // ================================

  private loadMigrations(): void {
    this.migrations = [
      {
        version: '1.0.0',
        description: 'Initial schema creation',
        timestamp: new Date('2025-01-01'),
        up: [
          // Schema versions table (must be first)
          `CREATE TABLE IF NOT EXISTS schema_versions (
            version VARCHAR(20) PRIMARY KEY,
            description TEXT NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            rollback_script LONGTEXT,
            INDEX idx_applied_at (applied_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

          // Tenants table
          `CREATE TABLE IF NOT EXISTS tenants (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(100) NOT NULL UNIQUE,
            plan ENUM('startup', 'business', 'enterprise') NOT NULL DEFAULT 'startup',
            status ENUM('active', 'suspended', 'cancelled') NOT NULL DEFAULT 'active',
            settings JSON,
            usage_limits JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_slug (slug),
            INDEX idx_status (status),
            INDEX idx_plan (plan)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

          // Users table
          `CREATE TABLE IF NOT EXISTS users (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            tenant_id CHAR(36),
            email VARCHAR(255) NOT NULL UNIQUE,
            username VARCHAR(100) NOT NULL,
            display_name VARCHAR(255),
            preferred_name VARCHAR(100),
            password_hash VARCHAR(255) NOT NULL,
            avatar_url TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            is_verified BOOLEAN NOT NULL DEFAULT FALSE,
            role ENUM('admin', 'user', 'guest') NOT NULL DEFAULT 'user',
            subscription_tier ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
            api_quota_remaining INT NOT NULL DEFAULT 1000,
            api_quota_reset_at TIMESTAMP NOT NULL DEFAULT (DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH)),
            preferences JSON,
            metadata JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            last_active_at TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
            INDEX idx_email (email),
            INDEX idx_username (username),
            INDEX idx_tenant_id (tenant_id),
            INDEX idx_role (role),
            INDEX idx_subscription_tier (subscription_tier),
            INDEX idx_is_active (is_active),
            INDEX idx_last_active (last_active_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

          // Plugins table
          `CREATE TABLE IF NOT EXISTS plugins (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            name VARCHAR(255) NOT NULL,
            category ENUM('consciousness', 'emotion', 'memory', 'goal', 'identity', 'agent', 'api', 'ui', 'analytics', 'security') NOT NULL,
            type ENUM('core', 'enhancement', 'community', 'custom') NOT NULL DEFAULT 'core',
            version VARCHAR(50) NOT NULL,
            description TEXT,
            author VARCHAR(255),
            repository_url TEXT,
            documentation_url TEXT,
            icon_url TEXT,
            license VARCHAR(100),
            dependencies JSON,
            configuration_schema JSON,
            safety_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
            is_bundled BOOLEAN NOT NULL DEFAULT FALSE,
            bundle_id CHAR(36),
            status ENUM('active', 'deprecated', 'disabled') NOT NULL DEFAULT 'active',
            download_count INT NOT NULL DEFAULT 0,
            rating DECIMAL(3,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_type (type),
            INDEX idx_status (status),
            INDEX idx_bundle_id (bundle_id),
            INDEX idx_safety_level (safety_level)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

          // Plugin bundles table
          `CREATE TABLE IF NOT EXISTS plugin_bundles (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            version VARCHAR(50) NOT NULL,
            category VARCHAR(100),
            install_behavior ENUM('atomic', 'individual') NOT NULL DEFAULT 'atomic',
            plugins JSON,
            dependencies JSON,
            configuration_schema JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_install_behavior (install_behavior)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

          // User plugins table
          `CREATE TABLE IF NOT EXISTS user_plugins (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id CHAR(36) NOT NULL,
            plugin_id CHAR(36) NOT NULL,
            bundle_id CHAR(36),
            is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            configuration JSON,
            installation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP,
            usage_count INT NOT NULL DEFAULT 0,
            error_count INT NOT NULL DEFAULT 0,
            performance_metrics JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
            FOREIGN KEY (bundle_id) REFERENCES plugin_bundles(id) ON DELETE SET NULL,
            UNIQUE KEY unique_user_plugin (user_id, plugin_id),
            INDEX idx_user_id (user_id),
            INDEX idx_plugin_id (plugin_id),
            INDEX idx_bundle_id (bundle_id),
            INDEX idx_is_enabled (is_enabled)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

          // Configuration table
          `CREATE TABLE IF NOT EXISTS configurations (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id CHAR(36),
            tenant_id CHAR(36),
            category ENUM('system', 'user', 'plugin', 'security', 'performance', 'ui') NOT NULL,
            config_key VARCHAR(255) NOT NULL,
            config_value JSON,
            value_type ENUM('string', 'number', 'boolean', 'object', 'array') NOT NULL,
            is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
            is_system_config BOOLEAN NOT NULL DEFAULT FALSE,
            description TEXT,
            validation_schema JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id),
            INDEX idx_tenant_id (tenant_id),
            INDEX idx_category (category),
            INDEX idx_config_key (config_key),
            INDEX idx_is_system_config (is_system_config)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

          // Feature flags table
          `CREATE TABLE IF NOT EXISTS feature_flags (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            flag_type ENUM('boolean', 'multivariate', 'percentage') NOT NULL DEFAULT 'boolean',
            is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            rollout_percentage INT NOT NULL DEFAULT 0,
            target_users JSON,
            environment ENUM('development', 'staging', 'production', 'all') NOT NULL DEFAULT 'all',
            plugin_id CHAR(36),
            conditions JSON,
            metadata JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE SET NULL,
            INDEX idx_name (name),
            INDEX idx_environment (environment),
            INDEX idx_plugin_id (plugin_id),
            INDEX idx_is_enabled (is_enabled)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

          // API keys table
          `CREATE TABLE IF NOT EXISTS api_keys (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id CHAR(36) NOT NULL,
            key_hash VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            scopes JSON,
            rate_limit INT NOT NULL DEFAULT 1000,
            quota_limit INT NOT NULL DEFAULT 10000,
            quota_used INT NOT NULL DEFAULT 0,
            quota_reset_at TIMESTAMP NOT NULL DEFAULT (DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH)),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            last_used_at TIMESTAMP,
            usage_count INT NOT NULL DEFAULT 0,
            allowed_ips JSON,
            plugin_access JSON,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id),
            INDEX idx_key_hash (key_hash),
            INDEX idx_is_active (is_active),
            INDEX idx_expires_at (expires_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        ],
        down: [
          'DROP TABLE IF EXISTS api_keys',
          'DROP TABLE IF EXISTS feature_flags',
          'DROP TABLE IF EXISTS configurations',
          'DROP TABLE IF EXISTS user_plugins',
          'DROP TABLE IF EXISTS plugin_bundles',
          'DROP TABLE IF EXISTS plugins',
          'DROP TABLE IF EXISTS users',
          'DROP TABLE IF EXISTS tenants',
          'DROP TABLE IF EXISTS schema_versions'
        ]
      }
    ];
  }

  // ================================
  // MIGRATION EXECUTION
  // ================================

  public async runMigrations(): Promise<MigrationResult[]> {
    logger.info('Starting database migrations');
    
    const results: MigrationResult[] = [];
    
    try {
      // Ensure database is initialized
      await databaseManager.initialize();
      
      // Get current schema version
      const currentVersion = await this.getCurrentVersion();
      logger.info(`Current schema version: ${currentVersion || 'none'}`);
      
      // Find migrations to run
      const migrationsToRun = this.getMigrationsToRun(currentVersion);
      
      if (migrationsToRun.length === 0) {
        logger.info('No migrations to run - database is up to date');
        return results;
      }
      
      logger.info(`Running ${migrationsToRun.length} migrations`);
      
      // Run each migration in transaction
      for (const migration of migrationsToRun) {
        const result = await this.runSingleMigration(migration);
        results.push(result);
        
        if (!result.success) {
          logger.error(`Migration ${migration.version} failed, stopping`);
          break;
        }
      }
      
      logger.info('Database migrations completed');
      return results;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Migration process failed: ${errorMessage}`);
      throw error;
    }
  }

  private async getCurrentVersion(): Promise<string | null> {
    try {
      const result = await databaseManager.query<{ version: string }>(
        'SELECT version FROM schema_versions ORDER BY applied_at DESC LIMIT 1'
      );
      
      return result.data.length > 0 ? result.data[0].version : null;
    } catch (error: unknown) {
      // Table doesn't exist yet - error is expected when migrations table doesn't exist
      logger.debug('Migrations table not found, starting from beginning', { error });
      return null;
    }
  }

  private getMigrationsToRun(currentVersion: string | null): Migration[] {
    if (!currentVersion) {
      return this.migrations;
    }
    
    const currentIndex = this.migrations.findIndex(m => m.version === currentVersion);
    if (currentIndex === -1) {
      throw new Error(`Current version ${currentVersion} not found in migrations`);
    }
    
    return this.migrations.slice(currentIndex + 1);
  }

  private async runSingleMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      version: migration.version,
      executedQueries: [],
      errors: [],
      duration: 0
    };
    
    logger.info(`Running migration ${migration.version}: ${migration.description}`);
    
    try {
      await databaseManager.transaction(async (connection) => {
        // Execute each query in the migration
        for (const query of migration.up) {
          try {
            await connection.query(query);
            result.executedQueries.push(query);
            logger.debug(`Executed query: ${query.substring(0, 100)}...`);
          } catch (queryError) {
            const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
            result.errors.push(`Query failed: ${errorMessage}`);
            throw queryError;
          }
        }
        
        // Record migration in schema_versions table
        await connection.query(
          'INSERT INTO schema_versions (version, description, rollback_script) VALUES (?, ?, ?)',
          [migration.version, migration.description, migration.down.join(';\n')]
        );
        
        result.success = true;
        logger.info(`Migration ${migration.version} completed successfully`);
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      logger.error(`Migration ${migration.version} failed: ${errorMessage}`);
    }
    
    result.duration = Date.now() - startTime;
    return result;
  }

  // ================================
  // ROLLBACK FUNCTIONALITY
  // ================================

  public async rollback(targetVersion?: string): Promise<MigrationResult> {
    logger.info(`Rolling back database to version: ${targetVersion || 'previous'}`);
    
    const startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      version: targetVersion || 'rollback',
      executedQueries: [],
      errors: [],
      duration: 0
    };
    
    try {
      const currentVersion = await this.getCurrentVersion();
      if (!currentVersion) {
        throw new Error('No current version found - nothing to rollback');
      }
      
      // Get rollback script
      const rollbackResult = await databaseManager.query<{ rollback_script: string }>(
        'SELECT rollback_script FROM schema_versions WHERE version = ?',
        [currentVersion]
      );
      
      if (rollbackResult.data.length === 0) {
        throw new Error(`No rollback script found for version ${currentVersion}`);
      }
      
      const rollbackScript = rollbackResult.data[0].rollback_script;
      const queries = rollbackScript.split(';\n').filter((q: string) => q.trim().length > 0);
      
      await databaseManager.transaction(async (connection) => {
        // Execute rollback queries
        for (const query of queries) {
          await connection.query(query);
          result.executedQueries.push(query);
        }
        
        // Remove version record
        await connection.query(
          'DELETE FROM schema_versions WHERE version = ?',
          [currentVersion]
        );
        
        result.success = true;
      });
      
      logger.info(`Rollback to version ${targetVersion} completed successfully`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      logger.error(`Rollback failed: ${errorMessage}`);
    }
    
    result.duration = Date.now() - startTime;
    return result;
  }

  // ================================
  // UTILITY METHODS
  // ================================

  public async getSchemaVersion(): Promise<string | null> {
    return await this.getCurrentVersion();
  }

  public async getMigrationHistory(): Promise<MigrationHistoryEntry[]> {
    try {
      const result = await databaseManager.query<MigrationHistoryEntry>(
        'SELECT * FROM schema_versions ORDER BY applied_at DESC'
      );
      return result.data;
    } catch (error: unknown) {
      logger.debug('Could not retrieve migration history', { error });
      return [];
    }
  }

  public async validateSchema(): Promise<boolean> {
    try {
      // Check if all required tables exist
      const tables = [
        'schema_versions', 'tenants', 'users', 'plugins', 
        'plugin_bundles', 'user_plugins', 'configurations', 
        'feature_flags', 'api_keys'
      ];
      
      for (const table of tables) {
        const result = await databaseManager.query(
          'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
          [table]
        );
        
        if (result.data[0].count === 0) {
          logger.error(`Required table missing: ${table}`);
          return false;
        }
      }
      
      logger.info('Schema validation passed');
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Schema validation failed: ${errorMessage}`);
      return false;
    }
  }
}

export const migrationManager = new MigrationManager();
