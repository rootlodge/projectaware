import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page, path } = body;
    
    if (!page || !path) {
      return NextResponse.json(
        { success: false, error: 'page and path are required' },
        { status: 400 }
      );
    }
    
    const autonomousSystem = await getAutonomousThinkingSystem();
    autonomousSystem.setCurrentPage(path);
    
    console.log(`[AutonomousThinking] Page changed to: ${page} (${path})`);
    
    return NextResponse.json({
      success: true,
      data: { 
        page,
        path,
        message: 'Page change recorded successfully'
      }
    });
  } catch (error) {
    console.error('Failed to record page change:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record page change' },
      { status: 500 }
    );
  }
}
