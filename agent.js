const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs-extra');
const {
  askLLM,
  loadIdentity,
  reflectOnMemory,
  deepReflect,
  think,
  tagThought,
  evolveIdentity,
  updateDynamicState,
  giveReward,
  userGiveReward,
  analyzeSatisfaction,
  analyzeOutputAndDecide,
  stateManager
} = require('./brain');

const { saveMessage, getRecentMessages, getConversationHistory, getUserResponsePatterns } = require('./memory');
const MultiAgentManager = require('./MultiAgentManager');
const InternalAgentSystem = require('./InternalAgentSystem');

// Initialize multi-agent manager and internal agent system
const multiAgentManager = new MultiAgentManager();
const internalAgentSystem = new InternalAgentSystem();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let inputBuffer = '';
let lastInputTime = Date.now();
let sleepMode = false;
let currentStatus = 'idle';
let processingInput = false;
let lastLoggedThought = '';
let lastLoggedTime = 0;
let thoughtsSinceLastMeaningful = 0;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logThought(content) {
  // Don't log thoughts when processing user input
  if (processingInput) return;
  
  const now = Date.now();
  const contentToCheck = content.replace(/\[.*?\]/g, '').trim(); // Remove timestamps and brackets for comparison
  
  // Special handling for idle/awaiting messages - be very restrictive
  const isIdleMessage = 
    contentToCheck.includes('Awaiting user input') ||
    contentToCheck.includes('Idle - awaiting') ||
    contentToCheck.includes('No new information to process');
  
  if (isIdleMessage) {
    const timeSinceLastLog = now - lastLoggedTime;
    // Only log idle messages if:
    // 1. It's been more than 2 minutes since last log, OR
    // 2. This is the first idle message after meaningful content
    if (timeSinceLastLog < 120000 && contentToCheck === lastLoggedThought) {
      return; // Skip this idle message
    }
  }
  
  // Check if this is a repetitive thought
  const isRepetitive = contentToCheck === lastLoggedThought;
  const timeSinceLastLog = now - lastLoggedTime;
  
  // Filter criteria for non-idle thoughts:
  if (isRepetitive && timeSinceLastLog < 30000 && !isIdleMessage) {
    thoughtsSinceLastMeaningful++;
    if (thoughtsSinceLastMeaningful > 2) {
      return; // Skip logging this repetitive thought
    }
  }
  
  // Reset counter for meaningful content
  if (!isRepetitive || content.includes('[Deep Reflection]') || content.includes('[Satisfaction Analysis]') || content.includes('USER ➜') || content.includes('[!]')) {
    thoughtsSinceLastMeaningful = 0;
  }
  
  const timestamp = new Date().toISOString();
  const entry = `\n[${timestamp}]\n${content}\n-----------------------------`;
  fs.appendFileSync('./logs/thoughts.log', entry);
  console.log(chalk.gray(entry));
  
  // Update tracking variables
  lastLoggedThought = contentToCheck;
  lastLoggedTime = now;
}

function displayStatus() {
  if (processingInput) return;
  
  const statusText = `[Status] Mode: ${currentStatus.toUpperCase()} | Last Input: ${new Date(lastInputTime).toLocaleTimeString()}`;
  console.log(chalk.yellowBright(statusText));
}

rl.on('line', line => {
  inputBuffer = line.trim();
  lastInputTime = Date.now();
  sleepMode = false;
  processingInput = true; // Set flag to interrupt other processes
  currentStatus = 'processing input';
});

