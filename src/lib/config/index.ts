/**
 * Project Aware v2.0 - Configuration System Implementation
 * 
 * Comprehensive configuration management with:
 * - Environment detection
 * - Plugin/Bundle configuration
 * - Feature flags
 * - Security settings
 * - Database configuration
 * - Hot reloading support
 */

import { 
  AppConfig, 
  Environment, 
  DatabaseConfig, 
  PluginConfig, 
  BundleConfig,
  FeatureFlags, 
  APIConfig, 
  SecurityConfig, 
  LoggingConfig, 
  MonitoringConfig,
  ConfigValidation,
  ConfigValidationResult,
  EnvironmentDetection,
  PluginMetadata,
  BundleMetadata
} from '@/lib/types/config';

class ConfigurationManager {
  private config: AppConfig;
  private watchers: Map<string, (value: unknown) => void> = new Map();
  private environment: Environment;

  constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  /**
   * Environment Detection
   */
  private detectEnvironment(): Environment {
    const nodeEnv = (process.env.NODE_ENV as Environment['NODE_ENV']) || 'development';
    const isDocker = process.env.DOCKER_CONTAINER === 'true' || !!process.env.KUBERNETES_SERVICE_HOST;
    const isKubernetes = !!process.env.KUBERNETES_SERVICE_HOST;
    const isCloud = !!process.env.CLOUD_PROVIDER || !!process.env.VERCEL || !!process.env.NETLIFY;
    const isLocal = !isDocker && !isKubernetes && !isCloud;

    let platform: Environment['platform'] = 'local';
    if (isKubernetes) platform = 'kubernetes';
    else if (isDocker) platform = 'docker';
    else if (isCloud) platform = 'cloud';

    return {
      NODE_ENV: nodeEnv,
      isLocal,
      isCloud,
      isDocker,
      platform,
      version: process.env.APP_VERSION || '2.0.0-dev',
      buildTime: process.env.BUILD_TIME || new Date().toISOString()
    };
  }

  /**
   * Configuration Loading with Environment-Specific Defaults
   */
  private loadConfiguration(): AppConfig {
    return {
      environment: this.environment,
      database: this.loadDatabaseConfig(),
      plugins: this.loadPluginConfig(),
      bundles: this.loadBundleConfig(),
      features: this.loadFeatureFlags(),
      api: this.loadAPIConfig(),
      security: this.loadSecurityConfig(),
      logging: this.loadLoggingConfig(),
      monitoring: this.loadMonitoringConfig()
    };
  }

  private loadDatabaseConfig(): DatabaseConfig {
    const isProduction = this.environment.NODE_ENV === 'production';
    
    return {
      type: (process.env.DB_TYPE as DatabaseConfig['type']) || 'mariadb',
      host: process.env.DB_HOST || (this.environment.isDocker ? 'database' : 'localhost'),
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'projectaware',
      username: process.env.DB_USER || 'projectaware',
      password: process.env.DB_PASSWORD || 'projectaware_dev',
      ssl: process.env.DB_SSL === 'true' || isProduction,
      poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
      connectionTimeout: parseInt(process.env.DB_TIMEOUT || '60000'),
      schema: {
        autoMigrate: process.env.DB_AUTO_MIGRATE === 'true' || !isProduction,
        seedData: process.env.DB_SEED === 'true' || !isProduction,
        backupEnabled: process.env.DB_BACKUP === 'true' || isProduction
      },
      mariadb: {
        compression: process.env.DB_COMPRESSION === 'true' || isProduction,
        jsonColumns: process.env.DB_JSON_COLUMNS === 'false' ? false : true,
        generatedColumns: process.env.DB_GENERATED_COLUMNS === 'false' ? false : true,
        clustering: process.env.DB_CLUSTERING === 'true' || isProduction
      }
    };
  }

