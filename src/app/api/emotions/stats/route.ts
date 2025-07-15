import { NextResponse } from 'next/server';
import { getEmotionEngine } from '@/lib/shared/instances';

export async function GET() {
  try {
    const emotionEngine = getEmotionEngine();
    const stats = emotionEngine.getEmotionStats();
    const currentEmotion = emotionEngine.getCurrentEmotion();
    
    return NextResponse.json({
      dominantEmotion: stats.dominant_emotions[0] || currentEmotion.primary,
      averageIntensity: stats.average_intensity,
      emotionCount: stats.dominant_emotions.reduce((acc, emotion, index) => {
        acc[emotion] = stats.dominant_emotions.length - index; // Mock counts based on order
        return acc;
      }, {} as Record<string, number>),
      recentTrend: stats.empathy_trend > 0.6 ? 'positive' : stats.empathy_trend < 0.4 ? 'negative' : 'stable',
      lastUpdated: currentEmotion.timestamp,
      empathyTrend: stats.empathy_trend,
      emotionDiversity: stats.emotion_diversity,
      userEmotionResponses: stats.user_emotion_responses
    });
  } catch (error) {
    console.error('Failed to get emotion stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve emotion statistics' },
      { status: 500 }
    );
  }
}
