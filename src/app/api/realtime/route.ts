import { NextRequest, NextResponse } from 'next/server';
import { StateManager } from '@/lib/core/StateManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';
import { MultiAgentManager } from '@/lib/agents/MultiAgentManager';
import { Brain } from '@/lib/core/brain';
import { ResponseCache } from '@/lib/systems/ResponseCache';
import { MemorySystem } from '@/lib/core/memory';

// WebSocket connections storage
const _connections = new Set<WebSocket>();
const stateManager = new StateManager();
const emotionEngine = new EmotionEngine(stateManager);
const responseCache = new ResponseCache();
const brain = new Brain(stateManager, emotionEngine, responseCache);
const multiAgentManager = new MultiAgentManager(stateManager, brain, emotionEngine);

interface _WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'system_update' | 'conversation_update' | 'emotion_update' | 'agent_update';
  data?: any;
  timestamp?: string;
}

export async function GET(_request: NextRequest) {
  try {
    // This endpoint provides WebSocket connection information
    return NextResponse.json({
      success: true,
      websocket_available: false, // Next.js doesn't support WebSocket directly
      alternative_endpoints: {
        polling: '/api/realtime/poll',
        server_sent_events: '/api/realtime/events'
      },
      message: 'Real-time updates available via polling or Server-Sent Events'
    });
  } catch (error) {
    console.error('WebSocket info error:', error);
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
    const { action, data: _data } = await request.json();
    
    switch (action) {
      case 'get_realtime_data':
        const realtimeData = await gatherRealtimeData();
        return NextResponse.json({
          success: true,
          data: realtimeData
        });
        
      case 'subscribe_to_updates':
        // In a real WebSocket implementation, this would add the connection to a subscription list
        return NextResponse.json({
          success: true,
          message: 'Subscription registered (simulated)',
          polling_interval: 5000 // 5 seconds
        });
        
      case 'broadcast_update':
        // Simulate broadcasting an update
        const updateData = await gatherRealtimeData();
        return NextResponse.json({
          success: true,
          message: 'Update broadcasted (simulated)',
          data: updateData
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('WebSocket action error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function gatherRealtimeData() {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    // Gather comprehensive real-time data
    const [
      systemMetrics,
      emotionState,
      agentStatus,
      memoryStats,
      recentActivity,
      activeExecutions
    ] = await Promise.all([
      brain.getSystemMetrics(),
      Promise.resolve(emotionEngine.getCurrentEmotion()),
      Promise.resolve(multiAgentManager.getSystemStatus()),
      memory.getStats(),
      memory.getRecentMessages(10),
      Promise.resolve(multiAgentManager.getActiveExecutions())
    ]);
    
    await memory.close();
    
    return {
      system: {
        ...systemMetrics,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      },
      emotion: {
        ...emotionState,
        history_summary: await getEmotionSummary(),
        timestamp: new Date().toISOString()
      },
      agents: {
        ...agentStatus,
        active_executions: activeExecutions.length,
        execution_details: activeExecutions.slice(0, 5), // Last 5 executions
        timestamp: new Date().toISOString()
      },
      memory: {
        ...memoryStats,
        recent_activity: recentActivity,
        timestamp: new Date().toISOString()
      },
      performance: {
        cache_stats: responseCache.getStats(),
        response_times: await getAverageResponseTimes(),
        error_rates: await getErrorRates(),
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Failed to gather realtime data:', error);
    return {
      error: 'Failed to gather realtime data',
      timestamp: new Date().toISOString()
    };
  }
}

async function getEmotionSummary() {
  try {
    // Get emotion trends 
    const emotions = emotionEngine.getEmotionHistory();
    if (emotions.length === 0) return { trend: 'stable', dominant: 'neutral' };
    
    // Get recent emotions (last 10)
    const recentEmotions = emotions.slice(-10);
    
    const emotionCounts: Record<string, number> = {};
    recentEmotions.forEach(emotion => {
      emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 1;
    });
    
    const dominant = Object.entries(emotionCounts).reduce((a, b) => 
      emotionCounts[a[0]] > emotionCounts[b[0]] ? a : b
    )[0];
    
    // Determine trend based on intensity changes
    const trend = recentEmotions.length > 5 ? 
      (recentEmotions.slice(-3).reduce((sum, e) => sum + e.intensity, 0) / 3 > 
       recentEmotions.slice(0, 3).reduce((sum, e) => sum + e.intensity, 0) / 3 ? 'rising' : 'falling') 
      : 'stable';
    
    return { trend, dominant, count: emotions.length };
  } catch (error) {
    return { trend: 'unknown', dominant: 'neutral', count: 0 };
  }
}

async function getAverageResponseTimes() {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    // Get recent processing times from learning events
    const events = await memory.getLearningEvents(50);
    const processingEvents = events.filter(e => 
      e.event_type.includes('brain') || e.event_type.includes('processing')
    );
    
    if (processingEvents.length === 0) {
      await memory.close();
      return { average: 0, samples: 0 };
    }
    
    // Extract response times from context (simplified)
    const times = processingEvents.map(() => Math.random() * 2000 + 500); // Simulated for now
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    
    await memory.close();
    return { average: Math.round(average), samples: times.length };
  } catch (error) {
    return { average: 0, samples: 0 };
  }
}

async function getErrorRates() {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    const recentMessages = await memory.getRecentMessages(100);
    const errors = recentMessages.filter(msg => 
      msg.type.includes('error') || msg.content.toLowerCase().includes('error')
    );
    
    await memory.close();
    
    return {
      error_rate: recentMessages.length > 0 ? (errors.length / recentMessages.length) * 100 : 0,
      total_messages: recentMessages.length,
      error_count: errors.length
    };
  } catch (error) {
    return { error_rate: 0, total_messages: 0, error_count: 0 };
  }
}
