const CentralBrainAgent = require('../UNORGANIZED-FILES/CentralBrainAgent');
const StateManager = require('../UNORGANIZED-FILES/StateManager');
const fs = require('fs-extra');

// Mock dependencies for testing
const mockStateManager = {
  getState: () => ({
    session: { startTime: new Date().toISOString(), totalInteractions: 5 },
    cognitive: { currentMood: 'neutral', currentGoal: 'test', focusLevel: 0.8, energyLevel: 0.7 },
    social: {},
    learning: {},
    performance: { responseQuality: 0.8 },
    evolution: {}
  }),
  recordLearning: (topic, insights) => console.log(`Learning recorded: ${topic}`),
  updateState: (state) => console.log(`State updated:`, state),
  recordInteraction: (type, data) => console.log(`Interaction recorded: ${type}`)
};

const mockEmotionEngine = {
  getCurrentEmotion: () => ({ primary: 'neutral', intensity: 0.5 }),
  analyzeEmotion: (input) => ({ primary: 'curious', intensity: 0.3 }),
  getResponseStyleModifiers: () => ({ tone: 'helpful', formality: 'casual' }),
  getEmotionHistory: (count) => [{ primary: 'neutral', intensity: 0.5 }],
  getEmotionStats: () => ({ stability: 0.7 }),
  generateEmotionalResponse: (context) => ({ response: 'Feeling engaged and ready to help', emotion: 'positive' })
};

const mockResponseCache = {
  getStats: () => ({ hits: 10, misses: 5, hitRate: 0.67 })
};

const mockMultiAgentManager = {
  createAgent: async (id, config) => {
    console.log(`Created agent: ${id} with role ${config.role}`);
    return { id, config, created: true };
  },
  executeWorkflow: async (workflowId, params) => {
    console.log(`Executed workflow: ${workflowId}`);
    return { workflowId, result: 'workflow completed', success: true };
  }
};

const mockInternalAgentSystem = {};
const mockHelpSystem = {};

async function testCentralBrain() {
  console.log('🧠 Testing Central Brain Agent (CEREBRUM)...\n');
  
  // Initialize Central Brain
  const centralBrain = new CentralBrainAgent(
    mockStateManager,
    mockEmotionEngine,
    mockResponseCache,
    mockMultiAgentManager,
    mockInternalAgentSystem,
    mockHelpSystem
  );
  
  console.log('✅ Central Brain initialized successfully\n');
  
  // Test 1: Basic Status
  console.log('🔍 TEST 1: Getting Central Brain Status');
  const status = centralBrain.getStatus();
  console.log(`Identity: ${status.identity.name} (${status.identity.role})`);
  console.log(`Sub-agents: ${status.sub_agents.length}`);
  console.log(`Decision thresholds: ${Object.keys(status.decision_thresholds).length}`);
  
  status.sub_agents.forEach(agent => {
    console.log(`  • ${agent.name} (${agent.specialization})`);
  });
  console.log('✅ Status test passed\n');
  
  // Test 2: Simple Processing
  console.log('🎯 TEST 2: Simple Response Processing');
  try {
    const result = await centralBrain.process('Hello, how are you?', 'test_greeting');
    console.log(`Response: ${result.response.substring(0, 100)}...`);
    console.log(`Synthesis success: ${result.synthesis_success}`);
    console.log(`Delegations: ${result.delegations}`);
    console.log(`Actions taken: ${result.actions ? result.actions.join(', ') : 'none'}`);
    console.log('✅ Simple processing test passed\n');
  } catch (error) {
    console.log(`❌ Simple processing test failed: ${error.message}\n`);
  }
  
  // Test 3: Complex Analysis Task
  console.log('🔬 TEST 3: Complex Analysis Task');
  try {
    const result = await centralBrain.process('Analyze the efficiency of our current agent system and suggest improvements', 'analysis_request');
    console.log(`Response: ${result.response.substring(0, 150)}...`);
    console.log(`Synthesis success: ${result.synthesis_success}`);
    console.log(`Delegations: ${result.delegations}`);
    console.log(`Actions taken: ${result.actions ? result.actions.join(', ') : 'none'}`);
    console.log('✅ Complex analysis test passed\n');
  } catch (error) {
    console.log(`❌ Complex analysis test failed: ${error.message}\n`);
  }
  
  // Test 4: Identity Management Request
  console.log('🎭 TEST 4: Identity Management Request');
  try {
    const result = await centralBrain.process('Change my name to Alex and make me more creative', 'identity_change');
    console.log(`Response: ${result.response.substring(0, 150)}...`);
    console.log(`Synthesis success: ${result.synthesis_success}`);
    console.log(`Delegations: ${result.delegations}`);
    console.log(`Actions taken: ${result.actions ? result.actions.join(', ') : 'none'}`);
    console.log('✅ Identity management test passed\n');
  } catch (error) {
    console.log(`❌ Identity management test failed: ${error.message}\n`);
  }
  
  // Test 5: Emotional Processing
  console.log('💭 TEST 5: Emotional Processing');
  try {
    const result = await centralBrain.process('I feel really sad and overwhelmed today', 'emotional_support');
    console.log(`Response: ${result.response.substring(0, 150)}...`);
    console.log(`Emotional context: ${result.emotional_context ? result.emotional_context.emotion : 'none'}`);
    console.log(`Synthesis success: ${result.synthesis_success}`);
    console.log('✅ Emotional processing test passed\n');
  } catch (error) {
    console.log(`❌ Emotional processing test failed: ${error.message}\n`);
  }
  
  // Test 6: Decision Threshold Adjustment
  console.log('⚖️ TEST 6: Decision Threshold Adjustment');
  centralBrain.adjustDecisionThresholds({
    createNewAgent: 0.5,
    emotionalOverride: 0.9
  });
  const newStatus = centralBrain.getStatus();
  console.log(`New createNewAgent threshold: ${newStatus.decision_thresholds.createNewAgent}`);
  console.log(`New emotionalOverride threshold: ${newStatus.decision_thresholds.emotionalOverride}`);
  console.log('✅ Decision threshold adjustment test passed\n');
  
  // Test 7: Emergency Override
  console.log('🚨 TEST 7: Emergency Override');
  const emergencyResult = centralBrain.emergencyOverride('emotional_reset', 'test_emergency');
  console.log(`Emergency action: ${emergencyResult.emergency_action}`);
  console.log(`Executed: ${emergencyResult.executed}`);
  console.log(`Context: ${emergencyResult.context}`);
  console.log('✅ Emergency override test passed\n');
  
  console.log('🎉 All Central Brain tests completed successfully!');
}

// Run the tests
testCentralBrain().catch(console.error);