  private loadPluginConfig(): PluginConfig {
    const isDevelopment = this.environment.NODE_ENV === 'development';
    
    return {
      enabled: process.env.PLUGINS_ENABLED !== 'false',
      autoLoad: process.env.PLUGINS_AUTO_LOAD !== 'false',
      sandboxing: process.env.PLUGINS_SANDBOX !== 'false',
      maxPlugins: parseInt(process.env.PLUGINS_MAX || '50'),
      pluginPaths: process.env.PLUGINS_PATHS?.split(',') || ['./src/lib/plugins'],
      security: {
        allowUnsigned: process.env.PLUGINS_ALLOW_UNSIGNED === 'true' || isDevelopment,
        requireApproval: process.env.PLUGINS_REQUIRE_APPROVAL !== 'false',
        resourceLimits: {
          memory: parseInt(process.env.PLUGINS_MEMORY_LIMIT || '256'),
          cpu: parseInt(process.env.PLUGINS_CPU_LIMIT || '50'),
          storage: parseInt(process.env.PLUGINS_STORAGE_LIMIT || '100')
        }
      },
      consciousness: {
        enabled: process.env.CONSCIOUSNESS_ENABLED === 'true',
        intensity: parseInt(process.env.CONSCIOUSNESS_INTENSITY || '50'),
        introspection: process.env.CONSCIOUSNESS_INTROSPECTION === 'true',
        metacognition: process.env.CONSCIOUSNESS_METACOGNITION === 'true',
        selfMonitoring: process.env.CONSCIOUSNESS_MONITORING === 'true',
        uncertaintyQuantification: process.env.CONSCIOUSNESS_UNCERTAINTY === 'true'
      },
      emotions: {
        enabled: process.env.EMOTIONS_ENABLED === 'true',
        coreBundle: {
          enabled: process.env.EMOTIONS_CORE_ENABLED === 'true',
          intensity: parseInt(process.env.EMOTIONS_INTENSITY || '50'),
          persistence: (process.env.EMOTIONS_PERSISTENCE as 'session' | 'permanent' | 'none') || 'session',
          decayRate: parseFloat(process.env.EMOTIONS_DECAY_RATE || '0.1')
        },
        individualEmotions: {
          joy: { 
            enabled: process.env.EMOTION_JOY_ENABLED === 'true', 
            intensity: parseInt(process.env.EMOTION_JOY_INTENSITY || '50') 
          },
          sadness: { 
            enabled: process.env.EMOTION_SADNESS_ENABLED === 'true', 
            intensity: parseInt(process.env.EMOTION_SADNESS_INTENSITY || '50') 
          },
          curiosity: { 
            enabled: process.env.EMOTION_CURIOSITY_ENABLED === 'true', 
            intensity: parseInt(process.env.EMOTION_CURIOSITY_INTENSITY || '75') 
          },
          frustration: { 
            enabled: process.env.EMOTION_FRUSTRATION_ENABLED === 'true', 
            intensity: parseInt(process.env.EMOTION_FRUSTRATION_INTENSITY || '30') 
          },
          empathy: { 
            enabled: process.env.EMOTION_EMPATHY_ENABLED === 'true', 
            intensity: parseInt(process.env.EMOTION_EMPATHY_INTENSITY || '60') 
          },
          humor: { 
            enabled: process.env.EMOTION_HUMOR_ENABLED === 'true', 
            intensity: parseInt(process.env.EMOTION_HUMOR_INTENSITY || '40') 
          },
          concern: { 
            enabled: process.env.EMOTION_CONCERN_ENABLED === 'true', 
            intensity: parseInt(process.env.EMOTION_CONCERN_INTENSITY || '50') 
          }
        },
        triggers: {
          enabled: process.env.EMOTION_TRIGGERS_ENABLED === 'true',
          contextual: process.env.EMOTION_TRIGGERS_CONTEXTUAL === 'true',
          userBased: process.env.EMOTION_TRIGGERS_USER_BASED === 'true'
        },
        decisionInfluence: process.env.EMOTION_DECISION_INFLUENCE === 'true'
      },
      memory: {
        enabled: process.env.MEMORY_ENABLED === 'true',
        coreBundle: {
          enabled: process.env.MEMORY_CORE_ENABLED === 'true',
          shortTerm: {
            enabled: process.env.MEMORY_SHORT_TERM_ENABLED === 'true',
            capacity: parseInt(process.env.MEMORY_SHORT_TERM_CAPACITY || '100'),
            duration: parseInt(process.env.MEMORY_SHORT_TERM_DURATION || '60')
          },
          longTerm: {
            enabled: process.env.MEMORY_LONG_TERM_ENABLED === 'true',
            compression: process.env.MEMORY_COMPRESSION === 'true',
            indexing: process.env.MEMORY_INDEXING === 'true'
          }
        },
        advancedBundle: {
          enabled: process.env.MEMORY_ADVANCED_ENABLED === 'true',
          episodic: process.env.MEMORY_EPISODIC === 'true',
          semantic: process.env.MEMORY_SEMANTIC === 'true',
          associative: process.env.MEMORY_ASSOCIATIVE === 'true'
        },
        retention: {
          policy: (process.env.MEMORY_RETENTION_POLICY as 'time-based' | 'importance-based' | 'user-controlled') || 'time-based',
          maxAge: parseInt(process.env.MEMORY_MAX_AGE || '30'),
          compressionThreshold: parseInt(process.env.MEMORY_COMPRESSION_THRESHOLD || '1000')
        }
      },
      goals: {
        enabled: process.env.GOALS_ENABLED === 'true',
        userGoals: {
          enabled: process.env.GOALS_USER_ENABLED === 'true',
          maxGoals: parseInt(process.env.GOALS_MAX_USER || '10'),
          prioritization: process.env.GOALS_PRIORITIZATION === 'true'
        },
        autonomousGoals: {
          enabled: process.env.GOALS_AUTONOMOUS_ENABLED === 'true', // OFF by default
          requireApproval: process.env.GOALS_AUTONOMOUS_APPROVAL !== 'false', // REQUIRED
          safetyConstraints: process.env.GOALS_SAFETY_CONSTRAINTS !== 'false',
          maxAutonomousGoals: parseInt(process.env.GOALS_MAX_AUTONOMOUS || '3')
        },
        taskManagement: {
          enabled: process.env.GOALS_TASK_MANAGEMENT === 'true',
          autoBreakdown: process.env.GOALS_AUTO_BREAKDOWN === 'true',
          progressTracking: process.env.GOALS_PROGRESS_TRACKING === 'true'
        },
        integration: {
          contextAware: process.env.GOALS_CONTEXT_AWARE === 'true',
          emotionInfluenced: process.env.GOALS_EMOTION_INFLUENCED === 'true',
          memoryBased: process.env.GOALS_MEMORY_BASED === 'true'
        }
      },
      identity: {
        enabled: process.env.IDENTITY_ENABLED === 'true', // OFF by default - HIGH SECURITY
        lockEnabled: process.env.IDENTITY_LOCK_ENABLED !== 'false', // Master safety switch
        coreProtection: {
          enabled: process.env.IDENTITY_CORE_PROTECTION !== 'false',
          immutableTraits: process.env.IDENTITY_IMMUTABLE_TRAITS?.split(',') || ['core_personality', 'ethical_framework'],
          backupEnabled: process.env.IDENTITY_BACKUP_ENABLED !== 'false'
        },
        adaptiveTraits: {
          enabled: process.env.IDENTITY_ADAPTIVE_ENABLED === 'true',
          changeThreshold: parseFloat(process.env.IDENTITY_CHANGE_THRESHOLD || '0.1'),
          userApprovalRequired: process.env.IDENTITY_USER_APPROVAL !== 'false'
        },
        nameRecognition: {
          enabled: process.env.IDENTITY_NAME_RECOGNITION === 'true',
          contextualUsage: process.env.IDENTITY_CONTEXTUAL_USAGE === 'true',
          multiUser: process.env.IDENTITY_MULTI_USER === 'true'
        }
      }
    };
  }

