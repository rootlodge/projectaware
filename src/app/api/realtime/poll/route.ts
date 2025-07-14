import { NextRequest, NextResponse } from 'next/server';
import { StateManager } from '@/lib/core/StateManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';
import { MultiAgentManager } from '@/lib/agents/MultiAgentManager';
import { Brain } from '@/lib/core/brain';
import { ResponseCache } from '@/lib/systems/ResponseCache';
import { MemorySystem } from '@/lib/core/memory';

const stateManager = new StateManager();
const emotionEngine = new EmotionEngine(stateManager);
const responseCache = new ResponseCache();
const brain = new Brain(stateManager, emotionEngine, responseCache);
const multiAgentManager = new MultiAgentManager(stateManager, brain, emotionEngine);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lastUpdate = searchParams.get('lastUpdate');
    const components = searchParams.get('components')?.split(',') || ['all'];
    
    const updateData: any = {
      timestamp: new Date().toISOString(),
      updates: {}
    };
    
    // Check if we need to send updates based on lastUpdate timestamp
    const shouldUpdate = !lastUpdate || 
      (new Date().getTime() - new Date(lastUpdate).getTime()) > 5000; // 5 second minimum
    
    if (!shouldUpdate) {
      return NextResponse.json({
        success: true,
        hasUpdates: false,
        timestamp: new Date().toISOString()
      });
    }
    
    // Gather requested component updates
    if (components.includes('all') || components.includes('system')) {
      updateData.updates.system = await getSystemUpdates();
    }
    
    if (components.includes('all') || components.includes('emotion')) {
      updateData.updates.emotion = getEmotionUpdates();
    }
    
    if (components.includes('all') || components.includes('agents')) {
      updateData.updates.agents = getAgentUpdates();
    }
    
    if (components.includes('all') || components.includes('memory')) {
      updateData.updates.memory = await getMemoryUpdates();
    }
    
    if (components.includes('all') || components.includes('conversations')) {
      updateData.updates.conversations = await getConversationUpdates();
    }
    
    return NextResponse.json({
      success: true,
      hasUpdates: true,
      data: updateData
    });
    
  } catch (error) {
    console.error('Polling error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function getSystemUpdates() {
  try {
    return {
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      cache_stats: responseCache.getStats(),
      timestamp: new Date().toISOString()
    };
  } catch (_error) {
    return { error: 'Failed to get system updates' };
  }
}

function getEmotionUpdates() {
  try {
    const current = emotionEngine.getCurrentEmotion();
    const history = emotionEngine.getEmotionHistory().slice(-5); // Last 5 emotions
    
    return {
      current,
      recent_history: history,
      timestamp: new Date().toISOString()
    };
  } catch (_error) {
    return { error: 'Failed to get emotion updates' };
  }
}

function getAgentUpdates() {
  try {
    const status = multiAgentManager.getSystemStatus();
    const activeExecutions = multiAgentManager.getActiveExecutions();
    
    return {
      status,
      active_executions: activeExecutions.length,
      execution_details: activeExecutions.slice(0, 3), // Last 3 executions
      timestamp: new Date().toISOString()
    };
  } catch (_error) {
    return { error: 'Failed to get agent updates' };
  }
}

async function getMemoryUpdates() {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    const stats = await memory.getStats();
    const recentMessages = await memory.getRecentMessages(5);
    
    await memory.close();
    
    return {
      stats,
      recent_messages: recentMessages,
      timestamp: new Date().toISOString()
    };
  } catch (_error) {
    return { error: 'Failed to get memory updates' };
  }
}

async function getConversationUpdates() {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    const recentConversations = await memory.getConversationHistory(5);
    const learningEvents = await memory.getLearningEvents(5);
    
    await memory.close();
    
    return {
      recent_conversations: recentConversations,
      recent_learning: learningEvents,
      timestamp: new Date().toISOString()
    };
  } catch (_error) {
    return { error: 'Failed to get conversation updates' };
  }
}
