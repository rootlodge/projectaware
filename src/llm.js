const fetch = require('node-fetch');
const { llmTimeoutMs, models } = require('./config');
const { logger } = require('./utils');

async function queryLLM(prompt, model) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), llmTimeoutMs);
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await response.json();
    return data.response || '';
  } catch (e) {
    logger.error(`LLM ${model} error: ${e}`);
    return '';
  }
}

async function askAllModels(prompt) {
  for (const model of models) {
    const answer = (await queryLLM(prompt, model)).trim();
    if (answer.length > 2) return answer;
  }
  return '[No answer]';
}

module.exports = { askAllModels };
