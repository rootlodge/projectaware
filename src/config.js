module.exports = {
  models: ['llama3', 'dolphin3'],
  llmTimeoutMs: 10000,
  memoryPath: require('path').join(__dirname, 'memory.json'),
  logPath: require('path').join(__dirname, '../logs/agent.log'),
};
