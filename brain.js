const axios = require('axios');
const fs = require('fs');

const OLLAMA_URL = 'http://localhost:11434';

function validateResponse(response, maxLength = 200) {
  // Remove common hallucination phrases
  const cleaned = response
    .replace(/I (think|believe|assume|imagine) Dylan/gi, 'Dylan')
    .replace(/It (seems|appears) that/gi, '')
    .replace(/probably|likely|presumably|apparently/gi, '')
    .trim();

  // Check length
  if (cleaned.length > maxLength) {
    return "Response too long. No new information to process.";
  }

  // Check for fabrication patterns
  const fabricationPatterns = [
    /project.*meteor/i,
    /working on.*\w+(?:js|py|html)/i,
    /building.*application/i,
    /developing.*system/i
  ];

  if (fabricationPatterns.some(pattern => pattern.test(cleaned))) {
    return "No factual information available.";
  }

  return cleaned;
}

async function askLLM(prompt, model = 'gemma3:latest') {
  try {
    const res = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more factual responses
        top_p: 0.8,
        repeat_penalty: 1.1
      }
    });
    
    const response = res.data.response.trim();
    return validateResponse(response);
  } catch (error) {
    console.error('LLM request failed:', error.message);
    return "Unable to process request.";
  }
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

STRICT FACTUAL ANALYSIS ONLY:
Recent conversation logs:
${recentLogs}

Rules:
1. ONLY reference information explicitly stated in the logs above
2. Do NOT invent any projects, dates, events, or user activities
3. Do NOT assume what the user is thinking, feeling, or doing
4. If logs are empty or contain no new info, respond: "No new information to process."
5. Maximum 2 sentences

Your factual observation:`;

  let thought = await askLLM(prompt);

  // Enhanced hallucination detection
  const hallucinationPatterns = [
    /project|initiative|experiment|simulation|unconfirmed|unknown|hypothetical/i,
    /he(?:'s| is) (thinking|drinking|feeling|struggling|working on)/i,
    /dylan.*(?:probably|might|seems to|appears to|likely)/i,
    /i (?:believe|think|assume|imagine) dylan/i,
    /it sounds like|it seems|presumably|apparently/i
  ];

  const isHallucination = hallucinationPatterns.some(pattern => pattern.test(thought));
  
  if (isHallucination || thought.length > 200) {
    thought = "No new information to process.";
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
