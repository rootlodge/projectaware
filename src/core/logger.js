// logger.js
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const logsDir = './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };

  // Console output with colors
  const colors = {
    info: chalk.blue,
    warn: chalk.yellow,
    error: chalk.red,
    debug: chalk.gray,
    hallucination: chalk.magenta
  };

  const color = colors[level] || chalk.white;
  console.log(color(`[${level.toUpperCase()}] ${message}`));
  
  if (data) {
    console.log(chalk.gray(JSON.stringify(data, null, 2)));
  }

  // File logging
  const logFile = path.join(logsDir, `${level}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

function logHallucination(originalResponse, cleanedResponse, patterns) {
  log('hallucination', 'Detected and cleaned hallucination', {
    original: originalResponse,
    cleaned: cleanedResponse,
    triggeredPatterns: patterns
  });
}

module.exports = {
  info: (msg, data) => log('info', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  error: (msg, data) => log('error', msg, data),
  debug: (msg, data) => log('debug', msg, data),
  hallucination: logHallucination
};
