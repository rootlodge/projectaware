import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, reason, force } = body; // action: 'pause' | 'resume', reason: string, force: boolean
    
    if (!action || !['pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be "pause" or "resume"' },
        { status: 400 }
      );
    }
    
    const autonomousSystem = getAutonomousThinkingSystem();
    
    if (action === 'pause') {
      const forceDisable = force === true || reason === 'user_in_brain_interface';
      autonomousSystem.pauseThinking(reason || 'user_interface_interaction', forceDisable);
      console.log(`[AutonomousThinking] ${forceDisable ? 'Force ' : ''}Paused: ${reason || 'user_interface_interaction'}`);
    } else {
      autonomousSystem.resumeThinking();
      console.log('[AutonomousThinking] Resumed');
    }
    
    return NextResponse.json({
      success: true,
      data: { 
        action,
        force: force || false,
        message: `Autonomous thinking ${action}d successfully${force ? ' (forced)' : ''}`
      }
    });
  } catch (error) {
    console.error('Failed to control autonomous thinking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to control autonomous thinking' },
      { status: 500 }
    );
  }
}
