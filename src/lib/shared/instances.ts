import { StateManager } from '../core/StateManager';
import { EmotionEngine } from '../systems/EmotionEngine';
import { GoalEngine } from '../systems/GoalEngine';
import { CentralBrainAgent } from '../agents/CentralBrainAgent';
import { MemorySystem } from '../core/memory';
import { ResponseCache } from '../systems/ResponseCache';
import { Brain } from '../core/brain';
import { ContextManager } from '../systems/ContextManager';
import { AgentOrchestrator } from '../agents/AgentOrchestrator';
import { SelfModificationEngine } from '../systems/SelfModificationEngine';
import { MetacognitionEngine } from '../systems/MetacognitionEngine';
import { CognitiveSelfMonitor } from '../systems/CognitiveSelfMonitor';
import { ThoughtStream } from '../core/ThoughtStream';
import { getAutonomousThinkingSystem } from '../systems/autonomousThinkingInstance';

// Singleton instances to maintain state across API calls
let stateManagerInstance: StateManager | null = null;
let emotionEngineInstance: EmotionEngine | null = null;
let goalEngineInstance: GoalEngine | null = null;
let centralBrainAgentInstance: CentralBrainAgent | null = null;
let memorySystemInstance: MemorySystem | null = null;
let responseCacheInstance: ResponseCache | null = null;
let brainInstance: Brain | null = null;
let contextManagerInstance: ContextManager | null = null;
let agentOrchestratorInstance: AgentOrchestrator | null = null;
let selfModificationEngineInstance: SelfModificationEngine | null = null;
let metacognitionEngineInstance: MetacognitionEngine | null = null;
let cognitiveSelfMonitorInstance: CognitiveSelfMonitor | null = null;

export function getStateManager(): StateManager {
  if (!stateManagerInstance) {
    stateManagerInstance = new StateManager();
  }
  return stateManagerInstance;
}

export function getEmotionEngine(): EmotionEngine {
  if (!emotionEngineInstance) {
    const stateManager = getStateManager();
    emotionEngineInstance = new EmotionEngine(stateManager);
    
    // Initialize with some sample emotions for testing
    setTimeout(() => {
      if (emotionEngineInstance) {
        emotionEngineInstance.manualEmotionOverride('curious', 0.7, 'System initialization');
        setTimeout(() => {
          if (emotionEngineInstance) {
            emotionEngineInstance.processUserInput('Hello! How are you today?', 'user_greeting');
          }
        }, 2000);
      }
    }, 1000);
  }
  return emotionEngineInstance;
}

export function getGoalEngine(): GoalEngine {
  if (!goalEngineInstance) {
    goalEngineInstance = GoalEngine.getInstance();
    
    // Initialize the goal engine asynchronously
    goalEngineInstance.initialize().catch(error => {
      console.error('Failed to initialize Goal Engine:', error);
    });
  }
  return goalEngineInstance;
}

export function getResponseCache(): ResponseCache {
  if (!responseCacheInstance) {
    responseCacheInstance = new ResponseCache();
  }
  return responseCacheInstance;
}

export function getBrain(): Brain {
  if (!brainInstance) {
    const stateManager = getStateManager();
    const emotionEngine = getEmotionEngine();
    const responseCache = getResponseCache();
    brainInstance = new Brain(stateManager, emotionEngine, responseCache);
  }
  return brainInstance;
}

export function getCentralBrainAgent(): CentralBrainAgent {
  if (!centralBrainAgentInstance) {
    const stateManager = getStateManager();
    const emotionEngine = getEmotionEngine();
    const responseCache = getResponseCache();
    const brain = getBrain();
    centralBrainAgentInstance = new CentralBrainAgent(stateManager, emotionEngine, responseCache, brain);
  }
  return centralBrainAgentInstance;
}

export async function getMemorySystem(): Promise<MemorySystem> {
  if (!memorySystemInstance) {
    memorySystemInstance = new MemorySystem();
    
    // Initialize the memory system synchronously and wait for it to complete
    try {
      await memorySystemInstance.initialize();
      console.log('Memory System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Memory System:', error);
      // Reset instance on failure so next call will retry
      memorySystemInstance = null;
      throw error;
    }
  }
  return memorySystemInstance;
}

// Reset instances if needed
export function resetInstances() {
  if (emotionEngineInstance) {
    emotionEngineInstance.destroy();
  }
  stateManagerInstance = null;
  emotionEngineInstance = null;
  goalEngineInstance = null;
  centralBrainAgentInstance = null;
  memorySystemInstance = null;
  responseCacheInstance = null;
  brainInstance = null;
  contextManagerInstance = null;
  agentOrchestratorInstance = null;
  selfModificationEngineInstance = null;
  metacognitionEngineInstance = null;
  cognitiveSelfMonitorInstance = null;
}

// ContextManager singleton
export function getContextManager(): ContextManager {
  if (!contextManagerInstance) {
    contextManagerInstance = new ContextManager();
  }
  return contextManagerInstance;
}

// AgentOrchestrator singleton
export function getAgentOrchestrator(): AgentOrchestrator {
  if (!agentOrchestratorInstance) {
    agentOrchestratorInstance = new AgentOrchestrator();
  }
  return agentOrchestratorInstance;
}

// MetacognitionEngine singleton
export async function getMetacognitionEngine(): Promise<MetacognitionEngine> {
  if (!metacognitionEngineInstance) {
    const stateManager = getStateManager();
    const emotionEngine = getEmotionEngine();
    const memorySystem = await getMemorySystem();
    const autonomousThinking = await getAutonomousThinkingSystem();
    const centralBrain = getCentralBrainAgent();
    
    metacognitionEngineInstance = new MetacognitionEngine(
      stateManager,
      emotionEngine,
      memorySystem,
      autonomousThinking,
      centralBrain
    );
    
    console.log('[Instances] MetacognitionEngine initialized');
  }
  return metacognitionEngineInstance;
}

// CognitiveSelfMonitor singleton
export async function getCognitiveSelfMonitor(): Promise<CognitiveSelfMonitor> {
  if (!cognitiveSelfMonitorInstance) {
    const metacognitionEngine = await getMetacognitionEngine();
    const autonomousThinking = await getAutonomousThinkingSystem();
    const stateManager = getStateManager();
    const emotionEngine = getEmotionEngine();
    
    cognitiveSelfMonitorInstance = new CognitiveSelfMonitor(
      metacognitionEngine,
      autonomousThinking,
      stateManager,
      emotionEngine
    );
    
    console.log('[Instances] CognitiveSelfMonitor initialized');
  }
  return cognitiveSelfMonitorInstance;
}

// SelfModificationEngine singleton
export async function getSelfModificationEngine(): Promise<SelfModificationEngine> {
  if (!selfModificationEngineInstance) {
    const stateManager = getStateManager();
    const metacognitionEngine = await getMetacognitionEngine();
    const cognitiveSelfMonitor = await getCognitiveSelfMonitor();
    
    selfModificationEngineInstance = new SelfModificationEngine(
      stateManager,
      metacognitionEngine,
      cognitiveSelfMonitor
    );
    
    console.log('[Instances] SelfModificationEngine initialized');
  }
  return selfModificationEngineInstance;
}

// ThoughtStream singleton
export function getThoughtStream(): ThoughtStream {
  return ThoughtStream.getInstance();
}

// Export thoughtStream instance for backward compatibility
export const thoughtStream = getThoughtStream();
