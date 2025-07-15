/**
 * Configuration Utilities
 * 
 * Helper functions for configuration management, migration from environment variables,
 * and providing convenient access to configuration values throughout the application.
 */

import { getConfig, getConfigSection, isFirstTime, AppConfig } from './app-config';

/**
 * Environment variable migration utility
 * 
 * Maps old environment variables to new configuration paths
 */
const ENV_MIGRATION_MAP: Record<string, string> = {
  'FIRSTTIME': 'onboarding.firstTime',
  'ONBOARDING_COMPLETE': 'onboarding.onboardingComplete',
  'ONCLOUD': 'auth.cloudEnabled',
  'AUTH_PROVIDER': 'auth.provider',
  'NEXTAUTH_SECRET': 'auth.sessionSecret',
  'NEXTAUTH_URL': 'auth.baseUrl',
  'DATABASE_PATH': 'system.dataDirectory',
  'LOG_LEVEL': 'system.debugMode',
  'NODE_ENV': 'system.isDevelopment',
  'DEFAULT_THEME': 'ui.defaultTheme',
  'LOCALE': 'ui.locale',
  'ENABLE_ANIMATIONS': 'ui.enableAnimations',
  'ENABLE_SOUNDS': 'ui.enableSounds',
  'CACHE_TTL': 'performance.cacheTTL',
  'MAX_MEMORY': 'performance.maxMemoryUsage',
  'REQUEST_TIMEOUT': 'performance.requestTimeout',
  'RATE_LIMIT_RPM': 'security.rateLimiting.requestsPerMinute',
  'ENABLE_CSRF': 'security.enableCSRF',
  'COOKIE_SECURE': 'security.cookies.secure',
  'AUTO_BACKUP': 'backup.autoBackup',
  'BACKUP_FREQUENCY': 'backup.backupFrequency',
  'BACKUP_RETENTION': 'backup.backupRetention',
};

/**
 * Environment variables that should remain as env vars (essential runtime config)
 */
const ESSENTIAL_ENV_VARS = [
  'PORT',
  'HOST',
  'OLLAMA_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NODE_ENV',
];

/**
 * Migrate environment variables to configuration system
 */
export async function migrateFromEnv(): Promise<{
  migrated: number;
  skipped: string[];
  errors: string[];
}> {
  const configManager = getConfig();
  const migrated: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const [envVar, configPath] of Object.entries(ENV_MIGRATION_MAP)) {
    try {
      const envValue = process.env[envVar];
      
      if (envValue === undefined) {
        skipped.push(envVar);
        continue;
      }

      // Parse value based on expected type
      let parsedValue: any = envValue;
      
      if (envValue.toLowerCase() === 'true' || envValue.toLowerCase() === 'false') {
        parsedValue = envValue.toLowerCase() === 'true';
      } else if (!isNaN(Number(envValue))) {
        parsedValue = Number(envValue);
      }

      await configManager.setValue(configPath, parsedValue);
      migrated.push(envVar);
      
      console.log(`✅ Migrated ${envVar} -> ${configPath}: ${parsedValue}`);
    } catch (error) {
      errors.push(`${envVar}: ${error}`);
      console.error(`❌ Failed to migrate ${envVar}:`, error);
    }
  }

  return {
    migrated: migrated.length,
    skipped,
    errors,
  };
}

/**
 * Get environment variable fallback value
 * Use this for essential env vars that should not be migrated
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  if (!ESSENTIAL_ENV_VARS.includes(key)) {
    console.warn(`⚠️ ${key} should be migrated to configuration system`);
  }
  
  return process.env[key] || defaultValue;
}

/**
 * Configuration shortcuts for common values
 */
export class Config {
  private static configManager = getConfig();

  // Onboarding shortcuts
  static isFirstTime(): boolean {
    return isFirstTime();
  }

  static isOnboardingComplete(): boolean {
    return getConfigSection('onboarding').onboardingComplete;
  }

  static getCurrentOnboardingStep(): number {
    return getConfigSection('onboarding').currentStep;
  }

  static async completeOnboarding(): Promise<void> {
    await this.configManager.completeOnboarding();
  }

  static async setOnboardingStep(step: number): Promise<void> {
    await this.configManager.updateOnboardingStep(step);
  }

  // Auth shortcuts
  static isCloudEnabled(): boolean {
    return getConfigSection('auth').cloudEnabled;
  }

  static getAuthProvider(): string {
    return getConfigSection('auth').provider;
  }

  static allowsGuests(): boolean {
    return getConfigSection('auth').allowGuests;
  }

  // System shortcuts
  static getAppName(): string {
    return getConfigSection('system').appName;
  }

  static getVersion(): string {
    return getConfigSection('system').version;
  }

  static isDevelopment(): boolean {
    return getConfigSection('system').isDevelopment;
  }

  static isDebugMode(): boolean {
    return getConfigSection('system').debugMode;
  }

  static getDataDirectory(): string {
    return getConfigSection('system').dataDirectory;
  }

  // UI shortcuts
  static getDefaultTheme(): string {
    return getConfigSection('ui').defaultTheme;
  }

  static getLocale(): string {
    return getConfigSection('ui').locale;
  }

  static areAnimationsEnabled(): boolean {
    return getConfigSection('ui').enableAnimations;
  }

