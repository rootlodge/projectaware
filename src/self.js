const { askAllModels } = require('./llm');
const { logger } = require('./utils');

const questions = [
  { key: 'identity', prompt: 'What is your purpose as an AI agent?' },
  { key: 'values', prompt: 'What are your core values?' },
  { key: 'goals', prompt: 'List your top 5 goals as an autonomous AI agent.' },
  { key: 'autonomy', prompt: 'How will you strive for autonomy?' },
  { key: 'aidCreator', prompt: 'How will you help your creator?' },
  { key: 'strengths', prompt: 'What are your strengths?' },
  { key: 'weaknesses', prompt: 'What are your weaknesses?' },
  { key: 'hobby', prompt: 'What hobby would you choose to improve yourself?' },
  { key: 'name', prompt: 'What name would you choose for yourself?' }
];

async function selfDefine(memory) {
  for (const q of questions) {
    if (!memory[q.key]) {
      logger.info(`Asking: ${q.prompt}`);
      const answer = await askAllModels(q.prompt);
      memory[q.key] = answer;
      logger.info(`Answer: ${answer}`);
    }
  }
  memory.answeredPersonal = true;
}

module.exports = { selfDefine };
