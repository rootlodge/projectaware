import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const workflows = multiAgentManager.getWorkflows();
    
    // Transform workflows to expected format
    const formattedWorkflows = Object.entries(workflows).map(([id, workflow]) => ({
      id,
      name: workflow.name,
      description: workflow.description,
      status: 'paused' as const, // Default status since not in interface
      progress: 0, // Default progress
      agents: workflow.steps.flatMap(step => step.agents), // Extract agents from steps
      createdAt: new Date().toISOString(), // Default creation time
      lastRun: '' // Default last run
    }));

    return NextResponse.json({
      workflows: formattedWorkflows
    });
  } catch (error) {
    console.error('Failed to get workflows:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve workflows' },
      { status: 500 }
    );
  }
}
