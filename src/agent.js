const { loadMemory, saveMemory } = require('./memory');
const { selfDefine } = require('./self');
const { logger } = require('./utils');

async function main() {
  let memory = loadMemory();
  if (!memory.answeredPersonal) {
    logger.info('Starting self-definition...');
    await selfDefine(memory);
    saveMemory(memory);
    logger.info('Self-definition complete.');
  } else {
    logger.info('Self-definition already complete.');
  }
  // Future: Add advanced reasoning, evolution, or UI here
}

if (require.main === module) {
  main();
}

module.exports = { main };
