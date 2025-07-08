// Multi-Agent Workflow Management System
const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');
const logger = require('./logger');
const StateManager = require('./StateManager');
const { askLLM, loadIdentity } = require('./brain');

class MultiAgentManager extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map(); // agent_id -> agent_instance
    this.workflows = new Map(); // workflow_id -> workflow_config
    this.activeWorkflows = new Map(); // workflow_id -> execution_state
    this.messageQueue = []; // Inter-agent communication queue
    this.workflowsDir = './workflows';
    this.agentsDir = './agents';
    
    this.initializeDirectories();
    this.loadExistingWorkflows();
    this.loadExistingAgents();
    
    logger.info('MultiAgentManager initialized');
  }

  async initializeDirectories() {
    await fs.ensureDir(this.workflowsDir);
    await fs.ensureDir(this.agentsDir);
    await fs.ensureDir('./logs/multi-agent');
  }

  /**
   * Create a new agent instance with specific role and capabilities
   * @param {string} agentId - Unique identifier for the agent
   * @param {Object} config - Agent configuration
   * @returns {Promise<Object>} Created agent instance
   */
  async createAgent(agentId, config) {
    if (this.agents.has(agentId)) {
      throw new Error(`Agent with ID '${agentId}' already exists`);
    }

    const agent = {
      id: agentId,
      name: config.name || agentId,
      role: config.role || 'general',
      capabilities: config.capabilities || [],
      identity: config.identity || {},
      stateManager: new StateManager(),
      status: 'idle',
      currentTask: null,
      messageHistory: [],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    // Create agent-specific directories
    const agentDir = path.join(this.agentsDir, agentId);
    await fs.ensureDir(agentDir);
    
    // Save agent configuration
    await fs.writeJSON(path.join(agentDir, 'config.json'), config, { spaces: 2 });
    
    // Initialize agent identity if provided
    if (config.identity) {
      await fs.writeJSON(path.join(agentDir, 'identity.json'), config.identity, { spaces: 2 });
    }

    this.agents.set(agentId, agent);
    
    logger.info(`Agent '${agentId}' created with role '${config.role}'`);
    this.emit('agentCreated', agent);
    
    return agent;
  }

  /**
   * Remove an agent from the system
   * @param {string} agentId - Agent to remove
   */
  async removeAgent(agentId) {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent '${agentId}' not found`);
    }

    const agent = this.agents.get(agentId);
    
    // Stop any active tasks
    if (agent.status === 'working') {
      await this.stopAgentTask(agentId);
    }

    this.agents.delete(agentId);
    
    logger.info(`Agent '${agentId}' removed`);
    this.emit('agentRemoved', { agentId, agent });
  }

  /**
   * Create a new workflow definition
   * @param {string} workflowId - Unique workflow identifier
   * @param {Object} definition - Workflow definition
   */
  async createWorkflow(workflowId, definition) {
    if (this.workflows.has(workflowId)) {
      throw new Error(`Workflow '${workflowId}' already exists`);
    }

    const workflow = {
      id: workflowId,
      name: definition.name || workflowId,
      description: definition.description || '',
      steps: definition.steps || [],
      agents: definition.agents || [],
      coordination: definition.coordination || 'sequential',
      createdAt: new Date().toISOString(),
      ...definition
    };

    // Validate workflow definition
    this.validateWorkflow(workflow);

    this.workflows.set(workflowId, workflow);
    
    // Save workflow to file
    await fs.writeJSON(
      path.join(this.workflowsDir, `${workflowId}.json`),
      workflow,
      { spaces: 2 }
    );

    logger.info(`Workflow '${workflowId}' created`);
    this.emit('workflowCreated', workflow);
    
    return workflow;
  }

  /**
   * Execute a workflow with specified parameters
   * @param {string} workflowId - Workflow to execute
   * @param {Object} params - Execution parameters
   * @returns {Promise<Object>} Execution result
   */
  async executeWorkflow(workflowId, params = {}) {
    if (!this.workflows.has(workflowId)) {
      throw new Error(`Workflow '${workflowId}' not found`);
    }

    if (this.activeWorkflows.has(workflowId)) {
      throw new Error(`Workflow '${workflowId}' is already running`);
    }

    const workflow = this.workflows.get(workflowId);
    const executionId = this.generateExecutionId();
    
    const execution = {
      id: executionId,
      workflowId,
      status: 'running',
      startTime: new Date().toISOString(),
      currentStep: 0,
      stepResults: [],
      params,
      error: null
    };

    this.activeWorkflows.set(workflowId, execution);

    logger.info(`Starting workflow execution: ${workflowId} (${executionId})`);
    this.emit('workflowStarted', execution);

    try {
      const result = await this.runWorkflowSteps(workflow, execution);
      
      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      execution.result = result;
      
      logger.info(`Workflow '${workflowId}' completed successfully`);
      this.emit('workflowCompleted', execution);
      
      return result;
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      execution.error = error.message;
      
      logger.error(`Workflow '${workflowId}' failed:`, error.message);
      this.emit('workflowFailed', execution);
      
      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Execute workflow steps based on coordination strategy
   * @param {Object} workflow - Workflow definition
   * @param {Object} execution - Execution state
   * @returns {Promise<Object>} Final result
   */
  async runWorkflowSteps(workflow, execution) {
    const { steps, coordination } = workflow;
    const results = [];

    switch (coordination) {
      case 'sequential':
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          execution.currentStep = i;
          
          logger.info(`Executing step ${i + 1}/${steps.length}: ${step.name}`);
          
          const stepResult = await this.executeStep(step, execution, results);
          results.push(stepResult);
          execution.stepResults.push(stepResult);
          
          this.emit('stepCompleted', { execution, step, result: stepResult });
        }
        break;

      case 'parallel':
        logger.info(`Executing ${steps.length} steps in parallel`);
        
        const promises = steps.map((step, index) => 
          this.executeStep(step, execution, [], index)
        );
        
        const parallelResults = await Promise.all(promises);
        results.push(...parallelResults);
        execution.stepResults.push(...parallelResults);
        break;

      case 'conditional':
        results.push(await this.executeConditionalWorkflow(workflow, execution));
        break;

      default:
        throw new Error(`Unknown coordination strategy: ${coordination}`);
    }

    return {
      success: true,
      results,
      executionTime: Date.now() - new Date(execution.startTime).getTime(),
      stepsCompleted: results.length
    };
  }

  /**
   * Execute a single workflow step
   * @param {Object} step - Step definition
   * @param {Object} execution - Execution context
   * @param {Array} previousResults - Results from previous steps
   * @param {number} stepIndex - Step index for parallel execution
   * @returns {Promise<Object>} Step result
   */
  async executeStep(step, execution, previousResults, stepIndex = null) {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (step.type) {
        case 'agent_task':
          result = await this.executeAgentTask(step, execution, previousResults);
          break;
          
        case 'agent_collaboration':
          result = await this.executeAgentCollaboration(step, execution, previousResults);
          break;
          
        case 'decision_point':
          result = await this.executeDecisionPoint(step, execution, previousResults);
          break;
          
        case 'data_processing':
          result = await this.executeDataProcessing(step, execution, previousResults);
          break;
          
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      return {
        stepName: step.name,
        stepType: step.type,
        success: true,
        result,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Step '${step.name}' failed:`, error.message);
      
      return {
        stepName: step.name,
        stepType: step.type,
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute an agent task step
   * @param {Object} step - Step definition
   * @param {Object} execution - Execution context
   * @param {Array} previousResults - Previous step results
   * @returns {Promise<Object>} Task result
   */
  async executeAgentTask(step, execution, previousResults) {
    const { agentId, task, input } = step;
    
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent '${agentId}' not found`);
    }

    const agent = this.agents.get(agentId);
    agent.status = 'working';
    agent.currentTask = task;
    agent.lastActive = new Date().toISOString();

    // Prepare task input, potentially using previous results
    const taskInput = this.prepareTaskInput(input, previousResults, execution.params);
    
    // Execute the task using the agent's capabilities
    const result = await this.runAgentTask(agent, task, taskInput);
    
    agent.status = 'idle';
    agent.currentTask = null;
    
    return result;
  }

  /**
   * Execute agent collaboration step
   * @param {Object} step - Step definition
   * @param {Object} execution - Execution context
   * @param {Array} previousResults - Previous step results
   * @returns {Promise<Object>} Collaboration result
   */
  async executeAgentCollaboration(step, execution, previousResults) {
    const { agents: agentIds, collaborationType, task } = step;
    
    // Validate all agents exist
    for (const agentId of agentIds) {
      if (!this.agents.has(agentId)) {
        throw new Error(`Agent '${agentId}' not found`);
      }
    }

    const agents = agentIds.map(id => this.agents.get(id));
    
    switch (collaborationType) {
      case 'discussion':
        return await this.facilitateAgentDiscussion(agents, task, previousResults);
        
      case 'review':
        return await this.facilitateAgentReview(agents, task, previousResults);
        
      case 'consensus':
        return await this.facilitateAgentConsensus(agents, task, previousResults);
        
      default:
        throw new Error(`Unknown collaboration type: ${collaborationType}`);
    }
  }

  /**
   * Facilitate a discussion between multiple agents
   * @param {Array} agents - Participating agents
   * @param {Object} task - Discussion task
   * @param {Array} previousResults - Context from previous steps
   * @returns {Promise<Object>} Discussion result
   */
  async facilitateAgentDiscussion(agents, task, previousResults) {
    const discussion = {
      topic: task.topic,
      participants: agents.map(a => a.id),
      messages: [],
      startTime: new Date().toISOString()
    };

    const context = this.buildDiscussionContext(task, previousResults);
    
    // Initialize discussion with the topic
    const prompt = `
You are participating in a multi-agent discussion about: ${task.topic}

Context: ${context}

As ${agents[0].name} with role ${agents[0].role}, provide your initial perspective on this topic.
Keep your response focused and under 200 words.
`;

    for (let round = 0; round < (task.maxRounds || 3); round++) {
      for (const agent of agents) {
        const response = await askLLM(prompt, 'gemma3:latest', 0.7);
        
        const message = {
          agentId: agent.id,
          agentName: agent.name,
          round: round + 1,
          content: response,
          timestamp: new Date().toISOString()
        };
        
        discussion.messages.push(message);
        agent.messageHistory.push(message);
      }
    }

    discussion.endTime = new Date().toISOString();
    discussion.summary = await this.summarizeDiscussion(discussion);
    
    return discussion;
  }

  /**
   * Validate workflow definition
   * @param {Object} workflow - Workflow to validate
   */
  validateWorkflow(workflow) {
    if (!workflow.steps || !Array.isArray(workflow.steps)) {
      throw new Error('Workflow must have a steps array');
    }

    if (workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    for (const step of workflow.steps) {
      if (!step.name || !step.type) {
        throw new Error('Each step must have a name and type');
      }
    }
  }

  /**
   * Load existing workflows from disk
   */
  async loadExistingWorkflows() {
    try {
      const files = await fs.readdir(this.workflowsDir);
      const workflowFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of workflowFiles) {
        const workflowData = await fs.readJSON(path.join(this.workflowsDir, file));
        this.workflows.set(workflowData.id, workflowData);
      }
      
      logger.info(`Loaded ${workflowFiles.length} workflows`);
    } catch (error) {
      logger.warn('Failed to load existing workflows:', error.message);
    }
  }

  /**
   * Load existing agents from disk
   */
  async loadExistingAgents() {
    try {
      const dirs = await fs.readdir(this.agentsDir);
      
      for (const dir of dirs) {
        const agentDir = path.join(this.agentsDir, dir);
        const configPath = path.join(agentDir, 'config.json');
        
        if (await fs.pathExists(configPath)) {
          const config = await fs.readJSON(configPath);
          await this.createAgent(dir, config);
        }
      }
      
      logger.info(`Loaded ${this.agents.size} agents`);
    } catch (error) {
      logger.warn('Failed to load existing agents:', error.message);
    }
  }

  /**
   * Get all agents
   * @returns {Array} List of all agents
   */
  getAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get all workflows
   * @returns {Array} List of all workflows
   */
  getWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * Get active workflow executions
   * @returns {Array} List of active executions
   */
  getActiveExecutions() {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Generate unique session ID
   * @returns {string} Unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique execution ID
   * @returns {string} Unique execution ID
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Run an agent task
   * @param {Object} agent - Agent instance
   * @param {Object} task - Task definition
   * @param {Object} input - Task input
   * @returns {Promise<Object>} Task result
   */
  async runAgentTask(agent, task, input) {
    const prompt = `
You are ${agent.name}, a ${agent.role} AI agent.

Identity: ${JSON.stringify(agent.identity, null, 2)}

Task: ${JSON.stringify(task, null, 2)}

Input: ${JSON.stringify(input, null, 2)}

Please complete this task according to your role and capabilities. 
Provide a detailed response that addresses the task requirements.
Keep your response focused and under 500 words.

Response:`;

    const response = await askLLM(prompt, 'gemma3:latest', 0.3);
    
    return {
      agentId: agent.id,
      agentName: agent.name,
      taskType: task.type,
      response: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Prepare task input from various sources
   * @param {Object} inputConfig - Input configuration
   * @param {Array} previousResults - Previous step results
   * @param {Object} params - Workflow parameters
   * @returns {Object} Prepared input
   */
  prepareTaskInput(inputConfig, previousResults, params) {
    if (!inputConfig) return {};

    switch (inputConfig.source) {
      case 'workflow_params':
        return params[inputConfig.key] || {};
        
      case 'previous_step':
        const stepResult = previousResults.find(r => r.stepName === inputConfig.step);
        return stepResult ? stepResult.result : {};
        
      case 'static':
        return inputConfig.value || {};
        
      default:
        return inputConfig;
    }
  }

  /**
   * Build discussion context from task and previous results
   * @param {Object} task - Discussion task
   * @param {Array} previousResults - Previous step results
   * @returns {string} Context string
   */
  buildDiscussionContext(task, previousResults) {
    let context = `Topic: ${task.topic}\n`;
    
    if (previousResults.length > 0) {
      context += '\nPrevious results:\n';
      previousResults.forEach((result, index) => {
        context += `${index + 1}. ${result.stepName}: ${JSON.stringify(result.result, null, 2)}\n`;
      });
    }
    
    return context;
  }

  /**
   * Summarize discussion results
   * @param {Object} discussion - Discussion object
   * @returns {Promise<string>} Discussion summary
   */
  async summarizeDiscussion(discussion) {
    const prompt = `
Please summarize the following multi-agent discussion:

Topic: ${discussion.topic}
Participants: ${discussion.participants.join(', ')}

Messages:
${discussion.messages.map(m => `${m.agentName}: ${m.content}`).join('\n\n')}

Provide a concise summary of the key points, agreements, and conclusions.
Keep the summary under 300 words.

Summary:`;

    return await askLLM(prompt, 'gemma3:latest', 0.2);
  }

  /**
   * Facilitate agent review collaboration
   * @param {Array} agents - Participating agents
   * @param {Object} task - Review task
   * @param {Array} previousResults - Context from previous steps
   * @returns {Promise<Object>} Review result
   */
  async facilitateAgentReview(agents, task, previousResults) {
    const review = {
      topic: task.topic,
      reviewers: agents.map(a => a.id),
      reviews: [],
      startTime: new Date().toISOString()
    };

    const context = this.buildDiscussionContext(task, previousResults);
    
    // Each agent provides their review
    for (const agent of agents) {
      const prompt = `
You are ${agent.name}, conducting a review.

Context: ${context}

As a ${agent.role}, provide your review and recommendations.
Focus on your area of expertise and be constructive.
Keep your review under 300 words.

Review:`;

      const response = await askLLM(prompt, 'gemma3:latest', 0.4);
      
      review.reviews.push({
        agentId: agent.id,
        agentName: agent.name,
        review: response,
        timestamp: new Date().toISOString()
      });
    }

    review.endTime = new Date().toISOString();
    review.consensus = await this.generateReviewConsensus(review);
    
    return review;
  }

  /**
   * Facilitate agent consensus building
   * @param {Array} agents - Participating agents
   * @param {Object} task - Consensus task
   * @param {Array} previousResults - Context from previous steps
   * @returns {Promise<Object>} Consensus result
   */
  async facilitateAgentConsensus(agents, task, previousResults) {
    const consensus = {
      topic: task.topic,
      participants: agents.map(a => a.id),
      rounds: [],
      startTime: new Date().toISOString()
    };

    const context = this.buildDiscussionContext(task, previousResults);
    
    for (let round = 1; round <= (task.maxRounds || 2); round++) {
      const roundData = {
        round,
        positions: [],
        timestamp: new Date().toISOString()
      };

      for (const agent of agents) {
        const prompt = `
You are ${agent.name} working toward consensus.

Context: ${context}

Round ${round} of ${task.maxRounds || 2}

Previous rounds:
${consensus.rounds.map(r => 
  r.positions.map(p => `${p.agentName}: ${p.position}`).join('\n')
).join('\n\n')}

State your position and any compromises you're willing to make.
Keep your response under 200 words.

Position:`;

        const response = await askLLM(prompt, 'gemma3:latest', 0.5);
        
        roundData.positions.push({
          agentId: agent.id,
          agentName: agent.name,
          position: response,
          timestamp: new Date().toISOString()
        });
      }
      
      consensus.rounds.push(roundData);
    }

    consensus.endTime = new Date().toISOString();
    consensus.finalAgreement = await this.generateFinalConsensus(consensus);
    
    return consensus;
  }

  /**
   * Generate review consensus
   * @param {Object} review - Review data
   * @returns {Promise<string>} Consensus summary
   */
  async generateReviewConsensus(review) {
    const prompt = `
Based on the following reviews, generate a consensus summary:

${review.reviews.map(r => `${r.agentName}: ${r.review}`).join('\n\n')}

Identify common themes, conflicting opinions, and provide balanced recommendations.
Keep the consensus under 400 words.

Consensus:`;

    return await askLLM(prompt, 'gemma3:latest', 0.2);
  }

  /**
   * Generate final consensus from multiple rounds
   * @param {Object} consensus - Consensus data
   * @returns {Promise<string>} Final agreement
   */
  async generateFinalConsensus(consensus) {
    const prompt = `
Based on multiple rounds of discussion, generate the final consensus:

${consensus.rounds.map((round, index) => 
  `Round ${index + 1}:\n${round.positions.map(p => `${p.agentName}: ${p.position}`).join('\n')}`
).join('\n\n')}

Synthesize the discussions into a clear, actionable agreement.
Highlight any remaining disagreements that need resolution.
Keep the final consensus under 400 words.

Final Agreement:`;

    return await askLLM(prompt, 'gemma3:latest', 0.1);
  }

  /**
   * Execute conditional workflow (not fully implemented)
   * @param {Object} workflow - Workflow definition
   * @param {Object} execution - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async executeConditionalWorkflow(workflow, execution) {
    // Simplified conditional execution - can be expanded based on needs
    return await this.runWorkflowSteps({
      ...workflow,
      coordination: 'sequential'
    }, execution);
  }

  /**
   * Execute decision point step
   * @param {Object} step - Step definition
   * @param {Object} execution - Execution context
   * @param {Array} previousResults - Previous step results
   * @returns {Promise<Object>} Decision result
   */
  async executeDecisionPoint(step, execution, previousResults) {
    const prompt = `
You are making a decision based on previous workflow results.

Decision Point: ${step.name}
Criteria: ${JSON.stringify(step.criteria || {}, null, 2)}

Previous Results:
${previousResults.map((r, i) => `${i + 1}. ${r.stepName}: ${JSON.stringify(r.result, null, 2)}`).join('\n')}

Make a decision and provide reasoning.
Format your response as JSON: {"decision": "choice", "reasoning": "explanation"}

Decision:`;

    const response = await askLLM(prompt, 'gemma3:latest', 0.2);
    
    try {
      const jsonMatch = response.match(/\{.*\}/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { decision: 'continue', reasoning: 'Default decision' };
    } catch (error) {
      return { decision: 'continue', reasoning: 'Failed to parse decision' };
    }
  }

  /**
   * Execute data processing step
   * @param {Object} step - Step definition
   * @param {Object} execution - Execution context
   * @param {Array} previousResults - Previous step results
   * @returns {Promise<Object>} Processing result
   */
  async executeDataProcessing(step, execution, previousResults) {
    const inputData = this.prepareTaskInput(step.input, previousResults, execution.params);
    
    const prompt = `
You are processing data according to these specifications:

Processing Type: ${step.processingType || 'general'}
Operation: ${step.operation || 'analyze'}

Input Data:
${JSON.stringify(inputData, null, 2)}

Process the data and provide structured results.
Keep results under 500 words.

Results:`;

    const response = await askLLM(prompt, 'gemma3:latest', 0.3);
    
    return {
      processingType: step.processingType,
      operation: step.operation,
      result: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Stop an agent's current task
   * @param {string} agentId - Agent to stop
   */
  async stopAgentTask(agentId) {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent '${agentId}' not found`);
    }

    const agent = this.agents.get(agentId);
    agent.status = 'idle';
    agent.currentTask = null;
    
    logger.info(`Stopped task for agent '${agentId}'`);
  }
}

module.exports = MultiAgentManager;
