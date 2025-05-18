const fs = require('fs');
const { memoryPath } = require('./config');

function loadMemory() {
  try {
    return JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
  } catch {
    return {};
  }
}

function saveMemory(memory) {
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
}

module.exports = { loadMemory, saveMemory };
