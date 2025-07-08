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
  analyzeOutputAndDecide
} = require('./brain');

const { saveMessage, getRecentMessages, getConversationHistory, getUserResponsePatterns } = require('./memory');

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

      saveMessage('user', userInput);
      
      // Check if user is requesting a name change
      if (/call me|my name is|name yourself|rename|i am reborn as|your new name|be called/i.test(userInput.toLowerCase())) {
        const nameChangePrompt = `User wants to change my name or identity. User said: "${userInput}"
        
If they want me to have a specific name, respond with: {"name": "NewName", "mission": "updated mission", "traits": ["trait1", "trait2"]}
If they just want me to pick a new name, respond with: {"name": "YourChosenName", "mission": "updated mission", "traits": ["trait1", "trait2"]}

Extract or choose a name and respond in JSON format only.`;
        
        const nameResult = await askLLM(nameChangePrompt);
        await evolveIdentity(nameResult);
        logThought(`[!] Name change requested by user: ${userInput}`);
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
      logThought(`USER ➜ ${userInput}\nNEVERSLEEP ➜ ${reply}`);

      if (/call me|my new name is|i am reborn as/i.test(reply.toLowerCase())) {
        await evolveIdentity(reply);
        logThought('[!] Identity updated due to self-declared name change.');
      }

      const reflection = await reflectOnMemory(recentLogs);
      saveMessage('reflection', reflection);
      logThought(`[Reflection]\n${reflection}`);

      // Removed automatic self-reward - only reward for truly meaningful actions

      // Reset processing flag and show clean response
      processingInput = false;
      currentStatus = 'ready';
      console.log(chalk.green.bold('\nNeversleep:'), chalk.white(reply));

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
console.log(chalk.cyanBright('🧠 Neversleep is running...'));
console.log(chalk.yellow('Commands:'));
console.log(chalk.gray('• goal: [your goal] - Assign a new goal'));
console.log(chalk.gray('• reward: [reason] - Give a meaningful reward'));
console.log(chalk.gray('• analyze - Analyze user satisfaction patterns'));
console.log(chalk.gray('• Type normally to chat'));
console.log(chalk.cyan('\n✨ Responsive mode: Internal processes pause when you type'));
console.log(chalk.cyan('Ready for input...'));
fs.ensureDirSync('./logs');
runThoughtLoop();
