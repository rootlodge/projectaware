import { NextResponse } from 'next/server';
import { StateManager } from '@/lib/core/StateManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';

export async function GET() {
  try {
    const stateManager = new StateManager();
    const emotionEngine = new EmotionEngine(stateManager);
    
    const currentEmotion = emotionEngine.getCurrentEmotion();
    const history = emotionEngine.getEmotionHistory();
    
    // Calculate statistics
    const emotionCount: { [key: string]: number } = {};
    let totalIntensity = 0;
    
    history.forEach(entry => {
      emotionCount[entry.emotion] = (emotionCount[entry.emotion] || 0) + 1;
      totalIntensity += entry.intensity;
    });
    
    const averageIntensity = history.length > 0 ? totalIntensity / history.length : 0;
    
    // Find dominant emotion
    let dominantEmotion = 'neutral';
    let maxCount = 0;
    Object.entries(emotionCount).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion;
      }
    });
    
    // Calculate trend (simplified)
    let recentTrend: 'positive' | 'negative' | 'stable' = 'stable';
    if (history.length >= 5) {
      const recent = history.slice(-5);
      const recentAvg = recent.reduce((sum, entry) => sum + entry.intensity, 0) / recent.length;
      const older = history.slice(-10, -5);
      if (older.length > 0) {
        const olderAvg = older.reduce((sum, entry) => sum + entry.intensity, 0) / older.length;
        if (recentAvg > olderAvg + 0.1) recentTrend = 'positive';
        else if (recentAvg < olderAvg - 0.1) recentTrend = 'negative';
      }
    }
    
    const stats = {
      dominantEmotion,
      averageIntensity,
      emotionCount,
      recentTrend,
      lastUpdated: currentEmotion.timestamp
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get emotion stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve emotion statistics' },
      { status: 500 }
    );
  }
}
