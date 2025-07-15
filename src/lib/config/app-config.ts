/**
 * Application Configuration System
 * 
 * This TypeScript configuration system replaces environment variables
 * for application settings while keeping only essential env vars like PORT.
 * 
 * All configuration is persisted in the database and can be modified at runtime.
 */

import { MemorySystem } from '../core/memory';
import fs from 'fs';
import path from 'path';

export interface OnboardingConfig {
  /** Whether this is a first-time installation */
  firstTime: boolean;
  /** Whether onboarding has been completed */
  onboardingComplete: boolean;
  /** Current onboarding step for incomplete flows */
  currentStep: number;
  /** Whether to show the welcome tour */
  showWelcomeTour: boolean;
  /** Whether to skip optional setup steps */
  skipOptionalSteps: boolean;
}

export interface AuthConfig {
  /** Whether cloud authentication is enabled */
  cloudEnabled: boolean;
  /** Authentication provider (local, github, google, etc.) */
  provider: 'local' | 'github' | 'google' | 'custom';
  /** Whether to allow guest access */
  allowGuests: boolean;
  /** Session timeout in milliseconds */
  sessionTimeout: number;
  /** Whether to remember login */
  rememberLogin: boolean;
}

export interface SystemConfig {
  /** Application name */
  appName: string;
  /** Application version */
  version: string;
  /** Development mode flag */
  isDevelopment: boolean;
  /** Debug logging enabled */
  debugMode: boolean;
  /** Data directory path */
  dataDirectory: string;
  /** Maximum log file size in MB */
  maxLogSize: number;
  /** Number of log files to keep */
  logRetention: number;
}

export interface UIConfig {
  /** Default theme (light, dark, auto) */
  defaultTheme: 'light' | 'dark' | 'auto';
  /** Language/locale setting */
  locale: string;
  /** Whether to enable animations */
  enableAnimations: boolean;
  /** Whether to show tooltips */
  showTooltips: boolean;
  /** Default page size for pagination */
  defaultPageSize: number;
  /** Whether to enable sound effects */
  enableSounds: boolean;
  /** Accessibility features enabled */
  accessibilityMode: boolean;
}

export interface SecurityConfig {
  /** Whether to enable CSRF protection */
  enableCSRF: boolean;
  /** Rate limiting settings */
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
  /** Content Security Policy settings */
  csp: {
    enabled: boolean;
    strictMode: boolean;
  };
  /** Cookie security settings */
  cookies: {
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    httpOnly: boolean;
  };
}

export interface PerformanceConfig {
  /** Whether to enable caching */
  enableCaching: boolean;
  /** Cache TTL in seconds */
  cacheTTL: number;
  /** Maximum memory usage in MB */
  maxMemoryUsage: number;
  /** Whether to enable compression */
  enableCompression: boolean;
  /** Request timeout in milliseconds */
  requestTimeout: number;
  /** Maximum concurrent requests */
  maxConcurrentRequests: number;
}

export interface NotificationConfig {
  /** Whether notifications are enabled */
  enabled: boolean;
  /** Desktop notification settings */
  desktop: {
    enabled: boolean;
    sound: boolean;
    persistTime: number;
  };
  /** Email notification settings */
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  /** In-app notification settings */
  inApp: {
    enabled: boolean;
    maxVisible: number;
    autoHide: boolean;
  };
}

export interface BackupConfig {
  /** Whether automatic backups are enabled */
  autoBackup: boolean;
  /** Backup frequency in hours */
  backupFrequency: number;
  /** Number of backups to retain */
  backupRetention: number;
  /** Backup location */
  backupPath: string;
  /** Whether to compress backups */
  compressBackups: boolean;
  /** Whether to backup to cloud */
  cloudBackup: boolean;
}

/**
 * Complete application configuration
 */
