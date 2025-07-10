import { StateManager } from '../core/StateManager';
import { EmotionEngine } from '../systems/EmotionEngine';
import { GoalEngine } from '../systems/GoalEngine';

// Singleton instances to maintain state across API calls
let stateManagerInstance: StateManager | null = null;
let emotionEngineInstance: EmotionEngine | null = null;
let goalEngineInstance: GoalEngine | null = null;

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

// Reset instances if needed
export function resetInstances() {
  if (emotionEngineInstance) {
    emotionEngineInstance.destroy();
  }
  stateManagerInstance = null;
  emotionEngineInstance = null;
  goalEngineInstance = null;
}
