import { StateManager } from '../core/StateManager';
import { Brain } from '../core/brain';
import { EmotionEngine } from '../systems/EmotionEngine';
import fs from 'fs-extra';
import path from 'path';

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  specialization: string;
  traits: string[];
  capabilities: string[];
  model: string;
  temperature: number;
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  type: 'sequential' | 'parallel' | 'conditional';
  agents: string[];
  condition?: string;
  input_mapping?: Record<string, string>;
  output_mapping?: Record<string, string>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: string[];
  enabled: boolean;
}

export interface AgentResponse {
  agent_id: string;
  response: string;
  confidence: number;
  processing_time: number;
  metadata: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  start_time: string;
  end_time?: string;
  agents_involved: string[];
  results: AgentResponse[];
  final_output: string;
}

export class MultiAgentManager {
  private stateManager: StateManager;
  private brain: Brain;
  private emotionEngine: EmotionEngine;
  private agents: Map<string, AgentConfig> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private agentsPath: string;
  private workflowsPath: string;

  constructor(stateManager: StateManager, brain: Brain, emotionEngine: EmotionEngine) {
    this.stateManager = stateManager;
    this.brain = brain;
    this.emotionEngine = emotionEngine;
    this.agentsPath = path.join(process.cwd(), 'src', 'lib', 'config', 'agents.json');
    this.workflowsPath = path.join(process.cwd(), 'src', 'lib', 'config', 'workflows.json');
    
    this.loadConfiguration();
    console.log('[MultiAgent] Manager initialized');
  }

  private async loadConfiguration(): Promise<void> {
    try {
      // Load agents configuration
      if (await fs.pathExists(this.agentsPath)) {
        const agentsData = await fs.readJson(this.agentsPath);
        agentsData.forEach((agent: AgentConfig) => {
          this.agents.set(agent.id, agent);
        });
        console.log(`Loaded ${this.agents.size} agents`);
      } else {
        this.createDefaultAgents();
      }

      // Load workflows configuration
      if (await fs.pathExists(this.workflowsPath)) {
        const workflowsData = await fs.readJson(this.workflowsPath);
        workflowsData.forEach((workflow: Workflow) => {
          this.workflows.set(workflow.id, workflow);
        });
        console.log(`Loaded ${this.workflows.size} workflows`);
      } else {
        this.createDefaultWorkflows();
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.createDefaultAgents();
      this.createDefaultWorkflows();
    }
  }

  private createDefaultAgents(): void {
    const defaultAgents: AgentConfig[] = [
      {
        id: 'code_reviewer',
        name: 'CodeReviewer',
        role: 'Code Analysis Specialist',
        specialization: 'code_review',
        traits: ['analytical', 'detail-oriented', 'systematic', 'constructive'],
        capabilities: ['code_analysis', 'bug_detection', 'performance_review', 'security_audit'],
        model: 'gemma3:latest',
        temperature: 0.3,
        enabled: true
      },
      {
        id: 'creative_thinker',
        name: 'CreativeThinker',
        role: 'Creative Problem Solver',
        specialization: 'creative_solutions',
        traits: ['innovative', 'imaginative', 'flexible', 'inspiring'],
        capabilities: ['brainstorming', 'alternative_solutions', 'creative_writing', 'design_thinking'],
        model: 'llama3.2:latest',
        temperature: 0.8,
        enabled: true
      },
      {
        id: 'logical_analyst',
        name: 'LogicalAnalyst',
        role: 'Logical Reasoning Specialist',
        specialization: 'logical_analysis',
        traits: ['logical', 'methodical', 'precise', 'objective'],
        capabilities: ['logical_reasoning', 'data_analysis', 'pattern_recognition', 'problem_decomposition'],
        model: 'gemma3:latest',
        temperature: 0.2,
        enabled: true
      },
      {
        id: 'practical_implementer',
        name: 'PracticalImplementer',
        role: 'Implementation Specialist',
        specialization: 'practical_solutions',
        traits: ['pragmatic', 'efficient', 'results-oriented', 'realistic'],
        capabilities: ['implementation_planning', 'resource_optimization', 'feasibility_analysis', 'execution_strategy'],
        model: 'gemma3:latest',
        temperature: 0.4,
        enabled: true
      }
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });

    this.saveAgentsConfiguration();
  }

