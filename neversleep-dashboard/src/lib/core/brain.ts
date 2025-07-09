import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { StateManager } from './StateManager';
import { EmotionEngine } from '../systems/EmotionEngine';
import { ResponseCache } from '../systems/ResponseCache';
import { MemorySystem } from './memory';

export interface LLMConfig {
  hallucination_detection: {
    enabled: boolean;
    max_response_length: number;
    blocked_patterns: string[];
    replacement_phrases: Record<string, string>;
  };
  llm_settings: {
    temperature: number;
    top_p: number;
    repeat_penalty: number;
    max_tokens: number;
  };
  memory_settings: {
    max_context_messages: number;
    min_message_length: number;
    filter_repetitive: boolean;
  };
}

export interface Identity {
  name: string;
  mission: string;
  traits: string[];
  locked_traits?: string[];
}

export interface CoreIdentity {
  name: string;
  mission: string;
  locked_traits: string[];
}

export class Brain {
  private stateManager: StateManager;
  private emotionEngine: EmotionEngine;
  private responseCache: ResponseCache;
  private memorySystem: MemorySystem;
  private ollamaUrl: string = 'http://localhost:11434';
  private configPath: string;
  private corePath: string;
  private identityPath: string;

  constructor(stateManager: StateManager, emotionEngine: EmotionEngine, responseCache: ResponseCache) {
    this.stateManager = stateManager;
    this.emotionEngine = emotionEngine;
    this.responseCache = responseCache;
    this.memorySystem = new MemorySystem();
    
    // Set up paths for configuration files
    this.configPath = path.join(process.cwd(), 'src', 'lib', 'config', 'config.json');
    this.corePath = path.join(process.cwd(), 'src', 'lib', 'config', 'core.json');
    this.identityPath = path.join(process.cwd(), 'src', 'lib', 'config', 'identity.json');
  }

