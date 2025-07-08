// agent.js
const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs-extra');
const {
  askLLM,
  loadIdentity,
  reflectOnMemory,
  think,
  tagThought,
  evolveIdentity,
  updateDynamicState
} = require('./brain');
const { saveMessage, getRecentMessages } = require('./memory');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let inputBuffer = '';
let identityObj = loadIdentity();

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
  inputBuffer = line;
});

async function runThoughtLoop() {
  while (true) {
    identityObj = loadIdentity();

    if (inputBuffer.trim()) {
      const userInput = inputBuffer.trim();
      inputBuffer = '';

      saveMessage('user', userInput);

      const recent = await getRecentMessages(10);
      const context = recent.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      const prompt = `${identityObj.context}\n\n${context}\nUSER: ${userInput}\nAI:`;

      const reply = await askLLM(prompt);
      saveMessage('ai', reply);
      logThought(`USER ➜ ${userInput}\nNEVERSLEEP ➜ ${reply}`);

      const reflection = await reflectOnMemory(context);
      saveMessage('reflection', reflection);
      logThought(`[Reflection]\n${reflection}`);

      await evolveIdentity(context);
    } else {
      const idleThought = await think(identityObj.context);
      const tags = await tagThought(idleThought, identityObj.context);
      await updateDynamicState(tags);

      saveMessage('thought', idleThought);
      logThought(`[Thought] (${tags.mood} | ${tags.goal})\n${idleThought}`);
    }

    await wait(1000);
  }
}

console.clear();
console.log(chalk.cyanBright('🧠 Neversleep is running...\nType at any time to interact.\n'));
fs.ensureDirSync('./logs');
runThoughtLoop();