  private createDefaultWorkflows(): void {
    const defaultWorkflows: Workflow[] = [
      {
        id: 'code_review_workflow',
        name: 'Comprehensive Code Review',
        description: 'Multi-agent code review with security, performance, and quality analysis',
        steps: [
          {
            id: 'initial_analysis',
            type: 'parallel',
            agents: ['code_reviewer', 'logical_analyst']
          },
          {
            id: 'creative_improvements',
            type: 'sequential',
            agents: ['creative_thinker']
          },
          {
            id: 'implementation_review',
            type: 'sequential',
            agents: ['practical_implementer']
          }
        ],
        triggers: ['code_review', 'review_code', 'analyze_code'],
        enabled: true
      },
      {
        id: 'problem_solving_workflow',
        name: 'Complex Problem Solving',
        description: 'Multi-perspective approach to complex problem solving',
        steps: [
          {
            id: 'problem_analysis',
            type: 'sequential',
            agents: ['logical_analyst']
          },
          {
            id: 'solution_generation',
            type: 'parallel',
            agents: ['creative_thinker', 'practical_implementer']
          },
          {
            id: 'solution_review',
            type: 'sequential',
            agents: ['code_reviewer']
          }
        ],
        triggers: ['solve_problem', 'complex_problem', 'need_solution'],
        enabled: true
      },
      {
        id: 'research_workflow',
        name: 'Multi-Perspective Research',
        description: 'Comprehensive research with multiple analytical perspectives',
        steps: [
          {
            id: 'research_planning',
            type: 'sequential',
            agents: ['logical_analyst']
          },
          {
            id: 'parallel_research',
            type: 'parallel',
            agents: ['creative_thinker', 'practical_implementer', 'code_reviewer']
          }
        ],
        triggers: ['research', 'investigate', 'analyze_topic'],
        enabled: true
      }
    ];

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });

    this.saveWorkflowsConfiguration();
  }

  async executeWorkflow(workflowId: string, input: string, context: string = ''): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow ${workflowId} is disabled`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflow_id: workflowId,
      status: 'running',
      start_time: new Date().toISOString(),
      agents_involved: [],
      results: [],
      final_output: ''
    };

    this.activeExecutions.set(executionId, execution);

    try {
      console.log(`[MultiAgent] Starting workflow execution: ${workflowId}`);
      
      let currentInput = input;
      const allResults: AgentResponse[] = [];

      for (const step of workflow.steps) {
        const stepResults = await this.executeWorkflowStep(step, currentInput, context);
        allResults.push(...stepResults);
        
        // Update agents involved
        step.agents.forEach(agentId => {
          if (!execution.agents_involved.includes(agentId)) {
            execution.agents_involved.push(agentId);
          }
        });

        // Prepare input for next step (use last result or combine results)
        if (stepResults.length > 0) {
          currentInput = this.combineStepResults(stepResults);
        }
      }

      // Generate final synthesis
      execution.final_output = await this.synthesizeResults(allResults, input, context);
      execution.results = allResults;
      execution.status = 'completed';
      execution.end_time = new Date().toISOString();

      console.log(`[MultiAgent] Workflow completed: ${workflowId}`);
      
      // Record the workflow execution
      this.stateManager.recordInteraction('workflow_execution', {
        workflow_id: workflowId,
        agents_count: execution.agents_involved.length,
        processing_time: Date.now() - new Date(execution.start_time).getTime(),
        success: true
      });

      return execution;

    } catch (error) {
      console.error(`[MultiAgent] Workflow execution failed:`, error);
      execution.status = 'failed';
      execution.end_time = new Date().toISOString();
      execution.final_output = `Workflow execution failed: ${error}`;
      
      return execution;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  private async executeWorkflowStep(
    step: WorkflowStep,
    input: string,
    context: string
  ): Promise<AgentResponse[]> {
    const results: AgentResponse[] = [];

    if (step.type === 'sequential') {
      // Execute agents one by one
      let currentInput = input;
      for (const agentId of step.agents) {
        const result = await this.executeAgent(agentId, currentInput, context);
        results.push(result);
        currentInput = result.response; // Use previous agent's output as next input
      }
    } else if (step.type === 'parallel') {
      // Execute all agents simultaneously
      const promises = step.agents.map(agentId => 
        this.executeAgent(agentId, input, context)
      );
      const parallelResults = await Promise.all(promises);
      results.push(...parallelResults);
    } else if (step.type === 'conditional') {
      // Execute based on condition (simplified implementation)
      const shouldExecute = await this.evaluateCondition(step.condition || 'true', input, context);
      if (shouldExecute) {
        for (const agentId of step.agents) {
          const result = await this.executeAgent(agentId, input, context);
          results.push(result);
        }
      }
    }

    return results;
  }

  private async executeAgent(agentId: string, input: string, context: string): Promise<AgentResponse> {
    const startTime = Date.now();
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.enabled) {
      throw new Error(`Agent ${agentId} is disabled`);
    }

    try {
      const prompt = this.buildAgentPrompt(agent, input, context);
      const response = await this.brain.askLLM(prompt, agent.model, agent.temperature);
      const processingTime = Date.now() - startTime;

      console.log(`[MultiAgent] Agent ${agent.name} completed in ${processingTime}ms`);

      const agentResponse: AgentResponse = {
        agent_id: agentId,
        response,
        confidence: this.calculateConfidence(response, agent),
        processing_time: processingTime,
        metadata: {
          model: agent.model,
          temperature: agent.temperature,
          specialization: agent.specialization
        }
      };

      return agentResponse;

    } catch (error) {
      console.error(`[MultiAgent] Agent ${agentId} execution failed:`, error);
      return {
        agent_id: agentId,
        response: `Agent execution failed: ${error}`,
        confidence: 0,
        processing_time: Date.now() - startTime,
        metadata: { error: true }
      };
    }
  }

  private buildAgentPrompt(agent: AgentConfig, input: string, context: string): string {
    const emotionState = this.emotionEngine.getCurrentEmotion();
    
    return `You are ${agent.name}, a specialized AI agent in a multi-agent system.

