import { NextRequest, NextResponse } from 'next/server';
import { getConfig, AppConfig } from '@/lib/config/app-config';

/**
 * Configuration API Endpoint
 * 
 * Handles GET/POST requests for application configuration management
 */

export async function GET(request: NextRequest) {
  try {
    const configManager = getConfig();
    
    // Check if we need to initialize
    if (!configManager['initialized']) {
      await configManager.initialize();
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const path = searchParams.get('path');

    if (path) {
      // Get specific value by dot notation path
      const value = configManager.getValue(path);
      return NextResponse.json({
        success: true,
        path,
        value
      });
    } else if (section) {
      // Get specific section
      const sectionData = configManager.getSection(section as keyof AppConfig);
      return NextResponse.json({
        success: true,
        section,
        data: sectionData
      });
    } else {
      // Get complete configuration
      const config = configManager.getConfig();
      return NextResponse.json({
        success: true,
        config
      });
    }
  } catch (error) {
    console.error('Configuration API GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load configuration'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const configManager = getConfig();
    
    // Check if we need to initialize
    if (!configManager['initialized']) {
      await configManager.initialize();
    }

    const body = await request.json();
    const { action, section, key, value, path, config: newConfig } = body;

    switch (action) {
      case 'update_section':
        if (!section || !value) {
          return NextResponse.json({
            success: false,
            error: 'Missing section or value'
          }, { status: 400 });
        }
        
        await configManager.updateSection(section, value);
        return NextResponse.json({
          success: true,
          message: `Section ${section} updated successfully`
        });

      case 'update_value':
        if (!section || !key || value === undefined) {
          return NextResponse.json({
            success: false,
            error: 'Missing section, key, or value'
          }, { status: 400 });
        }
        
        await configManager.updateValue(section, key, value);
        return NextResponse.json({
          success: true,
          message: `Value ${section}.${key} updated successfully`
        });

      case 'set_path':
        if (!path || value === undefined) {
          return NextResponse.json({
            success: false,
            error: 'Missing path or value'
          }, { status: 400 });
        }
        
        await configManager.setValue(path, value);
        return NextResponse.json({
          success: true,
          message: `Path ${path} updated successfully`
        });

      case 'reset_section':
        if (!section) {
          return NextResponse.json({
            success: false,
            error: 'Missing section'
          }, { status: 400 });
        }
        
        await configManager.resetSection(section);
        return NextResponse.json({
          success: true,
          message: `Section ${section} reset to defaults`
        });

      case 'reset_all':
        await configManager.resetToDefaults();
        return NextResponse.json({
          success: true,
          message: 'Configuration reset to defaults'
        });

      case 'import_config':
        if (!newConfig) {
          return NextResponse.json({
            success: false,
            error: 'Missing configuration data'
          }, { status: 400 });
        }
        
        await configManager.importConfig(typeof newConfig === 'string' ? newConfig : JSON.stringify(newConfig));
        return NextResponse.json({
          success: true,
          message: 'Configuration imported successfully'
        });

      case 'export_config':
        const exportedConfig = configManager.exportConfig();
        return NextResponse.json({
          success: true,
          config: exportedConfig
        });

      case 'complete_onboarding':
        await configManager.completeOnboarding();
        return NextResponse.json({
          success: true,
          message: 'Onboarding marked as complete'
        });

      case 'update_onboarding_step':
        if (typeof value !== 'number') {
          return NextResponse.json({
            success: false,
            error: 'Step must be a number'
          }, { status: 400 });
        }
        
        await configManager.updateOnboardingStep(value);
        return NextResponse.json({
          success: true,
          message: `Onboarding step updated to ${value}`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Configuration API POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update configuration'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const configManager = getConfig();
    
    // Check if we need to initialize
    if (!configManager['initialized']) {
      await configManager.initialize();
    }

    const body = await request.json();
    
    // Replace entire configuration
    await configManager.importConfig(JSON.stringify(body));
    
    return NextResponse.json({
      success: true,
      message: 'Configuration replaced successfully'
    });
  } catch (error) {
    console.error('Configuration API PUT error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to replace configuration'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const configManager = getConfig();
    
    // Check if we need to initialize
    if (!configManager['initialized']) {
      await configManager.initialize();
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const path = searchParams.get('path');

    if (path) {
      // Delete specific value by setting to undefined
      await configManager.setValue(path, undefined);
      return NextResponse.json({
        success: true,
        message: `Path ${path} deleted`
      });
    } else if (section) {
      // Reset section to defaults
      await configManager.resetSection(section as keyof AppConfig);
      return NextResponse.json({
        success: true,
        message: `Section ${section} reset to defaults`
      });
    } else {
      // Reset all to defaults
      await configManager.resetToDefaults();
      return NextResponse.json({
        success: true,
        message: 'All configuration reset to defaults'
      });
    }
  } catch (error) {
    console.error('Configuration API DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete configuration'
    }, { status: 500 });
  }
}
