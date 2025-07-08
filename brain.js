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

async function askLLM(prompt, model = 'gemma3:latest', temperature = null) {
  try {
    const config = loadConfig();
    const res = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model,
      prompt,
      stream: false,
      options: {
        temperature: temperature !== null ? temperature : config.llm_settings.temperature,
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
  // Check if there's actually meaningful content to think about
  const hasUserInput = recentLogs.includes('USER:');
  const hasRecentActivity = recentLogs.trim().length > 50;
  
  if (!hasUserInput && !hasRecentActivity) {
    // Return a simple idle state instead of generating repetitive thoughts
    return "Idle - awaiting user interaction.";
  }

  const prompt = `${identityContext}

STRICT FACTUAL ANALYSIS ONLY:
Recent conversation logs:
${recentLogs}

Rules:
1. ONLY reference information explicitly stated in the logs above
2. Do NOT invent any projects, dates, events, or user activities
3. Do NOT assume what the user is thinking, feeling, or doing
4. If logs show no meaningful new information, respond: "Awaiting user input."
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
  const logger = require('./logger');
  
  // First, check for direct name change patterns
  const directNamePatterns = [
    /change your name to\s+(\w+)/i,
    /your name is\s+(\w+)/i,
    /call yourself\s+(\w+)/i,
    /you are now\s+(\w+)/i,
    /become\s+(\w+)/i,
    /you should be called\s+(\w+)/i,
    /rename yourself to\s+(\w+)/i,
    /i want you to be\s+(\w+)/i
  ];
  
  for (const pattern of directNamePatterns) {
    const match = memoryLog.match(pattern);
    if (match && match[1]) {
      const newName = match[1];
      logger.info(`[Identity] Direct name change detected: ${newName}`);
      
      try {
        const currentIdentity = JSON.parse(fs.readFileSync('./identity.json', 'utf-8'));
        
        // Reflect on traits when name changes
        const traitReflectionPrompt = `The AI is changing its name to "${newName}". 
        
Current traits: ${currentIdentity.traits.join(', ')}

What traits should "${newName}" have? Consider:
- The personality that the name suggests
- Traits that would be helpful for the AI's mission
- Keep helpful core traits, add relevant new ones
- Maximum 10 traits

Respond with ONLY a JSON array of trait strings:
["trait1", "trait2", "trait3"]`;

        const traitResponse = await askLLM(traitReflectionPrompt, 'gemma3:latest', 0.3);
        let newTraits;
        
        try {
          newTraits = JSON.parse(traitResponse);
          if (!Array.isArray(newTraits)) {
            throw new Error('Not an array');
          }
          // Limit to 10 traits and filter out locked traits
          const core = JSON.parse(fs.readFileSync('./core.json', 'utf-8'));
          newTraits = newTraits
            .filter(t => !core.locked_traits.includes(t))
            .slice(0, 10);
        } catch {
          logger.warn('[Identity] Failed to parse new traits, keeping current ones');
          newTraits = currentIdentity.traits;
        }
        
        const identity = {
          name: newName,
          mission: `Assist users as ${newName}`,
          traits: newTraits
        };
        
        fs.writeFileSync('./identity.json', JSON.stringify(identity, null, 2));
        logger.info('[Identity] Successfully updated to:', identity);
        
        // Log the change to memory
        const { saveMessage } = require('./memory');
        await saveMessage('system', `Identity changed: Name is now ${newName}`);
        return;
        
      } catch (err) {
        logger.error('[Identity] Direct name change failed:', err.message);
      }
    }
  }
  
  // Fallback to LLM for complex cases
  const currentIdentity = JSON.parse(fs.readFileSync('./identity.json', 'utf-8'));
  const prompt = `You are a JSON parser for identity evolution. You MUST return only valid JSON. No explanations, no text, ONLY JSON.

Current Identity:
Name: ${currentIdentity.name}
Mission: ${currentIdentity.mission}
Current Traits: ${currentIdentity.traits.join(', ')}

Recent Context: ${memoryLog.slice(-1500)} // Last 1500 chars

Analyze if the AI needs to evolve its identity based on:
1. User requests for name/personality changes
2. New tasks requiring different traits
3. Conversation patterns suggesting needed adaptations

Trait Guidelines:
- You can have 1-10 traits maximum
- Consider: helpful, intelligent, creative, analytical, empathetic, curious, precise, adaptive, witty, patient, logical, intuitive, diplomatic, persistent, innovative
- Add traits relevant to current tasks/conversations
- Remove traits that seem unnecessary or conflicting

Output ONE of these JSON formats EXACTLY:

For changes: {"name": "NewName", "mission": "updated mission description", "traits": ["trait1", "trait2", "trait3", "up to 10 traits"]}
For no changes: {"no_change": true}

JSON:`;

  try {
    logger.debug('[Identity] Asking LLM for identity evolution...');
    const result = await askLLM(prompt, 'gemma3:latest', 0.1); // Very low temperature for consistency
    
    logger.debug('[Identity] Raw LLM response:', result);
    
    // Try to extract JSON from response if it contains other text
    let jsonMatch = result.match(/\{.*\}/s);
    if (!jsonMatch) {
      logger.warn('[Identity] No JSON found in response, assuming no change needed');
      return;
    }
    
    const cleanJson = jsonMatch[0];
    logger.debug('[Identity] Extracted JSON:', cleanJson);
    
    const update = JSON.parse(cleanJson);
    
    if (update.no_change) {
      logger.info('[Identity] No changes needed');
      return;
    }
    
    if (!update.name && !update.mission && !update.traits) {
      logger.warn('[Identity] Invalid update format, ignoring');
      return;
    }
    
    const core = JSON.parse(fs.readFileSync('./core.json', 'utf-8'));
    const currentIdentity = JSON.parse(fs.readFileSync('./identity.json', 'utf-8'));
    
    const identity = {
      name: update.name || currentIdentity.name,
      mission: update.mission || currentIdentity.mission,
      traits: (update.traits || currentIdentity.traits || ['helpful', 'intelligent'])
        .filter(t => !core.locked_traits.includes(t))
        .slice(0, 10) // Limit to 10 traits maximum
    };
    
    fs.writeFileSync('./identity.json', JSON.stringify(identity, null, 2));
    logger.info('[Identity] Successfully updated:', identity);
    
    // Log the change to memory for context
    const { saveMessage } = require('./memory');
    await saveMessage('system', `Identity evolved: ${JSON.stringify(identity)}`);
    
  } catch (err) {
    logger.error('[Identity] Evolution failed:', err.message);
    logger.debug('[Identity] Error details:', err);
    
    // Fallback: ensure identity.json exists with core values
    try {
      const core = JSON.parse(fs.readFileSync('./core.json', 'utf-8'));
      if (!fs.existsSync('./identity.json')) {
        const fallbackIdentity = {
          name: core.name,
          mission: core.mission,
          traits: [...core.locked_traits]
        };
        fs.writeFileSync('./identity.json', JSON.stringify(fallbackIdentity, null, 2));
        logger.info('[Identity] Created fallback identity');
      }
    } catch (fallbackErr) {
      logger.error('[Identity] Could not create fallback identity:', fallbackErr.message);
    }
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
  // If thought is idle/repetitive, default to continue without LLM call
  if (thought.includes('Idle - awaiting') || thought.includes('Awaiting user input') || thought.includes('No new information')) {
    return 'continue'; // Keep running but don't spam decisions
  }

  const prompt = `You are a grounded AI agent that must manage your operational state.

Based on this internal thought: "${thought}"
And current goal: "${goal}"

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
