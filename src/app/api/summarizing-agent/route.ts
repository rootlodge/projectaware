import { NextRequest, NextResponse } from 'next/server';
import { SummarizingAgent } from '@/lib/agents/SummarizingAgent';
import { Brain } from '@/lib/core/brain';
import { MemorySystem } from '@/lib/core/memory';
import { StateManager } from '@/lib/core/StateManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';
import { ResponseCache } from '@/lib/systems/ResponseCache';

let summarizingAgentInstance: SummarizingAgent | null = null;

function getSummarizingAgent(): SummarizingAgent {
  if (!summarizingAgentInstance) {
    const stateManager = new StateManager();
    const emotionEngine = new EmotionEngine(stateManager);
    const responseCache = new ResponseCache();
    const brain = new Brain(stateManager, emotionEngine, responseCache);
    const memorySystem = new MemorySystem();
    
    summarizingAgentInstance = new SummarizingAgent(brain, memorySystem, stateManager);
  }
  return summarizingAgentInstance;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '5');

    const agent = getSummarizingAgent();

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: agent.getStatus()
        });

      case 'summaries':
        const summaries = await agent.getRecentSummaries(sessionId || undefined, limit);
        return NextResponse.json({
          success: true,
          data: summaries
        });

      case 'context':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID required for context'
          }, { status: 400 });
        }
        const context = await agent.getSummaryContext(sessionId);
        return NextResponse.json({
          success: true,
          data: { context }
        });

      case 'check':
        await agent.checkSummarizationNeeds();
        return NextResponse.json({
          success: true,
          message: 'Summarization check completed'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Valid actions: status, summaries, context, check'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Summarizing agent API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, triggerType, sessionId } = body;

    const agent = getSummarizingAgent();

    switch (action) {
      case 'trigger':
        const summaries = await agent.triggerSummarization(
          triggerType || 'cerebrum_request',
          sessionId
        );
        return NextResponse.json({
          success: true,
          data: {
            summaries,
            count: summaries.length,
            message: `Created ${summaries.length} summaries`
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Valid actions: trigger'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Summarizing agent API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
