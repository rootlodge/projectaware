import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

export async function GET(req: NextRequest) {
  try {
    const thinkingSystem = getAutonomousThinkingSystem();
    const stats = thinkingSystem.getThinkingStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get autonomous thinking stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get thinking stats',
        data: {
          total_thoughts: 0,
          total_interactions: 0,
          total_sessions: 0,
          avg_session_duration: 0,
          most_common_emotion: 'neutral',
          efficiency_trend: 0.5
        }
      },
      { status: 500 }
    );
  }
}