export interface AppConfig {
  onboarding: OnboardingConfig;
  auth: AuthConfig;
  system: SystemConfig;
  ui: UIConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
  notifications: NotificationConfig;
  backup: BackupConfig;
  /** Custom configuration for extensions */
  custom: Record<string, any>;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AppConfig = {
  onboarding: {
    firstTime: true,
    onboardingComplete: false,
    currentStep: 0,
    showWelcomeTour: true,
    skipOptionalSteps: false,
  },
  auth: {
    cloudEnabled: false,
    provider: 'local',
    allowGuests: true,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    rememberLogin: true,
  },
  system: {
    appName: 'Project Aware',
    version: '1.0.0',
    isDevelopment: process.env.NODE_ENV === 'development',
    debugMode: false,
    dataDirectory: './data',
    maxLogSize: 10, // 10MB
    logRetention: 7, // 7 files
  },
  ui: {
    defaultTheme: 'dark',
    locale: 'en-US',
    enableAnimations: true,
    showTooltips: true,
    defaultPageSize: 20,
    enableSounds: false,
    accessibilityMode: false,
  },
  security: {
    enableCSRF: true,
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 100,
      burstLimit: 20,
    },
    csp: {
      enabled: true,
      strictMode: false,
    },
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
    },
  },
  performance: {
    enableCaching: true,
    cacheTTL: 300, // 5 minutes
    maxMemoryUsage: 512, // 512MB
    enableCompression: true,
    requestTimeout: 30000, // 30 seconds
    maxConcurrentRequests: 10,
  },
  notifications: {
    enabled: true,
    desktop: {
      enabled: false,
      sound: false,
      persistTime: 5000,
    },
    email: {
      enabled: false,
      frequency: 'daily',
    },
    inApp: {
      enabled: true,
      maxVisible: 5,
      autoHide: true,
    },
  },
  backup: {
    autoBackup: true,
    backupFrequency: 24, // 24 hours
    backupRetention: 7, // 7 backups
    backupPath: './backups',
    compressBackups: true,
    cloudBackup: false,
  },
  custom: {},
};

