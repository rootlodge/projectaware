import { NextRequest, NextResponse } from 'next/server';
import { AgentCoreSystem } from '@/lib/systems/AgentCoreSystem';

const agentCore = new AgentCoreSystem();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  
  if (action === 'metrics') {
    return NextResponse.json(agentCore.getMetrics());
  }
  
  if (action === 'validate') {
    return NextResponse.json(agentCore.validateIntegrity());
  }
  
  return NextResponse.json({
    coreValues: agentCore.getCoreValues(),
    riskFactors: agentCore.getRiskFactors(),
    strategicGoals: agentCore.getStrategicGoals(),
    recentDecisions: agentCore.getRecentDecisions(10)
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  if (body.action === 'evaluate_behavior') {
    const { change, context, severity } = body;
    return NextResponse.json(agentCore.evaluateBehaviorChange(change, context, severity));
  }
  
  if (body.action === 'filter_goal') {
    const { goal, priority } = body;
    return NextResponse.json(agentCore.filterGoalThroughCore(goal, priority));
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
