import { NextRequest, NextResponse } from 'next/server';
import { getCognitiveSelfMonitor } from '@/lib/shared/instances';

/**
 * GET /api/metacognition/cognitive-load
 * Get current cognitive load and monitoring data
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const include_history = url.searchParams.get('include_history') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const monitor = await getCognitiveSelfMonitor();
    
    const response: any = {
      success: true,
      current_cognitive_load: monitor.getCurrentCognitiveLoad(),
      active_reasoning_chains: monitor.getActiveReasoningChains(),
      metrics: monitor.getMetrics(),
      timestamp: new Date().toISOString()
    };

    if (include_history) {
      response.recent_thought_events = monitor.getRecentThoughtEvents(limit);
      response.confidence_tracking = monitor.getConfidenceTracking(20);
      response.uncertainty_analyses = monitor.getUncertaintyAnalyses(10);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Metacognition API] Error getting cognitive load:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get cognitive load data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/metacognition/cognitive-load/reasoning-chain
 * Start a new reasoning chain for monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { trigger, goal } = data;

    if (!trigger || !goal) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Trigger and goal are required for reasoning chain' 
        },
        { status: 400 }
      );
    }

    const monitor = await getCognitiveSelfMonitor();
    const chainId = monitor.startReasoningChain(trigger, goal);

    return NextResponse.json({
      success: true,
      chain_id: chainId,
      message: 'Reasoning chain started and being monitored',
      next_steps: [
        'Add reasoning steps via PUT request',
        'Monitor cognitive load changes',
        'Complete chain when finished'
      ]
    });

  } catch (error) {
    console.error('[Metacognition API] Error starting reasoning chain:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start reasoning chain',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/metacognition/cognitive-load/reasoning-chain
 * Add a step to an existing reasoning chain
 */
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      chain_id, 
      step_type, 
      description, 
      inputs, 
      processing, 
      outputs 
    } = data;

    if (!chain_id || !step_type || !description || !outputs) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: chain_id, step_type, description, outputs' 
        },
        { status: 400 }
      );
    }

    const monitor = await getCognitiveSelfMonitor();
    monitor.addReasoningStep(
      chain_id,
      step_type,
      description,
      inputs || [],
      processing || { method: 'standard', considerations: [], assumptions: [], alternatives_considered: [] },
      outputs
    );

    return NextResponse.json({
      success: true,
      message: 'Reasoning step added to chain',
      chain_id: chain_id
    });

  } catch (error) {
    console.error('[Metacognition API] Error adding reasoning step:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add reasoning step',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
