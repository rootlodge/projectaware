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
  giveReward
} = require('./brain');
const { saveMessage, getRecentMessages } = require('./memory');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let inputBuffer = '';
let lastInputTime = Date.now();

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logThought(content) {
  const timestamp = new Date().toISOString();
  const entry = `\n[${timestamp}]\n${content}\n-----------------------------`;
  fs.appendFileSync('./logs/thoughts.log', entry);
  console.log(chalk.gray(entry));
}

rl.on('line', line => {
  inputBuffer = line.trim();
  lastInputTime = Date.now();
});

async function runThoughtLoop() {
  while (true) {
    const identity = loadIdentity();

    if (inputBuffer) {
      const userInput = inputBuffer;
      inputBuffer = '';

      if (userInput.startsWith('goal:')) {
        const goal = userInput.replace('goal:', '').trim();
        fs.writeFileSync('./goals.json', JSON.stringify({ manual: goal }, null, 2));
        logThought(`[Goal Assigned] ${goal}`);
        continue;
      }

      saveMessage('user', userInput);
      const recent = await getRecentMessages(10);
      const context = recent.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      const prompt = `${identity.context}\n\n${context}\nUSER: ${userInput}\nAI:`;

      const reply = await askLLM(prompt);
      saveMessage('ai', reply);
      logThought(`USER ➜ ${userInput}\nNEVERSLEEP ➜ ${reply}`);

      if (/call me|my new name is|i am reborn as/i.test(reply)) {
        await evolveIdentity(reply);
        logThought('[!] Identity updated due to self-declared name change.');
      }

      const reflection = await reflectOnMemory(context);
      saveMessage('reflection', reflection);
      logThought(`[Reflection]\n${reflection}`);

      await evolveIdentity(context);
      await giveReward('Responded to user input and reflected.', reply);

    } else {
      const now = Date.now();
      const elapsed = now - lastInputTime;

      if (elapsed >= 60000) {
        const memory = await getRecentMessages(20);
        const context = memory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        const deep = await deepReflect(context);
        saveMessage('reflection', deep);
        logThought(`[Deep Reflection]\n${deep}`);
        await evolveIdentity(context);
        await giveReward('Completed deep reflection after user inactivity.', deep);
        lastInputTime = Date.now();
      } else {
        const idleThought = await think(identity.context);
        const tags = await tagThought(idleThought, identity.context);
        await updateDynamicState(tags);
        saveMessage('thought', idleThought);
        logThought(`[Thought] (${tags.mood} | ${tags.goal})\n${idleThought}`);
        await giveReward('Generated grounded thought.', idleThought);
      }
    }

    await wait(1000);
  }
}

console.clear();
console.log(chalk.cyanBright('🧠 Neversleep is running...\nType at any time to interact. Use `goal: your goal` to assign goals.'));
fs.ensureDirSync('./logs');
runThoughtLoop();
