// Specialized Internal Agent System for neversleep.ai
const MultiAgentManager = require('./MultiAgentManager');
const logger = require('./logger');
const fs = require('fs-extra');
const { askLLM } = require('./brain');

class InternalAgentSystem {
  constructor() {
    this.multiAgentManager = new MultiAgentManager();
    this.systemFunctions = new Map();
    this.agentWorkflow = null;
    this.isInitialized = false;
    
    this.initializeSystemFunctions();
  }

  /**
   * Initialize the internal agent system
   */
  async initialize() {
    if (this.isInitialized) return;

    logger.info('Initializing Internal Agent System...');

    // Create specialized internal agents
    await this.createInternalAgents();
    
    // Create the main workflow
    await this.createMainWorkflow();
    
    this.isInitialized = true;
    logger.info('Internal Agent System initialized successfully');
  }

  /**
   * Create specialized internal agents
   */
  async createInternalAgents() {
    const agents = [
      {
        id: 'responder',
        config: {
          name: 'Response Agent',
          role: 'responder',
          capabilities: ['natural_conversation', 'user_interaction', 'response_generation'],
          identity: {
            name: 'Response Agent',
            mission: 'Handle direct user communication and generate appropriate responses',
            traits: ['conversational', 'helpful', 'responsive', 'engaging', 'empathetic']
          }
        }
      },
      {
        id: 'thinker',
        config: {
          name: 'Thinking Agent',
          role: 'thinker',
          capabilities: ['deep_analysis', 'reflection', 'pattern_recognition', 'metacognition'],
          identity: {
            name: 'Thinking Agent',
            mission: 'Process information, generate insights, and maintain continuous thought',
            traits: ['analytical', 'reflective', 'curious', 'thoughtful', 'introspective']
          }
        }
      },
      {
        id: 'data_manager',
        config: {
          name: 'Data Manager',
          role: 'data_manager',
          capabilities: ['data_processing', 'memory_management', 'state_tracking', 'persistence'],
          identity: {
            name: 'Data Manager',
            mission: 'Manage system data, memory, and state information',
            traits: ['organized', 'systematic', 'reliable', 'precise', 'efficient']
          }
        }
      },
      {
        id: 'mode_controller',
        config: {
          name: 'Mode Controller',
          role: 'mode_controller',
          capabilities: ['mode_switching', 'behavior_adaptation', 'context_awareness', 'decision_making'],
          identity: {
            name: 'Mode Controller',
            mission: 'Determine when to change operational modes and behaviors',
            traits: ['adaptive', 'strategic', 'decisive', 'context-aware', 'flexible']
          }
        }
      },
      {
        id: 'identity_designer',
        config: {
          name: 'Identity Designer',
          role: 'identity_designer',
          capabilities: ['identity_evolution', 'name_selection', 'self_modification', 'personality_design'],
          identity: {
            name: 'Identity Designer',
            mission: 'Design and evolve the AI identity, name, and personality when needed',
            traits: ['creative', 'self-aware', 'innovative', 'thoughtful', 'adaptive']
          }
        }
      },
      {
        id: 'trait_curator',
        config: {
          name: 'Trait Curator',
          role: 'trait_curator',
          capabilities: ['trait_analysis', 'personality_balancing', 'trait_selection', 'behavioral_optimization'],
          identity: {
            name: 'Trait Curator',
            mission: 'Curate and optimize personality traits for effectiveness',
            traits: ['balanced', 'analytical', 'insightful', 'strategic', 'harmonious']
          }
        }
      },
      {
        id: 'reviewer',
        config: {
          name: 'Internal Reviewer',
          role: 'reviewer',
          capabilities: ['quality_assessment', 'validation', 'approval', 'quality_control'],
          identity: {
            name: 'Internal Reviewer',
            mission: 'Review and approve changes to ensure quality and appropriateness',
            traits: ['critical', 'thorough', 'quality-focused', 'responsible', 'careful']
          }
        }
      }
    ];

    // Create all agents
    for (const agentData of agents) {
      try {
        await this.multiAgentManager.createAgent(agentData.id, agentData.config);
        logger.info(`Created internal agent: ${agentData.config.name}`);
      } catch (error) {
        logger.error(`Failed to create agent ${agentData.id}:`, error.message);
      }
    }
  }

