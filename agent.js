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
  analyzeOutputAndDecide
} = require('./brain');

const { saveMessage, getRecentMessages } = require('./memory');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let inputBuffer = '';
let lastInputTime = Date.now();
let sleepMode = false;
let currentStatus = 'idle';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logThought(content) {
  const timestamp = new Date().toISOString();
  const entry = `\n[${timestamp}]\n${content}\n-----------------------------`;
  fs.appendFileSync('./logs/thoughts.log', entry);
  console.log(chalk.gray(entry));
}

function displayStatus() {
  const statusText = `[Status] Mode: ${currentStatus.toUpperCase()} | Last Input: ${new Date(lastInputTime).toLocaleTimeString()}`;
  console.log(chalk.yellowBright(statusText));
}

rl.on('line', line => {
  inputBuffer = line.trim();
  lastInputTime = Date.now();
  sleepMode = false;
  currentStatus = 'input';
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

      saveMessage('user', userInput);
      const recent = await getRecentMessages(10);
      const recentLogs = recent.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

      const thought = await think(identity.context, recentLogs);
      saveMessage('thought', thought);
      logThought(`[Thought]\n${thought}`);

      const tags = await tagThought(thought, identity.context);
      await updateDynamicState(tags);

      const replyPrompt = `${identity.context}\n\nUser: ${userInput}\nAI:`;
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

      currentStatus = 'input';

    } else if (!sleepMode) {
      const now = Date.now();
      const elapsed = now - lastInputTime;

      if (elapsed >= 60000) {
        const memory = await getRecentMessages(20);
        const memoryLogs = memory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const deepReflection = await deepReflect(memoryLogs);
        saveMessage('reflection', deepReflection);
        logThought(`[Deep Reflection]\n${deepReflection}`);

        await evolveIdentity(memoryLogs);
        // Removed automatic self-reward for routine reflection

        lastInputTime = Date.now();
        currentStatus = 'reflecting';

      } else {
        const recent = await getRecentMessages(10);
        const recentLogs = recent.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const idleThought = await think(identity.context, recentLogs);
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
    await wait(1000);
  }
}

console.clear();
console.log(chalk.cyanBright('🧠 Neversleep is running...'));
console.log(chalk.yellow('Commands:'));
console.log(chalk.gray('• goal: [your goal] - Assign a new goal'));
console.log(chalk.gray('• reward: [reason] - Give a meaningful reward'));
console.log(chalk.gray('• Type normally to chat'));
console.log(chalk.cyan('\nReady for input...'));
fs.ensureDirSync('./logs');
runThoughtLoop();
