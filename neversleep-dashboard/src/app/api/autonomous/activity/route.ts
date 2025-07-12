import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { immediate } = body; // immediate: boolean - force immediate stop
    
    const autonomousSystem = await getAutonomousThinkingSystem();
    
    if (immediate) {
      // Force immediate stop of all autonomous activities
      autonomousSystem.forceStop();
      console.log('[AutonomousThinking] User activity detected - FORCE STOPPED immediately');
    } else {
      // Regular user activity recording
      autonomousSystem.recordUserActivity();
      console.log('[AutonomousThinking] User activity recorded');
    }
    
    return NextResponse.json({
      success: true,
      data: { 
        message: immediate ? 'Autonomous thinking force stopped' : 'User activity recorded',
        immediate: immediate || false
      }
    });
  } catch (error) {
    console.error('Failed to record user activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record user activity' },
      { status: 500 }
    );
  }
}
