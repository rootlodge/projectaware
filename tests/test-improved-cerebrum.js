const CentralBrainAgent = require('../CentralBrainAgent');

// Simple test to verify the improved central brain works
async function testImprovedCerebrum() {
  console.log('🧠 Testing Improved CEREBRUM...\n');
  
  // Mock minimal dependencies
  const mockStateManager = {
    getState: () => ({
      session: { startTime: new Date().toISOString(), totalInteractions: 3 },
      cognitive: { currentMood: 'neutral', currentGoal: 'assist', focusLevel: 0.8, energyLevel: 0.7 },
      social: {}, learning: {}, performance: { responseQuality: 0.8 }, evolution: {}
    }),
    recordLearning: (topic, insights) => console.log(`✅ Learning recorded: ${topic}`),
    updateState: (state) => console.log(`✅ State updated`),
    recordInteraction: (type, data) => console.log(`✅ Interaction recorded: ${type}`),
    resetToDefaults: () => console.log('✅ State reset to defaults')
  };

  const mockEmotionEngine = {
    getCurrentEmotion: () => ({ primary: 'neutral', intensity: 0.5 }),
    analyzeEmotion: (input) => ({ primary: 'curious', intensity: 0.3 }),
    getResponseStyleModifiers: () => ({ tone: 'helpful' }),
    getEmotionHistory: () => [{ primary: 'neutral', intensity: 0.5 }],
    getEmotionStats: () => ({ stability: 0.7 }),
    generateEmotionalResponse: (context) => ({ response: 'Feeling engaged', emotion: 'positive' })
  };

  const mockResponseCache = {
    getStats: () => ({ hits: 5, misses: 2, hitRate: 0.71 }),
    clear: () => console.log('✅ Response cache cleared')
  };

  const mockMultiAgentManager = {};
  const mockInternalAgentSystem = {};
  const mockHelpSystem = {};

  // Initialize Central Brain
  const centralBrain = new CentralBrainAgent(
    mockStateManager,
    mockEmotionEngine,
    mockResponseCache,
    mockMultiAgentManager,
    mockInternalAgentSystem,
    mockHelpSystem
  );

  // Test 1: Simple greeting (should handle directly)
  console.log('🔍 TEST 1: Simple greeting');
  try {
    const result = await centralBrain.process('Hello, how are you?', 'greeting');
    console.log(`✅ Response: ${result.response.substring(0, 80)}...`);
    console.log(`✅ Direct response: ${result.direct_response}`);
    console.log(`✅ Delegations: ${result.delegations}`);
  } catch (error) {
    console.log(`❌ Test 1 failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Complex analysis (should delegate)
  console.log('🔍 TEST 2: Complex analysis');
  try {
    const result = await centralBrain.process('Analyze my productivity patterns and suggest improvements', 'analysis');
    console.log(`✅ Response: ${result.response.substring(0, 80)}...`);
    console.log(`✅ Direct response: ${result.direct_response}`);
    console.log(`✅ Delegations: ${result.delegations}`);
  } catch (error) {
    console.log(`❌ Test 2 failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Independent thinking
  console.log('🔍 TEST 3: Independent thinking');
  try {
    const thinkingResult = await centralBrain.independentThinking();
    console.log(`✅ Independent thoughts: ${thinkingResult.thoughts.substring(0, 80)}...`);
  } catch (error) {
    console.log(`❌ Test 3 failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Memory cleaning
  console.log('🔍 TEST 4: Memory cleaning');
  try {
    const cleanResult = await centralBrain.cleanAllMemory();
    console.log(`✅ Memory clean result: ${cleanResult.success ? 'Success' : 'Failed'}`);
    console.log(`✅ Message: ${cleanResult.message || cleanResult.error}`);
  } catch (error) {
    console.log(`❌ Test 4 failed: ${error.message}`);
  }

  console.log('\n🎉 All tests completed!');
}

testImprovedCerebrum().catch(console.error);
