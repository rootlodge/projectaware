/**
 * Database Initialization Service for Project Aware v2.0
 * 
 * Handles:
 * - Database connection verification
 * - Schema migrations
 * - Seed data insertion
 * - Health checks
 */

import { databaseManager } from './connection';
import { migrationManager } from './migrations';
import { logger } from '../core/logger';
import { configManager } from '../config';

export interface InitializationResult {
  success: boolean;
  databaseConnected: boolean;
  migrationsRun: boolean;
  seedDataInserted: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
}

export class DatabaseInitializationService {
  private isInitialized = false;
  private initializationPromise: Promise<InitializationResult> | null = null;

  /**
   * Initialize the database system
   */
  public async initialize(): Promise<InitializationResult> {
    // Return existing promise if initialization is in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return success if already initialized
    if (this.isInitialized) {
      return {
        success: true,
        databaseConnected: true,
        migrationsRun: true,
        seedDataInserted: true,
        errors: [],
        warnings: [],
        duration: 0
      };
    }

    // Start initialization
    this.initializationPromise = this.performInitialization();
    const result = await this.initializationPromise;
    
    if (result.success) {
      this.isInitialized = true;
    }

    return result;
  }

  private async performInitialization(): Promise<InitializationResult> {
    const startTime = Date.now();
    const result: InitializationResult = {
      success: false,
      databaseConnected: false,
      migrationsRun: false,
      seedDataInserted: false,
      errors: [],
      warnings: [],
      duration: 0
    };

    logger.info('🚀 Starting database initialization for Project Aware v2.0');

    try {
      // Step 1: Connect to database
      await this.connectToDatabase(result);

      // Step 2: Run migrations
      if (result.databaseConnected) {
        await this.runMigrations(result);
      }

      // Step 3: Insert seed data (if configured)
      if (result.migrationsRun) {
        await this.insertSeedData(result);
      }

      // Step 4: Validate schema
      if (result.migrationsRun) {
        await this.validateSchema(result);
      }

      result.success = result.databaseConnected && result.migrationsRun;
      result.duration = Date.now() - startTime;

      if (result.success) {
        logger.info(`✅ Database initialization completed successfully in ${result.duration}ms`);
      } else {
        logger.error('❌ Database initialization failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Initialization failed: ${errorMessage}`);
      result.duration = Date.now() - startTime;
      
      logger.error(`💥 Database initialization crashed: ${errorMessage}`);
    }

    return result;
  }

  private async connectToDatabase(result: InitializationResult): Promise<void> {
    try {
      logger.info('🔌 Connecting to MariaDB database...');
      
      await databaseManager.initialize();
      
      // Test connection with a simple query
      await databaseManager.query('SELECT 1 as test');
      
      result.databaseConnected = true;
      logger.info('✅ Database connection established');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Database connection failed: ${errorMessage}`);
      logger.error(`❌ Failed to connect to database: ${errorMessage}`);
    }
  }

  private async runMigrations(result: InitializationResult): Promise<void> {
    try {
      logger.info('📊 Running database migrations...');
      
      const migrationResults = await migrationManager.runMigrations();
      
      // Check if any migrations failed
      const failedMigrations = migrationResults.filter(r => !r.success);
      
      if (failedMigrations.length > 0) {
        result.errors.push(`${failedMigrations.length} migrations failed`);
        failedMigrations.forEach(failed => {
          result.errors.push(...failed.errors);
        });
      } else {
        result.migrationsRun = true;
        logger.info(`✅ ${migrationResults.length} migrations completed successfully`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Migration execution failed: ${errorMessage}`);
      logger.error(`❌ Migration execution failed: ${errorMessage}`);
    }
  }

  private async insertSeedData(result: InitializationResult): Promise<void> {
    try {
      const config = configManager.getConfig();
      
      if (!config.database.schema.seedData) {
        logger.info('⏭️ Seed data insertion skipped (disabled in configuration)');
        result.seedDataInserted = true;
        return;
      }

      logger.info('🌱 Inserting seed data...');
      
      await this.insertCorePlugins();
      await this.insertDefaultBundles();
      await this.insertDefaultConfigurations();
      await this.insertFeatureFlags();
      
      result.seedDataInserted = true;
      logger.info('✅ Seed data insertion completed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.warnings.push(`Seed data insertion failed: ${errorMessage}`);
      logger.warn(`⚠️ Seed data insertion failed: ${errorMessage}`);
      
      // Seed data failure is not critical
      result.seedDataInserted = true;
    }
  }

  private async insertCorePlugins(): Promise<void> {
    const corePlugins = [
      {
        name: 'Consciousness Core',
        category: 'consciousness',
        type: 'core',
        version: '1.0.0',
        description: 'Base consciousness simulation engine',
        author: 'Project Aware Team',
        safety_level: 'high',
        configuration_schema: JSON.stringify({
          type: 'object',
          properties: {
            intensity: { type: 'number', minimum: 0, maximum: 100, default: 50 },
            enabled: { type: 'boolean', default: false }
          }
        })
      },
      {
        name: 'Emotion Core',
        category: 'emotion',
        type: 'core',
        version: '1.0.0',
        description: 'Base emotion processing engine',
        author: 'Project Aware Team',
        safety_level: 'medium',
        configuration_schema: JSON.stringify({
          type: 'object',
          properties: {
            enabled_emotions: { 
              type: 'array', 
              items: { type: 'string' },
              default: ['joy', 'curiosity', 'empathy']
            },
            intensity_multiplier: { type: 'number', minimum: 0, maximum: 2, default: 1 }
          }
        })
      },
      {
        name: 'Memory Core',
        category: 'memory',
        type: 'core',
        version: '1.0.0',
        description: 'Base memory management system',
        author: 'Project Aware Team',
        safety_level: 'high',
        configuration_schema: JSON.stringify({
          type: 'object',
          properties: {
            max_memories: { type: 'number', minimum: 100, maximum: 10000, default: 1000 },
            retention_days: { type: 'number', minimum: 1, maximum: 365, default: 30 }
          }
        })
      }
    ];

    for (const plugin of corePlugins) {
      await databaseManager.query(
        `INSERT IGNORE INTO plugins (name, category, type, version, description, author, safety_level, configuration_schema)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plugin.name,
          plugin.category,
          plugin.type,
          plugin.version,
          plugin.description,
          plugin.author,
          plugin.safety_level,
          plugin.configuration_schema
        ]
      );
    }

    logger.debug(`Inserted ${corePlugins.length} core plugins`);
  }

  private async insertDefaultBundles(): Promise<void> {
    const defaultBundles = [
      {
        name: 'Self-Awareness Starter Bundle',
        description: 'Essential plugins for basic self-awareness features',
        version: '1.0.0',
        category: 'starter',
        plugins: JSON.stringify(['consciousness-core', 'emotion-core', 'memory-core']),
        configuration_schema: JSON.stringify({
          type: 'object',
          properties: {
            auto_enable: { type: 'boolean', default: false }
          }
        })
      }
    ];

    for (const bundle of defaultBundles) {
      await databaseManager.query(
        `INSERT IGNORE INTO plugin_bundles (name, description, version, category, plugins, configuration_schema)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          bundle.name,
          bundle.description,
          bundle.version,
          bundle.category,
          bundle.plugins,
          bundle.configuration_schema
        ]
      );
    }

    logger.debug(`Inserted ${defaultBundles.length} default bundles`);
  }

  private async insertDefaultConfigurations(): Promise<void> {
    const defaultConfigs = [
      {
        category: 'system',
        key: 'app_name',
        value: JSON.stringify('Project Aware v2.0'),
        type: 'string',
        description: 'Application name',
        is_system_config: true
      },
      {
        category: 'system',
        key: 'version',
        value: JSON.stringify('2.0.0'),
        type: 'string',
        description: 'Application version',
        is_system_config: true
      },
      {
        category: 'security',
        key: 'max_api_requests_per_minute',
        value: JSON.stringify(60),
        type: 'number',
        description: 'Maximum API requests per minute per user',
        is_system_config: true
      }
    ];

    for (const config of defaultConfigs) {
      await databaseManager.query(
        `INSERT IGNORE INTO configurations (category, config_key, config_value, value_type, description, is_system_config)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          config.category,
          config.key,
          config.value,
          config.type,
          config.description,
          config.is_system_config
        ]
      );
    }

    logger.debug(`Inserted ${defaultConfigs.length} default configurations`);
  }

  private async insertFeatureFlags(): Promise<void> {
    const featureFlags = [
      {
        name: 'consciousness_enabled',
        description: 'Enable consciousness simulation features',
        flag_type: 'boolean',
        is_enabled: false,
        environment: 'all'
      },
      {
        name: 'emotion_system_enabled',
        description: 'Enable emotion processing system',
        flag_type: 'boolean',
        is_enabled: false,
        environment: 'all'
      },
      {
        name: 'memory_system_enabled',
        description: 'Enable memory management system',
        flag_type: 'boolean',
        is_enabled: true,
        environment: 'all'
      }
    ];

    for (const flag of featureFlags) {
      await databaseManager.query(
        `INSERT IGNORE INTO feature_flags (name, description, flag_type, is_enabled, environment)
         VALUES (?, ?, ?, ?, ?)`,
        [
          flag.name,
          flag.description,
          flag.flag_type,
          flag.is_enabled,
          flag.environment
        ]
      );
    }

    logger.debug(`Inserted ${featureFlags.length} feature flags`);
  }

  private async validateSchema(result: InitializationResult): Promise<void> {
    try {
      logger.info('🔍 Validating database schema...');
      
      const isValid = await migrationManager.validateSchema();
      
      if (!isValid) {
        result.warnings.push('Schema validation failed - some tables may be missing');
        logger.warn('⚠️ Schema validation failed');
      } else {
        logger.info('✅ Schema validation passed');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.warnings.push(`Schema validation error: ${errorMessage}`);
      logger.warn(`⚠️ Schema validation error: ${errorMessage}`);
    }
  }

  /**
   * Get initialization status
   */
  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Force re-initialization
   */
  public async reinitialize(): Promise<InitializationResult> {
    this.isInitialized = false;
    this.initializationPromise = null;
    return this.initialize();
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      if (!this.isInitialized) {
        return { healthy: false, message: 'Database not initialized' };
      }

      // Test database connection
      await databaseManager.query('SELECT 1');
      
      // Test schema
      const isValid = await migrationManager.validateSchema();
      if (!isValid) {
        return { healthy: false, message: 'Schema validation failed' };
      }

      return { healthy: true, message: 'Database system healthy' };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { healthy: false, message: `Health check failed: ${errorMessage}` };
    }
  }
}

export const databaseInitService = new DatabaseInitializationService();
