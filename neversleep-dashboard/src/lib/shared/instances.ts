import { StateManager } from '../core/StateManager';
import { EmotionEngine } from '../systems/EmotionEngine';

// Singleton instances to maintain state across API calls
let stateManagerInstance: StateManager | null = null;
let emotionEngineInstance: EmotionEngine | null = null;

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

// Reset instances if needed
export function resetInstances() {
  if (emotionEngineInstance) {
    emotionEngineInstance.destroy();
  }
  stateManagerInstance = null;
  emotionEngineInstance = null;
}