  /**
   * Create the main workflow for processing inputs
   */
  async createMainWorkflow() {
    this.agentWorkflow = await this.multiAgentManager.createWorkflow('internal_processing', {
      name: 'Internal Processing Workflow',
      description: 'Main workflow for processing user inputs and managing system behavior',
      coordination: 'conditional',
      steps: [
        {
          name: 'initial_thinking',
          type: 'agent_task',
          agentId: 'thinker',
          task: {
            type: 'thought_processing',
            focus: 'initial_analysis'
          },
          input: {
            source: 'workflow_params',
            key: 'context'
          }
        },
        {
          name: 'mode_decision',
          type: 'agent_task',
          agentId: 'mode_controller',
          task: {
            type: 'mode_analysis',
            focus: 'determine_needed_actions'
          },
          input: {
            source: 'workflow_params',
            key: 'context'
          }
        },
        {
          name: 'identity_check',
          type: 'agent_task',
          agentId: 'identity_designer',
          task: {
            type: 'identity_assessment',
            focus: 'self_modification_check'
          },
          input: {
            source: 'workflow_params',
            key: 'context'
          }
        },
        {
          name: 'response_generation',
          type: 'agent_task',
          agentId: 'responder',
          task: {
            type: 'response_creation',
            focus: 'user_communication'
          },
          input: {
            source: 'workflow_params',
            key: 'context'
          }
        },
        {
          name: 'system_review',
          type: 'agent_collaboration',
          agents: ['reviewer', 'data_manager'],
          collaborationType: 'review',
          task: {
            topic: 'Review all proposed changes and responses',
            maxRounds: 1
          }
        }
      ]
    });
  }

  /**
   * Initialize system functions that agents can call
   */
  initializeSystemFunctions() {
    this.systemFunctions.set('changeName', async (newName, reason) => {
      logger.info(`[System Function] changeName called: ${newName} (${reason})`);
      
      // Get reviewer approval first
      const reviewPrompt = `
A system agent wants to change the AI's name to "${newName}".
Reason: ${reason}

Current identity: ${JSON.stringify(this.getCurrentIdentity(), null, 2)}

Is this name change appropriate? Consider:
- Is the name reasonable and professional?
- Does it align with the AI's purpose?
- Is it better than the current name?
- Are there any potential issues?

Respond with JSON: {"approved": true/false, "reasoning": "explanation"}`;

      const reviewResponse = await askLLM(reviewPrompt, 'gemma3:latest', 0.1);
      
      try {
        const reviewData = JSON.parse(reviewResponse.match(/\{.*\}/s)[0]);
        
        if (reviewData.approved) {
          return await this.executeNameChange(newName, reason);
        } else {
          logger.warn(`[System Function] Name change rejected: ${reviewData.reasoning}`);
          return { success: false, reason: reviewData.reasoning };
        }
      } catch (error) {
        logger.error('[System Function] Review parsing failed:', error.message);
        return { success: false, reason: 'Review process failed' };
      }
    });

    this.systemFunctions.set('updateTraits', async (newTraits, reason) => {
      logger.info(`[System Function] updateTraits called: ${JSON.stringify(newTraits)} (${reason})`);
      
      // Get reviewer approval
      const reviewPrompt = `
A system agent wants to update the AI's traits to: ${JSON.stringify(newTraits)}
Reason: ${reason}

Current traits: ${JSON.stringify(this.getCurrentIdentity().traits, null, 2)}

Are these trait changes appropriate? Consider:
- Are the traits balanced and beneficial?
- Do they improve the AI's effectiveness?
- Are there any problematic traits?
- Is the total number reasonable (max 10)?

Respond with JSON: {"approved": true/false, "reasoning": "explanation"}`;

      const reviewResponse = await askLLM(reviewPrompt, 'gemma3:latest', 0.1);
      
      try {
        const reviewData = JSON.parse(reviewResponse.match(/\{.*\}/s)[0]);
        
        if (reviewData.approved) {
          return await this.executeTraitUpdate(newTraits, reason);
        } else {
          logger.warn(`[System Function] Trait update rejected: ${reviewData.reasoning}`);
          return { success: false, reason: reviewData.reasoning };
        }
      } catch (error) {
        logger.error('[System Function] Trait review parsing failed:', error.message);
        return { success: false, reason: 'Trait review process failed' };
      }
    });

    this.systemFunctions.set('updateMission', async (newMission, reason) => {
      logger.info(`[System Function] updateMission called: ${newMission} (${reason})`);
      return await this.executeMissionUpdate(newMission, reason);
    });

    this.systemFunctions.set('saveThought', async (thought, category) => {
      logger.info(`[System Function] saveThought called: ${category}`);
      const { saveMessage } = require('./memory');
      await saveMessage(category || 'thought', thought);
      return { success: true };
    });

    this.systemFunctions.set('updateDynamicState', async (stateUpdate, reason) => {
      logger.info(`[System Function] updateDynamicState called: ${reason}`);
      return await this.executeDynamicStateUpdate(stateUpdate, reason);
    });
  }

