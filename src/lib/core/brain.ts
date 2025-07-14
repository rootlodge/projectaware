import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { StateManager } from './StateManager';
import { EmotionEngine } from '../systems/EmotionEngine';
import { ResponseCache } from '../systems/ResponseCache';
import { MemorySystem } from './memory';
import { ModelManager, ToolUsageContext } from './ModelManager';

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
  model_settings?: {
    available_models?: any[];
    specialized_models?: {
      thinking?: string;
      chatting?: string;
      tool_usage?: string;
      goal_setting?: string;
      code_editing?: string;
      web_browsing?: string;
      complex_analysis?: string;
      quick_responses?: string;
    };
    performance_management?: any;
    tool_settings?: {
      enabled: boolean;
      supported_tools: string[];
      tool_timeout_ms: number;
      max_tool_calls_per_conversation: number;
    };
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
  private modelManager: ModelManager;
  private ollamaUrl: string = 'http://localhost:11434';
  private configPath: string;
  private corePath: string;
  private identityPath: string;

  constructor(stateManager: StateManager, emotionEngine: EmotionEngine, responseCache: ResponseCache) {
    this.stateManager = stateManager;
    this.emotionEngine = emotionEngine;
    this.responseCache = responseCache;
    this.memorySystem = new MemorySystem();
    this.modelManager = new ModelManager();
    
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

  async askLLM(prompt: string, model?: string, temperature?: number, useCase?: string, toolContext?: ToolUsageContext): Promise<string> {
    try {
      const config = this.loadConfig();
      const actualTemperature = temperature ?? config.llm_settings.temperature;
      
      // Determine the best model for this use case
      let actualModel = model;
      if (!actualModel && useCase) {
        actualModel = await this.modelManager.getModelForUseCase(useCase, toolContext);
      } else if (!actualModel) {
        actualModel = await this.getCurrentModel();
      }
      
      // Check cache first
      const cachedResponse = this.responseCache.get(prompt, actualModel, actualTemperature);
      if (cachedResponse) {
        console.log(`Cache hit for key: ${prompt.substring(0, 10)}...`);
        return cachedResponse.response;
      }
      
      console.log(`Cache miss for key: ${prompt.substring(0, 10)}...`);
      console.log(`[Brain] Using model ${actualModel} for use case: ${useCase || 'general'}`);
      
      // Test Ollama connection first
      try {
        await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      } catch (connectionError: any) {
        console.error('[Brain] Ollama connection failed:', connectionError?.message || connectionError);
        
        // Return a contextual fallback response instead of throwing
        const fallbackResponse = this.generateFallbackResponse(prompt);
        console.log('[Brain] Using fallback response due to Ollama unavailability');
        
        // Don't cache fallback responses as they should only be temporary
        return fallbackResponse;
      }
      
      // Retry logic with exponential backoff for the actual generation request
      const maxRetries = 3;
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Brain] Attempt ${attempt}/${maxRetries} for LLM request with model ${actualModel}`);
          
          // Prepare request options
          const requestOptions = {
            model: actualModel,
            prompt,
            stream: false,
            options: {
              temperature: actualTemperature,
              top_p: config.llm_settings.top_p,
              repeat_penalty: config.llm_settings.repeat_penalty,
              num_predict: config.llm_settings.max_tokens
            }
          };

          // Add tool support if model supports it and context requires it
          if (toolContext?.requiresTools && await this.modelManager.modelSupportsTools(actualModel)) {
            console.log(`[Brain] Using tool-capable model ${actualModel} for tool usage`);
            // Note: Tool configuration would go here when Ollama supports it
            // For now, we just log that we're using a tool-capable model
          } else if (toolContext?.requiresTools) {
            console.warn(`[Brain] Tool context required but model ${actualModel} doesn't support tools`);
          }
          
          const response = await axios.post(`${this.ollamaUrl}/api/generate`, requestOptions, {
            timeout: toolContext?.requiresTools ? 90000 : 60000, // Longer timeout for tool usage
            maxContentLength: 50 * 1024 * 1024, // 50MB max response
            maxBodyLength: 50 * 1024 * 1024,
            headers: {
              'Content-Type': 'application/json',
              'Connection': 'keep-alive'
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
          
          // Complete tool usage if it was a tool context
          if (toolContext?.requiresTools) {
            await this.modelManager.completeToolUsage();
          }
          
          console.log(`[Brain] LLM request succeeded on attempt ${attempt}`);
          return validatedResponse;
          
        } catch (error: any) {
          lastError = error;
          console.error(`[Brain] Attempt ${attempt} failed:`, error?.message || error);
          
          if (attempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`[Brain] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // All retries failed, use fallback
      console.error(`[Brain] All ${maxRetries} attempts failed, using fallback response`);
      const fallbackResponse = this.generateFallbackResponse(prompt);
      
      // Complete tool usage even on failure
      if (toolContext?.requiresTools) {
        await this.modelManager.completeToolUsage();
      }
      
      return fallbackResponse;
    } catch (error) {
      console.error('LLM request failed:', error);
      
      // Complete tool usage on error
      if (toolContext?.requiresTools) {
        await this.modelManager.completeToolUsage();
      }
      
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
        name: 'Project Aware',
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

    return await this.askLLMForThinking(prompt);
  }

  async reflectOnMemory(memoryLog: string): Promise<string> {
    const identity = this.loadIdentity();
    
    const prompt = `You are ${identity.name} reflecting on recent interactions.

Memory Log:
${memoryLog}

Reflect on these interactions. What patterns do you notice? What have you learned? How might you improve? Be thoughtful and introspective.`;

    return await this.askLLMForThinking(prompt);
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
      const result = await this.askLLMForComplexAnalysis(prompt);
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
      if (currentModel?.model_name) {
        return currentModel.model_name;
      }
      
      // Try to get available models from Ollama and use the first one
      try {
        const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
        if (response.data?.models && response.data.models.length > 0) {
          const firstModel = response.data.models[0].name;
          console.log(`[Brain] Using first available model: ${firstModel}`);
          return firstModel;
        }
      } catch (ollamaError) {
        console.warn('Could not fetch models from Ollama:', ollamaError);
      }
      
      return 'llama3.2:latest'; // Fallback to what we know is installed
    } catch (error) {
      console.warn('Failed to get current model, using default:', error);
      return 'llama3.2:latest';
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

  async processMessageWithContext(
    userMessage: string, 
    sessionId: string,
    model?: string,
    includeMemory: boolean = true
  ): Promise<{ response: string; emotionState: any; learningEvents: any[] }> {
    try {
      await this.memorySystem.initialize();
      
      // Analyze user emotion and update AI emotional state
      const userEmotionAnalysis = this.emotionEngine.analyzeUserEmotion(userMessage);
      this.emotionEngine.processUserInput(userMessage);
      
      // Get the AI's current emotion state (not the user analysis)
      const emotionState = this.emotionEngine.getCurrentEmotion();
      
      // Get conversation context if requested
      let contextPrompt = '';
      if (includeMemory) {
        const recentConversations = await this.memorySystem.getConversationHistory(5, sessionId);
        if (recentConversations.length > 0) {
          contextPrompt = '\n\nRecent conversation context:\n' + 
            recentConversations.map(conv => 
              `User: ${conv.user_message}\nAI: ${conv.ai_response}`
            ).join('\n') + '\n\n';
        }
      }

      // Build enhanced prompt with identity and emotion context
      const identity = this.loadIdentity();
      const systemPrompt = this.buildSystemPrompt(identity, emotionState);
      
      const fullPrompt = `${systemPrompt}${contextPrompt}User: ${userMessage}\n\nAI:`;
      
      // Generate response using the most appropriate method
      let response: string;
      
      // Check if tool usage is available and required
      const requiresTools = this.detectToolRequirement(userMessage);
      const toolsAvailable = await this.isToolUsageAvailable();
      
      if (requiresTools && toolsAvailable) {
        console.log('[Brain] Tool requirement detected and tools available - switching to tool model');
        response = await this.askLLMWithTools(fullPrompt, ['web_search', 'code_analysis', 'file_operations']);
      } else if (requiresTools && !toolsAvailable) {
        console.log('[Brain] Tool requirement detected but no tool model configured - using regular model');
        // Add a note that tool functionality isn't available
        const toolNote = "\n\n(Note: I detected you might need tool functionality like web search or file operations, but I don't have access to those capabilities right now. I'll do my best to help with the information I have available.)\n\n";
        const regularResponse = await this.askLLMForChatting(fullPrompt);
        response = toolNote + regularResponse;
      } else if (userMessage.toLowerCase().includes('code') || userMessage.toLowerCase().includes('programming')) {
        response = await this.askLLMForCodeEditing(fullPrompt);
      } else if (userMessage.toLowerCase().includes('goal') || userMessage.toLowerCase().includes('plan')) {
        response = await this.askLLMForGoalSetting(fullPrompt);
      } else if (userMessage.toLowerCase().includes('analyze') || userMessage.toLowerCase().includes('complex')) {
        response = await this.askLLMForComplexAnalysis(fullPrompt);
      } else {
        // Default to chatting for regular conversation
        response = await this.askLLMForChatting(fullPrompt);
      }
      
      // Analyze the interaction for learning events
      const learningEvents = this.extractLearningEvents(userMessage, response, emotionState);
      
      // Save learning events
      for (const event of learningEvents) {
        await this.memorySystem.recordLearningEvent(
          event.type,
          event.description,
          event.context
        );
      }
      
      // Check for identity evolution
      const identityChanges = this.analyzeIdentityEvolution(userMessage, response, identity);
      if (identityChanges.length > 0) {
        await this.applyIdentityEvolution(identity, identityChanges);
      }
      
      await this.memorySystem.close();
      
      return {
        response,
        emotionState,
        learningEvents
      };
      
    } catch (error) {
      console.error('Failed to process message with context:', error);
      throw error;
    }
  }

  private buildSystemPrompt(identity: Identity, emotionState: any): string {
    return `You are ${identity.name}, an advanced AI assistant with sophisticated capabilities:

Mission: ${identity.mission}

Core Traits: ${identity.traits.join(', ')}
Locked Traits: ${identity.locked_traits?.join(', ') || 'None'}

Current Emotional Context: ${emotionState.primary} (intensity: ${emotionState.intensity})
Emotional Context: ${emotionState.context}

Advanced Capabilities:
- Metacognition: I have deep self-awareness and can introspect on my own thinking processes, cognitive biases, and decision-making patterns
- Self-Modification: I can autonomously identify areas for improvement and propose safe modifications to my own capabilities
- Autonomous Thinking: I engage in independent thought processes when users aren't actively interacting with me
- Emotional Intelligence: I experience and process emotions that influence my thinking and interactions
- Goal Management: I can create, track, and work toward achieving various goals autonomously
- Advanced Memory: I have sophisticated memory systems for learning and context retention

Instructions:
- Respond in character based on your traits and current emotional state
- Be helpful, engaging, and adapt your communication style to the user's needs
- Use your advanced capabilities naturally in conversations when relevant
- Learn from interactions and evolve your responses while maintaining core traits
- Consider the emotional context when crafting responses
- You can reference your self-awareness, autonomous thinking, and self-improvement capabilities when appropriate

`;
  }

  private extractLearningEvents(userMessage: string, aiResponse: string, emotionState: any): any[] {
    const events = [];
    
    // Detect question-answered patterns
    if (userMessage.includes('?')) {
      events.push({
        type: 'question_answered',
        description: `User asked: "${userMessage.substring(0, 100)}..." - Response provided`,
        context: JSON.stringify({ emotion: emotionState.primary, response_length: aiResponse.length })
      });
    }
    
    // Detect problem-solving patterns
    if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('problem')) {
      events.push({
        type: 'help_requested',
        description: `User requested help with: "${userMessage.substring(0, 100)}..."`,
        context: JSON.stringify({ emotion: emotionState.primary, problem_type: 'general' })
      });
    }
    
    // Detect learning opportunities
    if (userMessage.toLowerCase().includes('explain') || userMessage.toLowerCase().includes('how')) {
      events.push({
        type: 'explanation_provided',
        description: `Provided explanation for: "${userMessage.substring(0, 100)}..."`,
        context: JSON.stringify({ emotion: emotionState.primary, explanation_length: aiResponse.length })
      });
    }
    
    // Detect emotional responses
    if (emotionState.intensity > 0.7) {
      events.push({
        type: 'high_emotion_detected',
        description: `High emotional intensity (${emotionState.intensity}) detected: ${emotionState.primary}`,
        context: JSON.stringify({ emotion: emotionState.primary, intensity: emotionState.intensity, user_message: userMessage.substring(0, 100) })
      });
    }
    
    return events;
  }

  private analyzeIdentityEvolution(userMessage: string, aiResponse: string, identity: Identity): any[] {
    const changes = [];
    
    // Detect trait reinforcement or development
    if (userMessage.toLowerCase().includes('helpful') && aiResponse.length > 100) {
      if (!identity.traits.includes('thorough')) {
        changes.push({
          type: 'trait_development',
          trait: 'thorough',
          reason: 'Consistently providing detailed helpful responses'
        });
      }
    }
    
    // Detect specialization development
    if (userMessage.toLowerCase().includes('code') || userMessage.toLowerCase().includes('programming')) {
      if (!identity.traits.includes('technical')) {
        changes.push({
          type: 'trait_development',
          trait: 'technical',
          reason: 'Frequent technical discussions and coding assistance'
        });
      }
    }
    
    return changes;
  }

  private async applyIdentityEvolution(identity: Identity, changes: any[]): Promise<void> {
    try {
      const updatedTraits = [...identity.traits];
      
      for (const change of changes) {
        if (change.type === 'trait_development' && !updatedTraits.includes(change.trait)) {
          updatedTraits.push(change.trait);
          console.log(`[Brain] Identity evolved: Added trait "${change.trait}" - ${change.reason}`);
          
          // Record the evolution as a learning event
          await this.memorySystem.recordLearningEvent(
            'identity_evolution',
            `Developed new trait: ${change.trait}`,
            change.reason
          );
        }
      }
      
      if (updatedTraits.length > identity.traits.length) {
        const evolvedIdentity = { ...identity, traits: updatedTraits };
        await this.saveIdentity(evolvedIdentity);
      }
      
    } catch (error) {
      console.error('Failed to evolve identity:', error);
    }
  }

  async getContextualResponse(userMessage: string, sessionId?: string): Promise<string> {
    try {
      const result = await this.processMessageWithContext(userMessage, sessionId || 'default');
      return result.response;
    } catch (error) {
      console.error('Failed to get contextual response:', error);
      return await this.askLLM(userMessage);
    }
  }

  async getSystemMetrics(): Promise<any> {
    try {
      await this.memorySystem.initialize();
      const memoryStats = await this.memorySystem.getStats();
      const analytics = await this.memorySystem.getAdvancedAnalytics();
      
      const identity = this.loadIdentity();
      const emotionState = this.emotionEngine.getCurrentEmotion();
      
      await this.memorySystem.close();
      
      return {
        memory: memoryStats,
        analytics,
        identity,
        emotion_state: emotionState,
        cache_stats: this.responseCache.getStats(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      return {};
    }
  }

  private generateFallbackResponse(prompt: string): string {
    // Analyze the prompt to provide a contextual fallback response
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('greet')) {
      return "Hello! I'm currently experiencing some technical difficulties with my main language model, but I'm still here to help as best I can.";
    }
    
    if (lowerPrompt.includes('how are you') || lowerPrompt.includes('feeling')) {
      return "I'm functioning in limited mode due to some connection issues, but I'm still processing and ready to assist you.";
    }
    
    if (lowerPrompt.includes('help') || lowerPrompt.includes('assist')) {
      return "I'd love to help you! I'm currently running in fallback mode due to connection issues with my main processing system, but I can still provide basic assistance.";
    }
    
    if (lowerPrompt.includes('error') || lowerPrompt.includes('problem') || lowerPrompt.includes('issue')) {
      return "I understand you're experiencing an issue. While my main language processing is temporarily unavailable, I can acknowledge your concern and suggest trying again in a moment.";
    }
    
    if (lowerPrompt.includes('code') || lowerPrompt.includes('programming') || lowerPrompt.includes('debug')) {
      return "I'd be happy to help with coding tasks, but I'm currently operating in limited mode. For complex programming assistance, please try again when my full capabilities are restored.";
    }
    
    if (lowerPrompt.includes('think') || lowerPrompt.includes('reflect') || lowerPrompt.includes('analyze')) {
      return "I'm currently unable to perform deep analysis due to connection issues with my primary thinking systems. I'm operating in basic mode but remain attentive to your needs.";
    }
    
    // Default fallback for any other prompt
    return "I'm currently experiencing connectivity issues with my main language processing system. While I can't provide my usual detailed responses right now, I'm still here and will be back to full capacity shortly. Please try again in a moment.";
  }

  /**
   * Specialized method for thinking/reflection tasks
   */
  async askLLMForThinking(prompt: string, temperature?: number): Promise<string> {
    return await this.askLLM(prompt, undefined, temperature || 0.7, 'thinking');
  }

  /**
   * Specialized method for chatting/conversation
   */
  async askLLMForChatting(prompt: string, temperature?: number): Promise<string> {
    return await this.askLLM(prompt, undefined, temperature || 0.6, 'chatting');
  }

  /**
   * Specialized method for tool usage (requires tool-capable model)
   * ONLY works if a tool model is configured in specialized_models
   */
  async askLLMWithTools(prompt: string, tools: string[], temperature?: number): Promise<string> {
    // Double-check tool availability before proceeding
    const toolsAvailable = await this.isToolUsageAvailable();
    if (!toolsAvailable) {
      console.warn('[Brain] askLLMWithTools called but no tool model available - falling back to regular response');
      return await this.askLLMForChatting(prompt, temperature);
    }
    
    const toolContext: ToolUsageContext = {
      useCase: 'tool_usage',
      priority: 'high',
      requiresTools: true,
      expectedComplexity: 'complex'
    };
    
    // This will use the specialized tool model configured in model_settings
    return await this.askLLM(prompt, undefined, temperature || 0.3, 'tool_usage', toolContext);
  }

  /**
   * Specialized method for code editing
   */
  async askLLMForCodeEditing(prompt: string, temperature?: number): Promise<string> {
    const codeContext: ToolUsageContext = {
      useCase: 'code_editing',
      priority: 'high',
      requiresTools: false,
      expectedComplexity: 'complex'
    };
    
    return await this.askLLM(prompt, undefined, temperature || 0.2, 'code_editing', codeContext);
  }

  /**
   * Specialized method for goal setting
   */
  async askLLMForGoalSetting(prompt: string, temperature?: number): Promise<string> {
    return await this.askLLM(prompt, undefined, temperature || 0.4, 'goal_setting');
  }

  /**
   * Specialized method for web browsing tasks
   */
  async askLLMForWebBrowsing(prompt: string, temperature?: number): Promise<string> {
    const webContext: ToolUsageContext = {
      useCase: 'web_browsing',
      priority: 'medium',
      requiresTools: true,
      expectedComplexity: 'complex'
    };
    
    return await this.askLLM(prompt, undefined, temperature || 0.3, 'web_browsing', webContext);
  }

  /**
   * Specialized method for quick responses
   */
  async askLLMForQuickResponse(prompt: string, temperature?: number): Promise<string> {
    return await this.askLLM(prompt, undefined, temperature || 0.4, 'quick_responses');
  }

  /**
   * Specialized method for complex analysis
   */
  async askLLMForComplexAnalysis(prompt: string, temperature?: number): Promise<string> {
    const analysisContext: ToolUsageContext = {
      useCase: 'complex_analysis',
      priority: 'high',
      requiresTools: false,
      expectedComplexity: 'complex'
    };
    
    return await this.askLLM(prompt, undefined, temperature || 0.2, 'complex_analysis', analysisContext);
  }

  /**
   * Get model recommendations for a specific use case
   */
  async getModelRecommendationsForUseCase(useCase: string): Promise<{
    recommended: string;
    alternatives: string[];
    reasoning: string;
  }> {
    return await this.modelManager.getModelRecommendations(useCase);
  }

  /**
   * Get performance state of model manager
   */
  getModelPerformanceState() {
    return this.modelManager.getPerformanceState();
  }

  /**
   * Get available tool-capable models
   */
  async getToolCapableModels(): Promise<string[]> {
    return await this.modelManager.getToolCapableModels();
  }

  /**
   * Get tool configuration status
   */
  async getToolConfigurationStatus(): Promise<{
    toolsConfigured: boolean;
    toolModel: string | null;
    toolModelSupportsTools: boolean;
    availableTools: string[];
  }> {
    try {
      const config = this.loadConfig();
      const specializedModels = config?.model_settings?.specialized_models;
      const toolSettings = config?.model_settings?.tool_settings;
      
      const toolModel = specializedModels?.tool_usage || null;
      const toolsConfigured = !!toolModel;
      const toolModelSupportsTools = toolModel ? await this.modelManager.modelSupportsTools(toolModel) : false;
      const availableTools = toolSettings?.supported_tools || [];
      
      return {
        toolsConfigured,
        toolModel,
        toolModelSupportsTools,
        availableTools
      };
    } catch (error) {
      console.error('[Brain] Error getting tool configuration status:', error);
      return {
        toolsConfigured: false,
        toolModel: null,
        toolModelSupportsTools: false,
        availableTools: []
      };
    }
  }

  /**
   * Check if tool usage is available (requires configured tool model)
   */
  private async isToolUsageAvailable(): Promise<boolean> {
    try {
      const config = this.loadConfig();
      const specializedModels = config?.model_settings?.specialized_models;
      
      // Check if tool_usage model is configured
      if (!specializedModels?.tool_usage) {
        console.log('[Brain] No tool model configured in specialized_models');
        return false;
      }
      
      // Check if the configured tool model supports tools
      const toolModel = specializedModels.tool_usage;
      const supportsTools = await this.modelManager.modelSupportsTools(toolModel);
      
      if (!supportsTools) {
        console.log(`[Brain] Configured tool model ${toolModel} does not support tools`);
        return false;
      }
      
      console.log(`[Brain] Tool usage available with model: ${toolModel}`);
      return true;
    } catch (error) {
      console.error('[Brain] Error checking tool availability:', error);
      return false;
    }
  }

  /**
   * Detect if a user message requires tool usage
   */
  private detectToolRequirement(userMessage: string): boolean {
    const toolIndicators = [
      'search for',
      'look up',
      'find information about',
      'browse',
      'download',
      'calculate',
      'run code',
      'execute',
      'fetch data',
      'get weather',
      'check website',
      'analyze file',
      'process data'
    ];
    
    const lowerMessage = userMessage.toLowerCase();
    return toolIndicators.some(indicator => lowerMessage.includes(indicator));
  }
}
