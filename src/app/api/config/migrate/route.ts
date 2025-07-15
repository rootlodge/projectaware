import { NextRequest, NextResponse } from 'next/server';
import { 
  migrateConfiguration, 
  createConfigBackup, 
  validateCurrentConfig, 
  generateMigrationReport 
} from '@/lib/config/migration';

/**
 * Configuration Migration API
 * 
 * Handles migration from old configuration system to new TypeScript configuration
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'validate':
        return await handleValidate();
        
      case 'backup':
        return await handleBackup();
        
      case 'migrate':
        return await handleMigrate();
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: validate, backup, migrate'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration operation failed'
    }, { status: 500 });
  }
}

async function handleValidate() {
  try {
    const validation = await validateCurrentConfig();
    
    return NextResponse.json({
      success: true,
      validation: {
        valid: validation.valid,
        issues: validation.issues,
        suggestions: validation.suggestions,
        issueCount: validation.issues.length,
        suggestionCount: validation.suggestions.length,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Validation failed: ${error}`
    }, { status: 500 });
  }
}

async function handleBackup() {
  try {
    const backupPath = await createConfigBackup();
    
    return NextResponse.json({
      success: true,
      message: 'Configuration backup created successfully',
      backupPath,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Backup failed: ${error}`
    }, { status: 500 });
  }
}

async function handleMigrate() {
  try {
    console.log('🚀 Starting configuration migration via API...');
    
    // Create backup first
    const backupPath = await createConfigBackup();
    console.log(`📦 Backup created: ${backupPath}`);
    
    // Run migration
    const migrationResult = await migrateConfiguration();
    
    // Generate report
    const report = generateMigrationReport(migrationResult);
    
    return NextResponse.json({
      success: migrationResult.success,
      message: migrationResult.success 
        ? 'Configuration migration completed successfully' 
        : 'Configuration migration completed with errors',
      migration: {
        migratedFiles: migrationResult.migratedFiles,
        migratedEnvVars: migrationResult.migratedEnvVars,
        errors: migrationResult.errors,
        warnings: migrationResult.warnings,
        fileCount: migrationResult.migratedFiles.length,
        envVarCount: migrationResult.migratedEnvVars.length,
        errorCount: migrationResult.errors.length,
        warningCount: migrationResult.warnings.length,
      },
      backupPath,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Migration failed: ${error}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Return migration status and available actions
    const validation = await validateCurrentConfig();
    
    return NextResponse.json({
      success: true,
      status: {
        configurationValid: validation.valid,
        issueCount: validation.issues.length,
        suggestionCount: validation.suggestions.length,
        migrationAvailable: true,
      },
      availableActions: [
        {
          action: 'validate',
          description: 'Validate current configuration and identify issues',
          method: 'POST',
          body: { action: 'validate' }
        },
        {
          action: 'backup',
          description: 'Create backup of current configuration files',
          method: 'POST',
          body: { action: 'backup' }
        },
        {
          action: 'migrate',
          description: 'Migrate from old configuration system to new TypeScript config',
          method: 'POST',
          body: { action: 'migrate' }
        }
      ]
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Failed to get migration status: ${error}`
    }, { status: 500 });
  }
}
