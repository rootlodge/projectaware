// Global instances for the autonomous thinking system
import { AutonomousThinkingSystem } from './AutonomousThinkingSystem';
import { 
  getStateManager, 
  getEmotionEngine, 
  getGoalEngine, 
  getCentralBrainAgent, 
  getMemorySystem 
} from '../shared/instances';

let autonomousThinkingSystemInstance: AutonomousThinkingSystem | null = null;

export async function getAutonomousThinkingSystem(): Promise<AutonomousThinkingSystem> {
  if (!autonomousThinkingSystemInstance) {
    try {
      const stateManager = getStateManager();
      const emotionEngine = getEmotionEngine();
      const goalEngine = getGoalEngine();
      const centralBrain = getCentralBrainAgent();
      const memorySystem = await getMemorySystem(); // Now properly await the async call
      
      autonomousThinkingSystemInstance = new AutonomousThinkingSystem(
        stateManager,
        emotionEngine,
        goalEngine,
        centralBrain,
        memorySystem
      );
      
      console.log('[AutonomousThinking] System initialized successfully');
    } catch (error) {
      console.error('[AutonomousThinking] Failed to initialize system:', error);
      throw error;
    }
  }
  
  return autonomousThinkingSystemInstance;
}

export function resetAutonomousThinkingSystem(): void {
  autonomousThinkingSystemInstance = null;
}
