import { NextRequest, NextResponse } from 'next/server';
import { StateManager } from '@/lib/core/StateManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';
import { MemorySystem } from '@/lib/core/memory';

export async function GET() {
  try {
    // Initialize systems
    const stateManager = new StateManager();
    const emotionEngine = new EmotionEngine(stateManager);
    const memory = new MemorySystem();

    // Get current state
    const state = stateManager.getState();
    const currentEmotion = emotionEngine.getCurrentEmotion();
    
    // Try to get memory stats (with fallback)
    let memoryStats = { messages: 0 };
    try {
      await memory.initialize();
      // For now, just use a placeholder until we add getStats method
      memoryStats = { messages: 0 };
      await memory.close();
    } catch (error) {
      console.warn('Memory system not available:', error);
    }

    // Check Ollama connection
    let ollamaStatus = 'disconnected';
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      ollamaStatus = response.ok ? 'connected' : 'error';
    } catch (error) {
      ollamaStatus = 'disconnected';
    }

    // Calculate uptime (use session start time)
    const startTime = new Date(state.session.start_time).getTime();
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    // Get processing queue size (simulated for now)
    const processingQueue = 0;

    // Get agent count (simulated for now)
    const agentCount = 4; // Default agents

    // Get last activity
    const lastActivity = state.session.last_activity;

    const metrics = {
      brain_status: state.cognitive.processing_mode === 'normal' ? 'active' : 'idle',
      memory_entries: memoryStats?.messages || 0,
      agent_count: agentCount,
      last_activity: lastActivity,
      ollama_status: ollamaStatus,
      emotion_state: currentEmotion?.primary || 'neutral',
      processing_queue: processingQueue,
      uptime: uptime
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to get system status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve system status' },
      { status: 500 }
    );
  }
}
