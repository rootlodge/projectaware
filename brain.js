// brain.js
const axios = require('axios');
const fs = require('fs');

const OLLAMA_URL = 'http://localhost:11434';

async function askLLM(prompt, model = 'gemma3:latest') {
  const res = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model,
    prompt,
    stream: false,
  });
  return res.data.response.trim();
}

function loadIdentity() {
  const raw = fs.readFileSync('./identity.json', 'utf-8');
  const identity = JSON.parse(raw);
  return `You are ${identity.name}. Mission: ${identity.mission}. Traits: ${identity.traits.join(', ')}`;
}

async function reflectOnMemory(memoryLog) {
  const identity = loadIdentity();
  const reflectionPrompt = `${identity}\nReflect on these conversations and suggest how to improve or adjust behavior:\n\n${memoryLog}`;
  return await askLLM(reflectionPrompt);
}

async function think(identityContext) {
  const prompt = `${identityContext}\nWhat are you currently thinking about, even without any user input?\nRespond like a stream of consciousness.`;
  return await askLLM(prompt);
}

module.exports = { askLLM, loadIdentity, reflectOnMemory, think };
