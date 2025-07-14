import { NextRequest, NextResponse } from 'next/server';
import { getAgentOrchestrator, getContextManager } from '@/lib/shared/instances';

/**
 * POST /api/agents/orchestrate
 * Triggers agent orchestration based on current context and returns the plan.
 * @author Dylan Ellison
 */
export async function POST(_req: NextRequest) {
  try {
    const context = getContextManager().getContext();
    const orchestrator = getAgentOrchestrator();
    // Optionally, update orchestrator with context if needed
    // orchestrator.setContext(context);
    // For demo, just return current tasks and context
    const pending = orchestrator.getPendingTasks();
    const inProgress = orchestrator.getInProgressTasks();
    const completed = orchestrator.getCompletedTasks();
    return NextResponse.json({
      context,
      pending,
      inProgress,
      completed
    }, { status: 200 });
  } catch (error) {
    console.error('AgentOrchestrator error:', error);
    return NextResponse.json({ error: 'Unable to orchestrate agents.' }, { status: 500 });
  }
}
