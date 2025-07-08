// agent.js
const inquirer = require('inquirer');
const chalk = require('chalk');
const { askLLM, loadIdentity, reflectOnMemory } = require('./brain');
const { saveMessage, getRecentMessages } = require('./memory');

async function main() {
  console.clear();
  console.log(chalk.cyan.bold('🧠 Neversleep AI - Always watching...'));

  while (true) {
    const { userInput } = await inquirer.prompt([
      { type: 'input', name: 'userInput', message: chalk.yellow('You:') }
    ]);

    if (!userInput.trim()) continue;

    saveMessage('user', userInput);

    const recentMessages = await getRecentMessages(10);
    const context = recentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const prompt = `${loadIdentity()}\n\n${context}\nUSER: ${userInput}\nAI:`;

    const reply = await askLLM(prompt);
    saveMessage('ai', reply);

    console.log(chalk.green.bold('Neversleep:'), chalk.white(reply));

    const reflection = await reflectOnMemory(context);
    console.log(chalk.gray.bold('\n[Reflection]'), chalk.gray.italic(reflection));
    saveMessage('reflection', reflection);
  }
}

main();
