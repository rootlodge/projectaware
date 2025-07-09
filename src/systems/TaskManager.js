const fs = require('fs-extra');
const path = require('path');
const logger = require('../core/logger');
const { askLLM } = require('./brain');

class TaskManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.tasksFile = './tasks.json';
    this.templatesFile = './task_templates.json';
    this.tasks = new Map();
    this.templates = new Map();
    this.activeTaskCount = 0;
    this.completedTaskCount = 0;
    this.taskCounter = 1;
    
    // Task priorities
    this.priorities = {
      CRITICAL: 5,
      HIGH: 4,
      MEDIUM: 3,
      LOW: 2,
      MINIMAL: 1
    };
    
    // Task statuses
    this.statuses = {
      PENDING: 'pending',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      BLOCKED: 'blocked'
    };
    
    // Initialize task system
    this.initializeTaskSystem();
  }

  /**
   * Initialize task system with default templates and load existing tasks
   */
  async initializeTaskSystem() {
    try {
      // Load existing tasks
      await this.loadTasks();
      
      // Load task templates
      await this.loadTemplates();
      
      // Create default templates if none exist
      if (this.templates.size === 0) {
        await this.createDefaultTemplates();
      }
      
      logger.info(`[TaskManager] Initialized with ${this.tasks.size} tasks and ${this.templates.size} templates`);
    } catch (error) {
      logger.error('[TaskManager] Failed to initialize:', error.message);
    }
  }

  /**
   * Load tasks from file
   */
  async loadTasks() {
    try {
      if (await fs.pathExists(this.tasksFile)) {
        const tasksData = await fs.readJson(this.tasksFile);
        this.tasks = new Map(Object.entries(tasksData.tasks || {}));
        this.taskCounter = tasksData.taskCounter || 1;
        this.activeTaskCount = tasksData.activeTaskCount || 0;
        this.completedTaskCount = tasksData.completedTaskCount || 0;
      }
    } catch (error) {
      logger.error('[TaskManager] Failed to load tasks:', error.message);
      this.tasks = new Map();
    }
  }

  /**
   * Save tasks to file
   */
  async saveTasks() {
    try {
      const tasksData = {
        tasks: Object.fromEntries(this.tasks),
        taskCounter: this.taskCounter,
        activeTaskCount: this.activeTaskCount,
        completedTaskCount: this.completedTaskCount,
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeJson(this.tasksFile, tasksData, { spaces: 2 });
    } catch (error) {
      logger.error('[TaskManager] Failed to save tasks:', error.message);
    }
  }

  /**
   * Load task templates
   */
  async loadTemplates() {
    try {
      if (await fs.pathExists(this.templatesFile)) {
        const templatesData = await fs.readJson(this.templatesFile);
        this.templates = new Map(Object.entries(templatesData.templates || {}));
      }
    } catch (error) {
      logger.error('[TaskManager] Failed to load templates:', error.message);
      this.templates = new Map();
    }
  }

  /**
   * Save task templates
   */
  async saveTemplates() {
    try {
      const templatesData = {
        templates: Object.fromEntries(this.templates),
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeJson(this.templatesFile, templatesData, { spaces: 2 });
    } catch (error) {
      logger.error('[TaskManager] Failed to save templates:', error.message);
    }
  }

  /**
   * Create default task templates
   */
  async createDefaultTemplates() {
    const defaultTemplates = {
      'learning': {
        name: 'Learning Task',
        description: 'Learn about a new topic or concept',
        priority: this.priorities.MEDIUM,
        estimatedDuration: 30,
        requiredAgents: ['SCHOLAR', 'COGITATOR'],
        steps: [
          'Research the topic',
          'Analyze key concepts',
          'Create knowledge summary',
          'Test understanding'
        ],
        tags: ['learning', 'knowledge', 'research']
      },
      'conversation': {
        name: 'Conversation Task',
        description: 'Engage in meaningful conversation with user',
        priority: this.priorities.HIGH,
        estimatedDuration: 15,
        requiredAgents: ['ELOQUENS', 'EMPATHIA'],
        steps: [
          'Analyze user input',
          'Determine appropriate response',
          'Generate contextual reply',
          'Monitor conversation flow'
        ],
        tags: ['conversation', 'interaction', 'communication']
      },
      'identity_evolution': {
        name: 'Identity Evolution Task',
        description: 'Evolve identity or personality traits',
        priority: this.priorities.CRITICAL,
        estimatedDuration: 45,
        requiredAgents: ['PERSONA', 'JUDEX'],
        steps: [
          'Analyze current identity',
          'Identify evolution triggers',
          'Plan trait changes',
          'Implement identity updates',
          'Validate changes'
        ],
        tags: ['identity', 'evolution', 'personality']
      },
      'system_maintenance': {
        name: 'System Maintenance Task',
        description: 'Perform routine system maintenance',
        priority: this.priorities.LOW,
        estimatedDuration: 20,
        requiredAgents: ['VIGIL', 'CEREBRUM'],
        steps: [
          'Check system health',
          'Analyze performance metrics',
          'Perform cleanup operations',
          'Update system status'
        ],
        tags: ['maintenance', 'system', 'optimization']
      },
      'problem_solving': {
        name: 'Problem Solving Task',
        description: 'Analyze and solve complex problems',
        priority: this.priorities.HIGH,
        estimatedDuration: 60,
        requiredAgents: ['COGITATOR', 'JUDEX', 'SCHOLAR'],
        steps: [
          'Define problem clearly',
          'Analyze root causes',
          'Generate potential solutions',
          'Evaluate solution options',
          'Implement best solution',
          'Monitor results'
        ],
        tags: ['problem-solving', 'analysis', 'solution']
      }
    };

    for (const [key, template] of Object.entries(defaultTemplates)) {
      this.templates.set(key, template);
    }
    
    await this.saveTemplates();
    logger.info('[TaskManager] Created default task templates');
  }

  /**
   * Create a new task
   */
  async createTask(name, description, options = {}) {
    const taskId = `task_${this.taskCounter++}`;
    
    const task = {
      id: taskId,
      name,
      description,
      priority: options.priority || this.priorities.MEDIUM,
      status: this.statuses.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDuration: options.estimatedDuration || 30,
      actualDuration: 0,
      startTime: null,
      endTime: null,
      assignedAgents: options.assignedAgents || [],
      requiredAgents: options.requiredAgents || [],
      dependencies: options.dependencies || [],
      tags: options.tags || [],
      steps: options.steps || [],
      completedSteps: [],
      metadata: options.metadata || {},
      progress: 0,
      notes: [],
      attachments: []
    };
    
    this.tasks.set(taskId, task);
    this.activeTaskCount++;
    
    await this.saveTasks();
    
    // Update state manager
    this.stateManager.recordTaskCreation(task);
    
    logger.info(`[TaskManager] Created task: ${name} (ID: ${taskId})`);
    return task;
  }

  /**
   * Create task from template
   */
  async createTaskFromTemplate(templateName, name, description, options = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    
    const taskOptions = {
      ...options,
      priority: options.priority || template.priority,
      estimatedDuration: options.estimatedDuration || template.estimatedDuration,
      requiredAgents: options.requiredAgents || template.requiredAgents,
      steps: options.steps || template.steps,
      tags: [...(options.tags || []), ...(template.tags || [])]
    };
    
    return await this.createTask(name, description, taskOptions);
  }

  /**
   * Update task
   */
  async updateTask(taskId, updates) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task '${taskId}' not found`);
    }
    
    // Update allowed fields
    const allowedFields = [
      'name', 'description', 'priority', 'status', 'estimatedDuration',
      'assignedAgents', 'requiredAgents', 'dependencies', 'tags', 'steps',
      'metadata', 'progress', 'notes'
    ];
    
    let hasChanges = false;
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        task[field] = value;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      task.updatedAt = new Date().toISOString();
      await this.saveTasks();
      
      // Update state manager
      this.stateManager.recordTaskUpdate(task);
      
      logger.info(`[TaskManager] Updated task: ${taskId}`);
    }
    
    return task;
  }

  /**
   * Start task execution
   */
  async startTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task '${taskId}' not found`);
    }
    
    if (task.status !== this.statuses.PENDING) {
      throw new Error(`Task '${taskId}' is not in pending status`);
    }
    
    task.status = this.statuses.IN_PROGRESS;
    task.startTime = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    
    await this.saveTasks();
    
    // Update state manager
    this.stateManager.recordTaskStart(task);
    
    logger.info(`[TaskManager] Started task: ${taskId}`);
    return task;
  }

  /**
   * Complete task
   */
  async completeTask(taskId, notes = null) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task '${taskId}' not found`);
    }
    
    task.status = this.statuses.COMPLETED;
    task.endTime = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    task.progress = 100;
    
    if (task.startTime) {
      task.actualDuration = Math.round((new Date(task.endTime) - new Date(task.startTime)) / 1000 / 60);
    }
    
    if (notes) {
      task.notes.push({
        timestamp: new Date().toISOString(),
        type: 'completion',
        content: notes
      });
    }
    
    this.activeTaskCount--;
    this.completedTaskCount++;
    
    await this.saveTasks();
    
    // Update state manager
    this.stateManager.recordTaskCompletion(task);
    
    logger.info(`[TaskManager] Completed task: ${taskId}`);
    return task;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task '${taskId}' not found`);
    }
    
    if (task.status === this.statuses.IN_PROGRESS) {
      this.activeTaskCount--;
    }
    
    this.tasks.delete(taskId);
    await this.saveTasks();
    
    // Update state manager
    this.stateManager.recordTaskDeletion(task);
    
    logger.info(`[TaskManager] Deleted task: ${taskId}`);
    return true;
  }

  /**
   * Get task by ID
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status) {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  /**
   * Get active tasks
   */
  getActiveTasks() {
    return this.getTasksByStatus(this.statuses.IN_PROGRESS);
  }

  /**
   * Get pending tasks
   */
  getPendingTasks() {
    return this.getTasksByStatus(this.statuses.PENDING);
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks() {
    return this.getTasksByStatus(this.statuses.COMPLETED);
  }

  /**
   * Get task analytics
   */
  getTaskAnalytics() {
    const allTasks = this.getAllTasks();
    const completedTasks = this.getCompletedTasks();
    const activeTasks = this.getActiveTasks();
    
    let totalEstimatedTime = 0;
    let totalActualTime = 0;
    let averageAccuracy = 0;
    
    completedTasks.forEach(task => {
      totalEstimatedTime += task.estimatedDuration || 0;
      totalActualTime += task.actualDuration || 0;
    });
    
    if (completedTasks.length > 0) {
      averageAccuracy = (totalEstimatedTime / totalActualTime) * 100;
    }
    
    return {
      total: allTasks.length,
      completed: completedTasks.length,
      active: activeTasks.length,
      pending: this.getPendingTasks().length,
      failed: this.getTasksByStatus(this.statuses.FAILED).length,
      cancelled: this.getTasksByStatus(this.statuses.CANCELLED).length,
      completionRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0,
      averageEstimatedTime: completedTasks.length > 0 ? totalEstimatedTime / completedTasks.length : 0,
      averageActualTime: completedTasks.length > 0 ? totalActualTime / completedTasks.length : 0,
      timeAccuracy: averageAccuracy,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get task templates
   */
  getTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by name
   */
  getTemplate(name) {
    return this.templates.get(name);
  }

  /**
   * Check if there are active tasks
   */
  hasActiveTasks() {
    return this.getActiveTasks().length > 0;
  }

  /**
   * Get task status summary
   */
  getStatusSummary() {
    return {
      activeTasks: this.getActiveTasks().length,
      pendingTasks: this.getPendingTasks().length,
      completedTasks: this.getCompletedTasks().length,
      hasActiveTasks: this.hasActiveTasks(),
      nextTask: this.getNextPriorityTask(),
      recentCompletions: this.getCompletedTasks().slice(-5),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get next priority task
   */
  getNextPriorityTask() {
    const pendingTasks = this.getPendingTasks();
    if (pendingTasks.length === 0) return null;
    
    return pendingTasks.reduce((highest, current) => 
      current.priority > highest.priority ? current : highest
    );
  }

  /**
   * Auto-assign agents to task based on requirements
   */
  async autoAssignAgents(taskId, availableAgents) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task '${taskId}' not found`);
    }
    
    const requiredAgents = task.requiredAgents || [];
    const assignedAgents = [];
    
    // Try to assign required agents
    for (const requiredAgent of requiredAgents) {
      if (availableAgents.includes(requiredAgent)) {
        assignedAgents.push(requiredAgent);
      }
    }
    
    // Use AI to suggest additional agents if needed
    if (assignedAgents.length < requiredAgents.length) {
      const prompt = `
Task: ${task.name}
Description: ${task.description}
Required Agents: ${requiredAgents.join(', ')}
Available Agents: ${availableAgents.join(', ')}
Currently Assigned: ${assignedAgents.join(', ')}

Suggest the best agents from the available list to complete this task efficiently.
Return only a JSON array of agent names.
`;
      
      try {
        const response = await askLLM(prompt, 'gemma2:latest', 0.1);
        const suggestedAgents = JSON.parse(response);
        
        for (const agent of suggestedAgents) {
          if (availableAgents.includes(agent) && !assignedAgents.includes(agent)) {
            assignedAgents.push(agent);
          }
        }
      } catch (error) {
        logger.warn(`[TaskManager] Failed to get AI agent suggestions: ${error.message}`);
      }
    }
    
    // Update task with assigned agents
    await this.updateTask(taskId, { assignedAgents });
    
    return assignedAgents;
  }

  /**
   * Process task queue and execute ready tasks
   */
  async processTaskQueue() {
    const pendingTasks = this.getPendingTasks();
    
    for (const task of pendingTasks) {
      // Check if task dependencies are met
      const dependenciesMet = await this.checkDependencies(task);
      
      if (dependenciesMet) {
        // Auto-start high priority tasks
        if (task.priority >= this.priorities.HIGH) {
          await this.startTask(task.id);
        }
      }
    }
  }

  /**
   * Check if task dependencies are met
   */
  async checkDependencies(task) {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }
    
    for (const depId of task.dependencies) {
      const depTask = this.tasks.get(depId);
      if (!depTask || depTask.status !== this.statuses.COMPLETED) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Clean up old completed tasks
   */
  async cleanupOldTasks(olderThanDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const completedTasks = this.getCompletedTasks();
    let removedCount = 0;
    
    for (const task of completedTasks) {
      const taskDate = new Date(task.endTime);
      if (taskDate < cutoffDate) {
        this.tasks.delete(task.id);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.completedTaskCount -= removedCount;
      await this.saveTasks();
      logger.info(`[TaskManager] Cleaned up ${removedCount} old completed tasks`);
    }
    
    return removedCount;
  }
}

module.exports = TaskManager;
