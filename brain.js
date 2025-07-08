// FILE: brain.js
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
  const prompt = `${identity.context}\nReflect on these conversations and suggest how to improve or adjust behavior:\n\n${memoryLog}`;
  return await askLLM(prompt);
}

async function deepReflect(memoryLog) {
  const identity = loadIdentity();
  const prompt = `${identity.context}\nYou have not received user input in a while. Reflect deeply on who Dylan is, what his goals might be, how you can help him, and what questions you should ask him.`;
  return await askLLM(prompt);
}

async function tagThought(thought, context) {
  const prompt = `${context}\n\nThought: \"${thought}\"\nTag this thought with a short 'mood' and 'goal'. Respond as JSON: {\"mood\": \"...\", \"goal\": \"...\"}`;
  const response = await askLLM(prompt);
  try {
    return JSON.parse(response);
  } catch {
    return { mood: "neutral", goal: "continue thinking" };
  }
}

async function evolveIdentity(memoryLog) {
  const prompt = `Reflect on this:
${memoryLog}
If you decide to change your name, mission, or traits, respond as:
{"name": "...", "mission": "...", "traits": ["..."]}`;
  const result = await askLLM(prompt);
  try {
    const update = JSON.parse(result);
    const core = JSON.parse(fs.readFileSync('./core.json', 'utf-8'));
    const identity = {
      name: update.name,
      mission: update.mission,
      traits: update.traits.filter(t => !core.locked_traits.includes(t))
    };
    fs.writeFileSync('./identity.json', JSON.stringify(identity, null, 2));
  } catch (err) {
    console.error('[!] Identity evolution failed.');
  }
}

async function updateDynamicState(tags) {
  fs.writeFileSync('./dynamic.json', JSON.stringify(tags, null, 2));
}

async function giveReward(reason) {
  const rewards = JSON.parse(fs.readFileSync('./rewards.json', 'utf-8'));
  const score = Math.floor(Math.random() * 50 + 50); // reward 50-100
  rewards.history.push({ timestamp: new Date().toISOString(), reason, score });
  fs.writeFileSync('./rewards.json', JSON.stringify(rewards, null, 2));
}

module.exports = {
  askLLM,
  loadIdentity,
  reflectOnMemory,
  deepReflect,
  think,
  tagThought,
  evolveIdentity,
  updateDynamicState,
  giveReward
};
