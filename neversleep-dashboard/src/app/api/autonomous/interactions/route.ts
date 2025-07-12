import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const thinkingSystem = await getAutonomousThinkingSystem();
    const interactions = await thinkingSystem.getAllInteractions(limit);
    
    return NextResponse.json({
      success: true,
      data: interactions
    });
  } catch (error) {
    console.error('Failed to get autonomous interactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get interactions',
        data: []
      },
      { status: 500 }
    );
  }
}