Your Role: ${agent.role}
Your Specialization: ${agent.specialization}
Your Traits: ${agent.traits.join(', ')}
Your Capabilities: ${agent.capabilities.join(', ')}

Current System Emotion: ${emotionState.primary} (intensity: ${emotionState.intensity})
Context: ${context}

Input to analyze: ${input}

Provide your specialized perspective based on your role and capabilities. Be specific and focus on your area of expertise. Your response will be combined with other agents' perspectives to create a comprehensive analysis.

Response:`;
  }

  private calculateConfidence(response: string, agent: AgentConfig): number {
    let confidence = 0.7; // Base confidence
    
    // Adjust based on response length (longer responses often indicate more thorough analysis)
    if (response.length > 200) confidence += 0.1;
    if (response.length > 500) confidence += 0.1;
    
    // Adjust based on agent specialization match with response content
    const specializationTerms = agent.capabilities.join(' ').toLowerCase();
    const responseWords = response.toLowerCase();
    
    let matchCount = 0;
    specializationTerms.split(' ').forEach(term => {
      if (responseWords.includes(term)) matchCount++;
    });
    
    confidence += (matchCount / agent.capabilities.length) * 0.2;
    
    return Math.min(1.0, Math.max(0.1, confidence));
  }

  private combineStepResults(results: AgentResponse[]): string {
    if (results.length === 1) {
      return results[0].response;
    }
    
    // Combine multiple results with agent attribution
    return results.map(result => {
      const agent = this.agents.get(result.agent_id);
      return `${agent?.name}: ${result.response}`;
    }).join('\n\n');
  }

  private async synthesizeResults(
    results: AgentResponse[],
    originalInput: string,
    context: string
  ): Promise<string> {
    const agentInputs = results.map(result => {
      const agent = this.agents.get(result.agent_id);
      return `${agent?.name} (${agent?.role}): ${result.response}`;
    }).join('\n\n');

    const prompt = `You are the synthesis coordinator for a multi-agent system. Your task is to combine insights from multiple specialized agents into a coherent, comprehensive response.

