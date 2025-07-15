/**
 * Configuration Migration Utility
 * 
 * Helps migrate from the current JSON + environment variable setup
 * to the new TypeScript configuration system.
 */

import fs from 'fs';
import path from 'path';
import { getConfig, AppConfig, DEFAULT_CONFIG } from './app-config';
import { migrateFromEnv } from './config-utils';

interface MigrationResult {
  success: boolean;
  migratedFiles: string[];
  migratedEnvVars: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Migrate existing configuration files and environment variables
 * to the new TypeScript configuration system
 */
export async function migrateConfiguration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedFiles: [],
    migratedEnvVars: [],
    errors: [],
    warnings: [],
  };

  console.log('🚀 Starting configuration migration...');

  try {
    const configManager = getConfig();
    await configManager.initialize();

    // Migrate environment variables
    console.log('📋 Migrating environment variables...');
    const envMigration = await migrateFromEnv();
    result.migratedEnvVars = envMigration.migrated > 0 ? 
      Object.keys(process.env).filter(key => process.env[key] !== undefined) : [];
    
    if (envMigration.errors.length > 0) {
      result.errors.push(...envMigration.errors);
    }

    // Migrate existing config files
    console.log('📁 Migrating configuration files...');
    await migrateConfigFiles(configManager, result);

    // Migrate onboarding state from database
    console.log('🗄️ Migrating onboarding state...');
    await migrateOnboardingState(configManager, result);

    result.success = result.errors.length === 0;
    
    if (result.success) {
      console.log('✅ Configuration migration completed successfully!');
      console.log(`   Migrated files: ${result.migratedFiles.length}`);
      console.log(`   Migrated env vars: ${result.migratedEnvVars.length}`);
      if (result.warnings.length > 0) {
        console.log(`   Warnings: ${result.warnings.length}`);
      }
    } else {
      console.log('❌ Configuration migration completed with errors.');
      result.errors.forEach(error => console.error(`   Error: ${error}`));
    }

  } catch (error) {
    result.errors.push(`Migration failed: ${error}`);
    console.error('❌ Configuration migration failed:', error);
  }

  return result;
}

/**
 * Migrate existing configuration files
 */