  private loadBundleConfig(): BundleConfig {
    return {
      enabled: process.env.BUNDLES_ENABLED !== 'false',
      autoInstall: process.env.BUNDLES_AUTO_INSTALL === 'true',
      atomicOperations: process.env.BUNDLES_ATOMIC !== 'false',
      dependencyResolution: process.env.BUNDLES_DEPENDENCY_RESOLUTION !== 'false',
      marketplace: {
        enabled: process.env.BUNDLES_MARKETPLACE_ENABLED === 'true',
        url: process.env.BUNDLES_MARKETPLACE_URL || 'https://marketplace.projectaware.ai',
        apiKey: process.env.BUNDLES_MARKETPLACE_API_KEY
      },
      bundlePaths: process.env.BUNDLES_PATHS?.split(',') || ['./src/lib/bundles']
    };
  }

  private loadFeatureFlags(): FeatureFlags {
    const isDevelopment = this.environment.NODE_ENV === 'development';
    
    return {
      selfAwareness: process.env.FEATURE_SELF_AWARENESS === 'true',
      pluginSystem: process.env.FEATURE_PLUGIN_SYSTEM !== 'false',
      bundleSystem: process.env.FEATURE_BUNDLE_SYSTEM !== 'false',
      apiGateway: process.env.FEATURE_API_GATEWAY !== 'false',
      multiTenant: process.env.FEATURE_MULTI_TENANT === 'true',
      realTimeUpdates: process.env.FEATURE_REAL_TIME_UPDATES === 'true',
      advancedStyling: process.env.FEATURE_ADVANCED_STYLING !== 'false',
      debug: process.env.FEATURE_DEBUG === 'true' || isDevelopment,
      beta: process.env.FEATURE_BETA === 'true',
      experimental: process.env.FEATURE_EXPERIMENTAL === 'true' && isDevelopment
    };
  }