/**
 * Configuration Manager
 * 
 * Handles loading, saving, and managing application configuration
 * with database persistence and runtime updates.
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  private memorySystem: MemorySystem;
  private initialized: boolean = false;
  private configPath: string;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.memorySystem = new MemorySystem();
    this.configPath = path.join(process.cwd(), 'src', 'lib', 'config', 'app-config.json');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Initialize configuration system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize memory system
      await this.memorySystem.initialize();

      // Load configuration from database first
      await this.loadFromDatabase();

      // If no database config exists, try loading from file
      if (!await this.hasConfigInDatabase()) {
        await this.loadFromFile();
        // Save to database for future use
        await this.saveToDatabase();
      }

      this.initialized = true;
      console.log('✅ Configuration system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize configuration system:', error);
      // Fall back to default configuration
      this.config = { ...DEFAULT_CONFIG };
      this.initialized = true;
    }
  }

  /**
   * Get complete configuration
   */
  public getConfig(): AppConfig {
    this.ensureInitialized();
    return { ...this.config };
  }

  /**
   * Get specific configuration section
   */
  public getSection<K extends keyof AppConfig>(section: K): AppConfig[K] {
    this.ensureInitialized();
    return { ...this.config[section] };
  }

  /**
   * Update configuration section
   */
  public async updateSection<K extends keyof AppConfig>(
    section: K,
    updates: Partial<AppConfig[K]>
  ): Promise<void> {
    this.ensureInitialized();

    this.config[section] = {
      ...this.config[section],
      ...updates,
    };

    await this.saveToDatabase();
    await this.saveToFile();
  }

  /**
   * Update specific configuration value
   */
  public async updateValue<K extends keyof AppConfig, V extends keyof AppConfig[K]>(
    section: K,
    key: V,
    value: AppConfig[K][V]
  ): Promise<void> {
    this.ensureInitialized();

    this.config[section][key] = value;

    await this.saveToDatabase();
    await this.saveToFile();
  }

  /**
   * Reset configuration to defaults
   */
  public async resetToDefaults(): Promise<void> {
    this.config = { ...DEFAULT_CONFIG };
    await this.saveToDatabase();
    await this.saveToFile();
  }

  /**
   * Reset specific section to defaults
   */
  public async resetSection<K extends keyof AppConfig>(section: K): Promise<void> {
    this.config[section] = { ...DEFAULT_CONFIG[section] };
    await this.saveToDatabase();
    await this.saveToFile();
  }

  /**
   * Export configuration to JSON
   */
  public exportConfig(): string {
    this.ensureInitialized();
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  public async importConfig(jsonConfig: string): Promise<void> {
    try {
      const newConfig = JSON.parse(jsonConfig) as AppConfig;
      
      // Validate configuration structure
      this.validateConfig(newConfig);

      this.config = newConfig;
      await this.saveToDatabase();
      await this.saveToFile();
    } catch (error) {
      throw new Error(`Invalid configuration format: ${error}`);
    }
  }

  /**
   * Get configuration value with dot notation
   */
  public getValue(path: string): any {
    this.ensureInitialized();
    
    const keys = path.split('.');
    let value: any = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Set configuration value with dot notation
   */
  public async setValue(path: string, value: any): Promise<void> {
    this.ensureInitialized();
    
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let target: any = this.config;
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
    
    await this.saveToDatabase();
    await this.saveToFile();
  }

  /**
   * Check if this is a first-time installation
   */
  public isFirstTime(): boolean {
    return this.getSection('onboarding').firstTime;
  }

  /**
   * Mark onboarding as complete
   */
  public async completeOnboarding(): Promise<void> {
    await this.updateSection('onboarding', {
      firstTime: false,
      onboardingComplete: true,
      currentStep: 0,
    });
  }

  /**
   * Update onboarding step
   */
  public async updateOnboardingStep(step: number): Promise<void> {
    await this.updateValue('onboarding', 'currentStep', step);
  }

  // Private methods

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }
  }

  private async hasConfigInDatabase(): Promise<boolean> {
    try {
      const config = await this.memorySystem.getConfigurationByKey('app_config', 'system');
      return !!config;
    } catch {
      return false;
    }
  }

  private async loadFromDatabase(): Promise<void> {
    try {
      const config = await this.memorySystem.getConfigurationByKey('app_config', 'system');
      if (config) {
        this.config = JSON.parse(config.value);
        console.log('📖 Configuration loaded from database');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load configuration from database:', error);
    }
  }

  private async saveToDatabase(): Promise<void> {
    try {
      await this.memorySystem.saveConfiguration({
        key: 'app_config',
        value: JSON.stringify(this.config),
        type: 'object',
        description: 'Application configuration settings',
        category: 'system',
      });
    } catch (error) {
      console.error('❌ Failed to save configuration to database:', error);
    }
  }

  private async loadFromFile(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContent = fs.readFileSync(this.configPath, 'utf-8');
        const fileConfig = JSON.parse(fileContent) as AppConfig;
        this.config = { ...DEFAULT_CONFIG, ...fileConfig };
        console.log('📖 Configuration loaded from file');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load configuration from file:', error);
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('❌ Failed to save configuration to file:', error);
    }
  }

  private validateConfig(config: any): void {
    const requiredSections = [
      'onboarding', 'auth', 'system', 'ui', 'security', 
      'performance', 'notifications', 'backup'
    ];

    for (const section of requiredSections) {
      if (!config[section] || typeof config[section] !== 'object') {
        throw new Error(`Missing or invalid section: ${section}`);
      }
    }
  }
}

/**
 * Convenience function to get configuration manager instance
 */
export function getConfig(): ConfigManager {
  return ConfigManager.getInstance();
}

/**
 * Convenience function to get specific configuration section
 */
export function getConfigSection<K extends keyof AppConfig>(section: K): AppConfig[K] {
  return getConfig().getSection(section);
}

/**
 * Convenience function to check if this is first time setup
 */
export function isFirstTime(): boolean {
  return getConfig().isFirstTime();
}

export default ConfigManager;
