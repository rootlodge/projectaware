// test-colors.js - Quick test to verify chalk formatting
const chalk = require('chalk');

console.log('Testing chalk colors:');
console.log(chalk.cyan.bold('🧠 Neversleep AI - Always watching...'));
console.log(chalk.green.bold('Neversleep:'), chalk.white('This is a test response'));
console.log(chalk.gray.bold('\n[Reflection]'), chalk.gray.italic('This is a reflection'));
console.log(chalk.yellow('You:'), 'This is how user input looks');
console.log('\nAll colors working! ✅');