  private loadAPIConfig(): APIConfig {
    return {
      enabled: process.env.API_ENABLED !== 'false',
      port: parseInt(process.env.API_PORT || process.env.PORT || '3000'),
      basePath: process.env.API_BASE_PATH || '/api',
      cors: {
        enabled: process.env.API_CORS_ENABLED !== 'false',
        origins: process.env.API_CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: process.env.API_CORS_CREDENTIALS === 'true'
      },
      rateLimit: {
        enabled: process.env.API_RATE_LIMIT_ENABLED !== 'false',
        windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        maxRequests: parseInt(process.env.API_RATE_LIMIT_MAX || '100'),
        skipSuccessfulRequests: process.env.API_RATE_LIMIT_SKIP_SUCCESS === 'true'
      },
      authentication: {
        required: process.env.API_AUTH_REQUIRED !== 'false',
        jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
        jwtExpiration: process.env.JWT_EXPIRATION || '1h',
        apiKeys: {
          enabled: process.env.API_KEYS_ENABLED !== 'false',
          keyLength: parseInt(process.env.API_KEY_LENGTH || '32'),
          scopes: process.env.API_KEY_SCOPES?.split(',') || ['read', 'write']
        }
      },
      plugins: {
        discoveryEnabled: process.env.API_PLUGIN_DISCOVERY !== 'false',
        orchestrationEnabled: process.env.API_PLUGIN_ORCHESTRATION !== 'false',
        realTimeStreaming: process.env.API_REAL_TIME_STREAMING === 'true'
      },
      documentation: {
        enabled: process.env.API_DOCS_ENABLED !== 'false',
        swagger: process.env.API_SWAGGER !== 'false',
        redoc: process.env.API_REDOC === 'true'
      }
    };
  }

  private loadSecurityConfig(): SecurityConfig {
    const isProduction = this.environment.NODE_ENV === 'production';
    
    return {
      encryption: {
        algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
        keyLength: parseInt(process.env.ENCRYPTION_KEY_LENGTH || '32'),
        saltRounds: parseInt(process.env.ENCRYPTION_SALT_ROUNDS || '12')
      },
      plugins: {
        sandboxing: process.env.SECURITY_PLUGIN_SANDBOX !== 'false',
        codeScanning: process.env.SECURITY_CODE_SCANNING === 'true' || isProduction,
        resourceLimits: process.env.SECURITY_RESOURCE_LIMITS !== 'false',
        auditLogging: process.env.SECURITY_AUDIT_LOGGING !== 'false'
      },
      api: {
        httpsOnly: process.env.SECURITY_HTTPS_ONLY === 'true' || isProduction,
        contentSecurityPolicy: process.env.SECURITY_CSP !== 'false',
        rateLimiting: process.env.SECURITY_RATE_LIMITING !== 'false',
        inputValidation: process.env.SECURITY_INPUT_VALIDATION !== 'false'
      },
      identity: {
        protectionLevel: (process.env.SECURITY_IDENTITY_LEVEL as 'strict' | 'moderate' | 'permissive') || 'strict',
        changeApprovalRequired: process.env.SECURITY_IDENTITY_APPROVAL !== 'false',
        backupFrequency: parseInt(process.env.SECURITY_IDENTITY_BACKUP_FREQ || '24')
      },
      selfModification: {
        enabled: process.env.SECURITY_SELF_MOD_ENABLED === 'true',
        safetyMonitoring: process.env.SECURITY_SELF_MOD_MONITORING !== 'false',
        rollbackEnabled: process.env.SECURITY_SELF_MOD_ROLLBACK !== 'false',
        approvalRequired: process.env.SECURITY_SELF_MOD_APPROVAL !== 'false'
      }
    };
  }