async function runThoughtLoop() {
  while (true) {
    const identity = loadIdentity();

    if (inputBuffer) {
      const userInput = inputBuffer;
      inputBuffer = '';

      if (userInput.toLowerCase().startsWith('goal:')) {
        const goal = userInput.substring(5).trim();
        fs.writeFileSync('./goals.json', JSON.stringify({ manual: goal }, null, 2));
        logThought(`[Goal Assigned] ${goal}`);
        currentStatus = 'goal assigned';
        continue;
      }

      if (userInput.toLowerCase().startsWith('reward:')) {
        const reason = userInput.substring(7).trim();
        const result = await userGiveReward(reason);
        logThought(`[User Reward] ${result}`);
        currentStatus = 'reward given';
        continue;
      }

      if (userInput.toLowerCase().startsWith('analyze') || userInput.toLowerCase().startsWith('satisfaction')) {
        const conversationHistory = await getConversationHistory(20);
        const satisfactionAnalysis = await analyzeSatisfaction(conversationHistory);
        const userPatterns = await getUserResponsePatterns(50);
        
        console.log(chalk.magenta.bold('\n📊 SATISFACTION ANALYSIS:'));
        console.log(chalk.white(satisfactionAnalysis));
        console.log(chalk.cyan.bold('\n📈 USER PATTERNS:'));
        console.log(chalk.gray(`Positive indicators: ${userPatterns.positive_indicators}`));
        console.log(chalk.gray(`Negative indicators: ${userPatterns.negative_indicators}`));
        console.log(chalk.gray(`Questions asked: ${userPatterns.questions}`));
        console.log(chalk.gray(`Short responses: ${userPatterns.short_responses}`));
        console.log(chalk.gray(`Commands used: ${userPatterns.commands}`));
        console.log(chalk.gray(`Total interactions: ${userPatterns.total_interactions}`));
        
        saveMessage('satisfaction_analysis', satisfactionAnalysis);
        logThought(`[Manual Satisfaction Analysis]\n${satisfactionAnalysis}`);
        currentStatus = 'analysis complete';
        continue;
      }

      if (userInput.toLowerCase().startsWith('state') || userInput.toLowerCase().startsWith('status')) {
        const state = stateManager.getState();
        const summary = stateManager.getSessionSummary();
        
        console.log(chalk.blue.bold('\n🔧 SYSTEM STATE:'));
        console.log(chalk.gray(`Session Duration: ${Math.round(summary.duration / 1000 / 60)} minutes`));
        console.log(chalk.gray(`Total Interactions: ${summary.interactions}`));
        console.log(chalk.gray(`Concepts Learned: ${summary.conceptsLearned}`));
        console.log(chalk.gray(`Identity Changes: ${summary.identityChanges}`));
        console.log(chalk.gray(`Current Mood: ${summary.currentMood}`));
        console.log(chalk.gray(`User Engagement: ${summary.userEngagement}`));
        
        console.log(chalk.cyan.bold('\n⚡ COGNITIVE STATE:'));
        console.log(chalk.gray(`Focus Level: ${state.cognitive.focusLevel}`));
        console.log(chalk.gray(`Energy Level: ${state.cognitive.energyLevel}`));
        console.log(chalk.gray(`Confidence Level: ${state.cognitive.confidenceLevel}`));
        
        console.log(chalk.green.bold('\n📈 PERFORMANCE:'));
        console.log(chalk.gray(`Response Quality: ${state.performance.responseQuality}`));
        console.log(chalk.gray(`Task Completion Rate: ${state.performance.taskCompletionRate}`));
        console.log(chalk.gray(`Hallucination Count: ${state.performance.hallucinationCount}`));
        
        logThought(`[State Query] User requested system state information`);
        currentStatus = 'state reported';
        continue;
      }

      // Multi-Agent Workflow Commands
      if (userInput.toLowerCase().startsWith('agents')) {
        const agents = multiAgentManager.getAgents();
        console.log(chalk.cyan.bold('\n🤖 ACTIVE AGENTS:'));
        if (agents.length === 0) {
          console.log(chalk.gray('No agents currently active.'));
        } else {
          agents.forEach(agent => {
            console.log(chalk.white(`• ${agent.name} (${agent.id})`));
            console.log(chalk.gray(`  Role: ${agent.role} | Status: ${agent.status}`));
            if (agent.currentTask) {
              console.log(chalk.yellow(`  Current Task: ${agent.currentTask.type}`));
            }
          });
        }
        continue;
      }

      if (userInput.toLowerCase().startsWith('create agent')) {
        const params = userInput.substring(12).trim().split(' ');
        if (params.length < 2) {
          console.log(chalk.red('Usage: create agent <id> <role> [capabilities...]'));
          continue;
        }
        
        const [agentId, role, ...capabilities] = params;
        try {
          const agent = await multiAgentManager.createAgent(agentId, {
            name: agentId,
            role: role,
            capabilities: capabilities,
            identity: {
              name: agentId,
              mission: `Serve as ${role} in multi-agent workflows`,
              traits: ['collaborative', 'focused', 'analytical', 'responsive']
            }
          });
          
          console.log(chalk.green(`✅ Agent '${agentId}' created with role '${role}'`));
          logThought(`[Multi-Agent] Created agent '${agentId}' with role '${role}'`);
        } catch (error) {
          console.log(chalk.red(`❌ Failed to create agent: ${error.message}`));
        }
        continue;
      }

      if (userInput.toLowerCase().startsWith('workflows')) {
        const workflows = multiAgentManager.getWorkflows();
        console.log(chalk.magenta.bold('\n📋 AVAILABLE WORKFLOWS:'));
        if (workflows.length === 0) {
          console.log(chalk.gray('No workflows available.'));
        } else {
          workflows.forEach(workflow => {
            console.log(chalk.white(`• ${workflow.name} (${workflow.id})`));
            console.log(chalk.gray(`  Description: ${workflow.description}`));
            console.log(chalk.gray(`  Coordination: ${workflow.coordination} | Steps: ${workflow.steps.length}`));
          });
        }
        continue;
      }

      if (userInput.toLowerCase().startsWith('run workflow')) {
        const workflowId = userInput.substring(12).trim();
        if (!workflowId) {
          console.log(chalk.red('Usage: run workflow <workflow_id> [param:value ...]'));
          continue;
        }

        try {
          // Parse parameters if provided
          const parts = workflowId.split(' ');
          const actualWorkflowId = parts[0];
          const params = {};
          
          for (let i = 1; i < parts.length; i++) {
            const param = parts[i];
            if (param.includes(':')) {
              const [key, value] = param.split(':');
              params[key] = value;
            }
          }

          console.log(chalk.yellow(`🚀 Starting workflow: ${actualWorkflowId}`));
          logThought(`[Multi-Agent] Starting workflow: ${actualWorkflowId}`);
          
          const result = await multiAgentManager.executeWorkflow(actualWorkflowId, params);
          
          console.log(chalk.green('✅ Workflow completed successfully!'));
          console.log(chalk.white('Results:'));
          console.log(chalk.gray(JSON.stringify(result, null, 2)));
          
          logThought(`[Multi-Agent] Workflow '${actualWorkflowId}' completed: ${result.stepsCompleted} steps in ${result.executionTime}ms`);
        } catch (error) {
          console.log(chalk.red(`❌ Workflow failed: ${error.message}`));
          logThought(`[Multi-Agent] Workflow '${workflowId}' failed: ${error.message}`);
        }
        continue;
      }

      if (userInput.toLowerCase().startsWith('active executions')) {
        const executions = multiAgentManager.getActiveExecutions();
        console.log(chalk.blue.bold('\n⚡ ACTIVE EXECUTIONS:'));
        if (executions.length === 0) {
          console.log(chalk.gray('No workflows currently running.'));
        } else {
          executions.forEach(exec => {
            console.log(chalk.white(`• ${exec.workflowId} (${exec.id})`));
            console.log(chalk.gray(`  Status: ${exec.status} | Step: ${exec.currentStep + 1}/${exec.stepResults.length}`));
            console.log(chalk.gray(`  Started: ${new Date(exec.startTime).toLocaleTimeString()}`));
          });
        }
        continue;
      }

      if (userInput.toLowerCase().startsWith('setup demo agents')) {
        console.log(chalk.yellow('🔧 Setting up demo agents for testing...'));
        
        try {
          // Create demo agents
          await multiAgentManager.createAgent('reviewer', {
            name: 'Code Reviewer',
            role: 'reviewer',
            capabilities: ['code_analysis', 'quality_assessment'],
            identity: {
              name: 'Code Reviewer',
              mission: 'Analyze code quality and provide constructive feedback',
              traits: ['analytical', 'detail-oriented', 'constructive', 'thorough']
            }
          });

          await multiAgentManager.createAgent('security_analyst', {
            name: 'Security Analyst',
            role: 'security_analyst',
            capabilities: ['security_audit', 'vulnerability_detection'],
            identity: {
              name: 'Security Analyst',
              mission: 'Identify security vulnerabilities and recommend fixes',
              traits: ['security-focused', 'methodical', 'cautious', 'expert']
            }
          });

          await multiAgentManager.createAgent('performance_expert', {
            name: 'Performance Expert',
            role: 'performance_expert',
            capabilities: ['performance_analysis', 'optimization'],
            identity: {
              name: 'Performance Expert',
              mission: 'Optimize code performance and resource usage',
              traits: ['performance-focused', 'efficient', 'innovative', 'precise']
            }
          });

          await multiAgentManager.createAgent('researcher', {
            name: 'Research Specialist',
            role: 'researcher',
            capabilities: ['research', 'data_gathering'],
            identity: {
              name: 'Research Specialist',
              mission: 'Conduct thorough research and gather relevant information',
              traits: ['curious', 'thorough', 'analytical', 'systematic']
            }
          });

          console.log(chalk.green('✅ Demo agents created successfully!'));
          console.log(chalk.white('Available agents: reviewer, security_analyst, performance_expert, researcher'));
          console.log(chalk.gray('Try: "run workflow code_review_workflow" or "agents" to see them'));
          
          logThought('[Multi-Agent] Demo agents created successfully');
        } catch (error) {
          console.log(chalk.red(`❌ Failed to setup demo agents: ${error.message}`));
        }
        continue;
      }

      if (userInput.toLowerCase().startsWith('internal agents')) {
        const status = internalAgentSystem.getStatus();
        console.log(chalk.blue.bold('\n🧠 INTERNAL AGENT SYSTEM:'));
        console.log(chalk.gray(`Initialized: ${status.initialized}`));
        console.log(chalk.gray(`Internal Agents: ${status.agents}`));
        console.log(chalk.gray(`System Functions: ${status.systemFunctions.join(', ')}`));
        
        if (status.initialized) {
          const internalAgents = internalAgentSystem.multiAgentManager.getAgents();
          console.log(chalk.white('\nActive Internal Agents:'));
          internalAgents.forEach(agent => {
            console.log(chalk.white(`• ${agent.name} (${agent.role})`));
            console.log(chalk.gray(`  Mission: ${agent.identity.mission}`));
            console.log(chalk.gray(`  Traits: ${agent.identity.traits.join(', ')}`));
          });
        }
        continue;
      }

      if (userInput.toLowerCase().startsWith('init internal system')) {
        console.log(chalk.yellow('🔧 Initializing internal agent system...'));
        
        try {
          await internalAgentSystem.initialize();
          console.log(chalk.green('✅ Internal agent system initialized successfully!'));
          console.log(chalk.white('The AI now has specialized internal agents for different functions.'));
          console.log(chalk.gray('Try: "internal agents" to see the active internal agents'));
          
          logThought('[Internal System] Internal agent system initialized');
        } catch (error) {
          console.log(chalk.red(`❌ Failed to initialize internal system: ${error.message}`));
        }
        continue;
      }

      if (userInput.toLowerCase().startsWith('process with internal')) {
        if (!internalAgentSystem.getStatus().initialized) {
          console.log(chalk.yellow('🔧 Initializing internal agent system first...'));
          await internalAgentSystem.initialize();
        }

        const testInput = userInput.substring(20).trim() || 'Hello, how are you?';
        
        try {
          console.log(chalk.blue('🧠 Processing with internal agent system...'));
          
          const recent = await getRecentMessages(5);
          const context = {
            userInput: testInput,
            recentMessages: recent,
            currentIdentity: internalAgentSystem.getCurrentIdentity()
          };
          
          const result = await internalAgentSystem.processInput(testInput, context);
          
          console.log(chalk.green('✅ Internal processing completed!'));
          console.log(chalk.white('Results:'));
          
          if (result.results) {
            result.results.forEach((stepResult, index) => {
              console.log(chalk.cyan(`\n${index + 1}. ${stepResult.stepName} (${stepResult.stepType}):`));
              if (stepResult.success) {
                console.log(chalk.white(stepResult.result.response || JSON.stringify(stepResult.result, null, 2)));
              } else {
                console.log(chalk.red(`Error: ${stepResult.error}`));
              }
            });
          }
          
          logThought(`[Internal Processing] Processed input through internal agent system`);
        } catch (error) {
          console.log(chalk.red(`❌ Internal processing failed: ${error.message}`));
        }
        continue;
      }

      saveMessage('user', userInput);
      
      // Check if user is requesting a name change
      const nameChangePatterns = [
        /change your name to\s+(\w+)/i,
        /your name is\s+(\w+)/i,
        /call yourself\s+(\w+)/i,
        /you are now\s+(\w+)/i,
        /become\s+(\w+)/i,
        /you should be called\s+(\w+)/i,
        /rename yourself to\s+(\w+)/i,
        /i want you to be\s+(\w+)/i,
        /call me|my name is|name yourself|rename|i am reborn as|your new name|be called/i
      ];
      
      const isNameChange = nameChangePatterns.some(pattern => pattern.test(userInput.toLowerCase()));
      
      if (isNameChange) {
        await evolveIdentity(userInput);
        logThought(`[!] Name change requested by user: ${userInput}`);
        
        // Reload identity after change to use new name in response
        const updatedIdentity = loadIdentity();
        console.log(chalk.green.bold(`\n${updatedIdentity.name}:`), chalk.white(`I have changed my name to ${updatedIdentity.name} as requested.`));
        processingInput = false;
        currentStatus = 'ready';
        continue;
      }
      
      const recent = await getRecentMessages(10);
      const recentLogs = recent.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

      const thought = await think(identity.context, recentLogs);
      saveMessage('thought', thought);
      logThought(`[Thought]\n${thought}`);

      const tags = await tagThought(thought, identity.context);
      await updateDynamicState(tags);

      const replyPrompt = `${identity.context}

Based on recent conversation patterns, focus on:
- Providing clear, helpful responses
- Being attentive to Dylan's satisfaction level
- Adjusting response style based on feedback

User: ${userInput}
AI:`;
      const reply = await askLLM(replyPrompt);
      saveMessage('ai', reply);
      logThought(`USER ➜ ${userInput}\n${identity.name.toUpperCase()} ➜ ${reply}`);

      if (/call me|my new name is|i am reborn as/i.test(reply.toLowerCase())) {
        await evolveIdentity(reply);
        logThought('[!] Identity updated due to self-declared name change.');
      }

      // Record user interaction in state
      stateManager.recordInteraction('user_message', {
        satisfaction: 'pending', // Will be updated based on user response patterns
        tone: 'conversational'
      });

      const reflection = await reflectOnMemory(recentLogs);
      saveMessage('reflection', reflection);
      logThought(`[Reflection]\n${reflection}`);

      // Reset processing flag and show clean response
      processingInput = false;
      currentStatus = 'ready';
      console.log(chalk.green.bold(`\n${identity.name}:`), chalk.white(reply));

    } else if (!sleepMode && !processingInput) {
      const now = Date.now();
      const elapsed = now - lastInputTime;

      if (elapsed >= 60000) {
        const memory = await getRecentMessages(20);
        const memoryLogs = memory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const deepReflection = await deepReflect(memoryLogs);
        saveMessage('reflection', deepReflection);
        logThought(`[Deep Reflection]\n${deepReflection}`);

        // Analyze user satisfaction patterns
        const conversationHistory = await getConversationHistory(15);
        const satisfactionAnalysis = await analyzeSatisfaction(conversationHistory);
        saveMessage('satisfaction_analysis', satisfactionAnalysis);
        logThought(`[Satisfaction Analysis]\n${satisfactionAnalysis}`);

        // Get user response patterns
        const userPatterns = await getUserResponsePatterns(30);
        logThought(`[User Patterns] Positive: ${userPatterns.positive_indicators}, Negative: ${userPatterns.negative_indicators}, Questions: ${userPatterns.questions}, Total: ${userPatterns.total_interactions}`);

        await evolveIdentity(memoryLogs);
        // Removed automatic self-reward for routine reflection

        lastInputTime = Date.now();
        currentStatus = 'analyzing satisfaction';

      } else {
        // Skip idle thoughts if user is providing input
        if (processingInput || inputBuffer) {
          await wait(100);
          continue;
        }

        const recent = await getRecentMessages(10);
        const recentLogs = recent.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const idleThought = await think(identity.context, recentLogs);
        
        // Check again if user started typing
        if (processingInput || inputBuffer) {
          continue;
        }
        
        saveMessage('thought', idleThought);

        const tags = await tagThought(idleThought, identity.context);
        await updateDynamicState(tags);

        logThought(`[Thought] (${tags.mood} | ${tags.goal})\n${idleThought}`);
        // Removed automatic self-reward for routine thoughts

        const decision = await analyzeOutputAndDecide(idleThought, tags.goal);
        currentStatus = decision;

        if (decision === 'sleep') {
          logThought(`[System] Entering sleep mode. Waiting for input...`);
          sleepMode = true;

        } else if (decision === 'shutdown') {
          logThought(`[System] Decided to shut down. Goodbye.`);
          displayStatus();
          process.exit(0);

        } else if (decision === 'idle') {
          logThought(`[System] Pausing iteration until user input.`);
          await wait(5000);
          displayStatus();
          continue;
        }
      }
    }

    displayStatus();
    
    // Shorter wait time for better responsiveness to user input
    await wait(processingInput ? 50 : 1000);
  }
}

console.clear();
const identity = loadIdentity();
console.log(chalk.cyanBright(`🧠 ${identity.name} is running...`));
console.log(chalk.yellow('Commands:'));
console.log(chalk.gray('• goal: [your goal] - Assign a new goal'));
console.log(chalk.gray('• reward: [reason] - Give a meaningful reward'));
console.log(chalk.gray('• analyze - Analyze user satisfaction patterns'));
console.log(chalk.gray('• state - View detailed system state and performance'));
console.log(chalk.gray('• Type normally to chat'));
console.log(chalk.cyan('\n✨ Enhanced Features:'));
console.log(chalk.cyan('• Responsive interruption when you type'));
console.log(chalk.cyan('• Advanced identity evolution with trait reflection'));
console.log(chalk.cyan('• Anti-hallucination system for grounded responses'));
console.log(chalk.cyan('• Comprehensive state tracking and analysis'));
console.log(chalk.cyan('\nReady for input...'));
fs.ensureDirSync('./logs');
runThoughtLoop();
