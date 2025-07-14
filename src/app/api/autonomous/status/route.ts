import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

export async function GET(req: NextRequest) {
  try {
    const thinkingSystem = await getAutonomousThinkingSystem();
    const status = thinkingSystem.getThinkingStatus();
    const throttleConfig = thinkingSystem.getThrottleConfig();
    const recentThoughts = thinkingSystem.getRecentThoughts(5);
    
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        throttle_config: throttleConfig,
        recent_thoughts: recentThoughts
      }
    });
  } catch (error) {
    console.error('Failed to get autonomous thinking status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get thinking status',
        data: {
          is_thinking: false,
          time_since_activity: 0,
          processing_efficiency: 0.5,
          throttle_config: {
            enabled: true,
            max_thoughts_per_minute: 20,
            unlimited: false
          },
          recent_thoughts: []
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    
    const thinkingSystem = await getAutonomousThinkingSystem();
    
    switch (action) {
      case 'record_activity':
        thinkingSystem.recordUserActivity();
        return NextResponse.json({
          success: true,
          data: { message: 'User activity recorded' }
        });
        
      case 'manual_trigger':
        await thinkingSystem.manualThinkingCycle();
        return NextResponse.json({
          success: true,
          data: { message: 'Manual thinking cycle triggered' }
        });
        
      case 'force_start':
        thinkingSystem.forceStartThinking();
        return NextResponse.json({
          success: true,
          data: { message: 'Thinking mode force started' }
        });
        
      case 'force_stop':
        thinkingSystem.forceStopThinking();
        return NextResponse.json({
          success: true,
          data: { message: 'Thinking mode force stopped' }
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to process autonomous thinking action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
