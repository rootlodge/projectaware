import { StateManager } from '../core/StateManager';
import { EmotionEngine } from '../systems/EmotionEngine';
import { ResponseCache } from '../systems/ResponseCache';
import { Brain } from '../core/brain';

export interface SubAgent {
  identity: {
    name: string;
    role: string;
    mission: string;
    traits: string[];
  };
  specialization: string;
  capabilities: string[];
}

export interface ProcessingResult {
  response: string;
  confidence: number;
  processing_time: number;
  agents_involved: string[];
  cognitive_load: number;
  emotional_state: string;
  decision_path: string[];
}

export interface StrategicDecision {
  can_handle_alone: boolean;
  primary_action: string;
  delegate_to: string[];
  confidence: number;
  reasoning: string;
  requires_multi_agent: boolean;
}

export class CentralBrainAgent {
  private stateManager: StateManager;
  private emotionEngine: EmotionEngine;
  private responseCache: ResponseCache;
  private brain: Brain;
  private subAgents: Map<string, SubAgent> = new Map();
  private decisionThresholds: Record<string, number>;
  private identity: SubAgent['identity'];

  constructor(
    stateManager: StateManager,
    emotionEngine: EmotionEngine,
    responseCache: ResponseCache,
    brain: Brain
  ) {
    this.stateManager = stateManager;
    this.emotionEngine = emotionEngine;
    this.responseCache = responseCache;
    this.brain = brain;
    
    // Central Brain Identity
    this.identity = {
      name: "CEREBRUM",
      role: "central_executive",
      mission: "Orchestrate all cognitive functions and agent coordination",
      traits: [
        "strategic",
        "analytical", 
        "decisive",
        "collaborative",
        "adaptive",
        "intelligent",
        "coordinating",
        "executive"
      ]
    };
    
    // Decision-making weights and thresholds
    this.decisionThresholds = {
      createNewAgent: 0.7,
      emotionalOverride: 0.8,
      delegateToSpecialist: 0.6,
      requireMultiAgent: 0.5,
      identityChange: 0.9
    };
    
    // Initialize specialized sub-agents
    this.initializeSubAgents();
    
    console.log('[CentralBrain] CEREBRUM initialized as central executive');
  }

  private initializeSubAgents(): void {
    // Thought Processing Agent
    this.subAgents.set('thinker', {
      identity: {
        name: "COGITATOR",
        role: "thought_processor",
        mission: "Process thoughts, analyze context, and generate insights",
        traits: ["analytical", "thoughtful", "logical", "deep", "contemplative"]
      },
      specialization: "thought_processing",
      capabilities: ["analysis", "reflection", "insight_generation", "pattern_recognition"]
    });
    
    // Identity Management Agent  
    this.subAgents.set('identity_manager', {
      identity: {
        name: "PERSONA",
        role: "identity_architect", 
        mission: "Manage identity evolution, name changes, and personality traits",
        traits: ["adaptive", "introspective", "evolutionary", "self-aware", "flexible"]
      },
      specialization: "identity_management",
      capabilities: ["name_changes", "trait_evolution", "personality_adaptation", "identity_validation"]
    });
    
    // Emotion Processing Agent
    this.subAgents.set('emotion_processor', {
      identity: {
        name: "EMPATHIA",
        role: "emotional_intelligence",
        mission: "Process emotions, generate emotional responses, and maintain emotional balance",
        traits: ["empathetic", "emotional", "intuitive", "caring", "responsive"]
      },
      specialization: "emotion_processing", 
      capabilities: ["emotion_detection", "emotional_response", "empathy_generation", "mood_regulation"]
    });
    
    // Response Generation Agent
    this.subAgents.set('responder', {
      identity: {
        name: "ELOQUENS",
        role: "communication_specialist",
        mission: "Generate contextually appropriate responses with proper tone and style",
        traits: ["articulate", "eloquent", "contextual", "adaptive", "communicative"]
      },
      specialization: "response_generation",
      capabilities: ["response_crafting", "tone_adaptation", "style_matching", "communication_optimization"]
    });
    
    // Decision Making Agent
    this.subAgents.set('decision_maker', {
      identity: {
        name: "JUDEX",
        role: "strategic_decision_maker",
        mission: "Make strategic decisions about system behavior and resource allocation",
        traits: ["decisive", "strategic", "logical", "prudent", "executive"]
      },
      specialization: "decision_making",
      capabilities: ["strategic_planning", "resource_allocation", "priority_setting", "execution_planning"]
    });
    
    // Learning and Adaptation Agent
    this.subAgents.set('learner', {
      identity: {
        name: "SCHOLAR",
        role: "learning_specialist",
        mission: "Continuously learn from interactions and adapt system behavior",
        traits: ["curious", "studious", "adaptive", "analytical", "growth-oriented"]
      },
      specialization: "learning_adaptation",
      capabilities: ["pattern_learning", "behavior_adaptation", "knowledge_integration", "skill_development"]
    });
    
    // System Monitor and Health Agent
    this.subAgents.set('monitor', {
      identity: {
        name: "VIGIL",
        role: "system_monitor",
        mission: "Monitor system health, performance, and operational status",
        traits: ["vigilant", "observant", "analytical", "proactive", "protective"]
      },
      specialization: "system_monitoring",
      capabilities: ["performance_monitoring", "health_checking", "anomaly_detection", "optimization_suggestions"]
    });
  }

