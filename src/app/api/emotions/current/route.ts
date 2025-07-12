import { NextResponse } from 'next/server';
import { getEmotionEngine } from '@/lib/shared/instances';

export async function GET() {
  try {
    const emotionEngine = getEmotionEngine();
    const currentEmotion = emotionEngine.getCurrentEmotion();
    
    return NextResponse.json({
      emotion: currentEmotion.primary,
      intensity: currentEmotion.intensity,
      timestamp: currentEmotion.timestamp,
      context: currentEmotion.context,
      secondary: currentEmotion.secondary,
      empathy_level: currentEmotion.empathy_level,
      stability: currentEmotion.stability,
      source: currentEmotion.source
    });
  } catch (error) {
    console.error('Failed to get current emotion:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve current emotion' },
      { status: 500 }
    );
  }
}
