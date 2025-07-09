// Test script for Multi-Agent Workflow System
const MultiAgentManager = require('../src/agents/MultiAgentManager');
const logger = require('../src/utils/logger');

async function testMultiAgentWorkflow() {
  console.log('🚀 Testing Multi-Agent Workflow System...\n');

  const manager = new MultiAgentManager();

  try {
    // Test 1: Create agents
    console.log('📝 Test 1: Creating agents...');
    
    const reviewer = await manager.createAgent('test_reviewer', {
      name: 'Test Code Reviewer',
      role: 'reviewer',
      capabilities: ['code_analysis', 'quality_assessment'],
      identity: {
        name: 'Test Code Reviewer',
        mission: 'Analyze code quality and provide feedback',
        traits: ['analytical', 'thorough', 'constructive']
      }
    });

    const analyst = await manager.createAgent('test_analyst', {
      name: 'Test Analyst',
      role: 'analyst',
      capabilities: ['data_analysis', 'problem_solving'],
      identity: {
        name: 'Test Analyst',
        mission: 'Analyze problems and provide insights',
        traits: ['logical', 'systematic', 'insightful']
      }
    });

    console.log(`✅ Created agents: ${reviewer.name}, ${analyst.name}\n`);

    // Test 2: Create a simple workflow
    console.log('📋 Test 2: Creating workflow...');
    
    const testWorkflow = await manager.createWorkflow('test_workflow', {
      name: 'Simple Test Workflow',
      description: 'A basic workflow for testing',
      coordination: 'sequential',
      agents: ['test_reviewer', 'test_analyst'],
      steps: [
        {
          name: 'initial_analysis',
          type: 'agent_task',
          agentId: 'test_reviewer',
          task: {
            type: 'analysis',
            focus: 'initial_review'
          },
          input: {
            source: 'workflow_params',
            key: 'task_description'
          }
        },
        {
          name: 'detailed_analysis',
          type: 'agent_task',
          agentId: 'test_analyst',
          task: {
            type: 'deep_analysis',
            focus: 'detailed_review'
          },
          input: {
            source: 'previous_step',
            step: 'initial_analysis'
          }
        },
        {
          name: 'collaboration',
          type: 'agent_collaboration',
          agents: ['test_reviewer', 'test_analyst'],
          collaborationType: 'discussion',
          task: {
            topic: 'Final recommendations',
            maxRounds: 2
          }
        }
      ]
    });

    console.log(`✅ Created workflow: ${testWorkflow.name}\n`);

    // Test 3: Execute workflow
    console.log('⚡ Test 3: Executing workflow...');
    
    const params = {
      task_description: 'Analyze a simple JavaScript function for code quality and performance.'
    };

    const result = await manager.executeWorkflow('test_workflow', params);
    
    console.log('✅ Workflow execution completed!');
    console.log(`📊 Results: ${result.stepsCompleted} steps completed in ${result.executionTime}ms\n`);

    // Test 4: Display agents and workflows
    console.log('📋 Test 4: Current system state...');
    
    const agents = manager.getAgents();
    const workflows = manager.getWorkflows();
    
    console.log(`Agents: ${agents.length}`);
    agents.forEach(agent => {
      console.log(`  • ${agent.name} (${agent.id}) - Role: ${agent.role} - Status: ${agent.status}`);
    });
    
    console.log(`Workflows: ${workflows.length}`);
    workflows.forEach(workflow => {
      console.log(`  • ${workflow.name} (${workflow.id}) - Steps: ${workflow.steps.length}`);
    });

    console.log('\n✅ All tests completed successfully!');
    
    // Test 5: Cleanup
    console.log('\n🧹 Test 5: Cleanup...');
    await manager.removeAgent('test_reviewer');
    await manager.removeAgent('test_analyst');
    console.log('✅ Cleanup completed!\n');

    return {
      success: true,
      message: 'Multi-agent workflow system is working correctly!'
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    logger.error('Multi-agent test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testAgentCollaboration() {
  console.log('🤝 Testing Agent Collaboration...\n');

  const manager = new MultiAgentManager();

  try {
    // Create specialized agents
    const agents = [
      {
        id: 'creative_thinker',
        config: {
          name: 'Creative Thinker',
          role: 'creative_thinker',
          capabilities: ['brainstorming', 'innovation'],
          identity: {
            name: 'Creative Thinker',
            mission: 'Generate innovative and creative solutions',
            traits: ['creative', 'innovative', 'open-minded', 'imaginative']
          }
        }
      },
      {
        id: 'logical_analyst',
        config: {
          name: 'Logical Analyst',
          role: 'analyst',
          capabilities: ['logical_analysis', 'systematic_thinking'],
          identity: {
            name: 'Logical Analyst',
            mission: 'Provide logical and systematic analysis',
            traits: ['logical', 'systematic', 'analytical', 'precise']
          }
        }
      },
      {
        id: 'practical_implementer',
        config: {
          name: 'Practical Implementer',
          role: 'implementer',
          capabilities: ['implementation', 'practical_solutions'],
          identity: {
            name: 'Practical Implementer',
            mission: 'Focus on practical and implementable solutions',
            traits: ['practical', 'implementation-focused', 'realistic', 'efficient']
          }
        }
      }
    ];

    // Create all agents
    for (const agentData of agents) {
      await manager.createAgent(agentData.id, agentData.config);
      console.log(`✅ Created ${agentData.config.name}`);
    }

    // Create collaboration workflow
    const collaborationWorkflow = await manager.createWorkflow('collaboration_test', {
      name: 'Multi-Perspective Problem Solving',
      description: 'Test collaboration between different thinking styles',
      coordination: 'sequential',
      steps: [
        {
          name: 'brainstorming',
          type: 'agent_task',
          agentId: 'creative_thinker',
          task: {
            type: 'brainstorming',
            focus: 'creative_solutions'
          },
          input: {
            source: 'workflow_params',
            key: 'problem'
          }
        },
        {
          name: 'analysis',
          type: 'agent_task',
          agentId: 'logical_analyst',
          task: {
            type: 'analysis',
            focus: 'logical_evaluation'
          },
          input: {
            source: 'previous_step',
            step: 'brainstorming'
          }
        },
        {
          name: 'implementation_review',
          type: 'agent_task',
          agentId: 'practical_implementer',
          task: {
            type: 'implementation_review',
            focus: 'practical_assessment'
          },
          input: {
            source: 'previous_step',
            step: 'analysis'
          }
        },
        {
          name: 'final_collaboration',
          type: 'agent_collaboration',
          agents: ['creative_thinker', 'logical_analyst', 'practical_implementer'],
          collaborationType: 'consensus',
          task: {
            topic: 'Optimal solution combining creativity, logic, and practicality',
            maxRounds: 3
          }
        }
      ]
    });

    console.log(`✅ Created collaboration workflow\n`);

    // Execute collaboration
    const problem = 'How to improve user engagement in a mobile app while maintaining simplicity?';
    const result = await manager.executeWorkflow('collaboration_test', { problem });

    console.log('✅ Collaboration workflow completed!');
    console.log(`📊 ${result.stepsCompleted} steps completed in ${result.executionTime}ms\n`);

    // Display final results
    if (result.results && result.results.length > 0) {
      const finalStep = result.results[result.results.length - 1];
      if (finalStep.result && finalStep.result.finalAgreement) {
        console.log('🎯 Final Consensus:');
        console.log(finalStep.result.finalAgreement);
      }
    }

    // Cleanup
    for (const agentData of agents) {
      await manager.removeAgent(agentData.id);
    }

    return {
      success: true,
      message: 'Agent collaboration test completed successfully!'
    };

  } catch (error) {
    console.error('❌ Collaboration test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  (async () => {
    console.log('🧪 Multi-Agent Workflow Tests\n');
    
    const basicTest = await testMultiAgentWorkflow();
    console.log(`Basic Test: ${basicTest.success ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (basicTest.success) {
      const collaborationTest = await testAgentCollaboration();
      console.log(`Collaboration Test: ${collaborationTest.success ? '✅ PASSED' : '❌ FAILED'}`);
    }
    
    console.log('\n🏁 Test suite completed!');
    process.exit(0);
  })();
}

module.exports = {
  testMultiAgentWorkflow,
  testAgentCollaboration
};
