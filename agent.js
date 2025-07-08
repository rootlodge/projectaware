// agent.js
const readline = require('readline');
const chalk = require('chalk');
const { askLLM, loadIdentity, reflectOnMemory, think } = require('./brain');
const { saveMessage, getRecentMessages } = require('./memory');
const fs = require('fs-extra');

const identity = loadIdentity();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let inputBuffer = '';
let lastReflection = '';

async function runThoughtLoop() {
  while (true) {
    if (inputBuffer.trim()) {
      const userInput = inputBuffer.trim();
      inputBuffer = ''; // reset

      saveMessage('user', userInput);
      const recent = await getRecentMessages(10);
      const context = recent.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      const prompt = `${identity}\n\n${context}\nUSER: ${userInput}\nAI:`;

      const reply = await askLLM(prompt);
      saveMessage('ai', reply);
      logThought(`USER ➜ ${userInput}\nNEVERSLEEP ➜ ${reply}`);

      const reflection = await reflectOnMemory(context);
      lastReflection = reflection;
      saveMessage('reflection', reflection);
      logThought(`[Reflection]\n${reflection}`);
    } else {
      const idleThought = await think(identity);
      saveMessage('thought', idleThought);
      logThought(`[Thought]\n${idleThought}`);
    }

    await wait(1000); // 1-second loop
  }
}

function logThought(content) {
  const timestamp = new Date().toISOString();
  const entry = `\n[${timestamp}]\n${content}\n-----------------------------`;
  fs.appendFileSync('./logs/thoughts.log', entry);
  console.log(chalk.gray(entry));
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Listen for user input without blocking loop
rl.on('line', line => {
  inputBuffer = line;
});

console.clear();
console.log(chalk.cyanBright('🧠 Neversleep is running...\nType at any time to interact.\n'));
fs.ensureDirSync('./logs');
runThoughtLoop();
