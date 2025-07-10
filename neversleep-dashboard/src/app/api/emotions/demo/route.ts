import { NextResponse } from 'next/server';
import { getEmotionEngine } from '@/lib/shared/instances';

export async function POST() {
  try {
    const emotionEngine = getEmotionEngine();
    
    // Simulate some realistic emotion scenarios
    const scenarios = [
      { input: 'Hello! How are you today?', delay: 500 },
      { input: 'I\'m feeling a bit sad today', delay: 2000 },
      { input: 'That\'s amazing! I\'m so excited!', delay: 4000 },
      { input: 'Can you help me with something?', delay: 6000 },
      { input: 'Thank you so much for your help!', delay: 8000 }
    ];
    
    // Process scenarios with delays
    scenarios.forEach(({ input, delay }) => {
      setTimeout(() => {
        emotionEngine.processUserInput(input, 'demo_scenario');
      }, delay);
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Emotion demo scenarios started' 
    });
  } catch (error) {
    console.error('Failed to start emotion demo:', error);
    return NextResponse.json(
      { error: 'Failed to start emotion demo' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const emotionEngine = getEmotionEngine();
    emotionEngine.resetToBaseline();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Emotions reset to baseline' 
    });
  } catch (error) {
    console.error('Failed to reset emotions:', error);
    return NextResponse.json(
      { error: 'Failed to reset emotions' },
      { status: 500 }
    );
  }
}
