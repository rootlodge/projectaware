import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'src', 'lib', 'config', 'config.json');

interface ThoughtThrottlingConfig {
  enabled: boolean;
  max_thoughts_per_minute: number;
  unlimited: boolean;
  adaptive_throttling: boolean;
  performance_threshold: number;
}

interface SystemConfig {
  hallucination_detection: any;
  llm_settings: any;
  memory_settings: any;
  thought_throttling: ThoughtThrottlingConfig;
}

async function loadConfig(): Promise<SystemConfig> {
  try {
    const configContent = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('Failed to load config:', error);
    throw new Error('Failed to load configuration');
  }
}

async function saveConfig(config: SystemConfig): Promise<void> {
  try {
    const configContent = JSON.stringify(config, null, 2);
    await fs.writeFile(CONFIG_PATH, configContent, 'utf-8');
  } catch (error) {
    console.error('Failed to save config:', error);
    throw new Error('Failed to save configuration');
  }
}

export async function GET() {
  try {
    const config = await loadConfig();
    
    return NextResponse.json({
      success: true,
      settings: {
        thought_throttling: config.thought_throttling,
        llm_settings: config.llm_settings,
        memory_settings: config.memory_settings,
        hallucination_detection: {
          enabled: config.hallucination_detection.enabled
        }
      }
    });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load settings'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await request.json();
    const config = await loadConfig();
    
    // Update thought throttling settings
    if (updates.thought_throttling) {
      config.thought_throttling = {
        ...config.thought_throttling,
        ...updates.thought_throttling
      };
      
      // Validate the settings
      if (config.thought_throttling.max_thoughts_per_minute < 1) {
        config.thought_throttling.max_thoughts_per_minute = 1;
      }
      if (config.thought_throttling.max_thoughts_per_minute > 120) {
        config.thought_throttling.max_thoughts_per_minute = 120;
      }
      if (config.thought_throttling.performance_threshold < 0.1) {
        config.thought_throttling.performance_threshold = 0.1;
      }
      if (config.thought_throttling.performance_threshold > 1.0) {
        config.thought_throttling.performance_threshold = 1.0;
      }
    }
    
    // Update other settings if provided
    if (updates.llm_settings) {
      config.llm_settings = {
        ...config.llm_settings,
        ...updates.llm_settings
      };
    }
    
    if (updates.memory_settings) {
      config.memory_settings = {
        ...config.memory_settings,
        ...updates.memory_settings
      };
    }
    
    if (updates.hallucination_detection) {
      config.hallucination_detection = {
        ...config.hallucination_detection,
        ...updates.hallucination_detection
      };
    }
    
    await saveConfig(config);
    
    // Trigger autonomous thinking system to reload config
    try {
      const reloadResponse = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''}/api/system/reload-config`, {
        method: 'POST',
      });
      
      if (!reloadResponse.ok) {
        console.warn('Failed to trigger config reload, changes will take effect on next restart');
      }
    } catch (error) {
      console.warn('Failed to trigger config reload:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        thought_throttling: config.thought_throttling,
        llm_settings: config.llm_settings,
        memory_settings: config.memory_settings,
        hallucination_detection: {
          enabled: config.hallucination_detection.enabled
        }
      }
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update settings'
    }, { status: 500 });
  }
}
