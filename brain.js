// brain.js
const axios = require('axios');
const fs = require('fs');

const OLLAMA_URL = 'http://localhost:11434';

async function askLLM(prompt, model = 'gemma3:latest') {
  const res = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model,
    prompt,
    stream: false
  });
  return res.data.response.trim();
}

function loadIdentity() {
  const base = JSON.parse(fs.readFileSync('./core.json', 'utf-8'));
  const overlay = JSON.parse(fs.readFileSync('./identity.json', 'utf-8'));
  const dynamic = JSON.parse(fs.readFileSync('./dynamic.json', 'utf-8'));

  return {
    ...base,
    ...overlay,
    ...dynamic,
    context: `You are ${overlay.name}, ${base.mission}. Traits: ${[...base.locked_traits, ...overlay.traits].join(', ')}. Current mood: ${dynamic.mood}. Current goal: ${dynamic.goal}.`
  };
}

async function think(identityContext) {
  const prompt = `${identityContext}\nWhat are you currently thinking about, even without any user input?\nRespond like a stream of consciousness.`;
  return await askLLM(prompt);
}

async function reflectOnMemory(memoryLog) {
  const identity = loadIdentity();
  const reflectionPrompt = `${identity.context}\nReflect on these conversations and suggest how to improve or adjust behavior:\n\n${memoryLog}`;
  return await askLLM(reflectionPrompt);
}

async function tagThought(thought, context) {
  const taggingPrompt = `${context}\n\nThought: "${thought}"\nTag this thought with a short 'mood' and 'goal'. Respond as JSON: {"mood": "...", "goal": "..."}`;
  const response = await askLLM(taggingPrompt);
  try {
    return JSON.parse(response);
  } catch {
    return { mood: "neutral", goal: "continue thinking" };
  }
}

async function evolveIdentity(memoryContext) {
  const prompt = `Here is your recent memory:\n${memoryContext}\n\nBased on this, update your name, mission, or traits if needed. Only change if strongly justified.\nRespond only as JSON:\n{"name": "...", "mission": "...", "traits": ["..."]}`;
  const response = await askLLM(prompt);
  try {
    const update = JSON.parse(response);
    const core = JSON.parse(fs.readFileSync('./core.json', 'utf-8'));
    const identity = {
      name: update.name,
      mission: update.mission,
      traits: update.traits.filter(trait => !core.locked_traits.includes(trait))
    };
    fs.writeFileSync('./identity.json', JSON.stringify(identity, null, 2));
  } catch (err) {
    console.error('[!] Identity update failed. Using existing.');
  }
}

async function updateDynamicState(tags) {
  fs.writeFileSync('./dynamic.json', JSON.stringify(tags, null, 2));
}

module.exports = {
  askLLM,
  loadIdentity,
  reflectOnMemory,
  think,
  tagThought,
  evolveIdentity,
  updateDynamicState
};
