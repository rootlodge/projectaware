import { NextResponse } from 'next/server';
import { StateManager } from '@/lib/core/StateManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';

export async function GET() {
  try {
    const stateManager = new StateManager();
    const emotionEngine = new EmotionEngine(stateManager);
    
    const currentEmotion = emotionEngine.getCurrentEmotion();
    
    return NextResponse.json({
      emotion: currentEmotion.primary,
      intensity: currentEmotion.intensity,
      timestamp: currentEmotion.timestamp,
      context: currentEmotion.context
    });
  } catch (error) {
    console.error('Failed to get current emotion:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve current emotion' },
      { status: 500 }
    );
  }
}