  private loadLoggingConfig(): LoggingConfig {
    const isDevelopment = this.environment.NODE_ENV === 'development';
    
    return {
      level: (process.env.LOG_LEVEL as LoggingConfig['level']) || (isDevelopment ? 'debug' : 'info'),
      enabled: process.env.LOGGING_ENABLED !== 'false',
      console: process.env.LOGGING_CONSOLE !== 'false',
      file: process.env.LOGGING_FILE === 'true',
      database: process.env.LOGGING_DATABASE === 'true',
      remote: process.env.LOGGING_REMOTE === 'true',
      structured: process.env.LOGGING_STRUCTURED !== 'false',
      plugins: {
        activities: process.env.LOGGING_PLUGIN_ACTIVITIES !== 'false',
        errors: process.env.LOGGING_PLUGIN_ERRORS !== 'false',
        performance: process.env.LOGGING_PLUGIN_PERFORMANCE === 'true',
        security: process.env.LOGGING_PLUGIN_SECURITY !== 'false'
      },
      retention: {
        days: parseInt(process.env.LOG_RETENTION_DAYS || '30'),
        maxSize: parseInt(process.env.LOG_MAX_SIZE || '100'),
        compression: process.env.LOG_COMPRESSION === 'true'
      }
    };
  }

  private loadMonitoringConfig(): MonitoringConfig {
    const isProduction = this.environment.NODE_ENV === 'production';
    
    return {
      enabled: process.env.MONITORING_ENABLED === 'true' || isProduction,
      metrics: {
        application: process.env.MONITORING_APP_METRICS !== 'false',
        plugins: process.env.MONITORING_PLUGIN_METRICS === 'true',
        database: process.env.MONITORING_DB_METRICS !== 'false',
        api: process.env.MONITORING_API_METRICS !== 'false'
      },
      alerts: {
        enabled: process.env.MONITORING_ALERTS_ENABLED === 'true',
        thresholds: {
          cpu: parseFloat(process.env.MONITORING_CPU_THRESHOLD || '80'),
          memory: parseFloat(process.env.MONITORING_MEMORY_THRESHOLD || '85'),
          errorRate: parseFloat(process.env.MONITORING_ERROR_RATE_THRESHOLD || '5'),
          responseTime: parseInt(process.env.MONITORING_RESPONSE_TIME_THRESHOLD || '1000')
        },
        notifications: {
          email: process.env.MONITORING_EMAIL_ALERTS === 'true',
          slack: process.env.MONITORING_SLACK_ALERTS === 'true',
          webhook: process.env.MONITORING_WEBHOOK_URL || ''
        }
      },
      healthChecks: {
        enabled: process.env.MONITORING_HEALTH_CHECKS !== 'false',
        interval: parseInt(process.env.MONITORING_HEALTH_INTERVAL || '30'),
        timeout: parseInt(process.env.MONITORING_HEALTH_TIMEOUT || '5')
      }
    };
  }

  /**
   * Configuration Validation
   */
  private validateConfiguration(): void {
    const validator = new ConfigValidator();
    const result = validator.validate(this.config);
    
    if (!result.valid) {
      console.error('Configuration validation failed:', result.errors);
      if (result.criticalIssues.length > 0) {
        throw new Error(`Critical configuration issues: ${result.criticalIssues.join(', ')}`);
      }
    }
    
    if (result.warnings.length > 0) {
      console.warn('Configuration warnings:', result.warnings);
    }
  }