async function migrateConfigFiles(configManager: any, result: MigrationResult): Promise<void> {
  const configDir = path.join(process.cwd(), 'src', 'lib', 'config');
  const configFiles = [
    'config.json',
    'core.json',
    'identity.json',
    'emotions.json',
    'self-modification.json',
    'state.json',
    'tasks.json',
    'task_templates.json',
  ];

  for (const fileName of configFiles) {
    try {
      const filePath = path.join(configDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        result.warnings.push(`Config file not found: ${fileName}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const fileData = JSON.parse(fileContent);

      // Map file content to configuration sections
      await migrateFileContent(configManager, fileName, fileData, result);
      result.migratedFiles.push(fileName);

    } catch (error) {
      result.errors.push(`Failed to migrate ${fileName}: ${error}`);
    }
  }
}

/**
 * Map file content to configuration sections
 */
async function migrateFileContent(
  configManager: any, 
  fileName: string, 
  data: any, 
  result: MigrationResult
): Promise<void> {
  switch (fileName) {
    case 'config.json':
      await migrateMainConfig(configManager, data, result);
      break;
      
    case 'emotions.json':
      await configManager.setValue('custom.emotions', data);
      break;
      
    case 'self-modification.json':
      await configManager.setValue('custom.selfModification', data);
      break;
      
    case 'state.json':
      await configManager.setValue('custom.state', data);
      break;
      
    case 'tasks.json':
      await configManager.setValue('custom.tasks', data);
      break;
      
    case 'task_templates.json':
      await configManager.setValue('custom.taskTemplates', data);
      break;
      
    case 'core.json':
    case 'identity.json':
      // These contain sensitive AI personality data, store in custom section
      await configManager.setValue(`custom.${fileName.replace('.json', '')}`, data);
      break;
      
    default:
      result.warnings.push(`Unknown config file: ${fileName}`);
      break;
  }
}

/**
 * Migrate main config.json content
 */
async function migrateMainConfig(configManager: any, data: any, result: MigrationResult): Promise<void> {
  try {
    // Map thought throttling settings
    if (data.thought_throttling) {
      await configManager.updateSection('performance', {
        enableCaching: true,
        cacheTTL: 300,
        maxMemoryUsage: 512,
        enableCompression: true,
        requestTimeout: 30000,
        maxConcurrentRequests: data.thought_throttling.max_thoughts_per_minute || 10,
      });
    }

    // Map LLM settings
    if (data.llm_settings) {
      await configManager.setValue('custom.llmSettings', data.llm_settings);
    }

    // Map model settings
    if (data.model_settings) {
      await configManager.setValue('custom.modelSettings', data.model_settings);
    }

    // Map memory settings
    if (data.memory_settings) {
      await configManager.setValue('custom.memorySettings', data.memory_settings);
    }

    // Map hallucination detection
    if (data.hallucination_detection) {
      await configManager.setValue('custom.hallucinationDetection', data.hallucination_detection);
    }

    // Store complete original config for reference
    await configManager.setValue('custom.originalConfig', data);

  } catch (error) {
    result.errors.push(`Failed to migrate main config: ${error}`);
  }
}

/**
 * Migrate onboarding state from database
 */
async function migrateOnboardingState(configManager: any, result: MigrationResult): Promise<void> {
  try {
    // This would check the existing memory system for onboarding state
    // and migrate it to the new configuration system
    
    // For now, we'll check if there are any user profiles to determine first-time status
    const isFirstTime = await configManager.getValue('onboarding.firstTime');
    
    if (isFirstTime === undefined) {
      // Default to first time if not set
      await configManager.updateSection('onboarding', {
        firstTime: true,
        onboardingComplete: false,
        currentStep: 0,
        showWelcomeTour: true,
        skipOptionalSteps: false,
      });
    }

  } catch (error) {
    result.warnings.push(`Could not migrate onboarding state: ${error}`);
  }
}

/**
 * Create backup of current configuration files before migration
 */
export async function createConfigBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'config-backup', timestamp);
  
  // Ensure backup directory exists
  fs.mkdirSync(backupDir, { recursive: true });
  
  const configDir = path.join(process.cwd(), 'src', 'lib', 'config');
  
  if (fs.existsSync(configDir)) {
    const files = fs.readdirSync(configDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const srcPath = path.join(configDir, file);
        const destPath = path.join(backupDir, file);
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  // Also backup any .env files
  const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const destPath = path.join(backupDir, envFile);
      fs.copyFileSync(envPath, destPath);
    }
  }
  
  console.log(`📦 Configuration backup created: ${backupDir}`);
  return backupDir;
}

/**
 * Validate current configuration and suggest improvements
 */
export async function validateCurrentConfig(): Promise<{
  valid: boolean;
  issues: string[];
  suggestions: string[];
}> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  try {
    const configManager = getConfig();
    await configManager.initialize();
    
    const config = configManager.getConfig();
    
    // Check for missing required sections
    const requiredSections: (keyof AppConfig)[] = [
      'onboarding', 'auth', 'system', 'ui', 'security', 
      'performance', 'notifications', 'backup'
    ];
    
    for (const section of requiredSections) {
      if (!config[section]) {
        issues.push(`Missing configuration section: ${section}`);
      }
    }
    
    // Check onboarding configuration
    if (config.onboarding?.firstTime && config.onboarding?.onboardingComplete) {
      issues.push('Conflicting onboarding state: firstTime=true but onboardingComplete=true');
      suggestions.push('Run onboarding completion to fix state');
    }
    
    // Check security settings for production
    if (!config.system?.isDevelopment) {
      if (!config.security?.enableCSRF) {
        issues.push('CSRF protection disabled in production');
        suggestions.push('Enable CSRF protection for production deployment');
      }
      
      if (!config.security?.cookies?.secure) {
        issues.push('Insecure cookies in production');
        suggestions.push('Enable secure cookies for production');
      }
    }
    
    // Check performance settings
    if (config.performance?.maxMemoryUsage && config.performance.maxMemoryUsage > 1024) {
      suggestions.push('High memory usage limit set, monitor system resources');
    }
    
    // Check backup settings
    if (!config.backup?.autoBackup) {
      suggestions.push('Automatic backups disabled, consider enabling for data protection');
    }
    
  } catch (error) {
    issues.push(`Configuration validation failed: ${error}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Generate migration report
 */
export function generateMigrationReport(result: MigrationResult): string {
  const report = [
    '# Configuration Migration Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    `Status: ${result.success ? '✅ Success' : '❌ Failed'}`,
    `Files migrated: ${result.migratedFiles.length}`,
    `Environment variables migrated: ${result.migratedEnvVars.length}`,
    `Errors: ${result.errors.length}`,
    `Warnings: ${result.warnings.length}`,
    '',
  ];
  
  if (result.migratedFiles.length > 0) {
    report.push('## Migrated Files');
    result.migratedFiles.forEach(file => report.push(`- ${file}`));
    report.push('');
  }
  
  if (result.migratedEnvVars.length > 0) {
    report.push('## Migrated Environment Variables');
    result.migratedEnvVars.forEach(envVar => report.push(`- ${envVar}`));
    report.push('');
  }
  
  if (result.errors.length > 0) {
    report.push('## Errors');
    result.errors.forEach(error => report.push(`- ${error}`));
    report.push('');
  }
  
  if (result.warnings.length > 0) {
    report.push('## Warnings');
    result.warnings.forEach(warning => report.push(`- ${warning}`));
    report.push('');
  }
  
  report.push('## Next Steps');
  if (result.success) {
    report.push('1. Test the application with the new configuration system');
    report.push('2. Remove old configuration files if everything works correctly');
    report.push('3. Update environment variable usage to only include essential vars');
    report.push('4. Consider setting up automatic configuration backups');
  } else {
    report.push('1. Review and fix the errors listed above');
    report.push('2. Re-run the migration process');
    report.push('3. Restore from backup if needed');
  }
  
  return report.join('\n');
}

export default {
  migrateConfiguration,
  createConfigBackup,
  validateCurrentConfig,
  generateMigrationReport,
};
