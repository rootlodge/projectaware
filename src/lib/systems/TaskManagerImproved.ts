import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger';
import { GoalEngine } from './GoalEngine';
import { MultiAgentManager } from '../agents/MultiAgentManager';
import { EmotionEngine } from './EmotionEngine';

// Enhanced Task Types
export interface CognitiveTask extends Task {
  cognitive_complexity: number;
  requires_creativity: boolean;
  knowledge_domains: string[];
  learning_potential: number;
  user_interaction_required: boolean;
  dependencies: string[];
  success_criteria: SuccessCriteria[];
  context_requirements: ContextRequirement[];
}

export interface SuccessCriteria {
  id: string;
  description: string;
  measurement_type: 'binary' | 'numeric' | 'qualitative';
  target_value?: number;
  validation_method: string;
  weight: number;
}

export interface ContextRequirement {
  type: 'emotional' | 'temporal' | 'knowledge' | 'resource';
  description: string;
  required_value: any;
  priority: number;
}

export interface TaskExecutionPlan {
  task_id: string;
  execution_strategy: 'sequential' | 'parallel' | 'adaptive';
  estimated_steps: PlanStep[];
  resource_allocation: ResourceAllocation;
  contingency_plans: ContingencyPlan[];
  monitoring_points: MonitoringPoint[];
}

export interface PlanStep {
  id: string;
  name: string;
  description: string;
  agent_type: string;
  inputs: any[];
  expected_outputs: any[];
  time_estimate: number;
  dependencies: string[];
}

export interface ResourceAllocation {
  primary_agent: string;
  supporting_agents: string[];
  computational_requirements: ComputationalRequirement;
  knowledge_access: string[];
  external_resources: string[];
}

export interface ComputationalRequirement {
  memory_mb: number;
  cpu_intensity: 'low' | 'medium' | 'high';
  storage_mb: number;
  network_required: boolean;
}

export interface ContingencyPlan {
  trigger_condition: string;
  alternative_approach: string;
  fallback_agent: string;
  risk_mitigation: string[];
}

export interface MonitoringPoint {
  step_id: string;
  success_threshold: number;
  failure_threshold: number;
  intervention_actions: string[];
}

export interface TaskPerformanceMetrics {
  task_id: string;
  execution_time: number;
  success_rate: number;
  quality_score: number;
  efficiency_rating: number;
  learning_gained: number;
  user_satisfaction: number;
  resource_utilization: ResourceUtilization;
}

export interface ResourceUtilization {
  agent_time: Record<string, number>;
  computational_usage: ComputationalRequirement;
  knowledge_accessed: string[];
  external_calls: number;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assignedAgent?: string;
  progress: number;
  result?: any;
  error?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  steps: string[];
  estimatedDuration: number;
  requiredAgents: string[];
}

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private cognitiveTasks: Map<string, CognitiveTask> = new Map();
  private templates: Map<string, TaskTemplate> = new Map();
  private executionPlans: Map<string, TaskExecutionPlan> = new Map();
  private performanceMetrics: Map<string, TaskPerformanceMetrics> = new Map();
  private configPath: string;
  private templatesPath: string;
  private goalEngine?: GoalEngine;
  private agentManager?: MultiAgentManager;
  private emotionEngine?: EmotionEngine;

  constructor(goalEngine?: GoalEngine, agentManager?: MultiAgentManager, emotionEngine?: EmotionEngine) {
    this.configPath = path.join(process.cwd(), 'src', 'lib', 'config', 'tasks.json');
    this.templatesPath = path.join(process.cwd(), 'src', 'lib', 'config', 'task_templates.json');
    this.goalEngine = goalEngine;
    this.agentManager = agentManager;
    this.emotionEngine = emotionEngine;
    this.loadTasks();
    this.loadTemplates();
  }

  private loadTasks() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readJsonSync(this.configPath);
        Object.entries(data).forEach(([id, task]) => {
          this.tasks.set(id, task as Task);
        });
        logger.info(`Loaded ${this.tasks.size} tasks`);
      }
    } catch (error) {
      logger.error('Failed to load tasks:', error);
    }
  }

  private loadTemplates() {
    try {
      if (fs.existsSync(this.templatesPath)) {
        const data = fs.readJsonSync(this.templatesPath);
        Object.entries(data).forEach(([id, template]) => {
          this.templates.set(id, template as TaskTemplate);
        });
        logger.info(`Loaded ${this.templates.size} task templates`);
      }
    } catch (error) {
      logger.error('Failed to load task templates:', error);
    }
  }

  private saveTasks() {
    try {
      const data = Object.fromEntries(this.tasks);
      fs.ensureDirSync(path.dirname(this.configPath));
      fs.writeJsonSync(this.configPath, data, { spaces: 2 });
    } catch (error) {
      logger.error('Failed to save tasks:', error);
    }
  }

  createTask(
    name: string, 
    description: string, 
    priority: Task['priority'] = 'medium',
    assignedAgent?: string
  ): Task {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const task: Task = {
      id,
      name,
      description,
      status: 'pending',
      priority,
      createdAt: now,
      updatedAt: now,
      assignedAgent,
      progress: 0
    };

    this.tasks.set(id, task);
    this.saveTasks();
    
    logger.info(`Created task: ${name} (${id})`);
    return task;
  }

  createTaskFromTemplate(templateId: string, overrides?: Partial<Task>): Task | null {
    const template = this.templates.get(templateId);
    if (!template) {
      logger.error(`Template not found: ${templateId}`);
      return null;
    }

    const task = this.createTask(
      template.name,
      template.description,
      overrides?.priority,
      overrides?.assignedAgent
    );

    if (overrides) {
      Object.assign(task, overrides);
      this.updateTask(task.id, overrides);
    }

    return task;
  }

  updateTask(taskId: string, updates: Partial<Task>): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      logger.error(`Task not found: ${taskId}`);
      return false;
    }

    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    
    if (updates.status === 'completed') {
      task.completedAt = new Date().toISOString();
      task.progress = 100;
    }

    this.tasks.set(taskId, task);
    this.saveTasks();
    
    logger.info(`Updated task: ${taskId}`, updates);
    return true;
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByStatus(status: Task['status']): Task[] {
    return this.getAllTasks().filter(task => task.status === status);
  }

  getTasksByAgent(agentId: string): Task[] {
    return this.getAllTasks().filter(task => task.assignedAgent === agentId);
  }

  deleteTask(taskId: string): boolean {
    const deleted = this.tasks.delete(taskId);
    if (deleted) {
      this.saveTasks();
      logger.info(`Deleted task: ${taskId}`);
    }
    return deleted;
  }

  getStats() {
    const tasks = this.getAllTasks();
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length
    };
    
    return stats;
  }

  cleanupCompletedTasks(olderThanDays: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let cleaned = 0;
    for (const [id, task] of this.tasks) {
      if (task.status === 'completed' && task.completedAt) {
        const completedDate = new Date(task.completedAt);
        if (completedDate < cutoffDate) {
          this.tasks.delete(id);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      this.saveTasks();
      logger.info(`Cleaned up ${cleaned} completed tasks older than ${olderThanDays} days`);
    }
    
    return cleaned;
  }
}

export default TaskManager;
