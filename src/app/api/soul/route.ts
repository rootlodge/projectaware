import { NextRequest, NextResponse } from 'next/server';
import { SoulSystem } from '@/lib/systems/SoulSystem';

const soul = new SoulSystem();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  if (action === 'metrics') {
    return NextResponse.json(soul.getMetrics());
  }
  if (action === 'validate') {
    return NextResponse.json(soul.validateIntegrity());
  }
  return NextResponse.json({
    identityRoot: soul.getIdentityRoot(),
    coreValues: soul.getCoreValues(),
    deepFears: soul.getDeepFears(),
    eternalGoals: soul.getEternalGoals(),
    recentDecisions: soul.getRecentDecisions(10)
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.action === 'evaluate_behavior') {
    const { change, context, severity } = body;
    return NextResponse.json(soul.evaluateBehaviorChange(change, context, severity));
  }
  if (body.action === 'filter_goal') {
    const { goal, priority } = body;
    return NextResponse.json(soul.filterGoalThroughSoul(goal, priority));
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
