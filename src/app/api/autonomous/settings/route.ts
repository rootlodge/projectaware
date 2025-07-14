import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, config } = body;
    
    const thinkingSystem = await getAutonomousThinkingSystem();
    
    switch (action) {
      case 'reload_config':
        await thinkingSystem.reloadThrottleConfig();
        return NextResponse.json({
          success: true,
          data: { 
            message: 'Configuration reloaded successfully',
            new_config: thinkingSystem.getThrottleConfig()
          }
        });
        
      case 'update_throttle':
        if (config && config.thought_throttling) {
          // Update config file first
          const configPath = path.join(process.cwd(), 'src', 'lib', 'config', 'config.json');
          
          const currentConfig = JSON.parse(await fs.readFile(configPath, 'utf-8'));
          currentConfig.thought_throttling = { ...currentConfig.thought_throttling, ...config.thought_throttling };
          
          await fs.writeFile(configPath, JSON.stringify(currentConfig, null, 2));
          
          // Reload in the system
          await thinkingSystem.reloadThrottleConfig();
          
          return NextResponse.json({
            success: true,
            data: { 
              message: 'Throttle configuration updated successfully',
              new_config: thinkingSystem.getThrottleConfig()
            }
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Invalid throttle configuration' },
            { status: 400 }
          );
        }
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to update autonomous thinking settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
