import { EmotionEngine } from './src/lib/systems/EmotionEngine';
import { StateManager } from './src/lib/core/StateManager';

async function testEmotionEngine() {
  console.log('🧠 Testing Enhanced Emotion Engine...\n');

  const stateManager = new StateManager();
  const emotionEngine = new EmotionEngine(stateManager);
  
  console.log('Initial emotion:', emotionEngine.getCurrentEmotion());
  console.log('');

  // Test 1: Sad input
  console.log('Test 1: Sad input - "I\'m feeling really down today, lost my job"');
  const sadAnalysis = emotionEngine.processUserInput("I'm feeling really down today, lost my job");
  console.log('User emotion analysis:', sadAnalysis);
  console.log('AI emotional response:', emotionEngine.getCurrentEmotion());
  console.log('Response modifier:', emotionEngine.getResponseModifier());
  console.log('');

  // Test 2: Happy input after sad
  setTimeout(() => {
    console.log('Test 2: Happy input - "Actually, I just got a new job! I\'m so excited!"');
    const happyAnalysis = emotionEngine.processUserInput("Actually, I just got a new job! I'm so excited!");
    console.log('User emotion analysis:', happyAnalysis);
    console.log('AI emotional response:', emotionEngine.getCurrentEmotion());
    console.log('Response modifier:', emotionEngine.getResponseModifier());
    console.log('');

    // Test 3: Joke input
    setTimeout(() => {
      console.log('Test 3: Joke input - "Haha, want to hear a funny story about my cat?"');
      const amusedAnalysis = emotionEngine.processUserInput("Haha, want to hear a funny story about my cat?");
      console.log('User emotion analysis:', amusedAnalysis);
      console.log('AI emotional response:', emotionEngine.getCurrentEmotion());
      console.log('Response modifier:', emotionEngine.getResponseModifier());
      console.log('');

      // Test 4: Check emotion decay after 10 seconds
      setTimeout(() => {
        console.log('Test 4: Emotion state after decay period:');
        console.log('Current emotion:', emotionEngine.getCurrentEmotion());
        console.log('Emotion stats:', emotionEngine.getEmotionStats());
        console.log('');

        // Cleanup
        emotionEngine.destroy();
        console.log('✅ Emotion Engine tests completed!');
      }, 10000);
    }, 2000);
  }, 2000);
}

testEmotionEngine().catch(console.error);
