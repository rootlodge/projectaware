import { NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

export async function POST() {
  try {
    // Reload the throttling configuration in the autonomous thinking system
    const autonomousThinkingSystem = await getAutonomousThinkingSystem();
    await autonomousThinkingSystem.reloadThrottleConfig();
    console.log('[Settings] Autonomous thinking system config reloaded');
    
    return NextResponse.json({
      success: true,
      message: 'Configuration reloaded successfully'
    });
  } catch (error) {
    console.error('Failed to reload configuration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to reload configuration'
    }, { status: 500 });
  }
}
