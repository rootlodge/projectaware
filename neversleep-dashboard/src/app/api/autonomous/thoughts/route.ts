import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    const thinkingSystem = getAutonomousThinkingSystem();
    const thoughts = thinkingSystem.getRecentThoughts(limit);
    
    return NextResponse.json({
      success: true,
      data: thoughts
    });
  } catch (error) {
    console.error('Failed to get autonomous thoughts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get thoughts',
        data: []
      },
      { status: 500 }
    );
  }
}
