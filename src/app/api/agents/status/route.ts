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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (agentId) {
      // Get specific agent status
      const agent = multiAgentManager.getAgent(agentId);
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }

      // Get agent performance metrics
      const metrics = await getAgentMetrics(agentId);
      const recentActivity = await getAgentRecentActivity(agentId);

      return NextResponse.json({
        success: true,
        agent: {
          ...agent,
          metrics,
          recent_activity: recentActivity,
          status: agent.enabled ? 'active' : 'idle',
          last_activity: new Date().toISOString() // TODO: Track real activity
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // Get all agents status
      const agents = multiAgentManager.getAgents();
      const systemStatus = multiAgentManager.getSystemStatus();
      const activeExecutions = multiAgentManager.getActiveExecutions();

      const agentStatuses = await Promise.all(
        agents.map(async (agent) => {
          const metrics = await getAgentMetrics(agent.id);
          return {
            id: agent.id,
            name: agent.name,
            role: agent.role,
            status: agent.enabled ? 'active' : 'idle' as const,
            specialization: agent.specialization,
            enabled: agent.enabled,
            metrics,
            last_activity: new Date().toISOString(), // TODO: Track real activity
            tasks_completed: metrics.total_executions || 0,
            success_rate: metrics.success_rate || 0,
            avg_response_time: metrics.avg_response_time || 0
          };
        })
      );

      return NextResponse.json({
        success: true,
        agents: agentStatuses,
        system_status: systemStatus,
        active_executions: activeExecutions.length,
        total_agents: agents.length,
        active_agents: agents.filter(a => a.enabled).length,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Agent status error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function getAgentMetrics(agentId: string) {
  // TODO: Implement real metrics tracking
  // For now, return simulated metrics
  return {
    total_executions: Math.floor(Math.random() * 100),
    successful_executions: Math.floor(Math.random() * 90),
    failed_executions: Math.floor(Math.random() * 10),
    success_rate: 0.85 + Math.random() * 0.15,
    avg_response_time: 1000 + Math.random() * 2000,
    last_24h_executions: Math.floor(Math.random() * 20),
    specialization_match_rate: 0.8 + Math.random() * 0.2,
    confidence_avg: 0.7 + Math.random() * 0.3
  };
}

async function getAgentRecentActivity(agentId: string) {
  // TODO: Implement real activity tracking
  // For now, return simulated recent activity
  const activities = [];
  const now = new Date();
  
  for (let i = 0; i < 5; i++) {
    const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000); // 30 minutes apart
    activities.push({
      timestamp: timestamp.toISOString(),
      action: ['execution', 'analysis', 'synthesis', 'review'][Math.floor(Math.random() * 4)],
      workflow_id: `workflow_${Math.floor(Math.random() * 10)}`,
      duration: Math.floor(Math.random() * 5000) + 1000,
      success: Math.random() > 0.1
    });
  }
  
  return activities;
}
