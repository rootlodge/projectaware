import { NextRequest, NextResponse } from 'next/server';
import { getContextManager } from '@/lib/shared/instances';

/**
 * GET /api/agents/context
 * Returns the current context snapshot for agents and UI.
 * @author Dylan Ellison
 */
export async function GET(req: NextRequest) {
  try {
    const contextManager = getContextManager();
    const context = contextManager.getContext();
    return NextResponse.json(context, { status: 200 });
  } catch (error) {
    console.error('ContextManager error:', error);
    return NextResponse.json({ error: 'Unable to retrieve context.' }, { status: 500 });
  }
}