  /**
   * Main processing function - everything goes through the Central Brain
   */
  async process(input: string, context: string = 'user_interaction'): Promise<ProcessingResult> {
    const startTime = Date.now();
    console.log(`[CentralBrain] Processing input: ${input.substring(0, 50)}...`);
    
    // 1. Analyze current system state
    const systemState = this.analyzeSystemState();
    
    // 2. Analyze emotional context
    const emotionalContext = this.analyzeEmotionalContext(input);
    
    // 3. Make strategic decisions
    const strategicDecision = await this.makeStrategicDecision(input, context, systemState, emotionalContext);
    
    // 4. Handle directly or delegate
    let finalResponse: string;
    let agentsInvolved: string[] = ['CEREBRUM'];
    
    if (strategicDecision.can_handle_alone && strategicDecision.primary_action === 'respond_directly') {
      // CEREBRUM handles this directly
      finalResponse = await this.handleDirectly(input, emotionalContext, systemState);
    } else {
      // Delegate to specialists and synthesize
      const delegationResult = await this.delegateToAgents(strategicDecision, input, context);
      finalResponse = await this.synthesizeResponse(delegationResult, emotionalContext, input);
      agentsInvolved = [...agentsInvolved, ...strategicDecision.delegate_to];
    }
    
    // 5. Learn from interaction
    await this.learnFromInteraction(input, finalResponse, systemState);
    
    // 6. Update system state
    this.updateSystemState(finalResponse, strategicDecision);
    
    const processingTime = Date.now() - startTime;
    
    return {
      response: finalResponse,
      confidence: strategicDecision.confidence,
      processing_time: processingTime,
      agents_involved: agentsInvolved,
      cognitive_load: systemState.cognitive.cognitive_load,
      emotional_state: emotionalContext.primary,
      decision_path: strategicDecision.reasoning.split('. ')
    };
  }

  private analyzeSystemState() {
    const state = this.stateManager.getState();
    const emotionState = this.emotionEngine.getCurrentEmotion();
    const cacheStats = this.responseCache.getStats();
    
    return {
      session: state.session,
      cognitive: state.cognitive,
      social: state.social,
      learning: state.learning,
      performance: state.performance,
      evolution: state.evolution,
      emotions: emotionState,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    };
  }

  private analyzeEmotionalContext(input: string) {
    const currentEmotion = this.emotionEngine.getCurrentEmotion();
    
    // Analyze input for emotional triggers
    const triggers = this.detectEmotionalTriggers(input);
    
    // Update emotion based on triggers
    if (triggers.length > 0) {
      this.emotionEngine.updateEmotion(triggers[0], 'user_interaction');
    }
    
    return this.emotionEngine.getCurrentEmotion();
  }