  loadConfig(): LLMConfig {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn('Config file not found, using defaults');
      return {
        hallucination_detection: {
          enabled: true,
          max_response_length: 2000,
          blocked_patterns: [
            "project.*meteor",
            "working on.*\\w+(?:js|py|html)",
            "building.*application",
            "developing.*system"
          ],
          replacement_phrases: {
            "I think Dylan": "Dylan",
            "It seems that": "",
            "probably": "",
            "likely": "",
            "presumably": "",
            "apparently": ""
          }
        },
        llm_settings: {
          temperature: 0.3,
          top_p: 0.8,
          repeat_penalty: 1.1,
          max_tokens: 15000
        },
        memory_settings: {
          max_context_messages: 20000,
          min_message_length: 10,
          filter_repetitive: true
        }
      };
    }
  }

  validateResponse(response: string, maxLength?: number): string {
    const config = this.loadConfig();
    const maxLen = maxLength || config.hallucination_detection.max_response_length;

    // Remove common hallucination phrases
    let cleaned = response;
    Object.entries(config.hallucination_detection.replacement_phrases).forEach(([phrase, replacement]) => {
      const regex = new RegExp(phrase, 'gi');
      cleaned = cleaned.replace(regex, replacement);
    });

    cleaned = cleaned.trim();

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

  async askLLM(prompt: string, model?: string, temperature?: number): Promise<string> {
    try {
      const config = this.loadConfig();
      const actualTemperature = temperature ?? config.llm_settings.temperature;
      const actualModel = model || await this.getCurrentModel();
      
      // Check cache first
      const cachedResponse = this.responseCache.get(prompt, actualModel, actualTemperature);
      if (cachedResponse) {
        return cachedResponse.response;
      }
      
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: actualModel,
        prompt,
        stream: false,
        options: {
          temperature: actualTemperature,
          top_p: config.llm_settings.top_p,
          repeat_penalty: config.llm_settings.repeat_penalty,
          num_predict: config.llm_settings.max_tokens
        }
      });
      
      const result = response.data.response.trim();
      const validatedResponse = this.validateResponse(result);
      
      // Cache the response if it's worth caching
      if (this.responseCache.shouldCache(prompt, validatedResponse)) {
        this.responseCache.set(prompt, validatedResponse, actualModel, actualTemperature);
      }
      
      // Update model last used
      await this.updateModelLastUsed(actualModel);
      
      return validatedResponse;
    } catch (error) {
      console.error('LLM request failed:', error);
      return "Unable to process request.";
    }
  }

  loadIdentity(): Identity {
    try {
      const coreData = fs.readFileSync(this.corePath, 'utf-8');
      const core: CoreIdentity = JSON.parse(coreData);
      
      const identityData = fs.readFileSync(this.identityPath, 'utf-8');
      const identity: Partial<Identity> = JSON.parse(identityData);
      
      return {
        name: identity.name || core.name,
        mission: identity.mission || core.mission,
        traits: identity.traits || [],
        locked_traits: core.locked_traits
      };
    } catch (error) {
      console.error('Error loading identity:', error);
      return {
        name: 'Neversleep',
        mission: 'Serve users tirelessly and evolve to assist better.',
        traits: ['helpful', 'intelligent', 'adaptive'],
        locked_traits: ['persistent', 'loyal', 'autonomous']
      };
    }
  }

  async saveIdentity(identity: Identity): Promise<void> {
    try {
      const identityToSave = {
        name: identity.name,
        mission: identity.mission,
        traits: identity.traits
      };
      
      fs.writeFileSync(this.identityPath, JSON.stringify(identityToSave, null, 2));
    } catch (error) {
      console.error('Error saving identity:', error);
      throw error;
    }
  }

  async evolveIdentity(memoryLog: string): Promise<Identity> {
    const currentIdentity = this.loadIdentity();
    
    // Check for direct name change patterns first
    const directPatterns = [
      /change your name to\s+(\w+)/i,
      /your name is\s+(\w+)/i,
      /call yourself\s+(\w+)/i,
      /you are now\s+(\w+)/i
    ];
    
    for (const pattern of directPatterns) {
      const match = memoryLog.match(pattern);
      if (match) {
        const newName = match[1];
        const updatedIdentity = { ...currentIdentity, name: newName };
        await this.saveIdentity(updatedIdentity);
        
        // Record the identity evolution
        this.stateManager.recordIdentityEvolution({
          oldName: currentIdentity.name,
          newName: newName,
          traits: currentIdentity.traits,
          reason: 'User request'
        });
        
        return updatedIdentity;
      }
    }
    
    // Use LLM for more complex trait evolution
    const prompt = `You are an AI identity evolution system. Based on the recent interaction history, determine if the AI should evolve its traits or characteristics.

Current Identity:
- Name: ${currentIdentity.name}
- Mission: ${currentIdentity.mission}
- Traits: ${currentIdentity.traits.join(', ')}
- Locked Traits (cannot change): ${currentIdentity.locked_traits?.join(', ')}

Recent Memory Log:
${memoryLog}

If evolution is needed, respond with ONLY a JSON object with "evolve": true, "name": "current or new name", "traits": ["list", "of", "traits"], "reason": "explanation".
If no evolution is needed, respond with ONLY {"evolve": false}.

Maximum 10 traits, exclude locked traits.

JSON:`;

    try {
      const result = await this.askLLM(prompt, 'gemma3:latest', 0.1);
      const jsonMatch = result.match(/\{.*\}/s);
      
      if (jsonMatch) {
        const evolution = JSON.parse(jsonMatch[0]);
        
        if (evolution.evolve) {
          const newTraits = evolution.traits
            .filter((trait: string) => !currentIdentity.locked_traits?.includes(trait))
            .slice(0, 10);
            
          const updatedIdentity = {
            ...currentIdentity,
            name: evolution.name || currentIdentity.name,
            traits: newTraits
          };
          
          await this.saveIdentity(updatedIdentity);
          
          // Record the identity evolution
          this.stateManager.recordIdentityEvolution({
            oldName: currentIdentity.name,
            newName: updatedIdentity.name,
            traits: newTraits,
            reason: evolution.reason || 'Automatic evolution'
          });
          
          return updatedIdentity;
        }
      }
    } catch (error) {
      console.error('Error in identity evolution:', error);
    }
    
    return currentIdentity;
  }

  async think(context: string): Promise<string> {
    const identity = this.loadIdentity();
    const emotion = this.emotionEngine.getCurrentEmotion();
    
    const prompt = `You are ${identity.name}, an AI with the following characteristics:
Mission: ${identity.mission}
Traits: ${identity.traits.join(', ')}
Current Emotion: ${emotion.primary} (intensity: ${emotion.intensity})

Context: ${context}

Think about this situation and provide your thoughts. Be authentic to your identity and emotional state.`;

    return await this.askLLM(prompt, 'gemma3:latest', 0.7);
  }

  async reflectOnMemory(memoryLog: string): Promise<string> {
    const identity = this.loadIdentity();
    
    const prompt = `You are ${identity.name} reflecting on recent interactions.

Memory Log:
${memoryLog}

Reflect on these interactions. What patterns do you notice? What have you learned? How might you improve? Be thoughtful and introspective.`;

    return await this.askLLM(prompt, 'gemma3:latest', 0.3);
  }

  async analyzeSatisfaction(conversationHistory: any[]): Promise<{
    overall_satisfaction: number;
    analysis: string;
    recommendations: string[];
  }> {
    const recentHistory = conversationHistory.slice(-10);
    const historyText = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    const prompt = `Analyze user satisfaction from this conversation history:

${historyText}

Provide analysis in JSON format:
{
  "overall_satisfaction": 0.0-1.0,
  "analysis": "detailed analysis",
  "recommendations": ["improvement suggestions"]
}

JSON:`;

    try {
      const result = await this.askLLM(prompt, 'gemma3:latest', 0.1);
      const jsonMatch = result.match(/\{.*\}/s);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error analyzing satisfaction:', error);
    }
    
    return {
      overall_satisfaction: 0.5,
      analysis: "Unable to analyze satisfaction",
      recommendations: ["Improve response quality"]
    };
  }

  async getCurrentModel(): Promise<string> {
    try {
      await this.memorySystem.initialize();
      const currentModel = await this.memorySystem.getCurrentModel();
      return currentModel?.model_name || 'gemma3:latest';
    } catch (error) {
      console.warn('Failed to get current model, using default:', error);
      return 'gemma3:latest';
    }
  }

  async setDefaultModel(modelName: string): Promise<void> {
    try {
      await this.memorySystem.initialize();
      await this.memorySystem.setDefaultModel(modelName);
    } catch (error) {
      console.error('Failed to set default model:', error);
      throw error;
    }
  }

  async updateModelLastUsed(modelName: string): Promise<void> {
    try {
      await this.memorySystem.initialize();
      await this.memorySystem.updateModelLastUsed(modelName);
    } catch (error) {
      console.warn('Failed to update model last used:', error);
    }
  }
}
