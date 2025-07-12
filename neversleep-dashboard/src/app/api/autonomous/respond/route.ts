import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

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
    
    // Get the autonomous thinking system and handle the response
    const autonomousSystem = getAutonomousThinkingSystem();
    const result = await autonomousSystem.respondToInteraction(interactionId, response);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Interaction not found' },
        { status: 404 }
      );
    }
    
    // Log the user response
    console.log(`[AI Interaction Response] User responded to ${interactionId}: ${response}`);
    
    // Try to process through goal and emotion engines for learning
    try {
      const { getGoalEngine } = require('@/lib/shared/instances');
      const { getEmotionEngine } = require('@/lib/shared/instances');
      
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
        userResponse: response,
        shouldNavigateToBrain: result.shouldNavigateToBrain || false,
        conversationData: result.conversationData || null
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
