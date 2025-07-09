import { NextRequest, NextResponse } from 'next/server';
import { StateManager } from '@/lib/core/StateManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';
import { ResponseCache } from '@/lib/systems/ResponseCache';
import { Brain } from '@/lib/core/brain';
import { CentralBrainAgent } from '@/lib/agents/CentralBrainAgent';

// Initialize systems
const stateManager = new StateManager();
const emotionEngine = new EmotionEngine(stateManager);
const responseCache = new ResponseCache();
const brain = new Brain(stateManager, emotionEngine, responseCache);
const centralBrain = new CentralBrainAgent(stateManager, emotionEngine, responseCache, brain);

export async function POST(request: NextRequest) {
  try {
    const { input, context } = await request.json();

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input is required and must be a string' },
        { status: 400 }
      );
    }

    // Process the input through the central brain
    const result = await centralBrain.process(input, context || 'user_interaction');

    return NextResponse.json({
      success: true,
      result: {
        response: result.response,
        confidence: result.confidence,
        processing_time: result.processing_time,
        agents_involved: result.agents_involved,
        cognitive_load: result.cognitive_load,
        emotional_state: result.emotional_state,
        decision_path: result.decision_path
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
    // Get system status
    const status = centralBrain.getSystemStatus();
    
    return NextResponse.json({
      success: true,
      status,
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
