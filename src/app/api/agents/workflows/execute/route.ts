import { NextRequest, NextResponse } from 'next/server';
import { StateManager } from '@/lib/core/StateManager';
import { MultiAgentManager } from '@/lib/agents/MultiAgentManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';
import { ResponseCache } from '@/lib/systems/ResponseCache';
import { Brain } from '@/lib/core/brain';

const stateManager = new StateManager();
const emotionEngine = new EmotionEngine(stateManager);
const responseCache = new ResponseCache();
const brain = new Brain(stateManager, emotionEngine, responseCache);
const multiAgentManager = new MultiAgentManager(stateManager, brain, emotionEngine);

export async function POST(request: NextRequest) {
  try {
    const { workflowId } = await request.json();

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Execute the workflow
    const execution = await multiAgentManager.executeWorkflow(workflowId, '', '');

    return NextResponse.json({
      success: true,
      execution,
      message: 'Workflow execution started'
    });
  } catch (error) {
    console.error('Failed to execute workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
