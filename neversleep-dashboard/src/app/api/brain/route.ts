import { NextRequest, NextResponse } from 'next/server';
import { StateManager } from '@/lib/core/StateManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';
import { ResponseCache } from '@/lib/systems/ResponseCache';
import { Brain } from '@/lib/core/brain';
import { CentralBrainAgent } from '@/lib/agents/CentralBrainAgent';
import { MemorySystem } from '@/lib/core/memory';

// Initialize systems
const stateManager = new StateManager();
const emotionEngine = new EmotionEngine(stateManager);
const responseCache = new ResponseCache();
const brain = new Brain(stateManager, emotionEngine, responseCache);
const centralBrain = new CentralBrainAgent(stateManager, emotionEngine, responseCache, brain);

export async function POST(request: NextRequest) {
  try {
    const { input, context, sessionId, model } = await request.json();

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input is required and must be a string' },
        { status: 400 }
      );
    }

    const actualSessionId = sessionId || `session_${Date.now()}`;
    
    // Process with enhanced brain functionality for full context and memory integration
    const processingResult = await brain.processMessageWithContext(
      input, 
      actualSessionId, 
      model, 
      true
    );
    
    // Also process through central brain for multi-agent coordination
    const centralResult = await centralBrain.process(input, context || 'user_interaction');
    
    // Save conversation to memory system
    try {
      const memory = new MemorySystem();
      await memory.initialize();
      
      await memory.saveConversation(
        actualSessionId,
        input,
        processingResult.response,
        centralResult.confidence,
        JSON.stringify(processingResult.emotionState)
      );
      
      // Save all learning events from enhanced processing
      for (const event of processingResult.learningEvents) {
        await memory.recordLearningEvent(
          event.type,
          event.description,
          event.context
        );
      }
      
      // Record comprehensive processing metadata
      await memory.recordLearningEvent(
        'enhanced_brain_interaction',
        `Enhanced brain processing completed with ${processingResult.learningEvents.length} learning events`,
        JSON.stringify({
          central_agents_involved: centralResult.agents_involved,
          central_cognitive_load: centralResult.cognitive_load,
          enhanced_emotion_state: processingResult.emotionState,
          learning_events_count: processingResult.learningEvents.length,
          session_id: actualSessionId
        })
      );
      
      await memory.close();
    } catch (memoryError) {
      console.warn('Failed to save conversation to memory:', memoryError);
      // Continue processing even if memory save fails
    }

    return NextResponse.json({
      success: true,
      result: {
        response: processingResult.response,
        confidence: centralResult.confidence,
        processing_time: centralResult.processing_time,
        agents_involved: centralResult.agents_involved,
        cognitive_load: centralResult.cognitive_load,
        emotional_state: processingResult.emotionState,
        learning_events: processingResult.learningEvents,
        decision_path: centralResult.decision_path,
        identity_changes: centralResult.identity_changes || [],
        agent_responses: centralResult.agent_responses || [],
        processing_status: centralResult.processing_status,
        session_id: actualSessionId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Brain processing error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get comprehensive system status
    const centralStatus = centralBrain.getSystemStatus();
    const brainMetrics = await brain.getSystemMetrics();
    const emotionState = emotionEngine.getCurrentEmotion();
    
    return NextResponse.json({
      success: true,
      status: {
        ...centralStatus,
        enhanced_metrics: brainMetrics,
        current_emotion: emotionState,
        cache_performance: responseCache.getStats(),
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Status retrieval error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
