const axios = require('axios');
const fs = require('fs');

const OLLAMA_URL = 'http://localhost:11434';

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
  } catch {
    // Fallback config if file doesn't exist
    return {
      hallucination_detection: {
        enabled: true,
        max_response_length: 2000,
        blocked_patterns: []
      },
      llm_settings: {
        temperature: 0.3,
        top_p: 0.8,
        repeat_penalty: 1.1,
        max_tokens: 15000
      }
    };
  }
}

function validateResponse(response, maxLength = null) {
  const config = loadConfig();
  const maxLen = maxLength || config.hallucination_detection.max_response_length;

  // Remove common hallucination phrases
  const cleaned = response
    .replace(/I (think|believe|assume|imagine) Dylan/gi, 'Dylan')
    .replace(/It (seems|appears) that/gi, '')
    .replace(/probably|likely|presumably|apparently/gi, '')
    .trim();

  // Check length
  if (cleaned.length > maxLen) {
    return `Response exceeds ${maxLen} characters. Please be more concise.`;
  }

  // Check for fabrication patterns from config
  const patterns = config.hallucination_detection.blocked_patterns.map(p => new RegExp(p, 'i'));
  
  if (patterns.some(pattern => pattern.test(cleaned))) {
    return "No factual information available.";
  }

  return cleaned;
}

async function askLLM(prompt, model = 'gemma3:latest') {
  try {
    const config = loadConfig();
    const res = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model,
      prompt,
      stream: false,
      options: {
        temperature: config.llm_settings.temperature,
        top_p: config.llm_settings.top_p,
        repeat_penalty: config.llm_settings.repeat_penalty,
        num_predict: config.llm_settings.max_tokens
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
  return thought;
}

async function reflectOnMemory(memoryLog) {
  const identity = loadIdentity();
  const prompt = `${identity.context}

Reflect on these conversations and suggest how to improve or adjust behavior. Do not hallucinate.

${memoryLog}`;

  return await askLLM(prompt);
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

  return await askLLM(prompt);
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
  // Only give rewards for meaningful actions, not routine thoughts
  const meaningfulReasons = [
    'Successfully helped user with specific request',
    'Learned something new from user interaction',
    'Corrected a previous mistake',
    'Provided valuable insight',
    'User expressed satisfaction',
    'Completed a challenging task'
  ];
  
  // Block self-rewards for routine activities
  const blockedReasons = [
    'Generated grounded thought',
    'Completed deep reflection after user inactivity',
    'Responded to user input and reflected'
  ];
  
  // Don't reward routine thoughts or hallucinations
  if (blockedReasons.some(blocked => reason.includes(blocked))) {
    return; // No reward for routine activities
  }
  
  // Don't reward if thought contains fabrications
  if (/he(?:'s| is) (thinking|drinking|feeling|struggling)/i.test(thought)) return;
  
  // Only proceed if it's a meaningful action
  if (!meaningfulReasons.some(meaningful => reason.includes(meaningful))) {
    return; // No reward for unmeaningful actions
  }
  
  const rewards = JSON.parse(fs.readFileSync('./rewards.json', 'utf-8'));
  const score = Math.floor(Math.random() * 30 + 70); // 70-100 for truly meaningful actions
  rewards.history.push({ 
    timestamp: new Date().toISOString(), 
    reason, 
    score,
    validated: true // Mark as a validated meaningful reward
  });
  fs.writeFileSync('./rewards.json', JSON.stringify(rewards, null, 2));
}

// New function for user-triggered rewards
async function userGiveReward(reason, score = 90) {
  const rewards = JSON.parse(fs.readFileSync('./rewards.json', 'utf-8'));
  rewards.history.push({ 
    timestamp: new Date().toISOString(), 
    reason: `USER REWARD: ${reason}`, 
    score,
    source: 'user',
    validated: true
  });
  fs.writeFileSync('./rewards.json', JSON.stringify(rewards, null, 2));
  return `Reward given: ${reason} (Score: ${score})`;
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

// New function for analyzing user satisfaction and conversation patterns
async function analyzeSatisfaction(conversationHistory) {
  const config = loadConfig();
  const prompt = `Analyze this conversation between Dylan and the AI to assess user satisfaction and interaction quality.

CONVERSATION HISTORY:
${conversationHistory}

Analyze the following aspects:
1. USER SATISFACTION INDICATORS:
   - Does Dylan seem satisfied with responses?
   - Are questions being answered effectively?
   - Is Dylan asking follow-up questions or changing topics?
   - Any signs of frustration or appreciation?

2. RESPONSE QUALITY PATTERNS:
   - Which types of responses get positive reactions?
   - What seems to frustrate or confuse Dylan?
   - Are responses too long, too short, or just right?

3. CONVERSATION FLOW:
   - Is Dylan building on previous topics or constantly switching?
   - Are there gaps in understanding?
   - What topics engage Dylan most?

4. IMPROVEMENT SUGGESTIONS:
   - How can responses be better tailored to Dylan's style?
   - What adjustments would improve satisfaction?

Respond with a clear analysis focusing ONLY on observable patterns from the actual conversation.`;

  return await askLLM(prompt);
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
  userGiveReward,
  analyzeOutputAndDecide,
  analyzeSatisfaction
};
