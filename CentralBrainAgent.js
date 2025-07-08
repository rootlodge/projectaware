const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');
const { askLLM } = require('./brain');

class CentralBrainAgent {
  constructor(stateManager, emotionEngine, responseCache, multiAgentManager, internalAgentSystem, helpSystem) {
    this.stateManager = stateManager;
    this.emotionEngine = emotionEngine;
    this.responseCache = responseCache;
    this.multiAgentManager = multiAgentManager;
    this.internalAgentSystem = internalAgentSystem;
    this.helpSystem = helpSystem;
    
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
    
    // Specialized sub-agents with their own identities
    this.subAgents = new Map();
    
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
    
    logger.info('[CentralBrain] CEREBRUM initialized as central executive');
  }
  
  initializeSubAgents() {
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
   * @param {string} input - User input or system trigger
   * @param {string} context - Context of the input
   * @returns {Object} Processing result with decisions and actions
   */
  async process(input, context = 'user_interaction') {
    logger.info(`[CentralBrain] Processing input: ${input.substring(0, 50)}...`);
    
    // 1. Analyze current system state
    const systemState = this.analyzeSystemState();
    
    // 2. Analyze emotional context
    const emotionalContext = this.analyzeEmotionalContext(input);
    
    // 3. Make strategic decisions
    const strategicDecision = await this.makeStrategicDecision(input, context, systemState, emotionalContext);
    
    // 4. Delegate to appropriate agents
    const delegationResult = await this.delegateToAgents(strategicDecision);
    
    // 5. Synthesize final response
    const finalResponse = await this.synthesizeResponse(delegationResult, emotionalContext);
    
    // 6. Learn from interaction
    await this.learnFromInteraction(input, finalResponse, systemState);
    
    // 7. Update system state
    this.updateSystemState(finalResponse);
    
    return finalResponse;
  }
  
  analyzeSystemState() {
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
  
  analyzeEmotionalContext(input) {
    const currentEmotion = this.emotionEngine.getCurrentEmotion();
    const inputEmotion = this.emotionEngine.analyzeEmotion(input, 'central_brain_analysis');
    const styleModifiers = this.emotionEngine.getResponseStyleModifiers();
    const emotionalHistory = this.emotionEngine.getEmotionHistory(5);
    
    return {
      current: currentEmotion,
      inputDetected: inputEmotion, 
      styleModifiers: styleModifiers,
      recentHistory: emotionalHistory,
      emotionalStability: this.emotionEngine.getEmotionStats().stability
    };
  }
  
  async makeStrategicDecision(input, context, systemState, emotionalContext) {
    const prompt = `You are CEREBRUM, the central executive brain. Analyze the situation and make strategic decisions.

CURRENT SYSTEM STATE:
- Session Duration: ${Math.round((Date.now() - new Date(systemState.session.startTime).getTime()) / 1000 / 60)} minutes
- Total Interactions: ${systemState.session.totalInteractions}
- Current Mood: ${systemState.cognitive.currentMood}
- Current Goal: ${systemState.cognitive.currentGoal}
- Focus Level: ${systemState.cognitive.focusLevel}
- Energy Level: ${systemState.cognitive.energyLevel}

EMOTIONAL CONTEXT:
- Current Emotion: ${emotionalContext.current.primary} (${(emotionalContext.current.intensity * 100).toFixed(1)}% intensity)
- Input Emotion: ${emotionalContext.inputDetected.primary} (${(emotionalContext.inputDetected.intensity * 100).toFixed(1)}% intensity)
- Emotional Stability: ${(emotionalContext.emotionalStability * 100).toFixed(1)}%
- Response Tone: ${emotionalContext.styleModifiers.tone}

USER INPUT: "${input}"
CONTEXT: ${context}

DECISION ANALYSIS - Respond with JSON only:
{
  "primary_action": "respond|delegate|create_agent|identity_change|multi_agent_workflow",
  "urgency": 0.0-1.0,
  "complexity": 0.0-1.0,
  "emotional_override": true/false,
  "requires_specialists": ["agent_name1", "agent_name2"],
  "should_create_new_agent": true/false,
  "new_agent_spec": {"role": "role_name", "mission": "mission_description"} or null,
  "delegation_strategy": "sequential|parallel|hierarchical",
  "response_approach": "direct|collaborative|analytical|creative|empathetic",
  "identity_actions": {"name_change": true/false, "trait_evolution": true/false},
  "reasoning": "Brief explanation of decision logic"
}

JSON:`;

    try {
      const decision = await askLLM(prompt, 'gemma3:latest', 0.1);
      const jsonMatch = decision.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        logger.warn('[CentralBrain] Failed to parse strategic decision, using default');
        return this.getDefaultDecision();
      }
    } catch (error) {
      logger.error('[CentralBrain] Strategic decision failed:', error.message);
      return this.getDefaultDecision();
    }
  }
  
  getDefaultDecision() {
    return {
      primary_action: "respond",
      urgency: 0.5,
      complexity: 0.3,
      emotional_override: false,
      requires_specialists: ["responder"],
      should_create_new_agent: false,
      new_agent_spec: null,
      delegation_strategy: "sequential",
      response_approach: "direct",
      identity_actions: { name_change: false, trait_evolution: false },
      reasoning: "Default response due to analysis failure"
    };
  }
  
  async delegateToAgents(strategicDecision) {
    const results = {
      delegations: [],
      responses: [],
      actions_taken: [],
      new_agents_created: []
    };
    
    // Handle identity actions first if needed
    if (strategicDecision.identity_actions.name_change || strategicDecision.identity_actions.trait_evolution) {
      const identityResult = await this.delegateToIdentityManager(strategicDecision);
      results.delegations.push(identityResult);
      results.actions_taken.push('identity_management');
    }
    
    // Create new agent if needed
    if (strategicDecision.should_create_new_agent && strategicDecision.new_agent_spec) {
      const newAgent = await this.createSpecializedAgent(strategicDecision.new_agent_spec);
      results.new_agents_created.push(newAgent);
      results.actions_taken.push('agent_creation');
    }
    
    // Delegate to required specialists
    for (const agentName of strategicDecision.requires_specialists) {
      const delegationResult = await this.delegateToSpecialist(agentName, strategicDecision);
      results.delegations.push(delegationResult);
    }
    
    // Handle multi-agent workflows if needed
    if (strategicDecision.primary_action === 'multi_agent_workflow') {
      const workflowResult = await this.orchestrateMultiAgentWorkflow(strategicDecision);
      results.delegations.push(workflowResult);
      results.actions_taken.push('multi_agent_workflow');
    }
    
    return results;
  }
  
  async delegateToSpecialist(agentName, strategicDecision) {
    const agent = this.subAgents.get(agentName);
    
    if (!agent) {
      logger.warn(`[CentralBrain] Unknown specialist: ${agentName}`);
      return { success: false, error: `Unknown specialist: ${agentName}` };
    }
    
    const delegationPrompt = `You are ${agent.identity.name}, ${agent.identity.mission}.
    
Your traits: ${agent.identity.traits.join(', ')}
Your specialization: ${agent.specialization}
Your capabilities: ${agent.capabilities.join(', ')}

STRATEGIC CONTEXT from CEREBRUM:
- Primary Action: ${strategicDecision.primary_action}
- Urgency: ${(strategicDecision.urgency * 100).toFixed(0)}%
- Complexity: ${(strategicDecision.complexity * 100).toFixed(0)}%
- Response Approach: ${strategicDecision.response_approach}

TASK: Process this according to your specialization and provide output.

Your specialized response:`;

    try {
      const response = await askLLM(delegationPrompt, 'gemma3:latest', 0.3);
      
      logger.info(`[CentralBrain] Delegated to ${agent.identity.name}: ${response.substring(0, 100)}...`);
      
      return {
        agent: agentName,
        identity: agent.identity.name,
        specialization: agent.specialization,
        response: response,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[CentralBrain] Delegation to ${agentName} failed:`, error.message);
      return {
        agent: agentName,
        success: false,
        error: error.message
      };
    }
  }
  
  async delegateToIdentityManager(strategicDecision) {
    const identityAgent = this.subAgents.get('identity_manager');
    
    const prompt = `You are ${identityAgent.identity.name}, ${identityAgent.identity.mission}.

IDENTITY ACTIONS REQUESTED:
- Name Change: ${strategicDecision.identity_actions.name_change}
- Trait Evolution: ${strategicDecision.identity_actions.trait_evolution}

CURRENT IDENTITY STATE: ${JSON.stringify(this.getCurrentIdentity(), null, 2)}

Strategic Decision Context: ${strategicDecision.reasoning}

Process the identity management request and return JSON:
{
  "actions_taken": ["action1", "action2"],
  "new_identity": {"name": "name", "traits": ["trait1", "trait2"]},
  "reasoning": "Why these changes were made"
}

JSON:`;

    try {
      const result = await askLLM(prompt, 'gemma3:latest', 0.2);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const identityResult = JSON.parse(jsonMatch[0]);
        logger.info(`[CentralBrain] Identity managed by ${identityAgent.identity.name}`);
        return {
          agent: 'identity_manager',
          result: identityResult,
          success: true
        };
      }
    } catch (error) {
      logger.error('[CentralBrain] Identity delegation failed:', error.message);
    }
    
    return { agent: 'identity_manager', success: false };
  }
  
  async createSpecializedAgent(agentSpec) {
    const agentId = `specialized_${Date.now()}`;
    
    try {
      const newAgent = await this.multiAgentManager.createAgent(agentId, {
        name: agentSpec.role.replace('_', ' ').toUpperCase(),
        role: agentSpec.role,
        capabilities: [agentSpec.role],
        identity: {
          name: agentSpec.role.replace('_', ' ').toUpperCase(),
          mission: agentSpec.mission,
          traits: ['specialized', 'focused', 'efficient', 'dedicated']
        }
      });
      
      logger.info(`[CentralBrain] Created specialized agent: ${agentId} (${agentSpec.role})`);
      
      return {
        id: agentId,
        role: agentSpec.role,
        mission: agentSpec.mission,
        created: true
      };
    } catch (error) {
      logger.error('[CentralBrain] Failed to create specialized agent:', error.message);
      return {
        role: agentSpec.role,
        created: false,
        error: error.message
      };
    }
  }
  
  async orchestrateMultiAgentWorkflow(strategicDecision) {
    try {
      // Determine appropriate workflow based on decision
      let workflowId = 'problem_solving'; // default
      
      if (strategicDecision.response_approach === 'creative') {
        workflowId = 'creative_brainstorming';
      } else if (strategicDecision.response_approach === 'analytical') {
        workflowId = 'research';
      }
      
      const result = await this.multiAgentManager.executeWorkflow(workflowId, {
        context: strategicDecision.reasoning,
        urgency: strategicDecision.urgency,
        approach: strategicDecision.response_approach
      });
      
      logger.info(`[CentralBrain] Orchestrated multi-agent workflow: ${workflowId}`);
      
      return {
        type: 'multi_agent_workflow',
        workflow: workflowId,
        result: result,
        success: true
      };
    } catch (error) {
      logger.error('[CentralBrain] Multi-agent workflow failed:', error.message);
      return {
        type: 'multi_agent_workflow',
        success: false,
        error: error.message
      };
    }
  }
  
  async synthesizeResponse(delegationResults, emotionalContext) {
    // Collect all responses and actions
    const allResponses = delegationResults.delegations
      .filter(d => d.success && d.response)
      .map(d => `${d.identity}: ${d.response}`);
    
    const actionsText = delegationResults.actions_taken.length > 0 
      ? `Actions taken: ${delegationResults.actions_taken.join(', ')}`
      : '';
    
    const newAgentsText = delegationResults.new_agents_created.length > 0
      ? `New agents created: ${delegationResults.new_agents_created.map(a => a.role).join(', ')}`
      : '';
    
    // Generate emotional response based on current state
    const emotionalResponse = this.emotionEngine.generateEmotionalResponse('central_synthesis');
    
    const synthesisPrompt = `You are CEREBRUM, the central executive brain. Synthesize all specialist responses into a coherent final response.

EMOTIONAL CONTEXT: ${emotionalResponse.response}
Current emotional tone: ${emotionalContext.styleModifiers.tone}

SPECIALIST RESPONSES:
${allResponses.join('\n')}

SYSTEM ACTIONS:
${actionsText}
${newAgentsText}

Synthesize a final response that:
1. Incorporates key insights from specialists
2. Maintains emotional appropriateness
3. Reflects your role as central coordinator
4. Is coherent and helpful

Final response:`;

    try {
      const finalResponse = await askLLM(synthesisPrompt, 'gemma3:latest', 0.4);
      
      return {
        response: finalResponse,
        emotional_context: emotionalResponse,
        delegations: delegationResults.delegations.length,
        actions: delegationResults.actions_taken,
        new_agents: delegationResults.new_agents_created,
        synthesis_success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[CentralBrain] Response synthesis failed:', error.message);
      
      // Fallback response
      return {
        response: "I've processed your request through my specialized cognitive functions, though synthesis encountered some complexity.",
        synthesis_success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async learnFromInteraction(input, response, systemState) {
    const learningAgent = this.subAgents.get('learner');
    
    const learningPrompt = `You are ${learningAgent.identity.name}, ${learningAgent.identity.mission}.

INTERACTION TO LEARN FROM:
Input: "${input}"
Response: "${response.response}"
Success: ${response.synthesis_success}

SYSTEM STATE DURING INTERACTION:
${JSON.stringify(systemState, null, 2)}

What can be learned from this interaction? Consider:
- Patterns in user behavior
- Effectiveness of delegation strategies
- Emotional appropriateness of responses
- System performance insights

Learning insights:`;

    try {
      const insights = await askLLM(learningPrompt, 'gemma3:latest', 0.3);
      
      // Record learning in state manager
      this.stateManager.recordLearning('Central Brain Interaction', insights);
      
      logger.info(`[CentralBrain] Learning recorded by ${learningAgent.identity.name}`);
      
      return insights;
    } catch (error) {
      logger.error('[CentralBrain] Learning failed:', error.message);
      return null;
    }
  }
  
  updateSystemState(response) {
    // Update cognitive state based on processing
    this.stateManager.updateState({
      cognitive: {
        focusLevel: Math.min(1.0, this.stateManager.getState().cognitive.focusLevel + 0.1),
        energyLevel: Math.max(0.1, this.stateManager.getState().cognitive.energyLevel - 0.05)
      },
      performance: {
        responseQuality: response.synthesis_success ? 0.9 : 0.6
      }
    });
    
    // Record interaction
    this.stateManager.recordInteraction('central_brain_processing', {
      synthesis_success: response.synthesis_success,
      delegations: response.delegations,
      actions: response.actions?.length || 0
    });
  }
  
  getCurrentIdentity() {
    try {
      const base = JSON.parse(fs.readFileSync('./core.json', 'utf-8'));
      const overlay = JSON.parse(fs.readFileSync('./identity.json', 'utf-8'));
      
      return {
        ...base,
        ...overlay
      };
    } catch (error) {
      logger.error('[CentralBrain] Failed to load current identity:', error.message);
      return { name: 'Unknown', traits: [] };
    }
  }
  
  /**
   * Get the status of the Central Brain and all sub-agents
   */
  getStatus() {
    return {
      identity: this.identity,
      sub_agents: Array.from(this.subAgents.entries()).map(([key, agent]) => ({
        key: key,
        name: agent.identity.name,
        role: agent.identity.role,
        specialization: agent.specialization,
        capabilities: agent.capabilities
      })),
      decision_thresholds: this.decisionThresholds,
      system_state: this.analyzeSystemState()
    };
  }
  
  /**
   * Adjust decision thresholds based on learning
   */
  adjustDecisionThresholds(adjustments) {
    for (const [key, value] of Object.entries(adjustments)) {
      if (this.decisionThresholds.hasOwnProperty(key)) {
        this.decisionThresholds[key] = Math.max(0, Math.min(1, value));
        logger.info(`[CentralBrain] Adjusted ${key} threshold to ${this.decisionThresholds[key]}`);
      }
    }
  }
  
  /**
   * Emergency override for critical situations
   */
  emergencyOverride(action, context = 'emergency') {
    logger.warn(`[CentralBrain] EMERGENCY OVERRIDE: ${action}`);
    
    // Reset emotional state if needed
    if (action === 'emotional_reset') {
      this.emotionEngine.resetEmotion();
    }
    
    // Clear cache if needed
    if (action === 'cache_clear') {
      this.responseCache.clear();
    }
    
    // Force identity reset if needed
    if (action === 'identity_reset') {
      // This would trigger identity manager to reset to default
      return this.delegateToIdentityManager({
        identity_actions: { name_change: true, trait_evolution: true },
        reasoning: 'Emergency identity reset'
      });
    }
    
    return { emergency_action: action, executed: true, context: context };
  }
}

module.exports = CentralBrainAgent;
