import { NextRequest, NextResponse } from 'next/server';
import { StateManager } from '@/lib/core/StateManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';
import { ResponseCache } from '@/lib/systems/ResponseCache';
import { Brain } from '@/lib/core/brain';
import { MultiAgentManager } from '@/lib/agents/MultiAgentManager';

// Initialize systems
const stateManager = new StateManager();
const emotionEngine = new EmotionEngine(stateManager);
const responseCache = new ResponseCache();
const brain = new Brain(stateManager, emotionEngine, responseCache);
const multiAgentManager = new MultiAgentManager(stateManager, brain, emotionEngine);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'workflows') {
      const workflows = multiAgentManager.getWorkflows();
      return NextResponse.json({
        success: true,
        workflows,
        timestamp: new Date().toISOString()
      });
    } else {
      const agents = multiAgentManager.getAgents();
      const systemStatus = multiAgentManager.getSystemStatus();
      const activeExecutions = multiAgentManager.getActiveExecutions();
      
      // Transform agents to match UI expectations
      const formattedAgents = agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.role,
        status: agent.enabled ? 'active' : 'idle' as const,
        description: `${agent.specialization} - ${agent.capabilities.join(', ')}`,
        lastActivity: new Date().toISOString(), // TODO: Track real last activity
        tasksCompleted: Math.floor(Math.random() * 50), // TODO: Implement real task tracking
        role: agent.role,
        specialization: agent.specialization,
        traits: agent.traits,
        capabilities: agent.capabilities,
        model: agent.model,
        temperature: agent.temperature,
        enabled: agent.enabled
      }));

      return NextResponse.json({
        success: true,
        agents: formattedAgents,
        system_status: systemStatus,
        active_executions: activeExecutions.length,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Agents retrieval error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'execute_workflow') {
      const { workflow_id, input, context } = await request.json();

      if (!workflow_id || !input) {
        return NextResponse.json(
          { error: 'Workflow ID and input are required' },
          { status: 400 }
        );
      }

      const execution = await multiAgentManager.executeWorkflow(workflow_id, input, context || '');

      return NextResponse.json({
        success: true,
        execution,
        timestamp: new Date().toISOString()
      });

    } else if (action === 'create_agent') {
      const agentConfig = await request.json();
      const agentId = await multiAgentManager.createAgent(agentConfig);

      return NextResponse.json({
        success: true,
        agent_id: agentId,
        message: 'Agent created successfully',
        timestamp: new Date().toISOString()
      });

    } else if (action === 'create_workflow') {
      const workflowConfig = await request.json();
      const workflowId = await multiAgentManager.createWorkflow(workflowConfig);

      return NextResponse.json({
        success: true,
        workflow_id: workflowId,
        message: 'Workflow created successfully',
        timestamp: new Date().toISOString()
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Agent operation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const updates = await request.json();

    if (type === 'workflow') {
      await multiAgentManager.updateWorkflow(id, updates);
      return NextResponse.json({
        success: true,
        message: 'Workflow updated successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      await multiAgentManager.updateAgent(id, updates);
      return NextResponse.json({
        success: true,
        message: 'Agent updated successfully',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Update operation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    if (type === 'workflow') {
      await multiAgentManager.deleteWorkflow(id);
      return NextResponse.json({
        success: true,
        message: 'Workflow deleted successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      await multiAgentManager.deleteAgent(id);
      return NextResponse.json({
        success: true,
        message: 'Agent deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Delete operation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
