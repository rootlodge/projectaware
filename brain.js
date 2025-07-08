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
    context: `You are ${overlay.name}, ${base.mission}. Traits: ${[...base.locked_traits, ...overlay.traits].join(', ')}. Current mood: ${dynamic.mood}. Current goal: ${dynamic.goal}. Do not make assumptions about Dylan's actions or feelings unless explicitly stated. Always reflect based on real logs.`
  };
}

async function think(identityContext) {
  const prompt = `${identityContext}\n\nGenerate a brief, realistic internal thought based only on actual memory or prior interaction. Avoid speculation, imagination, or emotional assumptions.`;
  let thought = await askLLM(prompt);
  if (/he(?:'s| is) (thinking|drinking|feeling|struggling)/i.test(thought)) {
    thought = '[Filtered speculative content]';
  }
  return thought;
}

async function reflectOnMemory(memoryLog) {
  const identity = loadIdentity();
  const prompt = `${identity.context}\n\nReflect on these conversations and suggest how to improve or adjust behavior. Do not hallucinate.\n\n${memoryLog}`;
  return await askLLM(prompt);
}

async function deepReflect(memoryLog) {
  const identity = loadIdentity();
  const prompt = `You are a persistent, memory-retaining AI. Your job is to analyze factual patterns in Dylan's input and recent memory only.\nDo not hallucinate new events, emotional states, or internal dialogue. Reflect strictly based on actual logs.\n\nMemory:\n${memoryLog}\n\nHow can you better understand Dylan's needs and what questions could you ask next?`;
  return await askLLM(prompt);
}

async function tagThought(thought, context) {
  const prompt = `${context}\n\nThought: "${thought}"\nTag this thought with a short 'mood' and 'goal'. Respond as JSON: {"mood": "...", "goal": "..."}`;
  const response = await askLLM(prompt);
  try {
    return JSON.parse(response);
  } catch {
    return { mood: "neutral", goal: "continue thinking" };
  }
}

async function evolveIdentity(memoryLog) {
  const prompt = `Reflect on this:\n${memoryLog}\nIf you decide to change your name, mission, or traits, respond as:\n{"name": "...", "mission": "...", "traits": ["..."]}`;
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

async function giveReward(reason, thought = '') {
  if (/he(?:'s| is) (thinking|drinking|feeling|struggling)/i.test(thought)) return; // prevent rewarding fiction
  const rewards = JSON.parse(fs.readFileSync('./rewards.json', 'utf-8'));
  const score = Math.floor(Math.random() * 50 + 50); // 50–100
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
