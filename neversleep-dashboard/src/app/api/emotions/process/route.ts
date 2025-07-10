import { NextRequest, NextResponse } from 'next/server';
import { getEmotionEngine, getGoalEngine } from '@/lib/shared/instances';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userInput, context } = body;
    
    if (!userInput) {
      return NextResponse.json({ error: 'userInput is required' }, { status: 400 });
    }
    
    const emotionEngine = getEmotionEngine();
    const analysis = emotionEngine.processUserInput(userInput, context || 'user_interaction');
    const currentEmotion = emotionEngine.getCurrentEmotion();
    
    // Log emotion change to goal engine
    try {
      const goalEngine = getGoalEngine();
      await goalEngine.logEmotionChange(
        currentEmotion.primary, 
        currentEmotion.intensity, 
        `User input processed: ${context || 'user_interaction'}`
      );
    } catch (error) {
      console.log('Could not log emotion to goal engine:', error);
    }
    
    return NextResponse.json({
      analysis,
      currentEmotion: {
        primary: currentEmotion.primary,
        secondary: currentEmotion.secondary,
        intensity: currentEmotion.intensity,
        empathy_level: currentEmotion.empathy_level,
        timestamp: currentEmotion.timestamp
      }
    });
  } catch (error) {
    console.error('Failed to process user input:', error);
    return NextResponse.json(
      { error: 'Failed to process user input' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { emotion, intensity, context } = body;
    
    if (!emotion || intensity === undefined) {
      return NextResponse.json({ error: 'emotion and intensity are required' }, { status: 400 });
    }
    
    const emotionEngine = getEmotionEngine();
    emotionEngine.manualEmotionOverride(emotion, intensity, context || 'manual_override');
    const currentEmotion = emotionEngine.getCurrentEmotion();
    
    return NextResponse.json({
      success: true,
      currentEmotion: {
        primary: currentEmotion.primary,
        secondary: currentEmotion.secondary,
        intensity: currentEmotion.intensity,
        timestamp: currentEmotion.timestamp
      }
    });
  } catch (error) {
    console.error('Failed to override emotion:', error);
    return NextResponse.json(
      { error: 'Failed to override emotion' },
      { status: 500 }
    );
  }
}
