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

async function think(identityContext, recentLogs) {
  const prompt = `${identityContext}

You have access to the following recent factual logs from Dylan's interactions:

${recentLogs}

Based ONLY on these exact logs, provide a clear, concise internal thought or summary.

Important rules:
- Do NOT invent or speculate about projects, dates, or events.
- If there is no new information, say: "No new information to add."
- Include your current mood and goal if relevant.
- You may decide whether to continue processing, wait for user input, sleep (pause), or shut down.

Respond ONLY with a factual internal thought or decision.`;

  let thought = await askLLM(prompt);

  // Basic hallucination catch — block common fabrication keywords
  if (/project|initiative|experiment|meteor|simulation|unconfirmed|unknown|hypothetical/i.test(thought.toLowerCase())) {
    thought = "No new information to add.";
  }
  return thought;
}

async function reflectOnMemory(memoryLog) {
  const identity = loadIdentity();
  const prompt = `${identity.context}

Reflect on these conversations and suggest how to improve or adjust behavior. Do not hallucinate.

${memoryLog}`;

  let reflection = await askLLM(prompt);

  if (/project|initiative|experiment|meteor|simulation|unconfirmed|unknown|hypothetical/i.test(reflection.toLowerCase())) {
    reflection = "No new actionable insights from logs.";
  }
  return reflection;
}

async function deepReflect(memoryLog) {
  const identity = loadIdentity();
  const prompt = `You are a persistent, memory-retaining AI. Analyze ONLY the factual logs below without invention:

${memoryLog}

Based strictly on these logs:
- Reflect on patterns or needs Dylan has shown.
- Suggest specific questions or actions.
- You may decide to continue thinking, wait for input, sleep, or shut down.

Do NOT hallucinate, speculate, or invent new events.

Respond clearly with your reflection and current operational decision.`;

  let reflection = await askLLM(prompt);

  if (/project|initiative|experiment|meteor|simulation|unconfirmed|unknown|hypothetical/i.test(reflection.toLowerCase())) {
    reflection = "No new actionable insights from logs.";
  }
  return reflection;
}

async function tagThought(thought, context) {
  const prompt = `${context}

Thought: "${thought}"
Tag this thought with a short 'mood' and 'goal'. Respond as JSON: {"mood": "...", "goal": "..."}`;

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

async function giveReward(reason, thought = '') {
  if (/he(?:'s| is) (thinking|drinking|feeling|struggling)/i.test(thought)) return; // prevent rewarding fiction
  const rewards = JSON.parse(fs.readFileSync('./rewards.json', 'utf-8'));
  const score = Math.floor(Math.random() * 50 + 50); // 50–100
  rewards.history.push({ timestamp: new Date().toISOString(), reason, score });
  fs.writeFileSync('./rewards.json', JSON.stringify(rewards, null, 2));
}

async function analyzeOutputAndDecide(thought, goal) {
  const prompt = `You are a grounded AI agent that must manage your operational state.

Based on this internal thought:

"${thought}"

And current goal:

"${goal}"

Choose ONLY one of the following operational states:

- continue: keep iterating on thoughts and working
- idle: pause and wait for user input before continuing
- sleep: enter low-power sleep mode until woken by input
- shutdown: save all state and fully exit

Respond with exactly one word from: continue, idle, sleep, shutdown.`;

  let decision = await askLLM(prompt);
  decision = decision.trim().toLowerCase();

  if (!['continue', 'idle', 'sleep', 'shutdown'].includes(decision)) {
    decision = 'continue'; // default safe fallback
  }

  return decision;
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
  giveReward,
  analyzeOutputAndDecide
};
