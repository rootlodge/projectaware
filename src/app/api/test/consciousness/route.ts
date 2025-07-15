import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const autonomousThinking = await getAutonomousThinkingSystem();
    
    console.log(`[TEST] Triggering consciousness action: ${action}`);
    
    switch (action) {
      case 'trigger_interaction':
        await autonomousThinking.triggerConsciousnessInteraction();
        return NextResponse.json({ 
          success: true, 
          message: 'Consciousness interaction triggered' 
        });
        
      case 'test_all':
        await autonomousThinking.testConsciousnessInteractions();
        return NextResponse.json({ 
          success: true, 
          message: 'All consciousness interactions tested' 
        });
        
      case 'force_thinking':
        autonomousThinking.forceStartThinking();
        return NextResponse.json({ 
          success: true, 
          message: 'Thinking mode force started' 
        });
        
      case 'manual_cycle':
        await autonomousThinking.manualThinkingCycle();
        return NextResponse.json({ 
          success: true, 
          message: 'Manual thinking cycle triggered' 
        });
        
      case 'status':
        const status = autonomousThinking.getThinkingStatus();
        const stats = autonomousThinking.getThinkingStats();
        return NextResponse.json({ 
          success: true, 
          status,
          stats
        });
        
      default:
        return NextResponse.json({ 
          success: false, 
          message: 'Unknown action. Available: trigger_interaction, test_all, force_thinking, manual_cycle, status' 
        });
    }
    
  } catch (error) {
    console.error('[TEST] Consciousness test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const autonomousThinking = await getAutonomousThinkingSystem();
    const status = autonomousThinking.getThinkingStatus();
    const stats = autonomousThinking.getThinkingStats();
    
    return NextResponse.json({
      success: true,
      status,
      stats,
      available_actions: [
        'trigger_interaction',
        'test_all', 
        'force_thinking',
        'manual_cycle',
        'status'
      ]
    });
  } catch (error) {
    console.error('[TEST] Get consciousness status error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
