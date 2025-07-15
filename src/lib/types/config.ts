/**
 * Project Aware v2.0 - Core Configuration Types
 * 
 * Comprehensive configuration system supporting:
 * - Plugin-first architecture
 * - Bundle management
 * - Environment detection
 * - Feature flags
 * - Database configuration
 * - API settings
 * - Security policies
 */

export interface AppConfig {
  environment: Environment;
  database: DatabaseConfig;
  plugins: PluginConfig;
  bundles: BundleConfig;
  features: FeatureFlags;
  api: APIConfig;
  security: SecurityConfig;
  logging: LoggingConfig;
  monitoring: MonitoringConfig;
}

export interface Environment {
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
  isLocal: boolean;
  isCloud: boolean;
  isDocker: boolean;
  platform: 'local' | 'docker' | 'kubernetes' | 'cloud';
  version: string;
  buildTime: string;
}

export interface DatabaseConfig {
  type: 'mariadb' | 'mysql' | 'postgresql' | 'sqlite';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolSize: number;
  connectionTimeout: number;
  schema: {
    autoMigrate: boolean;
    seedData: boolean;
    backupEnabled: boolean;
  };
  mariadb?: {
    compression: boolean;
    jsonColumns: boolean;
    generatedColumns: boolean;
    clustering: boolean;
  };
}

export interface PluginConfig {
  enabled: boolean;
  autoLoad: boolean;
  sandboxing: boolean;
  maxPlugins: number;
  pluginPaths: string[];
  security: {
    allowUnsigned: boolean;
    requireApproval: boolean;
    resourceLimits: {
      memory: number; // MB
      cpu: number; // percentage
      storage: number; // MB
    };
  };
  consciousness: ConsciousnessPluginConfig;
  emotions: EmotionPluginConfig;
  memory: MemoryPluginConfig;
  goals: GoalPluginConfig;
  identity: IdentityPluginConfig;
}

export interface BundleConfig {
  enabled: boolean;
  autoInstall: boolean;
  atomicOperations: boolean;
  dependencyResolution: boolean;
  marketplace: {
    enabled: boolean;
    url: string;
    apiKey?: string;
  };
  bundlePaths: string[];
}

export interface ConsciousnessPluginConfig {
  enabled: boolean;
  intensity: number; // 0-100
  introspection: boolean;
  metacognition: boolean;
  selfMonitoring: boolean;
  uncertaintyQuantification: boolean;
}

export interface EmotionPluginConfig {
  enabled: boolean;
  coreBundle: {
    enabled: boolean;
    intensity: number; // 0-100
    persistence: 'session' | 'permanent' | 'none';
    decayRate: number; // 0-1
  };
  individualEmotions: {
    joy: { enabled: boolean; intensity: number };
    sadness: { enabled: boolean; intensity: number };
    curiosity: { enabled: boolean; intensity: number };
    frustration: { enabled: boolean; intensity: number };
    empathy: { enabled: boolean; intensity: number };
    humor: { enabled: boolean; intensity: number };
    concern: { enabled: boolean; intensity: number };
  };
  triggers: {
    enabled: boolean;
    contextual: boolean;
    userBased: boolean;
  };
  decisionInfluence: boolean;
}

export interface MemoryPluginConfig {
  enabled: boolean;
  coreBundle: {
    enabled: boolean;
    shortTerm: {
      enabled: boolean;
      capacity: number; // items
      duration: number; // minutes
    };
    longTerm: {
      enabled: boolean;
      compression: boolean;
      indexing: boolean;
    };
  };
  advancedBundle: {
    enabled: boolean;
    episodic: boolean;
    semantic: boolean;
    associative: boolean;
  };
  retention: {
    policy: 'time-based' | 'importance-based' | 'user-controlled';
    maxAge: number; // days
    compressionThreshold: number; // items
  };
}

export interface GoalPluginConfig {
  enabled: boolean;
  userGoals: {
    enabled: boolean;
    maxGoals: number;
    prioritization: boolean;
  };
  autonomousGoals: {
    enabled: boolean; // OFF by default
    requireApproval: boolean; // REQUIRED
    safetyConstraints: boolean;
    maxAutonomousGoals: number;
  };
  taskManagement: {
    enabled: boolean;
    autoBreakdown: boolean;
    progressTracking: boolean;
  };
  integration: {
    contextAware: boolean;
    emotionInfluenced: boolean;
    memoryBased: boolean;
  };
}

