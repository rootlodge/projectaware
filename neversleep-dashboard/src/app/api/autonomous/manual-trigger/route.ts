import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

export async function POST(req: NextRequest) {
  try {
    const thinkingSystem = await getAutonomousThinkingSystem();
    
    // Trigger a manual thinking cycle
    await thinkingSystem.manualThinkingCycle();
    
    console.log('[API] Manual thinking cycle triggered by user');
    
    return NextResponse.json({
      success: true,
      data: { message: 'Manual thinking cycle triggered' }
    });
  } catch (error) {
    console.error('Failed to trigger manual thinking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to trigger thinking' },
      { status: 500 }
    );
  }
}