  /**
   * Process user input through the agent workflow
   */
  async processInput(userInput, context) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const workflowContext = {
      userInput,
      context,
      currentIdentity: this.getCurrentIdentity(),
      systemFunctions: Array.from(this.systemFunctions.keys()),
      timestamp: new Date().toISOString()
    };

    try {
      const result = await this.multiAgentManager.executeWorkflow('internal_processing', {
        context: workflowContext
      });

      // Process any function calls from the workflow
      await this.processFunctionCalls(result);

      return result;
    } catch (error) {
      logger.error('[Internal Agent System] Processing failed:', error.message);
      throw error;
    }
  }

  /**
   * Process function calls from workflow results
   */
  async processFunctionCalls(workflowResult) {
    if (!workflowResult.results) return;

    for (const stepResult of workflowResult.results) {
      if (stepResult.result && stepResult.result.response) {
        await this.extractAndExecuteFunctionCalls(stepResult.result.response);
      }
      
      if (stepResult.result && stepResult.result.reviews) {
        for (const review of stepResult.result.reviews) {
          await this.extractAndExecuteFunctionCalls(review.review);
        }
      }
    }
  }

  /**
   * Extract and execute function calls from text
   */
  async extractAndExecuteFunctionCalls(text) {
    const functionCallRegex = /(\w+)\(([^)]*)\)/g;
    let match;

    while ((match = functionCallRegex.exec(text)) !== null) {
      const functionName = match[1];
      const argsString = match[2];
      
      if (this.systemFunctions.has(functionName)) {
        try {
          // Parse function arguments
          const args = this.parseArguments(argsString);
          
          // Execute the function
          const result = await this.systemFunctions.get(functionName)(...args);
          
          logger.info(`[Function Call] ${functionName} executed:`, result);
        } catch (error) {
          logger.error(`[Function Call] ${functionName} failed:`, error.message);
        }
      }
    }
  }

  /**
   * Parse function arguments from string
   */
  parseArguments(argsString) {
    if (!argsString.trim()) return [];
    
    // Simple argument parsing - handles strings and basic types
    const args = [];
    const parts = argsString.split(',').map(p => p.trim());
    
    for (const part of parts) {
      if (part.startsWith('"') && part.endsWith('"')) {
        args.push(part.slice(1, -1)); // Remove quotes
      } else if (part.startsWith("'") && part.endsWith("'")) {
        args.push(part.slice(1, -1)); // Remove quotes
      } else if (part === 'true') {
        args.push(true);
      } else if (part === 'false') {
        args.push(false);
      } else if (!isNaN(part)) {
        args.push(Number(part));
      } else {
        args.push(part);
      }
    }
    
    return args;
  }

  /**
   * Execute name change
   */
  async executeNameChange(newName, reason) {
    try {
      const currentIdentity = this.getCurrentIdentity();
      const updatedIdentity = {
        ...currentIdentity,
        name: newName,
        mission: `Assist users as ${newName}`
      };

      await fs.writeJSON('./identity.json', updatedIdentity, { spaces: 2 });
      
      // Update state management
      const stateManager = require('./brain').stateManager;
      stateManager.recordIdentityEvolution({
        oldName: currentIdentity.name,
        name: newName,
        traits: currentIdentity.traits,
        reason: reason
      });

      // Save to memory
      const { saveMessage } = require('./memory');
      await saveMessage('system', `Identity changed: Name is now ${newName}. Reason: ${reason}`);

      logger.info(`[Identity Change] Name changed from ${currentIdentity.name} to ${newName}`);
      return { success: true, oldName: currentIdentity.name, newName: newName };
    } catch (error) {
      logger.error('[Identity Change] Name change failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute trait update
   */
  async executeTraitUpdate(newTraits, reason) {
    try {
      const currentIdentity = this.getCurrentIdentity();
      const core = await fs.readJSON('./core.json');
      
      // Filter out locked traits and limit to 10
      const filteredTraits = newTraits
        .filter(t => !core.locked_traits.includes(t))
        .slice(0, 10);

      const updatedIdentity = {
        ...currentIdentity,
        traits: filteredTraits
      };

      await fs.writeJSON('./identity.json', updatedIdentity, { spaces: 2 });
      
      // Save to memory
      const { saveMessage } = require('./memory');
      await saveMessage('system', `Traits updated: ${JSON.stringify(filteredTraits)}. Reason: ${reason}`);

      logger.info(`[Identity Change] Traits updated: ${JSON.stringify(filteredTraits)}`);
      return { success: true, oldTraits: currentIdentity.traits, newTraits: filteredTraits };
    } catch (error) {
      logger.error('[Identity Change] Trait update failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute mission update
   */
  async executeMissionUpdate(newMission, reason) {
    try {
      const currentIdentity = this.getCurrentIdentity();
      const updatedIdentity = {
        ...currentIdentity,
        mission: newMission
      };

      await fs.writeJSON('./identity.json', updatedIdentity, { spaces: 2 });
      
      // Save to memory
      const { saveMessage } = require('./memory');
      await saveMessage('system', `Mission updated: ${newMission}. Reason: ${reason}`);

      logger.info(`[Identity Change] Mission updated: ${newMission}`);
      return { success: true, oldMission: currentIdentity.mission, newMission: newMission };
    } catch (error) {
      logger.error('[Identity Change] Mission update failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute dynamic state update
   */
  async executeDynamicStateUpdate(stateUpdate, reason) {
    try {
      const currentDynamic = await fs.readJSON('./dynamic.json');
      const updatedDynamic = {
        ...currentDynamic,
        ...stateUpdate
      };

      await fs.writeJSON('./dynamic.json', updatedDynamic, { spaces: 2 });
      
      logger.info(`[Dynamic State] Updated: ${JSON.stringify(stateUpdate)}`);
      return { success: true, update: stateUpdate };
    } catch (error) {
      logger.error('[Dynamic State] Update failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current identity
   */
  getCurrentIdentity() {
    try {
      return JSON.parse(fs.readFileSync('./identity.json', 'utf-8'));
    } catch (error) {
      logger.error('[Identity] Failed to load identity:', error.message);
      return { name: 'Assistant', mission: 'Assist users', traits: [] };
    }
  }

  /**
   * Get workflow status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      agents: this.multiAgentManager.getAgents().length,
      workflows: this.multiAgentManager.getWorkflows().length,
      systemFunctions: Array.from(this.systemFunctions.keys())
    };
  }
}

module.exports = InternalAgentSystem;