export interface IdentityPluginConfig {
  enabled: boolean; // OFF by default - HIGH SECURITY
  lockEnabled: boolean; // Master safety switch
  coreProtection: {
    enabled: boolean;
    immutableTraits: string[];
    backupEnabled: boolean;
  };
  adaptiveTraits: {
    enabled: boolean;
    changeThreshold: number;
    userApprovalRequired: boolean;
  };
  nameRecognition: {
    enabled: boolean;
    contextualUsage: boolean;
    multiUser: boolean;
  };
}

export interface FeatureFlags {
  selfAwareness: boolean;
  pluginSystem: boolean;
  bundleSystem: boolean;
  apiGateway: boolean;
  multiTenant: boolean;
  realTimeUpdates: boolean;
  advancedStyling: boolean;
  debug: boolean;
  beta: boolean;
  experimental: boolean;
  environmentOverrides?: Record<string, Record<string, boolean>>;
}

export interface APIConfig {
  enabled: boolean;
  port: number;
  basePath: string;
  cors: {
    enabled: boolean;
    origins: string[];
    credentials: boolean;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  authentication: {
    required: boolean;
    jwtSecret: string;
    jwtExpiration: string;
    apiKeys: {
      enabled: boolean;
      keyLength: number;
      scopes: string[];
    };
  };
  plugins: {
    discoveryEnabled: boolean;
    orchestrationEnabled: boolean;
    realTimeStreaming: boolean;
  };
  documentation: {
    enabled: boolean;
    swagger: boolean;
    redoc: boolean;
  };
}

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
    saltRounds: number;
  };
  plugins: {
    sandboxing: boolean;
    codeScanning: boolean;
    resourceLimits: boolean;
    auditLogging: boolean;
  };
  api: {
    httpsOnly: boolean;
    contentSecurityPolicy: boolean;
    rateLimiting: boolean;
    inputValidation: boolean;
  };
  identity: {
    protectionLevel: 'strict' | 'moderate' | 'permissive';
    changeApprovalRequired: boolean;
    backupFrequency: number; // hours
  };
  selfModification: {
    enabled: boolean;
    safetyMonitoring: boolean;
    rollbackEnabled: boolean;
    approvalRequired: boolean;
  };
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enabled: boolean;
  console: boolean;
  file: boolean;
  database: boolean;
  remote: boolean;
  structured: boolean;
  plugins: {
    activities: boolean;
    errors: boolean;
    performance: boolean;
    security: boolean;
  };
  retention: {
    days: number;
    maxSize: number; // MB
    compression: boolean;
  };
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: {
    application: boolean;
    plugins: boolean;
    database: boolean;
    api: boolean;
  };
  alerts: {
    enabled: boolean;
    thresholds: {
      cpu: number;
      memory: number;
      errorRate: number;
      responseTime: number;
    };
    notifications: {
      email: boolean;
      slack: boolean;
      webhook: string;
    };
  };
  healthChecks: {
    enabled: boolean;
    interval: number; // seconds
    timeout: number; // seconds
  };
}

// Plugin-specific configuration interfaces
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  dependencies: string[];
  bundleId?: string;
  type: 'individual' | 'bundled' | 'core';
  category: 'consciousness' | 'emotion' | 'memory' | 'goal' | 'identity' | 'core' | 'utility';
  security: {
    level: 'low' | 'medium' | 'high' | 'critical';
    permissions: string[];
    sandbox: boolean;
  };
}

export interface BundleMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  plugins: string[];
  installBehavior: 'atomic' | 'individual';
  dependencies: string[];
  type: 'required' | 'optional' | 'enhancement';
}

// Environment detection utilities
export interface EnvironmentDetection {
  isLocal(): boolean;
  isDocker(): boolean;
  isKubernetes(): boolean;
  isCloud(): boolean;
  getVersion(): string;
  getBuildTime(): string;
  getPlatform(): Environment['platform'];
}

// Configuration validation
export interface ConfigValidation {
  validate(config: AppConfig): ConfigValidationResult;
  validatePlugin(plugin: PluginMetadata): boolean;
  validateBundle(bundle: BundleMetadata): boolean;
  validateSecurity(config: SecurityConfig): boolean;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  criticalIssues: string[];
}