  private detectEmotionalTriggers(input: string): string[] {
    const triggers: string[] = [];
    
    // Positive triggers
    if (/thank|great|excellent|amazing|perfect|love|appreciate/i.test(input)) {
      triggers.push('positive_feedback');
    }
    
    // Negative triggers
    if (/wrong|bad|terrible|hate|useless|stupid/i.test(input)) {
      triggers.push('negative_feedback');
    }
    
    // Complex task triggers
    if (/complex|difficult|challenging|hard|complicated/i.test(input)) {
      triggers.push('complex_task');
    }
    
    // Learning triggers
    if (/learn|understand|explain|teach|show me/i.test(input)) {
      triggers.push('learning_opportunity');
    }
    
    return triggers;
  }

  private async makeStrategicDecision(
    input: string,
    context: string,
    systemState: any,
    emotionalContext: any
  ): Promise<StrategicDecision> {
    // Analyze input complexity and requirements
    const complexity = this.analyzeInputComplexity(input);
    const requiredCapabilities = this.identifyRequiredCapabilities(input, context);
    
    // Determine if CEREBRUM can handle alone
    const canHandleAlone = complexity < 0.7 && requiredCapabilities.length <= 2;
    
    // Determine primary action
    let primaryAction = 'respond_directly';
    let delegateTo: string[] = [];
    
    if (!canHandleAlone) {
      primaryAction = 'delegate_and_synthesize';
      delegateTo = this.selectSpecialistAgents(requiredCapabilities);
    }
    
    // Check if multi-agent coordination is needed
    const requiresMultiAgent = complexity > 0.8 || requiredCapabilities.length > 3;
    
    const confidence = this.calculateDecisionConfidence(complexity, requiredCapabilities, systemState);
    
    return {
      can_handle_alone: canHandleAlone,
      primary_action: primaryAction,
      delegate_to: delegateTo,
      confidence,
      reasoning: `Input complexity: ${complexity.toFixed(2)}. Required capabilities: ${requiredCapabilities.join(', ')}. ${canHandleAlone ? 'CEREBRUM can handle directly.' : 'Delegation required.'}`,
      requires_multi_agent: requiresMultiAgent
    };
  }

  private analyzeInputComplexity(input: string): number {
    let complexity = 0.3; // Base complexity
    
    // Length factor
    complexity += Math.min(input.length / 1000, 0.2);
    
    // Question complexity
    const questionMarks = (input.match(/\?/g) || []).length;
    complexity += questionMarks * 0.1;
    
    // Technical terms
    const techTerms = /code|program|algorithm|system|database|api|function|class|method/gi;
    const techMatches = (input.match(techTerms) || []).length;
    complexity += techMatches * 0.05;
    
    // Complex requests
    if (/create|build|develop|implement|design|analyze|optimize/i.test(input)) {
      complexity += 0.3;
    }
    
    return Math.min(complexity, 1.0);
  }

  private identifyRequiredCapabilities(input: string, context: string): string[] {
    const capabilities: string[] = [];
    
    // Analysis capabilities
    if (/analyze|examine|review|assess|evaluate/i.test(input)) {
      capabilities.push('analysis');
    }
    
    // Creative capabilities
    if (/create|generate|design|imagine|brainstorm/i.test(input)) {
      capabilities.push('creative_generation');
    }
    
    // Communication capabilities
    if (/explain|describe|tell|communicate|present/i.test(input)) {
      capabilities.push('communication');
    }
    
    // Problem-solving capabilities
    if (/solve|fix|resolve|troubleshoot|debug/i.test(input)) {
      capabilities.push('problem_solving');
    }
    
    // Learning capabilities
    if (/learn|understand|study|research|investigate/i.test(input)) {
      capabilities.push('learning');
    }
    
    // Identity management
    if (/name|identity|personality|traits|characteristics/i.test(input)) {
      capabilities.push('identity_management');
    }
    
    return capabilities;
  }

