import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { interactionId, response } = body;
    
    if (!interactionId || !response) {
      return NextResponse.json(
        { success: false, error: 'interactionId and response are required' },
        { status: 400 }
      );
    }
    
    // Log the user response
    console.log(`[AI Interaction Response] User responded to ${interactionId}: ${response}`);
    
    // In a full implementation, you would:
    // 1. Find the interaction by ID
    // 2. Mark it as responded to
    // 3. Potentially generate a follow-up AI response
    // 4. Log this interaction for learning
    
    // For now, simulate processing the response
    const { getGoalEngine } = require('@/lib/systems/GoalEngine');
    const { getEmotionEngine } = require('@/lib/systems/EmotionEngine');
    
    try {
      const goalEngine = getGoalEngine();
      const emotionEngine = getEmotionEngine();
      
      // Log this as a user interaction for goal analysis
      await goalEngine.logUserInteraction(response, `response_to_ai_interaction_${interactionId}`);
      
      // Process emotional context of the response
      const emotionAnalysis = emotionEngine.processUserInput(response, 'ai_interaction_response');
      
      console.log(`[AI Interaction] User emotion analysis:`, emotionAnalysis);
      
    } catch (error) {
      console.log('Could not process interaction response through goal/emotion engines:', error);
    }
    
    return NextResponse.json({
      success: true,
      data: { 
        message: 'Response recorded successfully',
        interactionId,
        userResponse: response
      }
    });
  } catch (error) {
    console.error('Failed to record interaction response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record response' },
      { status: 500 }
    );
  }
}
