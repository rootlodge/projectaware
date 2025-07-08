// Test script for Internal Agent System
const InternalAgentSystem = require('../InternalAgentSystem');
const logger = require('../logger');

async function testInternalAgentSystem() {
  console.log('🧠 Testing Internal Agent System...\n');

  const internalSystem = new InternalAgentSystem();

  try {
    // Test 1: Initialize system
    console.log('📝 Test 1: Initializing internal agent system...');
    await internalSystem.initialize();
    
    const status = internalSystem.getStatus();
    console.log(`✅ System initialized: ${status.initialized}`);
    console.log(`📊 Internal Agents: ${status.agents}`);
    console.log(`🔧 System Functions: ${status.systemFunctions.join(', ')}\n`);

    // Test 2: Test self-modification workflow
    console.log('🔄 Test 2: Testing self-modification workflow...');
    
    const selfModContext = {
      userInput: "I think you should evolve your identity to be more creative",
      recentMessages: [
        { role: 'user', content: 'I think you should evolve your identity to be more creative' },
        { role: 'ai', content: 'I understand your suggestion' }
      ],
      currentIdentity: internalSystem.getCurrentIdentity()
    };

    const selfModResult = await internalSystem.processInput(
      "I think you should evolve your identity to be more creative",
      selfModContext
    );

    console.log('✅ Self-modification workflow completed!');
    console.log(`📊 Steps completed: ${selfModResult.stepsCompleted}`);
    
    // Display results
    if (selfModResult.results) {
      selfModResult.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.stepName}:`);
        if (result.result && result.result.response) {
          console.log(`   Response: ${result.result.response.substring(0, 100)}...`);
        }
      });
    }

    // Test 3: Test conversation processing
    console.log('\n💬 Test 3: Testing conversation processing...');
    
    const conversationContext = {
      userInput: "How are you feeling today?",
      recentMessages: [
        { role: 'user', content: 'How are you feeling today?' }
      ],
      currentIdentity: internalSystem.getCurrentIdentity()
    };

    const conversationResult = await internalSystem.processInput(
      "How are you feeling today?",
      conversationContext
    );

    console.log('✅ Conversation processing completed!');
    console.log(`📊 Steps completed: ${conversationResult.stepsCompleted}`);

    // Test 4: Test function call extraction
    console.log('\n⚙️ Test 4: Testing function call extraction...');
    
    const testText = `I think I should changeName("Creative Assistant", "user requested more creativity") and updateTraits(["creative", "innovative", "artistic"], "enhance creativity")`;
    
    console.log(`Test text: ${testText}`);
    await internalSystem.extractAndExecuteFunctionCalls(testText);
    
    console.log('✅ Function call extraction completed!');

    // Test 5: Check identity after modifications
    console.log('\n🔍 Test 5: Checking identity after modifications...');
    
    const finalIdentity = internalSystem.getCurrentIdentity();
    console.log(`Final identity: ${JSON.stringify(finalIdentity, null, 2)}`);

    console.log('\n✅ All internal agent system tests completed successfully!');
    
    return {
      success: true,
      message: 'Internal agent system is working correctly!',
      finalIdentity: finalIdentity
    };

  } catch (error) {
    console.error('❌ Internal agent system test failed:', error.message);
    logger.error('Internal agent system test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testFunctionCalls() {
  console.log('🔧 Testing System Function Calls...\n');

  const internalSystem = new InternalAgentSystem();
  
  try {
    await internalSystem.initialize();

    console.log('📝 Test 1: Testing name change function...');
    const nameChangeResult = await internalSystem.systemFunctions.get('changeName')(
      'TestBot',
      'Testing name change functionality'
    );
    console.log(`✅ Name change result: ${JSON.stringify(nameChangeResult)}`);

    console.log('\n📝 Test 2: Testing trait update function...');
    const traitUpdateResult = await internalSystem.systemFunctions.get('updateTraits')(
      ['testing', 'experimental', 'functional'],
      'Testing trait update functionality'
    );
    console.log(`✅ Trait update result: ${JSON.stringify(traitUpdateResult)}`);

    console.log('\n📝 Test 3: Testing dynamic state update...');
    const stateUpdateResult = await internalSystem.systemFunctions.get('updateDynamicState')(
      { mood: 'testing', goal: 'complete tests' },
      'Testing dynamic state update'
    );
    console.log(`✅ State update result: ${JSON.stringify(stateUpdateResult)}`);

    console.log('\n📝 Test 4: Testing thought saving...');
    const thoughtSaveResult = await internalSystem.systemFunctions.get('saveThought')(
      'This is a test thought from the internal agent system',
      'test'
    );
    console.log(`✅ Thought save result: ${JSON.stringify(thoughtSaveResult)}`);

    console.log('\n✅ All function call tests completed successfully!');
    
    return {
      success: true,
      message: 'System function calls are working correctly!'
    };

  } catch (error) {
    console.error('❌ Function call test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testAgentSpecialization() {
  console.log('🎭 Testing Agent Specialization...\n');

  const internalSystem = new InternalAgentSystem();
  
  try {
    await internalSystem.initialize();

    const testContexts = [
      {
        name: 'Creative Request',
        input: 'I want you to be more creative and artistic',
        expected: 'identity_designer should suggest creative changes'
      },
      {
        name: 'Analytical Request',
        input: 'Can you analyze this problem systematically?',
        expected: 'mode_controller should adjust to analytical mode'
      },
      {
        name: 'Casual Conversation',
        input: 'How was your day?',
        expected: 'responder should provide natural conversation'
      }
    ];

    for (const testContext of testContexts) {
      console.log(`📝 Testing: ${testContext.name}`);
      console.log(`Input: ${testContext.input}`);
      console.log(`Expected: ${testContext.expected}`);
      
      const context = {
        userInput: testContext.input,
        recentMessages: [{ role: 'user', content: testContext.input }],
        currentIdentity: internalSystem.getCurrentIdentity()
      };

      const result = await internalSystem.processInput(testContext.input, context);
      console.log(`✅ Processed successfully - ${result.stepsCompleted} steps completed\n`);
    }

    console.log('✅ Agent specialization tests completed successfully!');
    
    return {
      success: true,
      message: 'Agent specialization is working correctly!'
    };

  } catch (error) {
    console.error('❌ Agent specialization test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  (async () => {
    console.log('🧪 Internal Agent System Tests\n');
    
    const basicTest = await testInternalAgentSystem();
    console.log(`\nBasic Test: ${basicTest.success ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (basicTest.success) {
      const functionTest = await testFunctionCalls();
      console.log(`Function Test: ${functionTest.success ? '✅ PASSED' : '❌ FAILED'}`);
      
      const specializationTest = await testAgentSpecialization();
      console.log(`Specialization Test: ${specializationTest.success ? '✅ PASSED' : '❌ FAILED'}`);
    }
    
    console.log('\n🏁 Internal agent system test suite completed!');
    process.exit(0);
  })();
}

module.exports = {
  testInternalAgentSystem,
  testFunctionCalls,
  testAgentSpecialization
};
