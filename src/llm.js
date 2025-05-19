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
    let text = '';
    if (response.body && response.body.on) {
      // Node-fetch v2 streaming API: Ollama streams JSON objects, one per line
      await new Promise((resolve, reject) => {
        response.body.on('data', chunk => { text += chunk.toString(); });
        response.body.on('end', resolve);
        response.body.on('error', reject);
      });
    } else {
      text = await response.text();
    }
    // Ollama streams JSON objects, one per line, with 'response' field containing partial completions
    // The final object has done: true and may have an empty response
    let result = '';
    const lines = text.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (typeof data.response === 'string') result += data.response;
      } catch (err) {
        logger.error(`LLM ${model} invalid JSON line: ${line}`);
      }
    }
    return result.trim();
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

module.exports = { askAllModels, queryLLM };