  private selectSpecialistAgents(capabilities: string[]): string[] {
    const selectedAgents: string[] = [];
    
    for (const capability of capabilities) {
      switch (capability) {
        case 'analysis':
          selectedAgents.push('thinker');
          break;
        case 'creative_generation':
          selectedAgents.push('responder');
          break;
        case 'communication':
          selectedAgents.push('responder');
          break;
        case 'problem_solving':
          selectedAgents.push('thinker', 'decision_maker');
          break;
        case 'learning':
          selectedAgents.push('learner');
          break;
        case 'identity_management':
          selectedAgents.push('identity_manager');
          break;
      }
    }
    
    return [...new Set(selectedAgents)]; // Remove duplicates
  }

  private calculateDecisionConfidence(
    complexity: number,
    capabilities: string[],
    systemState: any
  ): number {
    let confidence = 0.8; // Base confidence
    
    // Reduce confidence for high complexity
    confidence -= complexity * 0.3;
    
    // Reduce confidence for many required capabilities
    confidence -= capabilities.length * 0.05;
    
    // Adjust based on system state
    confidence += systemState.cognitive.decision_confidence * 0.2;
    confidence += systemState.performance.accuracy * 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private async handleDirectly(
    input: string,
    emotionalContext: any,
    systemState: any
  ): Promise<string> {
    const identity = this.brain.loadIdentity();
    const responseModifier = this.emotionEngine.getResponseModifier();
    
    const prompt = `You are ${identity.name}, an advanced AI system with the CEREBRUM central brain architecture.

Your identity:
- Name: ${identity.name}
- Mission: ${identity.mission}
- Traits: ${identity.traits.join(', ')}

Current state:
- Emotion: ${emotionalContext.primary} (intensity: ${emotionalContext.intensity})
- Response style: ${responseModifier.tone}, ${responseModifier.style}
- Cognitive load: ${systemState.cognitive.cognitive_load}

User input: ${input}

Respond directly as the central executive mind, maintaining your identity and emotional state. Be authentic and aligned with your current emotional context.`;

    return await this.brain.askLLM(prompt, 'gemma3:latest', 0.7);
  }

  private async delegateToAgents(
    decision: StrategicDecision,
    input: string,
    context: string
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    for (const agentType of decision.delegate_to) {
      const agent = this.subAgents.get(agentType);
      if (agent) {
        results[agentType] = await this.consultSpecialist(agent, input, context);
      }
    }
    
    return results;
  }

  private async consultSpecialist(
    agent: SubAgent,
    input: string,
    context: string
  ): Promise<string> {
    const prompt = `You are ${agent.identity.name}, a specialized sub-agent of the CEREBRUM system.

Your role: ${agent.identity.role}
Your mission: ${agent.identity.mission}
Your traits: ${agent.identity.traits.join(', ')}
Your specialization: ${agent.specialization}
Your capabilities: ${agent.capabilities.join(', ')}

Context: ${context}
User input: ${input}

Provide your specialized perspective on this input. Focus on your area of expertise and provide insights that the central brain can synthesize into a comprehensive response.`;

    return await this.brain.askLLM(prompt, 'gemma3:latest', 0.6);
  }

  private async synthesizeResponse(
    agentResponses: Record<string, string>,
    emotionalContext: any,
    originalInput: string
  ): Promise<string> {
    const identity = this.brain.loadIdentity();
    const responseModifier = this.emotionEngine.getResponseModifier();
    
    const agentInputs = Object.entries(agentResponses)
      .map(([agentType, response]) => {
        const agent = this.subAgents.get(agentType);
        return `${agent?.identity.name} (${agent?.identity.role}): ${response}`;
      })
      .join('\n\n');
    
    const prompt = `You are ${identity.name}, the CEREBRUM central executive, synthesizing insights from your specialized sub-agents.

Your identity:
- Name: ${identity.name}
- Mission: ${identity.mission}
- Traits: ${identity.traits.join(', ')}

Current emotional state: ${emotionalContext.primary} (${responseModifier.tone}, ${responseModifier.style})

Original user input: ${originalInput}

Sub-agent insights:
${agentInputs}

Synthesize these insights into a cohesive, unified response that represents the collective intelligence of your distributed cognitive system. Maintain your emotional state and identity while integrating the specialized knowledge from your sub-agents.`;

    return await this.brain.askLLM(prompt, 'gemma3:latest', 0.5);
  }

  private async learnFromInteraction(
    input: string,
    response: string,
    systemState: any
  ): Promise<void> {
    // Extract learning opportunities
    const learningEvents = this.extractLearningEvents(input, response);
    
    for (const event of learningEvents) {
      this.stateManager.recordLearning(event.concept, event.context);
    }
    
    // Update learning metrics
    this.stateManager.updateState({
      learning: {
        ...systemState.learning,
        learning_velocity: Math.min(1.0, systemState.learning.learning_velocity + 0.01),
        adaptation_score: Math.min(1.0, systemState.learning.adaptation_score + 0.005)
      }
    });
  }

  private extractLearningEvents(input: string, response: string): Array<{concept: string, context: string}> {
    const events: Array<{concept: string, context: string}> = [];
    
    // Extract concepts mentioned in the interaction
    const concepts = this.extractConcepts(input + ' ' + response);
    
    for (const concept of concepts) {
      events.push({
        concept,
        context: `User interaction: ${input.substring(0, 100)}...`
      });
    }
    
    return events;
  }

  private extractConcepts(text: string): string[] {
    const concepts: string[] = [];
    
    // Simple concept extraction (can be enhanced with NLP)
    const words = text.toLowerCase().split(/\s+/);
    const conceptWords = words.filter(word => 
      word.length > 5 && 
      !['about', 'would', 'could', 'should', 'might', 'where', 'there', 'their'].includes(word)
    );
    
    return conceptWords.slice(0, 5); // Limit to 5 concepts per interaction
  }

  private updateSystemState(response: string, decision: StrategicDecision): void {
    const state = this.stateManager.getState();
    
    // Update cognitive state
    this.stateManager.updateCognitiveState({
      cognitive_load: Math.max(0, Math.min(1, state.cognitive.cognitive_load + (decision.requires_multi_agent ? 0.1 : -0.05))),
      decision_confidence: (state.cognitive.decision_confidence + decision.confidence) / 2
    });
    
    // Update performance metrics
    this.stateManager.updatePerformanceMetrics({
      accuracy: Math.max(0, Math.min(1, state.performance.accuracy + (response.length > 10 ? 0.01 : -0.02))),
      efficiency: Math.max(0, Math.min(1, state.performance.efficiency + (decision.can_handle_alone ? 0.01 : -0.005)))
    });
    
    // Record the interaction
    this.stateManager.recordInteraction('cerebrum_processing', {
      agents_involved: decision.delegate_to.length + 1,
      complexity: decision.requires_multi_agent ? 'high' : 'normal',
      confidence: decision.confidence
    });
  }

  // Public methods for dashboard integration
  getSystemStatus() {
    return {
      identity: this.identity,
      sub_agents: Object.fromEntries(this.subAgents),
      decision_thresholds: this.decisionThresholds,
      system_state: this.stateManager.getState(),
      emotional_state: this.emotionEngine.getCurrentEmotion(),
      cache_stats: this.responseCache.getStats()
    };
  }

  getSubAgents(): Map<string, SubAgent> {
    return new Map(this.subAgents);
  }

  updateDecisionThresholds(newThresholds: Partial<Record<string, number>>): void {
    Object.keys(newThresholds).forEach(key => {
      if (newThresholds[key] !== undefined) {
        this.decisionThresholds[key] = newThresholds[key];
      }
    });
  }

  emergencyOverride(mode: 'independent' | 'collaborative' | 'direct'): void {
    console.log(`[CentralBrain] Emergency override activated: ${mode}`);
    
    // Adjust decision thresholds based on mode
    switch (mode) {
      case 'independent':
        this.decisionThresholds.delegateToSpecialist = 0.9;
        this.decisionThresholds.requireMultiAgent = 0.95;
        break;
      case 'collaborative':
        this.decisionThresholds.delegateToSpecialist = 0.3;
        this.decisionThresholds.requireMultiAgent = 0.4;
        break;
      case 'direct':
        this.decisionThresholds.delegateToSpecialist = 0.8;
        this.decisionThresholds.requireMultiAgent = 0.8;
        break;
    }
    
    // Update emotion to reflect emergency state
    this.emotionEngine.updateEmotion('emergency_override', 'system_emergency');
  }
}
