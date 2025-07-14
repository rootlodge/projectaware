import { NextRequest, NextResponse } from 'next/server';
import { MetacognitionEngine } from '@/lib/systems/MetacognitionEngine';
import { CognitiveSelfMonitor } from '@/lib/systems/CognitiveSelfMonitor';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';
import { getStateManager, getEmotionEngine, getMemorySystem, getCentralBrainAgent } from '@/lib/shared/instances';

let metacognitionEngine: MetacognitionEngine | null = null;
let cognitiveSelfMonitor: CognitiveSelfMonitor | null = null;

export async function getMetacognitionEngine(): Promise<MetacognitionEngine> {
  if (!metacognitionEngine) {
    const stateManager = getStateManager();
    const emotionEngine = getEmotionEngine();
    const memorySystem = await getMemorySystem();
    const autonomousThinking = await getAutonomousThinkingSystem();
    const centralBrain = getCentralBrainAgent();

    metacognitionEngine = new MetacognitionEngine(
      stateManager,
      emotionEngine,
      memorySystem,
      autonomousThinking,
      centralBrain
    );

    console.log('[Metacognition API] Engine initialized');
  }
  return metacognitionEngine;
}

export async function getCognitiveSelfMonitor(): Promise<CognitiveSelfMonitor> {
  if (!cognitiveSelfMonitor) {
    const metacognition = await getMetacognitionEngine();
    const autonomousThinking = await getAutonomousThinkingSystem();
    const stateManager = getStateManager();
    const emotionEngine = getEmotionEngine();

    cognitiveSelfMonitor = new CognitiveSelfMonitor(
      metacognition,
      autonomousThinking,
      stateManager,
      emotionEngine
    );

    console.log('[Metacognition API] Cognitive self-monitor initialized');
  }
  return cognitiveSelfMonitor;
}

/**
 * GET /api/metacognition/status
 * Get current metacognitive state and status
 */
export async function GET(request: NextRequest) {
  try {
    const metacognition = await getMetacognitionEngine();
    const monitor = await getCognitiveSelfMonitor();

    const status = {
      metacognition_active: true,
      cognitive_monitoring_active: true,
      current_cognitive_state: metacognition.getCurrentCognitiveState(),
      cognitive_load: monitor.getCurrentCognitiveLoad(),
      recent_decisions: metacognition.getRecentDecisions(10),
      active_reasoning_chains: monitor.getActiveReasoningChains(),
      performance_summary: {
        recent_insights: metacognition.getMetaLearningEvents(5),
        metrics: monitor.getMetrics(),
        personality_state: metacognition.getAdaptivePersonality()
      },
      system_health: {
        memory_usage: 'normal',
        processing_efficiency: 'high',
        bias_detection_active: true,
        self_reflection_schedule: 'active'
      }
    };

    return NextResponse.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Metacognition API] Error getting status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get metacognition status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/metacognition/decision
 * Capture a decision point for metacognitive analysis
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      decision_type, 
      options_considered, 
      chosen_option, 
      rationale, 
      confidence, 
      uncertainty,
      context 
    } = data;

    // Validate required fields
    if (!decision_type || !chosen_option || !rationale || confidence === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: decision_type, chosen_option, rationale, confidence' 
        },
        { status: 400 }
      );
    }

    const metacognition = await getMetacognitionEngine();
    
    const decisionId = await metacognition.captureDecisionPoint(
      decision_type,
      options_considered || [],
      chosen_option,
      rationale,
      confidence,
      uncertainty || 0.5
    );

    // Start confidence tracking
    const monitor = await getCognitiveSelfMonitor();
    monitor.trackConfidence(decisionId, confidence, {
      positive_factors: context?.positive_factors || [],
      negative_factors: context?.negative_factors || [],
      uncertainty_sources: context?.uncertainty_sources || []
    });

    return NextResponse.json({
      success: true,
      decision_id: decisionId,
      message: 'Decision captured for metacognitive analysis',
      next_steps: [
        'Monitor decision outcome',
        'Track confidence evolution',
        'Analyze bias indicators'
      ]
    });

  } catch (error) {
    console.error('[Metacognition API] Error capturing decision:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to capture decision',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
