import { NextResponse } from 'next/server';
import { getEmotionEngine } from '@/lib/shared/instances';

export async function GET() {
  try {
    const emotionEngine = getEmotionEngine();
    const history = emotionEngine.getEmotionHistory();
    
    // Transform history to expected format
    const formattedHistory = history.map(entry => ({
      emotion: entry.emotion,
      intensity: entry.intensity,
      timestamp: entry.timestamp,
      context: entry.context,
      duration: entry.duration,
      source: entry.source,
      user_emotion_detected: entry.user_emotion_detected
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
