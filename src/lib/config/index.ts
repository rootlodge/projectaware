/**
 * Configuration System Index
 * 
 * Central export point for the TypeScript configuration system
 */

// Core configuration
export {
  ConfigManager,
  getConfig,
  getConfigSection,
  isFirstTime,
  DEFAULT_CONFIG,
  type AppConfig,
  type OnboardingConfig,
  type AuthConfig,
  type SystemConfig,
  type UIConfig,
  type SecurityConfig,
  type PerformanceConfig,
  type NotificationConfig,
  type BackupConfig,
} from './app-config';

// Utilities and shortcuts
export {
  Config,
  migrateFromEnv,
  getEnvVar,
  useConfig,
  createConfigBackup,
  restoreConfigBackup,
  validateConfig,
  getConfigSummary,
} from './config-utils';

// Migration utilities
export {
  migrateConfiguration,
  createConfigBackup as createMigrationBackup,
  validateCurrentConfig,
  generateMigrationReport,
} from './migration';
