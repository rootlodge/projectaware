import { NextResponse } from 'next/server';
import { StateManager } from '@/lib/core/StateManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';

export async function GET() {
  try {
    const stateManager = new StateManager();
    const emotionEngine = new EmotionEngine(stateManager);
    
    const history = emotionEngine.getEmotionHistory();
    
    // Transform history to expected format
    const formattedHistory = history.map(entry => ({
      emotion: entry.emotion,
      intensity: entry.intensity,
      timestamp: entry.timestamp,
      context: entry.context
    }));
    
    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error('Failed to get emotion history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve emotion history' },
      { status: 500 }
    );
  }
}