Original Input: ${originalInput}
Context: ${context}

Agent Responses:
${agentInputs}

Synthesize these perspectives into a unified, well-structured response that leverages the strengths of each agent's analysis. Maintain the depth and expertise while creating a cohesive narrative.

Synthesized Response:`;

    return await this.brain.askLLM(prompt, 'gemma3:latest', 0.4);
  }

  private async evaluateCondition(condition: string, input: string, context: string): Promise<boolean> {
    // Simplified condition evaluation - can be enhanced with proper expression parser
    if (condition === 'true') return true;
    if (condition === 'false') return false;
    
    // Basic keyword-based conditions
    if (condition.includes('contains:')) {
      const keyword = condition.split('contains:')[1].trim();
      return input.toLowerCase().includes(keyword.toLowerCase());
    }
    
    return true; // Default to true for now
  }

  // Agent Management Methods
  async createAgent(config: Omit<AgentConfig, 'id'>): Promise<string> {
    const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const agent: AgentConfig = { ...config, id };
    
    this.agents.set(id, agent);
    await this.saveAgentsConfiguration();
    
    console.log(`[MultiAgent] Created agent: ${agent.name}`);
    return id;
  }

  async updateAgent(id: string, updates: Partial<AgentConfig>): Promise<void> {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error(`Agent ${id} not found`);
    }
    
    const updatedAgent = { ...agent, ...updates, id }; // Preserve ID
    this.agents.set(id, updatedAgent);
    await this.saveAgentsConfiguration();
    
    console.log(`[MultiAgent] Updated agent: ${id}`);
  }

  async deleteAgent(id: string): Promise<void> {
    if (!this.agents.has(id)) {
      throw new Error(`Agent ${id} not found`);
    }
    
    this.agents.delete(id);
    await this.saveAgentsConfiguration();
    
    console.log(`[MultiAgent] Deleted agent: ${id}`);
  }

  // Workflow Management Methods
  async createWorkflow(workflow: Omit<Workflow, 'id'>): Promise<string> {
    const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newWorkflow: Workflow = { ...workflow, id };
    
    this.workflows.set(id, newWorkflow);
    await this.saveWorkflowsConfiguration();
    
    console.log(`[MultiAgent] Created workflow: ${newWorkflow.name}`);
    return id;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<void> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }
    
    const updatedWorkflow = { ...workflow, ...updates, id }; // Preserve ID
    this.workflows.set(id, updatedWorkflow);
    await this.saveWorkflowsConfiguration();
    
    console.log(`[MultiAgent] Updated workflow: ${id}`);
  }

  async deleteWorkflow(id: string): Promise<void> {
    if (!this.workflows.has(id)) {
      throw new Error(`Workflow ${id} not found`);
    }
    
    this.workflows.delete(id);
    await this.saveWorkflowsConfiguration();
    
    console.log(`[MultiAgent] Deleted workflow: ${id}`);
  }

  // Configuration persistence
  private async saveAgentsConfiguration(): Promise<void> {
    try {
      const agentsArray = Array.from(this.agents.values());
      await fs.writeJson(this.agentsPath, agentsArray, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save agents configuration:', error);
    }
  }

  private async saveWorkflowsConfiguration(): Promise<void> {
    try {
      const workflowsArray = Array.from(this.workflows.values());
      await fs.writeJson(this.workflowsPath, workflowsArray, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save workflows configuration:', error);
    }
  }

  // Public getters
  getAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  getAgent(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  // Workflow trigger matching
  findMatchingWorkflows(input: string): Workflow[] {
    const inputLower = input.toLowerCase();
    return Array.from(this.workflows.values()).filter(workflow => 
      workflow.enabled && 
      workflow.triggers.some(trigger => inputLower.includes(trigger.toLowerCase()))
    );
  }

  // System status
  getSystemStatus() {
    return {
      agents: {
        total: this.agents.size,
        enabled: Array.from(this.agents.values()).filter(a => a.enabled).length
      },
      workflows: {
        total: this.workflows.size,
        enabled: Array.from(this.workflows.values()).filter(w => w.enabled).length
      },
      active_executions: this.activeExecutions.size
    };
  }
}