  /**
   * Public API
   */
  public get<T = unknown>(path: string): T {
    return this.getNestedValue(this.config, path) as T;
  }

  public set<T = unknown>(path: string, value: T): void {
    this.setNestedValue(this.config, path, value);
    this.notifyWatchers(path, value);
  }

  public watch(path: string, callback: (value: unknown) => void): () => void {
    const watchKey = `${path}_${Date.now()}_${Math.random()}`;
    this.watchers.set(watchKey, callback);
    
    return () => {
      this.watchers.delete(watchKey);
    };
  }

  public getEnvironment(): Environment {
    return this.environment;
  }

  public reload(): void {
    const newConfig = this.loadConfiguration();
    this.config = newConfig;
    this.validateConfiguration();
    this.notifyWatchers('*', newConfig);
  }

  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    const value = this.config.features[feature];
    return typeof value === 'boolean' ? value : false;
  }

  public isDevelopment(): boolean {
    return this.environment.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.environment.NODE_ENV === 'production';
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Utility Methods
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getNestedValue(obj: any, path: string): unknown {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setNestedValue(obj: any, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = keys.reduce((current: any, key) => {
      if (!(key in current)) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private notifyWatchers(path: string, value: unknown): void {
    this.watchers.forEach((callback, key) => {
      if (key.startsWith(path) || path === '*') {
        callback(value);
      }
    });
  }
}

/**
 * Configuration Validator
 */
class ConfigValidator implements ConfigValidation {
  validate(config: AppConfig): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const criticalIssues: string[] = [];

    // Database validation
    if (!config.database.host) {
      errors.push('Database host is required');
    }
    if (!config.database.database) {
      errors.push('Database name is required');
    }
    if (config.environment.NODE_ENV === 'production' && config.database.password === 'projectaware_dev') {
      criticalIssues.push('Default development password detected in production');
    }

    // Security validation
    if (config.environment.NODE_ENV === 'production' && config.api.authentication.jwtSecret === 'dev-secret-change-in-production') {
      criticalIssues.push('Default JWT secret detected in production');
    }

    // Plugin safety validation
    if (config.plugins.identity.enabled && !config.plugins.identity.lockEnabled) {
      warnings.push('Identity plugins enabled without safety lock');
    }
    if (config.plugins.goals.autonomousGoals.enabled && !config.plugins.goals.autonomousGoals.requireApproval) {
      criticalIssues.push('Autonomous goals enabled without approval requirement');
    }

    // Bundle validation
    if (config.bundles.enabled && !config.bundles.atomicOperations) {
      warnings.push('Bundle operations not atomic - may cause inconsistent states');
    }

    return {
      valid: criticalIssues.length === 0 && errors.length === 0,
      errors,
      warnings,
      criticalIssues
    };
  }

  validatePlugin(plugin: PluginMetadata): boolean {
    return !!(plugin.id && plugin.name && plugin.version);
  }

  validateBundle(bundle: BundleMetadata): boolean {
    return !!(bundle.id && bundle.name && bundle.plugins && Array.isArray(bundle.plugins) && bundle.plugins.length > 0);
  }

  validateSecurity(config: SecurityConfig): boolean {
    return config.plugins.sandboxing && config.api.inputValidation;
  }
}

// Singleton instance
export const configManager = new ConfigurationManager();

// Environment detection utilities
export const environmentDetection: EnvironmentDetection = {
  isLocal: () => configManager.getEnvironment().isLocal,
  isDocker: () => configManager.getEnvironment().isDocker,
  isKubernetes: () => configManager.getEnvironment().platform === 'kubernetes',
  isCloud: () => configManager.getEnvironment().isCloud,
  getVersion: () => configManager.getEnvironment().version,
  getBuildTime: () => configManager.getEnvironment().buildTime,
  getPlatform: () => configManager.getEnvironment().platform
};

// Convenience exports
export const config = configManager;
export default configManager;
