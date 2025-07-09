// Test the new task management and auto-cleaning integration
const { stateManager, emotionEngine, responseCache } = require('../src/core/brain');
const MultiAgentManager = require('../src/agents/MultiAgentManager');
const InternalAgentSystem = require('../src/agents/InternalAgentSystem');
const HelpSystem = require('../src/systems/HelpSystem');
const CentralBrainAgent = require('../src/agents/CentralBrainAgent');

async function testTaskManagement() {
  console.log('🧪 Testing Task Management System...');
  
  // Initialize systems
  const multiAgentManager = new MultiAgentManager();
  const internalAgentSystem = new InternalAgentSystem();
  const helpSystem = new HelpSystem();
  
  // Initialize Central Brain Agent
  const centralBrain = new CentralBrainAgent(
    stateManager,
    emotionEngine,
    responseCache,
    multiAgentManager,
    internalAgentSystem,
    helpSystem
  );
  
  try {
    // Test task creation
    console.log('📝 Creating test tasks...');
    const taskResult1 = await centralBrain.handleTaskCommand('create', ['Test Task 1', 'This is a test task']);
    console.log('✅ Task 1 created:', taskResult1.success);
    
    const taskResult2 = await centralBrain.handleTaskCommand('create', ['Test Task 2', 'Another test task']);
    console.log('✅ Task 2 created:', taskResult2.success);
    
    // Test task listing
    console.log('\n📋 Listing tasks...');
    const listResult = await centralBrain.handleTaskCommand('list', []);
    console.log('✅ Tasks listed:', listResult.success, `(${listResult.tasks.length} tasks found)`);
    
    // Test task completion
    if (listResult.success && listResult.tasks.length > 0) {
      console.log('\n✅ Completing first task...');
      const completeResult = await centralBrain.handleTaskCommand('complete', [listResult.tasks[0].id, 'Test completion']);
      console.log('✅ Task completed:', completeResult.success);
    }
    
    // Test task analytics
    console.log('\n📊 Getting task analytics...');
    const analyticsResult = await centralBrain.handleTaskCommand('analytics', []);
    console.log('✅ Analytics retrieved:', analyticsResult.success);
    if (analyticsResult.success) {
      console.log('   - Total tasks:', analyticsResult.analytics.total);
      console.log('   - Completed tasks:', analyticsResult.analytics.completed);
      console.log('   - Completion rate:', analyticsResult.analytics.completionRate.toFixed(1) + '%');
    }
    
    // Test cleaning system
    console.log('\n🧹 Testing cleaning system...');
    const cleaningStatus = await centralBrain.intelligentCleaner.getStatus();
    console.log('✅ Cleaning status retrieved:');
    console.log('   - Has active tasks:', cleaningStatus.hasActiveTasks);
    console.log('   - Should clean:', cleaningStatus.shouldClean);
    console.log('   - Database size:', (cleaningStatus.databaseSize / 1024).toFixed(1) + ' KB');
    
    // Test maintenance thinking
    console.log('\n🧠 Testing independent thinking with maintenance...');
    const thinkingResult = await centralBrain.independentThinking();
    console.log('✅ Independent thinking completed:', !!thinkingResult.thoughts);
    console.log('   - Maintenance performed:', thinkingResult.maintenancePerformed);
    if (thinkingResult.taskProcessing) {
      console.log('   - Task processing:', thinkingResult.taskProcessing.processed);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run test
testTaskManagement().catch(console.error);