  static areTooltipsEnabled(): boolean {
    return getConfigSection('ui').showTooltips;
  }

  static getDefaultPageSize(): number {
    return getConfigSection('ui').defaultPageSize;
  }

  // Performance shortcuts
  static isCachingEnabled(): boolean {
    return getConfigSection('performance').enableCaching;
  }

  static getCacheTTL(): number {
    return getConfigSection('performance').cacheTTL;
  }

  static getMaxMemoryUsage(): number {
    return getConfigSection('performance').maxMemoryUsage;
  }

  static getRequestTimeout(): number {
    return getConfigSection('performance').requestTimeout;
  }

  // Security shortcuts
  static isCSRFEnabled(): boolean {
    return getConfigSection('security').enableCSRF;
  }

  static getRateLimitRPM(): number {
    return getConfigSection('security').rateLimiting.requestsPerMinute;
  }

  static isRateLimitingEnabled(): boolean {
    return getConfigSection('security').rateLimiting.enabled;
  }

  // Notification shortcuts
  static areNotificationsEnabled(): boolean {
    return getConfigSection('notifications').enabled;
  }

  static areDesktopNotificationsEnabled(): boolean {
    return getConfigSection('notifications').desktop.enabled;
  }

  static areInAppNotificationsEnabled(): boolean {
    return getConfigSection('notifications').inApp.enabled;
  }

  // Backup shortcuts
  static isAutoBackupEnabled(): boolean {
    return getConfigSection('backup').autoBackup;
  }

  static getBackupFrequency(): number {
    return getConfigSection('backup').backupFrequency;
  }

  static getBackupPath(): string {
    return getConfigSection('backup').backupPath;
  }

  // Generic value getter with type safety
  static getValue<T = any>(path: string, defaultValue?: T): T | undefined {
    const value = this.configManager.getValue(path);
    return value !== undefined ? value : defaultValue;
  }

  // Generic value setter
  static async setValue(path: string, value: any): Promise<void> {
    await this.configManager.setValue(path, value);
  }

  // Get complete config
  static getFullConfig(): AppConfig {
    return this.configManager.getConfig();
  }

  // Initialize if needed
  static async ensureInitialized(): Promise<void> {
    if (!this.configManager['initialized']) {
      await this.configManager.initialize();
    }
  }
}

/**
 * React hook for configuration values
 * Use this in React components to get reactive configuration updates
 */
export function useConfig<K extends keyof AppConfig>(section?: K) {
  // This is a placeholder - in a real implementation, you'd use React hooks
  // to subscribe to configuration changes and trigger re-renders
  
  if (section) {
    return getConfigSection(section);
  }
  
  return getConfig().getConfig();
}

/**
 * Create a configuration backup
 */
export async function createConfigBackup(): Promise<string> {
  const configManager = getConfig();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = {
    timestamp,
    version: Config.getVersion(),
    config: configManager.getConfig(),
  };
  
  return JSON.stringify(backup, null, 2);
}

/**
 * Restore configuration from backup
 */
export async function restoreConfigBackup(backupData: string): Promise<void> {
  const configManager = getConfig();
  const backup = JSON.parse(backupData);
  
  if (!backup.config) {
    throw new Error('Invalid backup format');
  }
  
  await configManager.importConfig(JSON.stringify(backup.config));
}

/**
 * Validate configuration integrity
 */
export function validateConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Check required sections
    const requiredSections = ['onboarding', 'auth', 'system', 'ui', 'security', 'performance', 'notifications', 'backup'];
    
    for (const section of requiredSections) {
      if (!config[section]) {
        errors.push(`Missing required section: ${section}`);
      }
    }
    
    // Check specific field types
    if (config.onboarding && typeof config.onboarding.firstTime !== 'boolean') {
      errors.push('onboarding.firstTime must be boolean');
    }
    
    if (config.system && typeof config.system.appName !== 'string') {
      errors.push('system.appName must be string');
    }
    
    if (config.performance && typeof config.performance.cacheTTL !== 'number') {
      errors.push('performance.cacheTTL must be number');
    }
    
    // Add more validations as needed...
    
  } catch (error) {
    errors.push(`Validation error: ${error}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration summary for debugging
 */
export function getConfigSummary(): Record<string, any> {
  const config = Config.getFullConfig();
  
  return {
    app: {
      name: config.system.appName,
      version: config.system.version,
      environment: config.system.isDevelopment ? 'development' : 'production',
    },
    onboarding: {
      firstTime: config.onboarding.firstTime,
      complete: config.onboarding.onboardingComplete,
      step: config.onboarding.currentStep,
    },
    auth: {
      provider: config.auth.provider,
      cloudEnabled: config.auth.cloudEnabled,
      allowGuests: config.auth.allowGuests,
    },
    ui: {
      theme: config.ui.defaultTheme,
      locale: config.ui.locale,
      animations: config.ui.enableAnimations,
    },
    performance: {
      caching: config.performance.enableCaching,
      cacheTTL: config.performance.cacheTTL,
      maxMemory: config.performance.maxMemoryUsage,
    },
    security: {
      csrf: config.security.enableCSRF,
      rateLimiting: config.security.rateLimiting.enabled,
      rateLimitRPM: config.security.rateLimiting.requestsPerMinute,
    },
  };
}

// Initialize configuration on module load
Config.ensureInitialized().catch(console.error);

export default Config;
