const { loadMemory, saveMemory } = require('./memory');
const { selfDefine } = require('./self');
const { logger } = require('./utils');
const readline = require('readline');
const { askAllModels } = require('./llm');
const { models } = require('./config');

async function askQuestionLoop() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  while (true) {
    await new Promise(resolve => {
      rl.question('Ask the agent anything (or type exit): ', async (question) => {
        if (question.trim().toLowerCase() === 'exit') {
          rl.close();
          process.exit(0);
        }
        // Use qwen3:8b for reasoning if available, else fallback
        let answer = '';
        if (models.includes('qwen3:8b')) {
          answer = (await require('./llm').queryLLM(question, 'qwen3:8b')).trim();
        }
        if (!answer) {
          answer = await askAllModels(question);
        }
        logger.info(`Q: ${question}\nA: ${answer}`);
        console.log(`Agent: ${answer}\n`);
        resolve();
      });
    });
  }
}

async function agentLoop() {
  let memory = loadMemory();
  if (!memory.answeredPersonal) {
    logger.info('Starting self-definition...');
    await selfDefine(memory);
    saveMemory(memory);
    logger.info('Self-definition complete.');
  } else {
    logger.info('Self-definition already complete.');
  }
  // Autonomous idea generation loop
  setInterval(async () => {
    const ideaPrompt = 'Think of a new useful idea or task for an autonomous AI agent.';
    const idea = (await require('./llm').queryLLM(ideaPrompt, 'qwen3:8b')).trim() || await askAllModels(ideaPrompt);
    logger.info(`New idea: ${idea}`);
    // Optionally, store in memory or act on idea
  }, 60000); // every 60 seconds
  // Start interactive question loop
  askQuestionLoop();
}

if (require.main === module) {
  agentLoop();
}

module.exports = { agentLoop };
